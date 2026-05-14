import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CopyPlanButton } from "@/components/planos/copy-plan-button";

const {
  clonePlanWithDateShiftMock,
  copyPlanMock,
  getUserTenantsMock,
} = vi.hoisted(() => ({
  clonePlanWithDateShiftMock: vi.fn(),
  copyPlanMock: vi.fn(),
  getUserTenantsMock: vi.fn(),
}));

vi.mock("@/app/actions/action-plan", () => ({
  clonePlanWithDateShift: clonePlanWithDateShiftMock,
}));

vi.mock("@/app/actions/shared", () => ({
  copyPlan: copyPlanMock,
}));

vi.mock("@/app/actions/tenant", () => ({
  getUserTenants: getUserTenantsMock,
}));

describe("CopyPlanButton", () => {
  const toast = vi.fn();
  const router = { refresh: vi.fn() };
  const plan = {
    id: "plan-1",
    tenant_id: "tenant-1",
    title: "Plano Base",
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();
    getUserTenantsMock.mockResolvedValue([
      { id: "tenant-1", name: "Empresa A", active: true },
      { id: "tenant-2", name: "Empresa B", active: true },
    ]);
  });

  it("uses date-shift clone for the same tenant", async () => {
    clonePlanWithDateShiftMock.mockResolvedValue({ success: true, message: "Plano clonado!" });

    render(<CopyPlanButton plan={plan as never} toast={toast} router={router} />);

    fireEvent.click(screen.getByRole("button", { name: /clonar/i }));
    await screen.findByText(/clonar plano de ação/i);

    fireEvent.change(screen.getByLabelText(/nova data de início/i), { target: { value: "2026-08-01" } });
    fireEvent.click(screen.getByRole("button", { name: /confirmar clonagem/i }));

    await waitFor(() => {
      expect(clonePlanWithDateShiftMock).toHaveBeenCalledWith("plan-1", "2026-08-01");
    });
    expect(copyPlanMock).not.toHaveBeenCalled();
  });

  it("uses copyPlan when target tenant differs", async () => {
    copyPlanMock.mockResolvedValue({ success: true, message: "Plano copiado!" });

    render(<CopyPlanButton plan={plan as never} toast={toast} router={router} />);

    fireEvent.click(screen.getByRole("button", { name: /clonar/i }));
    await screen.findByText(/clonar plano de ação/i);

    fireEvent.change(screen.getByLabelText(/empresa destino/i), { target: { value: "tenant-2" } });
    fireEvent.change(screen.getByLabelText(/nova data de início/i), { target: { value: "2026-08-01" } });
    fireEvent.click(screen.getByRole("button", { name: /confirmar clonagem/i }));

    await waitFor(() => {
      expect(copyPlanMock).toHaveBeenCalledWith("plan-1", "tenant-2");
    });
    expect(clonePlanWithDateShiftMock).not.toHaveBeenCalled();
  });
});
