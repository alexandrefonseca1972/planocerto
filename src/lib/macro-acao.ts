/** Tamanho máximo do nome de uma macro ação (evita frases longas como agrupador). */
export const MACRO_ACAO_MAX = 40;

/** Forma gravada: espaços colapsados, sem espaço nas pontas, caixa alta. */
export function normalizeMacroAcao(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleUpperCase("pt-BR");
}

/**
 * Chave de comparação para detectar duplicidade: ignora caixa, acentos, hífens e espaços extras.
 * "Empresa - Ação", "EMPRESA-AÇÃO" e "EMPRESA ACAO" → "EMPRESA ACAO".
 */
export function macroAcaoKey(value: unknown): string {
  return normalizeMacroAcao(value)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Mensagem de erro se o nome não for aceito; null se estiver ok. */
export function macroAcaoError(name: string): string | null {
  if (!name) return "Macro ação obrigatória.";
  if (name.length > MACRO_ACAO_MAX) return `Macro ação deve ter no máximo ${MACRO_ACAO_MAX} caracteres.`;
  return null;
}
