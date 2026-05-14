import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/validation/sanitize";

const SearchParamsSchema = z.object({
  query: z.string().min(2).max(200),
  source: z.enum(["DOU", "DOE", "DOM", "all"]).default("all"),
  state: z.string().length(2).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  actType: z.string().max(100).optional(),
  page: z.number().int().min(1).max(100).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

export interface SearchResult {
  id: string;
  title: string | null;
  content_snippet: string;
  source: string;
  edition_date: string;
  organ: string | null;
  act_type: string | null;
  original_url: string | null;
  rank: number;
}

interface SearchRow {
  id: string;
  title: string | null;
  content: string | null;
  source: string | null;
  edition_date: string;
  organ: string | null;
  act_type: string | null;
  original_url: string | null;
  rank: number;
}

export async function searchPublications(
  rawParams: unknown
): Promise<{ results: SearchResult[]; total: number }> {
  const params = SearchParamsSchema.parse(rawParams);

  const query = sanitizeText(params.query);
  const supabase = await createClient();
  const offset = (params.page - 1) * params.limit;

  const tsQuery = query
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w}:*`)
    .join(" & ");

  const { data: rpcData, error: rpcError, count } = await supabase.rpc("search_publications", {
    query_text: tsQuery,
    source_filter: params.source === "all" ? null : params.source,
    state_filter: params.state ?? null,
    date_from: params.dateFrom ?? null,
    date_to: params.dateTo ?? null,
    act_type_filter: params.actType ?? null,
    result_limit: params.limit,
    result_offset: offset,
  });

  if (rpcError) throw rpcError;

  let rows: SearchRow[] = [];
  let total = count ?? 0;

  if (rpcData && rpcData.length > 0) {
    rows = rpcData as SearchRow[];
  } else {
    const fallback = await supabase
      .from("do_publications")
      .select("id, title, content, source, edition_date, organ, act_type, original_url", {
        count: "exact",
      })
      .ilike("title", `%${query}%`)
      .limit(params.limit)
      .range(offset, offset + params.limit - 1);

    rows = (fallback.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      source: row.source,
      edition_date: row.edition_date,
      organ: row.organ,
      act_type: row.act_type,
      original_url: row.original_url,
      rank: 0,
    }));
    total = fallback.count ?? 0;
  }

  const results: SearchResult[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    content_snippet: row.content ? row.content.slice(0, 300) + "..." : "",
    source: row.source ?? "",
    edition_date: row.edition_date,
    organ: row.organ,
    act_type: row.act_type,
    original_url: row.original_url,
    rank: row.rank,
  }));

  return { results, total };
}