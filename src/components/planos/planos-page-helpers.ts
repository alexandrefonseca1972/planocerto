import type { ActionPlan } from "@/types/action-plan";

export function resolveSelectedPlanId<T extends { id: string }>(
  plans: T[],
  requestedPlanId?: string | null,
): string | null {
  if (requestedPlanId && plans.some((plan) => plan.id === requestedPlanId)) {
    return requestedPlanId;
  }

  return plans[0]?.id ?? null;
}

export function isValidActionText(value: string): boolean {
  return value.trim().length >= 3;
}

export function orderParentGroupsByMacroCatalog<T extends { action: string }>(
  groups: T[],
  macroCatalog: { name: string }[] = [],
): T[] {
  if (macroCatalog.length === 0) return groups;

  const macroOrder = new Map(
    macroCatalog.map((item, index) => [item.name.trim().toLowerCase(), index]),
  );

  return [...groups].sort((left, right) => {
    const leftIndex = macroOrder.get(left.action.trim().toLowerCase()) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = macroOrder.get(right.action.trim().toLowerCase()) ?? Number.MAX_SAFE_INTEGER;

    if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    return left.action.localeCompare(right.action, "pt-BR");
  });
}

export function buildMacroActionOptions<T extends { id: string; action: string }>(
  groups: T[],
  macroCatalog: { name: string }[] = [],
): Array<{ value: string; label: string; parentId?: string }> {
  const orderedGroups = orderParentGroupsByMacroCatalog(groups, macroCatalog);
  const options: Array<{ value: string; label: string; parentId?: string }> = [];
  const seen = new Set<string>();

  for (const item of macroCatalog) {
    const value = item.name.trim();
    if (!value) continue;
    const matchedGroup = orderedGroups.find((group) => group.action.trim().toLowerCase() === value.toLowerCase());
    options.push({
      value,
      label: value,
      parentId: matchedGroup?.id,
    });
    seen.add(value.toLowerCase());
  }

  for (const group of orderedGroups) {
    const value = group.action.trim();
    if (!value || seen.has(value.toLowerCase())) continue;
    options.push({
      value,
      label: value,
      parentId: group.id,
    });
    seen.add(value.toLowerCase());
  }

  return options;
}

export function filterCatalogByAccess<T extends { id: string }>(
  items: T[],
  allowedIds: string[] = [],
): T[] {
  if (allowedIds.length === 0) return items;
  const allowed = new Set(allowedIds);
  return items.filter((item) => allowed.has(item.id));
}

export function filterPlansByGovernance(
  plans: ActionPlan[],
  filters: {
    exercicio?: number | null;
    visibility?: "public" | "restricted" | null;
    status?: "active" | "archived" | null;
  },
): ActionPlan[] {
  return plans.filter((plan) => {
    const matchesExercicio = filters.exercicio === null || filters.exercicio === undefined
      ? true
      : plan.exercicio === filters.exercicio;
    const matchesVisibility = filters.visibility ? plan.visibility === filters.visibility : true;
    const matchesStatus = filters.status ? plan.status === filters.status : true;

    return matchesExercicio && matchesVisibility && matchesStatus;
  });
}

export function getAvailablePlanExercises(plans: ActionPlan[]): number[] {
  return [...new Set(plans.map((plan) => plan.exercicio).filter((value): value is number => typeof value === "number"))]
    .sort((left, right) => right - left);
}
