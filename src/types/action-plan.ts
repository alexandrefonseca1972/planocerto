export type ActionItemStatus = 1 | 2 | 3 | 4 | 5;

export interface ActionPlan {
  id: string; tenant_id: string; title: string;
  unit: string; director: string; goal: string;
  status: "active" | "archived";
  user_id: string | null; created_at: string; updated_at: string;
}

export interface ActionItem {
  id: string; plan_id: string; parent_id: string | null;
  number: string; sort_order: number;
  // Classificação (modelo Excel)
  tipo_pa: string; area: string; prioridade: string;
  subacao: string; como: string;
  // 5W2H
  action: string; why: string; where: string; responsible: string;
  planned_start: string | null; planned_end: string | null;
  actual_start: string | null; actual_end: string | null;
  cost: string; expected_result: string; actual_result: string;
  status: ActionItemStatus; observations: string;
  // Métricas (modelo Excel)
  preco: number;
  inscritos_esperado: number; inscritos_real: number;
  mat_fin_esperado: number; mat_fin_real: number;
  mat_acad_esperado: number; mat_acad_real: number;
  created_at: string; updated_at: string;
  children?: ActionItem[];
}

export interface AuditEntry {
  id: string; plan_id: string; item_id: string | null;
  action: string; snapshot: Record<string, unknown>;
  user_id: string | null; user_name: string;
  created_at: string;
}

export const STATUS_FAROL: Record<number, { label: string; color: string; dot: string }> = {
  1: { label: "Não Iniciada", color: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700", dot: "⚪" },
  2: { label: "Pendente", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800", dot: "🟡" },
  3: { label: "Em andamento (atraso)", color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800", dot: "🔴" },
  4: { label: "Em andamento", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800", dot: "🔵" },
  5: { label: "Concluído", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800", dot: "🟢" },
};

export interface ActionPlanFormState {
  message?: string; errors?: Record<string, string[]>; success?: boolean;
}
