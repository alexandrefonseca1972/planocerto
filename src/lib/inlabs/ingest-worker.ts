import { createAdminClient } from "@/lib/supabase/admin";
import { fetchDOUByDate } from "./client";
import { sanitizeText } from "@/lib/validation/sanitize";
import { logger as baseLogger } from "@/lib/logger";

const logger = baseLogger.child({ component: "ingest-worker" });

interface IngestResult {
  date: string;
  inserted: number;
  skipped: number;
  errors: number;
}

export async function ingestDOUForDate(date: string): Promise<IngestResult> {
  const supabase = createAdminClient();
  const result: IngestResult = { date, inserted: 0, skipped: 0, errors: 0 };

  const { data: existing } = await supabase
    .from("ingest_runs")
    .select("status")
    .eq("source", "DOU")
    .eq("edition_date", date)
    .single();

  if (existing?.status === "success") {
    logger.info({ date }, "Edição já ingerida com sucesso — pulando");
    return { ...result, skipped: 1 };
  }

  await supabase.from("ingest_runs").upsert({
    source: "DOU",
    edition_date: date,
    status: "running",
    started_at: new Date().toISOString(),
  });

  let page = 1;
  let totalPages = 1;

  try {
    do {
      const response = await fetchDOUByDate(date, page);
      totalPages = response.totalPages;

      for (const article of response.items) {
        try {
          const sanitized = {
            source: "DOU" as const,
            edition_date: article.dataDO,
            edition_num: article.edicao ?? null,
            section: sanitizeText(article.secao ?? ""),
            organ: sanitizeText(article.orgao ?? ""),
            title: sanitizeText(article.titulo ?? ""),
            content: sanitizeText(article.conteudo),
            original_url: article.urlOrigem ?? null,
          };

          if (!sanitized.content || sanitized.content.length < 10) {
            logger.warn({ id: article.id }, "Conteúdo vazio — ignorando");
            result.skipped++;
            continue;
          }

          const { error } = await supabase
            .from("do_publications")
            .upsert(sanitized, { onConflict: "source,edition_date,title" });

          if (error) {
            logger.error({ error, articleId: article.id }, "Erro ao inserir publicação");
            result.errors++;
          } else {
            result.inserted++;
          }
        } catch (err) {
          logger.error({ err, articleId: article.id }, "Erro ao processar artigo");
          result.errors++;
        }
      }

      page++;
    } while (page <= totalPages);

    await supabase
      .from("ingest_runs")
      .update({
        status: result.errors === 0 ? "success" : "partial",
        publications_ok: result.inserted,
        publications_err: result.errors,
        finished_at: new Date().toISOString(),
      })
      .eq("source", "DOU")
      .eq("edition_date", date);

    logger.info(result, "Ingestão concluída");
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";

    await supabase
      .from("ingest_runs")
      .update({
        status: "failed",
        error_detail: message,
        finished_at: new Date().toISOString(),
      })
      .eq("source", "DOU")
      .eq("edition_date", date);

    logger.error({ err }, "Ingestão falhou");
    throw err;
  }
}