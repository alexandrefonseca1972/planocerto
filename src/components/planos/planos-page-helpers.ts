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

