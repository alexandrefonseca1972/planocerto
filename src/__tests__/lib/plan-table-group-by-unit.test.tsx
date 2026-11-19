import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PlanTable } from "@/components/planos/plan-table";
import type { ActionItem } from "@/types/action-plan";

const item = (id: string, plan_id: string, number: number) =>
  ({ id, plan_id, number, action: "BRINDES", status: 2, cost: "100", children: [] }) as unknown as ActionItem;

const noop = vi.fn();
const props = {
  contasSummary: {},
  onEdit: noop,
  onShowForm: noop,
  onDelete: noop,
  onDuplicate: noop,
  onOpenTab: noop,
  inlineAction: noop,
  isInlineSaving: false,
};

// Grupo raiz (macro ação) com filhos, de um plano/cidade.
const group = (id: string, plan_id: string, macro: string, kids: string[]) =>
  ({
    id, plan_id, number: "1", action: macro, status: 2, cost: "", parent_id: null,
    children: kids.map((k, n) => ({ ...item(k, plan_id, n + 1), action: `Ação ${k}`, parent_id: id })),
  }) as unknown as ActionItem;

const texts = () => screen.getAllByRole("row").slice(1).map((r) => (r.textContent ?? "").replace(/\s+/g, " ").trim());

describe("PlanTable — vários planos: macro ação → cidade → ações", () => {
  it("junta a mesma macro (grafias diferentes) e lista as cidades dentro dela", () => {
    const items = [
      group("gRio", "pRio", "Brindes", ["r1"]),
      group("gBoa", "pBoa", "BRINDES", ["b1", "b2"]),
      group("gBoaE", "pBoa", "EMPRESA-VISITA", ["e1"]),
    ];
    render(<PlanTable {...props} items={items} unitByPlanId={{ pRio: "Rio Branco", pBoa: "Boa Vista" }} />);

    const rows = texts();
    expect(rows[0]).toMatch(/^BRINDES\s*3 ações · 2 cidades/);
    expect(rows[1]).toMatch(/^Boa Vista\s*2 ações/);
    expect(rows[2]).toMatch(/Ação b1/);
    expect(rows[3]).toMatch(/Ação b2/);
    expect(rows[4]).toMatch(/^Rio Branco\s*1 ação/);
    expect(rows[5]).toMatch(/Ação r1/);
    expect(rows[6]).toMatch(/^EMPRESA-VISITA\s*1 ação · 1 cidade/);
  });

  it("recolhe a macro ao clicar", () => {
    render(<PlanTable {...props} items={[group("g", "p", "BRINDES", ["a", "b"])]} unitByPlanId={{ p: "Belém" }} />);
    fireEvent.click(screen.getByText("BRINDES"));
    expect(texts()).toHaveLength(1);
  });

  it("sem unitByPlanId (plano único) não mostra linhas de macro/cidade", () => {
    render(<PlanTable {...props} items={[item("a", "p1", 1)]} />);
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });
});

describe("PlanTable — paginação agrupada", () => {
  it("não deixa cabeçalho de cidade sozinho no fim da página e repete o contexto na próxima", () => {
    // 19 ações em Belém + 3 em Rolim de Moura (página = 20 ações)
    const items = [
      group("g1", "pBel", "BRINDES", Array.from({ length: 19 }, (_, i) => `b${i}`)),
      group("g2", "pRol", "BRINDES", ["r0", "r1", "r2"]),
    ];
    render(<PlanTable {...props} items={items} unitByPlanId={{ pBel: "Belém", pRol: "Rolim de Moura" }} />);
    let rows = texts();
    // página 1: macro + Belém + 19 ações + Rolim de Moura + 1 ação
    expect(rows.at(-2)).toMatch(/^Rolim de Moura/);
    expect(rows.at(-1)).toMatch(/Ação r0/);
    fireEvent.click(screen.getByText("»"));
    rows = texts();
    expect(rows[0]).toMatch(/^BRINDES/);
    expect(rows[1]).toMatch(/^Rolim de Moura/);
    expect(rows.slice(2).map((t) => t.match(/Ação r\d/)?.[0])).toEqual(["Ação r1", "Ação r2"]);
  });
});

describe("PlanTable — virada de página na troca de cidade", () => {
  it("repete a macro quando a página nova começa com outra cidade", () => {
    // Belém ocupa exatamente 20 ações (página cheia); Rolim de Moura vai para a página 2.
    const items = [
      group("g1", "pBel", "BRINDES", Array.from({ length: 20 }, (_, i) => `b${i}`)),
      group("g2", "pRol", "BRINDES", ["r0"]),
    ];
    render(<PlanTable {...props} items={items} unitByPlanId={{ pBel: "Belém", pRol: "Rolim de Moura" }} />);
    fireEvent.click(screen.getByText("»"));
    const rows = texts();
    expect(rows[0]).toMatch(/^BRINDES/);
    expect(rows[1]).toMatch(/^Rolim de Moura/);
    expect(rows[2]).toMatch(/Ação r0/);
  });
});
