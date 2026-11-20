import { describe, expect, it } from "vitest";
import { buildPlanReport, type ReportItem } from "@/lib/plan-report";

const row = (p: Partial<ReportItem> & { id: string }): ReportItem => ({
  parent_id: null, number: p.id, action: p.id, responsible: null, planned_end: null, status: 1, preco: 0, ...p,
});
const TODAY = "2026-11-20";

describe("buildPlanReport", () => {
  const rows = [
    row({ id: "macro", preco: 0 }),
    row({ id: "atrasada", parent_id: "macro", status: 3, planned_end: "2026-12-01", preco: 100 }),
    row({ id: "vencida", parent_id: "macro", status: 4, planned_end: "2026-11-10", preco: 50 }),
    row({ id: "proxima", parent_id: "macro", status: 2, planned_end: "2026-11-25" }),
    row({ id: "longe", status: 1, planned_end: "2027-03-01" }),
    row({ id: "feita", status: 5, planned_end: "2026-11-01" }),
  ];
  const r = buildPlanReport(rows, 1000, TODAY);

  it("conta só ações (macro fica fora)", () => {
    expect(r.total).toBe(5);
    expect(r.done).toBe(1);
    expect(r.rate).toBe(20);
  });
  it("bloqueios = status em atraso ou prazo vencido, por data", () => {
    expect(r.blocked.map((b) => b.id)).toEqual(["vencida", "atrasada"]);
  });
  it("próximos vencimentos: 30 dias, sem concluídas nem bloqueios", () => {
    expect(r.upcoming.map((u) => u.id)).toEqual(["proxima"]);
  });
  it("financeiro e farol", () => {
    expect(r.finance).toEqual({ totalCost: 150, budget: 1000, percentUsed: 15, overBudget: false });
    expect(r.farol).toBe("vermelho"); // 2 de 5 em bloqueio
  });
  it("farol verde sem bloqueios; vermelho com orçamento estourado", () => {
    const ok = [row({ id: "a", status: 4, planned_end: "2026-12-30", preco: 10 })];
    expect(buildPlanReport(ok, 100, TODAY).farol).toBe("verde");
    expect(buildPlanReport(ok, 5, TODAY).farol).toBe("vermelho");
    expect(buildPlanReport(ok, null, TODAY).finance.percentUsed).toBeNull();
  });
});
