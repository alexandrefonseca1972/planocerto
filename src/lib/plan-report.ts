/**
 * Resumo executivo de um plano (PLANO-MELHORIAS 4.3): farol, bloqueios,
 * saúde financeira e próximos vencimentos. Função pura sobre as linhas do banco.
 */
export interface ReportItem {
  id: string;
  parent_id: string | null;
  number: string;
  action: string;
  responsible: string | null;
  planned_end: string | null;
  status: number;
  preco: number | string | null;
}

export type Farol = "verde" | "amarelo" | "vermelho";

const DAY = 86_400_000;
export const UPCOMING_DAYS = 30;
export const LIST_LIMIT = 5;

const byDate = (a: ReportItem, b: ReportItem) => (a.planned_end || "").localeCompare(b.planned_end || "");

/** `today` em AAAA-MM-DD (fuso de quem gera). */
export function buildPlanReport(rows: ReportItem[], budgetLimit: number | null | undefined, today: string) {
  // Macros (linhas com filhos) são agrupadores: só ações entram nas contas.
  const parents = new Set(rows.map((r) => r.parent_id).filter(Boolean));
  const actions = rows.filter((r) => !parents.has(r.id));
  const open = actions.filter((a) => a.status !== 5);

  const byStatus: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const a of actions) byStatus[a.status] = (byStatus[a.status] || 0) + 1;

  // Bloqueio = marcada em atraso ou com prazo vencido e não concluída.
  const blocked = open.filter((a) => a.status === 3 || (!!a.planned_end && a.planned_end < today)).sort(byDate);

  const limit = new Date(Date.parse(today) + UPCOMING_DAYS * DAY).toISOString().slice(0, 10);
  const upcoming = open
    .filter((a) => a.status !== 3 && !!a.planned_end && a.planned_end >= today && a.planned_end <= limit)
    .sort(byDate);

  // Mesma conta do BudgetHealthBar (calculatePlanFinancials): soma de preco de todas as linhas.
  const totalCost = rows.reduce((acc, r) => acc + (Number(r.preco) || 0), 0);
  const budget = budgetLimit && budgetLimit > 0 ? budgetLimit : null;
  const percentUsed = budget ? Math.round((totalCost / budget) * 100) : null;

  // ponytail: regra simples de farol (>10% em bloqueio ou orçamento estourado = vermelho); ajustar com o time se precisar.
  const blockedShare = actions.length ? blocked.length / actions.length : 0;
  const overBudget = budget !== null && totalCost > budget;
  const farol: Farol = blockedShare > 0.1 || overBudget ? "vermelho" : blocked.length > 0 ? "amarelo" : "verde";

  return {
    total: actions.length,
    done: byStatus[5],
    rate: actions.length ? Math.round((byStatus[5] / actions.length) * 100) : 0,
    byStatus,
    farol,
    blocked: blocked.slice(0, LIST_LIMIT),
    blockedCount: blocked.length,
    upcoming: upcoming.slice(0, LIST_LIMIT),
    upcomingCount: upcoming.length,
    finance: { totalCost, budget, percentUsed, overBudget },
  };
}
