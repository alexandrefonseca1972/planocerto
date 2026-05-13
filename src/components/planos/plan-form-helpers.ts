export interface PlanFormDraft {
  title: string;
  unit: string;
  director: string;
  goal: string;
}

export interface PlanFormValidation {
  titleValid: boolean;
  titleError: string;
  unitValid: boolean;
  unitError: string;
  directorValid: boolean;
  goalValid: boolean;
  canSubmit: boolean;
}

export function normalizePlanFormValue(value?: string | null): string {
  return value ?? "";
}

export function buildOfficialPlanHeader(unit: string): string {
  const normalizedUnit = unit.trim();
  return normalizedUnit ? `PLANO DE AÇÃO | ${normalizedUnit}` : "PLANO DE AÇÃO | NOME DA UNIDADE";
}

export function resolvePlanTitle(title: string, unit: string): string {
  const normalizedTitle = title.trim();
  if (normalizedTitle.length >= 2) return normalizedTitle;
  return unit.trim();
}

export function validatePlanFormDraft(draft: PlanFormDraft): PlanFormValidation {
  const unitTrimmed = draft.unit.trim();
  const resolvedTitle = resolvePlanTitle(draft.title, draft.unit);
  const titleValid = resolvedTitle.length >= 2;
  const unitValid = unitTrimmed.length >= 2 && unitTrimmed.length <= 200;

  return {
    titleValid,
    titleError: !titleValid ? "Informe uma unidade válida ou personalize o nome do plano." : "",
    unitValid,
    unitError: draft.unit.length > 0 && !unitValid ? "Selecione ou digite uma unidade com pelo menos 2 caracteres." : "",
    directorValid: draft.director.length <= 200,
    goalValid: draft.goal.length <= 1000,
    canSubmit: titleValid && unitValid,
  };
}

export function getPlanFormProgress(draft: PlanFormDraft): { fieldsFilled: number; totalFields: number; formProgress: number } {
  const fieldsFilled = [
    draft.title.trim().length > 0,
    draft.unit.trim().length > 0,
    draft.director.trim().length > 0,
    draft.goal.trim().length > 0,
  ].filter(Boolean).length;

  const totalFields = 4;

  return {
    fieldsFilled,
    totalFields,
    formProgress: Math.round((fieldsFilled / totalFields) * 100),
  };
}
