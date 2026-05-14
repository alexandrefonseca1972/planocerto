import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-middleware";
import { rateLimit } from "@/lib/api/rate-limit";
import { searchPublications } from "@/lib/supabase/search";
import { z } from "zod";

const QuerySchema = z.object({
  q: z.string().min(2).max(200),
  source: z.enum(["DOU", "DOE", "DOM", "all"]).optional(),
  state: z.string().length(2).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().min(1).max(100).optional(),
});

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, { limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = QuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parâmetros inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await searchPublications({
      query: parsed.data.q,
      source: parsed.data.source ?? "all",
      state: parsed.data.state,
      dateFrom: parsed.data.from,
      dateTo: parsed.data.to,
      page: parsed.data.page ?? 1,
    });

    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar busca" },
      { status: 500 }
    );
  }
}