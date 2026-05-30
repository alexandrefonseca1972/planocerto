import { NextRequest, NextResponse } from "next/server";
import { processUnsentAlerts } from "@/lib/notifications/alert-worker";
import { env } from "@/lib/env";
import { z } from "zod";

const BodySchema = z.object({ secret: z.string() });

/**
 * Dispatch periódico dos alertas das correlações ainda não notificadas.
 * `processUnsentAlerts` antes era órfã (nunca chamada); agora é acionável por
 * POST (segredo no corpo) ou por Vercel Cron (GET com Authorization).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }
  if (parsed.data.secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await processUnsentAlerts();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    await processUnsentAlerts();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
