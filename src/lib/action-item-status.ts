import type { ActionItemStatus } from "@/types/action-plan";

type ActionItemStatusInput = {
  action?: string | null;
  responsible?: string | null;
  planned_start?: string | null;
  planned_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  expected_result?: string | null;
  actual_result?: string | null;
  observations?: string | null;
  cost?: string | null;
  where?: string | null;
  why?: string | null;
  como?: string | null;
  inscritos_real?: number | null;
  mat_fin_real?: number | null;
  mat_acad_real?: number | null;
};

function hasText(value: string | null | undefined): boolean {
  return (value || "").trim().length > 0;
}

function hasPositiveNumber(value: number | null | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isPast(date: Date, today: Date): boolean {
  return date.getTime() < today.getTime();
}

export function deriveActionItemStatus(
  input: ActionItemStatusInput,
  referenceDate = new Date(),
): ActionItemStatus {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const plannedEnd = parseDate(input.planned_end);
  const hasPlanning =
    hasText(input.action) ||
    hasText(input.responsible) ||
    hasText(input.planned_start) ||
    hasText(input.planned_end) ||
    hasText(input.expected_result) ||
    hasText(input.cost) ||
    hasText(input.where) ||
    hasText(input.why) ||
    hasText(input.como);

  const hasExecutionSignals =
    hasText(input.actual_start) ||
    hasText(input.actual_result) ||
    hasText(input.observations) ||
    hasPositiveNumber(input.inscritos_real) ||
    hasPositiveNumber(input.mat_fin_real) ||
    hasPositiveNumber(input.mat_acad_real);

  const isCompleted =
    hasText(input.actual_end) ||
    (
      hasPositiveNumber(input.inscritos_real) &&
      hasPositiveNumber(input.mat_fin_real) &&
      hasPositiveNumber(input.mat_acad_real)
    );

  if (isCompleted) return 5;
  if (plannedEnd && isPast(plannedEnd, today)) return hasExecutionSignals ? 3 : 2;
  if (hasExecutionSignals) return 4;
  if (hasPlanning) return 2;
  return 1;
}
