/**
 * Filtro de intervalo de datas por prazo (planned_end), compartilhado entre
 * Dashboard e Planos.
 *
 * O intervalo só está ativo quando AMBAS as datas (from/to, YYYY-MM-DD) estão
 * presentes. Ativo, uma ação entra no recorte se tiver prazo e ele cair entre
 * from e to (inclusive); ações sem prazo ficam de fora. Sem intervalo, nada é
 * restringido.
 */
export function isWithinRange(
  plannedEnd: string | null,
  from: string | null,
  to: string | null,
): boolean {
  if (!from || !to) return true;
  return plannedEnd != null && plannedEnd >= from && plannedEnd <= to;
}
