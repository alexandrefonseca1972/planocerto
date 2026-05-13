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
