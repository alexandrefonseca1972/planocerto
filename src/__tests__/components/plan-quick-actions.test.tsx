import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlanQuickActions } from "@/components/planos/plan-quick-actions";
import type { ActionPlan } from "@/types/action-plan";

vi.mock("@/components/planos/copy-plan-button", () => ({
  CopyPlanButton: () => null,
}));

vi.mock("@/components/planos/share-link-button", () => ({
  ShareLinkButton: () => null,
}));

const plan = {
  id: "plan-1",
  tenant_id: "tenant-1",
  title: "Plano",
} as ActionPlan;

describe("PlanQuickActions", () => {
  it("oferece clonar e compartilhar, sem duplicar ação no menu do plano", () => {
    render(
      <PlanQuickActions
        plan={plan}
        plans={[plan]}
        toast={vi.fn()}
        router={{ refresh: vi.fn() }}
      />,
    );

    fireEvent.click(screen.getByTitle("Mais ações"));
    expect(screen.getByRole("button", { name: /clonar plano/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /compartilhar/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /duplicar ação/i })).not.toBeInTheDocument();
  });
});
