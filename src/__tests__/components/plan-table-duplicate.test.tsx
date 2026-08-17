import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlanTable } from "@/components/planos/plan-table";
import type { ActionItem } from "@/types/action-plan";

function item(partial: Partial<ActionItem> & { id: string }): ActionItem {
  return {
    plan_id: "plan-1",
    parent_id: null,
    number: "1.1",
    sort_order: 1,
    tipo_pa: "",
    area: "",
    prioridade: "",
    subacao: "",
    como: "",
    action: "Campanha",
    why: "",
    where: "",
    responsible: "",
    planned_start: null,
    planned_end: null,
    actual_start: null,
    actual_end: null,
    cost: "",
    expected_result: "",
    actual_result: "",
    status: 1,
    observations: "",
    preco: 0,
    inscritos_esperado: 0,
    inscritos_real: 0,
    mat_fin_esperado: 0,
    mat_fin_real: 0,
    mat_acad_esperado: 0,
    mat_acad_real: 0,
    created_at: "",
    updated_at: "",
    ...partial,
  };
}

describe("PlanTable duplicate action", () => {
  it("offers Duplicar ação in the row menu and calls onDuplicate", async () => {
    const onDuplicate = vi.fn();
    const row = item({ id: "c1", action: "Campanha Vestibular" });

    render(
      <PlanTable
        items={[row]}
        contasSummary={{}}
        onEdit={vi.fn()}
        onShowForm={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={onDuplicate}
        onOpenTab={vi.fn()}
        inlineAction={vi.fn()}
        isInlineSaving={false}
      />,
    );

    const trigger = screen.getByRole("button", { name: /ações da linha/i });
    fireEvent.pointerDown(trigger);
    const menuItem = await screen.findByRole("menuitem", { name: /duplicar ação/i });
    fireEvent.click(menuItem);
    expect(onDuplicate).toHaveBeenCalledWith(expect.objectContaining({ id: "c1" }));
  });
});
