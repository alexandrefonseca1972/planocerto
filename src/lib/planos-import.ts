/**
 * Helpers compartilhados para importação/exportação de planos de ação.
 * Usados pela API route de import, pela API route de upload-batch
 * e pelo componente de validação client-side.
 */

// ─── Mapa FAROL → status numérico ─────────────────────────────────────────

export const FAROL_MAP: Record<string, number> = {
  "NÃO PROGRAMADO": 1, "NAO PROGRAMADO": 1,
  "NÃO INICIADA": 1,   "NAO INICIADA": 1,
  "PENDENTE": 2,
  "EM ANDAMENTO (ATRASO)": 3,
  "EM ANDAMENTO": 4,
  "CONCLUÍDO": 5,      "CONCLUIDO": 5,
};

export function parseStatus(raw: string): number {
  if (!raw) return 1;
  return FAROL_MAP[raw.trim().toUpperCase()] ?? 1;
}

// ─── Índices de colunas conforme MODELO.xlsb ─────────────────────────────
// Aba "PLANO DE AÇÃO", linha 3 (índice 2):
// A  TIPO PA          B  ÁREA             C  UNIDADE         D  PRIORIDADE
// E  MACRO AÇÃO       F  AÇÃO             G  SUBAÇÃO         H  COMO?
// I  ONDE?            J  QUEM?            K  QUANTO (R$)
// L  INSCRITOS ESP    M  INSCRITOS REAL
// N  MAT.FIN ESP      O  MAT.FIN REAL
// P  MAT.ACD ESP      Q  MAT.ACD REAL
// R  INÍCIO PREVISTO  S  TÉRMINO PREVISTO  T  INÍCIO REAL    U  TÉRMINO REAL
// V  FAROL            W  ACOMPANHAMENTO / OBSERVAÇÕES

export const COL = {
  TIPO_PA: 0, AREA: 1, UNIDADE: 2, PRIORIDADE: 3,
  MACRO: 4, ACAO: 5, SUBACAO: 6, COMO: 7, ONDE: 8, QUEM: 9, QUANTO: 10,
  INSC_ESP: 11, INSC_REAL: 12,
  MATFIN_ESP: 13, MATFIN_REAL: 14,
  MATACD_ESP: 15, MATACD_REAL: 16,
  INICIO_PREV: 17, TERMINO_PREV: 18, INICIO_REAL: 19, TERMINO_REAL: 20,
  FAROL: 21, OBS: 22,
} as const;

// Colunas críticas que devem bater com o modelo para importação
export const REQUIRED_HEADERS: Record<number, string> = {
  0: "TIPO PA",
  4: "MACRO AÇÃO",
  5: "AÇÃO",
  17: "INÍCIO PREVISTO",
  18: "TÉRMINO PREVISTO",
  19: "INÍCIO REAL",
  20: "TÉRMINO REAL",
  21: "FAROL",
};

// ─── Parsers ──────────────────────────────────────────────────────────────

export function parseDate(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "number") {
    // Serial date do Excel
    return new Date(Math.round((raw - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
  }
  const s = String(raw).trim();
  if (!s) return null;
  // DD/MM/YYYY
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

export function parseNum(raw: unknown): number {
  if (raw === null || raw === undefined || raw === "") return 0;
  const n = Number(raw);
  return isNaN(n) ? 0 : Math.max(0, Math.round(n));
}

export function trimStr(raw: unknown): string {
  return raw == null ? "" : String(raw).trim();
}

// ─── Detecção de linha de header ──────────────────────────────────────────

/** Linha padrão do header no modelo (índice 2 = linha 3). */
const DEFAULT_HEADER_ROW = 2;

export function detectHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i] as string[];
    if (row.some((c) => {
      const v = String(c).trim().toUpperCase();
      return v.includes("MACRO") || v === "AÇÃO";
    })) {
      return i;
    }
  }
  return DEFAULT_HEADER_ROW; // fallback: modelo padrão usa linha 3 (índice 2)
}

// ─── Normalização de string para comparação ───────────────────────────────

export function normHeader(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

// \u2500\u2500\u2500 Valida\u00e7\u00e3o de arquivo (compartilhada cliente/servidor) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export const ACCEPTED_EXTS = new Set([".xlsx", ".xlsb", ".xls"]);
export const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

/**
 * Valida que a linha de header bate com o modelo padr\u00e3o (REQUIRED_HEADERS).
 * Retorna a linha de header detectada e a lista de erros (vazia = ok).
 */
export function validatePlanoHeaders(rows: unknown[][]): {
  headerRow: number;
  errors: string[];
} {
  const headerRow = detectHeaderRow(rows);
  const header = (rows[headerRow] ?? []) as unknown[];
  const errors: string[] = [];
  for (const [idx, expected] of Object.entries(REQUIRED_HEADERS)) {
    const actual = trimStr(header[Number(idx)]);
    if (!actual || normHeader(actual) !== normHeader(expected)) {
      errors.push(
        `Col ${String.fromCharCode(65 + Number(idx))}: esperada "${expected}", encontrada "${actual || "(vazia)"}"`,
      );
    }
  }
  return { headerRow, errors };
}

// \u2500\u2500\u2500 Planejamento de itens (agrupamento + numera\u00e7\u00e3o hier\u00e1rquica) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export interface PlanGroup {
  /** Nome cru da MACRO A\u00c7\u00c3O (chave de v\u00ednculo pai\u2194filho). */
  name: string;
  /** N\u00famero de exibi\u00e7\u00e3o do grupo: "1", "2", \u2026 */
  number: string;
  /** Ordem de exibi\u00e7\u00e3o (1-based, relativa). */
  sortOrder: number;
}

export interface PlanItem {
  row: unknown[];
  /** Nome cru da MACRO A\u00c7\u00c3O ("" se item sem grupo). */
  macroAcao: string;
  /** N\u00famero de exibi\u00e7\u00e3o: "1.1", "1.2", "2.1"\u2026 ou sequencial se sem grupo. */
  number: string;
  /** Ordem de exibi\u00e7\u00e3o (1-based, relativa). */
  sortOrder: number;
}

/**
 * Converte as linhas de dados (j\u00e1 sem o cabe\u00e7alho) em grupos + itens com
 * numera\u00e7\u00e3o hier\u00e1rquica consistente e `sort_order` intercalado na ordem das
 * linhas (grupo \u2192 seus filhos \u2192 pr\u00f3ximo grupo). Fun\u00e7\u00e3o pura: sem DB, sem
 * sanitiza\u00e7\u00e3o. Usada pelas duas rotas de import para garantir o MESMO
 * resultado. `sortOrder` \u00e9 relativo (1-based); a rota soma um offset se for
 * importar em um plano que j\u00e1 tem itens.
 *
 * - Grupos numerados 1..N pela ordem da primeira apari\u00e7\u00e3o.
 * - Filhos numerados "{\u00edndiceDoGrupo}.{contadorNoGrupo}".
 * - Itens sem MACRO A\u00c7\u00c3O numerados sequencialmente ap\u00f3s os grupos (N+1, N+2\u2026).
 */
export function parsePlanRows(dataRows: unknown[][]): {
  groups: PlanGroup[];
  items: PlanItem[];
} {
  // Passo 1: \u00edndice 1-based de cada grupo pela ordem de primeira apari\u00e7\u00e3o.
  const groupIndex = new Map<string, number>();
  for (const raw of dataRows) {
    const row = raw as unknown[];
    if (!trimStr(row[COL.ACAO])) continue;
    const macro = trimStr(row[COL.MACRO]);
    if (macro && !groupIndex.has(macro)) {
      groupIndex.set(macro, groupIndex.size + 1);
    }
  }
  const totalGroups = groupIndex.size;

  // Passo 2: emite grupos (lazy, na ordem das linhas) e itens, com sort_order
  // intercalado e numera\u00e7\u00e3o hier\u00e1rquica.
  const groups: PlanGroup[] = [];
  const emitted = new Set<string>();
  const childCounter = new Map<string, number>();
  const items: PlanItem[] = [];
  let sort = 0;
  let topLevel = totalGroups; // itens sem grupo continuam ap\u00f3s os grupos

  for (const raw of dataRows) {
    const row = raw as unknown[];
    if (!trimStr(row[COL.ACAO])) continue;
    const macro = trimStr(row[COL.MACRO]);

    if (macro && !emitted.has(macro)) {
      emitted.add(macro);
      sort++;
      groups.push({
        name: macro,
        number: String(groupIndex.get(macro)),
        sortOrder: sort,
      });
    }

    sort++;
    let number: string;
    if (macro) {
      const c = (childCounter.get(macro) ?? 0) + 1;
      childCounter.set(macro, c);
      number = `${groupIndex.get(macro)}.${c}`;
    } else {
      topLevel++;
      number = String(topLevel);
    }
    items.push({ row, macroAcao: macro, number, sortOrder: sort });
  }

  return { groups, items };
}
