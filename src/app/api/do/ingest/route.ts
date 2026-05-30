import { NextRequest, NextResponse } from "next/server";
import { ingestDOUForDate } from "@/lib/inlabs/ingest-worker";
import { extractEntitiesForDate } from "@/lib/llm/extraction-worker";
import { env } from "@/lib/env";
import { z } from "zod";
import { format, subDays } from "date-fns";
import { logger as baseLogger } from "@/lib/logger";

const log = baseLogger.child({ component: "api:do:ingest" });

const BodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  secret: z.string(),
});

const yesterday = () => format(subDays(new Date(), 1), "yyyy-MM-dd");

/**
 * Pipeline date-driven: ingere o DOU da data e, em seguida, extrai entidades das
 * publicações ainda não processadas (um batch). A extração antes era uma função
 * órfã — nunca chamada; agora roda encadeada após a ingestão.
 */
async function runIngestPipeline(date: string) {
  const ingest = await ingestDOUForDate(date);
  let extraction: { ok: boolean; error?: string } = { ok: true };
  try {
    await extractEntitiesForDate(date);
  } catch (err) {
    // A extração depende do LLM; falha nela não invalida a ingestão já persistida.
    extraction = { ok: false, error: err instanceof Error ? err.message : "erro na extração" };
    log.error({ err, date }, "Extração falhou após ingestão");
  }
  return { date, ingest, extraction };
}

// POST: acionamento manual/externo com o segredo no corpo.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetros inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  if (parsed.data.secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const result = await runIngestPipeline(parsed.data.date ?? yesterday());
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: acionamento por Vercel Cron (header Authorization: Bearer <CRON_SECRET>).
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const result = await runIngestPipeline(yesterday());
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
