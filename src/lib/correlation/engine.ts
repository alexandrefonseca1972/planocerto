import { createAdminClient } from "@/lib/supabase/admin";
import { SocialSignal } from "@/lib/validation/schemas";
import { generateInsight } from "@/lib/llm/generate-insight";
import { normalizeName } from "@/lib/validation/sanitize";
import pino from "pino";

const logger = pino({ name: "correlation-engine" });
const LOOKBACK_DAYS = 30;

export async function correlate(signal: SocialSignal): Promise<void> {
  const supabase = createAdminClient();
  const normalizedName = normalizeName(signal.entity_name);

  const { data: entities, error } = await supabase
    .from("do_entities")
    .select(`
      id,
      raw_name,
      context_snippet,
      publication_id,
      do_publications!inner (
        id, title, edition_date, source, act_type, organ, original_url
      )
    `)
    .ilike("normalized_name", `%${normalizedName.split(" ")[0]}%`)
    .gte(
      "do_publications.edition_date",
      new Date(Date.now() - LOOKBACK_DAYS * 86400000)
        .toISOString()
        .split("T")[0]
    )
    .limit(10);

  if (error) {
    logger.error({ error }, "Erro ao buscar entidades DO para correlação");
    throw error;
  }

  if (!entities?.length) {
    logger.info({ entity: signal.entity_name }, "Nenhuma publicação DO encontrada");
    return;
  }

  for (const entity of entities) {
    const pub = (entity as any).do_publications;

    try {
      const insight = await generateInsight({
        entityName: signal.entity_name,
        socialSignal: signal,
        doPublication: {
          title: pub.title,
          actType: pub.act_type,
          organ: pub.organ,
          date: pub.edition_date,
          snippet: entity.context_snippet ?? "",
        },
      });

      const severity = calculateSeverity(signal, pub);

      const { error: insertError } = await supabase
        .from("entity_correlations")
        .insert({
          monitored_entity_id: signal.entity_id,
          do_entity_id: entity.id,
          publication_id: entity.publication_id,
          correlation_type: "social_peak_do_match",
          social_signal: signal as any,
          insight_text: insight,
          severity,
          alert_sent: false,
        });

      if (insertError) {
        logger.error({ insertError }, "Erro ao salvar correlação");
      } else {
        logger.info(
          {
            entity: signal.entity_name,
            pubId: entity.publication_id,
            severity,
          },
          "Correlação criada"
        );
      }
    } catch (err) {
      logger.error({ err, entityId: entity.id }, "Erro ao gerar insight");
    }
  }
}

export function calculateSeverity(
  signal: SocialSignal,
  publication: any
): "low" | "medium" | "high" | "critical" {
  if (signal.signal_type === "crisis_alert" && signal.sentiment_score < -0.7) {
    return "critical";
  }
  if (signal.sentiment_score < -0.5 || signal.mentions_count > 1000) {
    return "high";
  }
  if (signal.sentiment_score < -0.2 || signal.mentions_count > 200) {
    return "medium";
  }
  return "low";
}