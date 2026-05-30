import { createAdminClient } from "@/lib/supabase/admin";
import { sendAlertEmail } from "./email";
import { sendWhatsAppAlert } from "./whatsapp";
import { logger as baseLogger } from "@/lib/logger";

const logger = baseLogger.child({ component: "alert-worker" });
const BATCH_SIZE = 50;

// Shape da publicação do DO embarcada no select.
interface AlertPublicationJoin {
  title: string | null;
  edition_date: string;
  original_url: string | null;
}

/**
 * Decide se a correlação deve ser marcada como `alert_sent`.
 * Marca quando ALGUM canal entregou (evita reenvio duplicado) ou quando não
 * houve falha (nada a enviar). Só deixa para retry se TODOS os canais falharam.
 * Exportada para teste unitário da lógica de idempotência.
 */
export function shouldMarkAlertSent(anySent: boolean, anyFailed: boolean): boolean {
  return anySent || !anyFailed;
}

export async function processUnsentAlerts(): Promise<void> {
  const supabase = createAdminClient();

  const { data: correlations, error } = await supabase
    .from("entity_correlations")
    .select(`
      id, insight_text, severity, social_signal,
      monitored_entity_id,
      do_publications!inner (title, edition_date, original_url)
    `)
    .eq("alert_sent", false)
    .in("severity", ["medium", "high", "critical"])
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) throw error;
  if (!correlations?.length) return;

  for (const correlation of correlations) {
    const pub = correlation.do_publications as unknown as AlertPublicationJoin;
    const signal = correlation.social_signal as { entity_name?: string } | null;
    const entityName = signal?.entity_name ?? "Entidade";
    const severity =
      (correlation.severity as "low" | "medium" | "high" | "critical") || "medium";

    const { data: prefs } = (await supabase
      .from("notification_preferences")
      .select("email, whatsapp_phone, channels")
      .eq("entity_id", correlation.monitored_entity_id)
      .maybeSingle()) as {
      data: { email: string; whatsapp_phone: string; channels: string[] } | null;
    };

    if (!prefs) continue;

    const channels: string[] = prefs.channels ?? ["email"];
    let anySent = false;
    let anyFailed = false;

    if (channels.includes("email") && prefs.email) {
      try {
        await sendAlertEmail({
          to: prefs.email,
          entityName,
          severity,
          insightText: correlation.insight_text ?? "",
          publicationDate: pub.edition_date,
          publicationUrl: pub.original_url ?? undefined,
          publicationTitle: pub.title ?? undefined,
        });
        anySent = true;
      } catch (err) {
        anyFailed = true;
        logger.error({ err, correlationId: correlation.id, channel: "email" }, "Falha no envio de e-mail");
      }
    }

    if (channels.includes("whatsapp") && prefs.whatsapp_phone) {
      try {
        await sendWhatsAppAlert({
          phone: prefs.whatsapp_phone,
          entityName,
          severity,
          insightText: (correlation.insight_text ?? "").slice(0, 400),
          publicationDate: pub.edition_date,
        });
        anySent = true;
      } catch (err) {
        anyFailed = true;
        logger.error({ err, correlationId: correlation.id, channel: "whatsapp" }, "Falha no envio de WhatsApp");
      }
    }

    // Idempotência: marca como enviado se ALGUM canal entregou (evita reenvio
    // duplicado quando um canal falha mas outro entregou). Só deixa para retry
    // quando TODOS os canais tentados falharam — aí nada foi entregue, sem dup.
    const shouldMark = shouldMarkAlertSent(anySent, anyFailed);
    if (!shouldMark) {
      logger.warn({ correlationId: correlation.id }, "Todos os canais falharam — mantido para retry");
      continue;
    }

    const { error: updateError } = await supabase
      .from("entity_correlations")
      .update({ alert_sent: true, alert_sent_at: new Date().toISOString() })
      .eq("id", correlation.id);

    if (updateError) {
      logger.error({ updateError, correlationId: correlation.id }, "Falha ao marcar alerta como enviado");
    } else {
      logger.info(
        { correlationId: correlation.id, anyFailed },
        anyFailed ? "Alerta marcado com falha parcial de canal" : "Alerta enviado",
      );
    }
  }
}