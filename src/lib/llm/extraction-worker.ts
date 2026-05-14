import { createAdminClient } from "@/lib/supabase/admin";
import { extractEntities, type ExtractedEntity } from "./extract-entities";
import { normalizeName } from "@/lib/validation/sanitize";
import pino from "pino";

const logger = pino({ name: "extraction-worker" });
const BATCH_SIZE = 20;

export async function extractEntitiesForDate(date: string) {
  const supabase = createAdminClient();

  const { data: publications, error } = await supabase
    .from("do_publications")
    .select("id, title, content")
    .eq("edition_date", date)
    .not("id", "in", `(select publication_id from do_entities)`)
    .limit(BATCH_SIZE);

  if (error) throw error;
  if (!publications?.length) return;

  for (const pub of publications) {
    try {
      const entities = await extractEntities(
        `${pub.title ?? ""}\n\n${pub.content}`
      );

      if (entities.length === 0) continue;

      const rows = entities.map((e: ExtractedEntity & { normalized_name?: string }) => ({
        publication_id: pub.id,
        entity_type: e.type,
        raw_name: e.raw_name,
        normalized_name: e.normalized_name ?? normalizeName(e.raw_name),
        document: e.document,
        context_snippet: e.context_snippet,
        confidence: e.confidence,
      }));

      const { error: insertError } = await supabase
        .from("do_entities")
        .insert(rows);

      if (insertError) {
        logger.error({ error: insertError, pubId: pub.id }, "Erro ao inserir entidades");
      } else {
        logger.info({ pubId: pub.id, count: rows.length }, "Entidades extraídas");
      }
    } catch (err) {
      logger.error({ err, pubId: pub.id }, "Extração falhou para publicação");
    }
  }
}