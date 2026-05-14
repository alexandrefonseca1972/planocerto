import { NextRequest, NextResponse } from "next/server";
import { ingestDOUForDate } from "@/lib/inlabs/ingest-worker";
import { env } from "@/lib/env";
import { z } from "zod";
import { format, subDays } from "date-fns";

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  secret: z.string(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = QuerySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetros inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const date = parsed.data.date ?? format(subDays(new Date(), 1), "yyyy-MM-dd");

  try {
    const result = await ingestDOUForDate(date);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}