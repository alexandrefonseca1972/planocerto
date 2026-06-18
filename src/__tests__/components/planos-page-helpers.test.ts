import { describe, expect, it } from "vitest";
import { buildMacroActionOptions, filterCatalogByAccess, filterItemTree, filterPlansByGovernance, getAvailablePlanExercises, isValidActionText, orderParentGroupsByMacroCatalog, resolveSelectedPlanId } from "@/components/planos/planos-page-helpers";
import { isWithinRange } from "@/lib/date-range";
import type { ActionItem } from "@/types/action-plan";
import type { ActionPlan } from "@/types/action-plan";

// Fábrica mínima — filterItemTree só usa id/children; o predicado de teste usa
// planned_end/status. Demais campos são preenchidos por completude de tipo.
function item(partial: Partial<ActionItem> & { id: string }): ActionItem {
  return {
    plan_id: "p", parent_id: null, number: "", sort_order: 0,
    tipo_pa: "", area: "", prioridade: "", subacao: "", como: "",
    action: "", why: "", where: "", responsible: "",
    planned_start: null, planned_end: null, actual_start: null, actual_end: null,
    cost: "", expected_result: "", actual_result: "",
    status: 1, observations: "",
    preco: 0, inscritos_esperado: 0, inscritos_real: 0,
    mat_fin_esperado: 0, mat_fin_real: 0, mat_acad_esperado: 0, mat_acad_real: 0,
    created_at: "", updated_at: "",
    ...partial,
  };
}

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

describe("filterItemTree", () => {
  const tree: ActionItem[] = [
    item({
      id: "g1", action: "EMPRESA - AÇÃO", status: 2, // grupo sem prazo
      children: [
        item({ id: "c1", planned_end: "2026-02-10", status: 4 }),
        item({ id: "c2", planned_end: "2026-05-20", status: 1 }),
      ],
    }),
    item({ id: "leaf", planned_end: "2026-02-15", status: 5 }),
    item({ id: "g2", action: "TRADE", status: 1, children: [
      item({ id: "c3", planned_end: "2026-09-01", status: 1 }),
    ] }),
  ];

  it("predicado sempre-verdadeiro mantém a árvore inteira", () => {
    expect(filterItemTree(tree, () => true)).toEqual(tree);
  });

  it("mantém o grupo só com os filhos que casam (poda os demais)", () => {
    const from = "2026-01-01", to = "2026-03-01";
    const result = filterItemTree(tree, (i) => isWithinRange(i.planned_end, from, to));
    // g1 mantido com apenas c1; leaf mantido; g2 podado (c3 fora do intervalo).
    expect(result.map((i) => i.id)).toEqual(["g1", "leaf"]);
    expect(result[0].children?.map((c) => c.id)).toEqual(["c1"]);
  });

  it("descarta grupo quando nenhum filho casa", () => {
    const result = filterItemTree(tree, (i) => isWithinRange(i.planned_end, "2026-08-01", "2026-12-31"));
    // só g2/c3 estão nesse intervalo.
    expect(result.map((i) => i.id)).toEqual(["g2"]);
    expect(result[0].children?.map((c) => c.id)).toEqual(["c3"]);
  });

  it("quando o nó casa, preserva a subárvore inteira", () => {
    // status===2 casa só g1; como g1 casa, mantém seus dois filhos.
    const result = filterItemTree(tree, (i) => i.status === 2);
    expect(result.map((i) => i.id)).toEqual(["g1"]);
    expect(result[0].children?.map((c) => c.id)).toEqual(["c1", "c2"]);
  });

  it("filtra folhas de topo por status", () => {
    const result = filterItemTree(tree, (i) => i.status === 5);
    expect(result.map((i) => i.id)).toEqual(["leaf"]);
  });
});
