import { describe, expect, it } from "vitest";
import { buildMacroActionOptions, filterCatalogByAccess, filterPlansByGovernance, getAvailablePlanExercises, isValidActionText, orderParentGroupsByMacroCatalog, resolveSelectedPlanId } from "@/components/planos/planos-page-helpers";
import type { ActionPlan } from "@/types/action-plan";

describe("resolveSelectedPlanId", () => {
  const plans = [
    { id: "plan-1" },
    { id: "plan-2" },
  ];

  it("uses requested plan when it exists in the loaded list", () => {
    expect(resolveSelectedPlanId(plans, "plan-2")).toBe("plan-2");
  });

  it("falls back to the first plan when the requested id is missing", () => {
    expect(resolveSelectedPlanId(plans, "missing-plan")).toBe("plan-1");
  });

  it("returns null when there are no plans", () => {
    expect(resolveSelectedPlanId([], "plan-2")).toBeNull();
  });
});

describe("isValidActionText", () => {
  it("accepts action text with at least 3 non-space chars", () => {
    expect(isValidActionText("ABC")).toBe(true);
    expect(isValidActionText("  ABC  ")).toBe(true);
  });

  it("rejects empty, whitespace-only, or too-short values", () => {
    expect(isValidActionText("")).toBe(false);
    expect(isValidActionText("  ")).toBe(false);
    expect(isValidActionText("AB")).toBe(false);
  });
});

describe("orderParentGroupsByMacroCatalog", () => {
  it("orders parent groups by the macro action catalog when available", () => {
    const groups = [
      { id: "2", action: "Trade" },
      { id: "1", action: "Afiliados" },
      { id: "3", action: "Eventos" },
    ];

    const ordered = orderParentGroupsByMacroCatalog(groups, [
      { name: "Eventos" },
      { name: "Afiliados" },
    ]);

    expect(ordered.map((item) => item.action)).toEqual(["Eventos", "Afiliados", "Trade"]);
  });

  it("preserves the original list when there is no catalog", () => {
    const groups = [
      { id: "2", action: "Trade" },
      { id: "1", action: "Afiliados" },
    ];

    expect(orderParentGroupsByMacroCatalog(groups)).toEqual(groups);
  });
});

describe("buildMacroActionOptions", () => {
  it("includes macro actions from the catalog even when no group exists yet", () => {
    const options = buildMacroActionOptions(
      [{ id: "existing-1", action: "Trade" }],
      [{ name: "Eventos" }, { name: "Trade" }],
    );

    expect(options).toEqual([
      { value: "Eventos", label: "Eventos", parentId: undefined },
      { value: "Trade", label: "Trade", parentId: "existing-1" },
    ]);
  });

  it("appends uncataloged existing groups after catalog entries", () => {
    const options = buildMacroActionOptions(
      [{ id: "existing-1", action: "Trade" }, { id: "existing-2", action: "Afiliados" }],
      [{ name: "Eventos" }],
    );

    expect(options.map((item) => item.value)).toEqual(["Eventos", "Afiliados", "Trade"]);
  });
});

describe("filterCatalogByAccess", () => {
  it("returns all items when the user has unrestricted access", () => {
    const items = [{ id: "1" }, { id: "2" }];
    expect(filterCatalogByAccess(items, [])).toEqual(items);
  });

  it("filters items to the explicitly allowed ids", () => {
    const items = [{ id: "1" }, { id: "2" }, { id: "3" }];
    expect(filterCatalogByAccess(items, ["2", "3"])).toEqual([{ id: "2" }, { id: "3" }]);
  });
});

describe("filterPlansByGovernance", () => {
  const plans: ActionPlan[] = [
    { id: "1", tenant_id: "t", title: "Plano 1", unit: "", director: "", goal: "", status: "active", visibility: "public", user_id: null, created_at: "", updated_at: "", exercicio: 2026 },
    { id: "2", tenant_id: "t", title: "Plano 2", unit: "", director: "", goal: "", status: "archived", visibility: "restricted", user_id: null, created_at: "", updated_at: "", exercicio: 2025 },
    { id: "3", tenant_id: "t", title: "Plano 3", unit: "", director: "", goal: "", status: "active", visibility: "restricted", user_id: null, created_at: "", updated_at: "", exercicio: 2026 },
  ];

  it("filters by plan status", () => {
    expect(filterPlansByGovernance([...plans], { status: "archived" }).map((plan) => plan.id)).toEqual(["2"]);
  });

  it("filters by visibility and exercise together", () => {
    expect(
      filterPlansByGovernance([...plans], { visibility: "restricted", exercicio: 2026 }).map((plan) => plan.id),
    ).toEqual(["3"]);
  });
});

describe("getAvailablePlanExercises", () => {
  it("returns unique exercises sorted descending", () => {
    const plans: ActionPlan[] = [
      { id: "1", tenant_id: "t", title: "A", unit: "", director: "", goal: "", status: "active", visibility: "public", user_id: null, created_at: "", updated_at: "", exercicio: 2024 },
      { id: "2", tenant_id: "t", title: "B", unit: "", director: "", goal: "", status: "active", visibility: "public", user_id: null, created_at: "", updated_at: "", exercicio: 2026 },
      { id: "3", tenant_id: "t", title: "C", unit: "", director: "", goal: "", status: "active", visibility: "public", user_id: null, created_at: "", updated_at: "", exercicio: 2025 },
      { id: "4", tenant_id: "t", title: "D", unit: "", director: "", goal: "", status: "active", visibility: "public", user_id: null, created_at: "", updated_at: "", exercicio: 2026 },
      { id: "5", tenant_id: "t", title: "E", unit: "", director: "", goal: "", status: "active", visibility: "public", user_id: null, created_at: "", updated_at: "" },
    ];

    expect(getAvailablePlanExercises(plans)).toEqual([2026, 2025, 2024]);
  });
});
