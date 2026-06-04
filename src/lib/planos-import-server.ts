/**
 * Lógica de inserção compartilhada pelas rotas de import de planos
 * (/api/plans/upload-batch e /api/plans/[id]/import).
 *
 * Server-only: usa Supabase + sanitização. A numeração/agrupamento vem de
 * `parsePlanRows` (puro), garantindo o MESMO resultado nas duas rotas.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { sanitizeText } from "@/app/actions/_catalog-utils";
import {
  COL,
  parsePlanRows,
  parseStatus,
  parseDate,
  parseNum,
  parsePreco,
  trimStr,
} from "@/lib/planos-import";

type Client = SupabaseClient<Database>;

const BATCH_SIZE = 50;

export interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
  groupCount: number;
}

/**
 * Insere grupos (MACRO AÇÃO) e itens de um plano a partir das linhas de dados.
 * `baseSort` desloca o sort_order (para importar em um plano que já tem itens).
 */
export async function importPlanItems(
  supabase: Client,
  planId: string,
  dataRows: unknown[][],
  opts: { baseSort?: number } = {},
): Promise<ImportResult> {
  const baseSort = opts.baseSort ?? 0;
  const { groups, items } = parsePlanRows(dataRows);

  const errors: string[] = [];
  let created = 0;
  let skipped = 0;

  // ── Grupos ────────────────────────────────────────────────────────────────
  // groupMap é chaveado pelo nome CRU da MACRO AÇÃO — o mesmo valor usado no
  // lookup dos filhos — para que a sanitização do texto não quebre o vínculo.
  const groupMap = new Map<string, string>();
  if (groups.length > 0) {
    const groupInserts = await Promise.all(
      groups.map(async (g) => ({
        plan_id: planId,
        number: g.number,
        sort_order: baseSort + g.sortOrder,
        action: (await sanitizeText(g.name)).slice(0, 500),
        tipo_pa: "",
        area: "",
        prioridade: "",
        status: 1 as const,
      })),
    );
    const { data: grupos, error } = await supabase
      .from("action_items")
      .insert(groupInserts)
      .select("id, number");
    if (error || !grupos) {
      return {
        created: 0,
        skipped: items.length,
        errors: [`Erro ao criar grupos: ${error?.message ?? "desconhecido"}`],
        groupCount: 0,
      };
    }
    // Mapeia id ↔ nome cru via o `number` (único por grupo) — robusto à ordem
    // de retorno do insert em lote.
    const numberToName = new Map(groups.map((g) => [g.number, g.name]));
    for (const gr of grupos) {
      const name = numberToName.get(trimStr(gr.number));
      if (name) groupMap.set(name, gr.id as string);
    }
    created += grupos.length;
  }

  // ── Itens ───────────────────────────────────────────────────────────────
  const sanitized = await Promise.all(
    items.map(async ({ row, macroAcao, number, sortOrder }) => {
      const [action, subacao, como, where, responsible, cost, tipo_pa, area, prioridade, observations] =
        await Promise.all([
          sanitizeText(trimStr(row[COL.ACAO])),
          sanitizeText(trimStr(row[COL.SUBACAO])),
          sanitizeText(trimStr(row[COL.COMO])),
          sanitizeText(trimStr(row[COL.ONDE])),
          sanitizeText(trimStr(row[COL.QUEM])),
          sanitizeText(trimStr(row[COL.QUANTO])),
          sanitizeText(trimStr(row[COL.TIPO_PA])),
          sanitizeText(trimStr(row[COL.AREA])),
          sanitizeText(trimStr(row[COL.PRIORIDADE])),
          sanitizeText(trimStr(row[COL.OBS])),
        ]);
      return {
        plan_id: planId,
        parent_id: macroAcao ? (groupMap.get(macroAcao) ?? null) : null,
        number,
        sort_order: baseSort + sortOrder,
        action: action.slice(0, 500),
        subacao: subacao.slice(0, 500),
        como: como.slice(0, 500),
        where: where.slice(0, 500),
        responsible: responsible.slice(0, 200),
        cost: cost.slice(0, 100),
        preco: parsePreco(row[COL.QUANTO]),
        tipo_pa: tipo_pa.slice(0, 100),
        area: area.slice(0, 100),
        prioridade: prioridade.slice(0, 100),
        planned_start: parseDate(row[COL.INICIO_PREV]),
        planned_end: parseDate(row[COL.TERMINO_PREV]),
        actual_start: parseDate(row[COL.INICIO_REAL]),
        actual_end: parseDate(row[COL.TERMINO_REAL]),
        status: parseStatus(trimStr(row[COL.FAROL])),
        observations: observations.slice(0, 2000),
        inscritos_esperado: parseNum(row[COL.INSC_ESP]),
        inscritos_real: parseNum(row[COL.INSC_REAL]),
        mat_fin_esperado: parseNum(row[COL.MATFIN_ESP]),
        mat_fin_real: parseNum(row[COL.MATFIN_REAL]),
        mat_acad_esperado: parseNum(row[COL.MATACD_ESP]),
        mat_acad_real: parseNum(row[COL.MATACD_REAL]),
      };
    }),
  );

  for (let i = 0; i < sanitized.length; i += BATCH_SIZE) {
    const batch = sanitized.slice(i, i + BATCH_SIZE);
    const { error, count } = await supabase
      .from("action_items")
      .insert(batch, { count: "exact" });
    if (error) {
      errors.push(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      skipped += batch.length;
    } else {
      created += count ?? batch.length;
    }
  }

  return { created, skipped, errors, groupCount: groups.length };
}
