import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

const m = vi.hoisted(() => ({
  getPlans: vi.fn(),
  getItems: vi.fn(),
  getAuditLog: vi.fn(),
  getCurrentUserPlanScope: vi.fn(),
  recalculateAndGetItems: vi.fn(),
  getTiposPA: vi.fn(),
  getAreas: vi.fn(),
  getMacroAcoes: vi.fn(),
  getUnits: vi.fn(),
  getContasSummaryByPlan: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/app/actions/action-plan", () => ({
  getPlans: m.getPlans,
  getItems: m.getItems,
  getAuditLog: m.getAuditLog,
  getCurrentUserPlanScope: m.getCurrentUserPlanScope,
  recalculateAndGetItems: m.recalculateAndGetItems,
}));
vi.mock("@/app/actions/tipos-pa", () => ({ getTiposPA: m.getTiposPA }));
vi.mock("@/app/actions/catalog", () => ({
  getAreas: m.getAreas,
  getMacroAcoes: m.getMacroAcoes,
  getUnits: m.getUnits,
}));
vi.mock("@/app/actions/contas-pagar", () => ({ getContasSummaryByPlan: m.getContasSummaryByPlan }));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast: m.toast }) }));

import { usePlanosData } from "@/lib/hooks/use-planos-data";

describe("usePlanosData", () => {
  beforeEach(() => {
    Object.values(m).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset());
    m.getPlans.mockResolvedValue([{ id: "p1", title: "Plano 1" }]);
    m.getTiposPA.mockResolvedValue([{ id: "t1", name: "Tipo" }]);
    m.getMacroAcoes.mockResolvedValue([{ id: "mc1", name: "Macro" }]);
    m.getUnits.mockResolvedValue([{ id: "u1", name: "U", active: true }]);
    m.getAreas.mockResolvedValue([{ id: "a1", name: "A", active: true }]);
    m.getCurrentUserPlanScope.mockResolvedValue({ areaIds: [], unitIds: [] });
  });

  it("não busca dados quando tenantId é undefined", () => {
    const { result } = renderHook(() => usePlanosData({ tenantId: undefined }));
    expect(m.getPlans).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
  });

  it("carrega planos e catálogos quando há tenantId", async () => {
    const { result } = renderHook(() => usePlanosData({ tenantId: "tenant-1" }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(m.getPlans).toHaveBeenCalledWith("tenant-1");
    expect(result.current.allPlans).toEqual([{ id: "p1", title: "Plano 1" }]);
  });

  it("filtra catálogos inativos", async () => {
    m.getUnits.mockResolvedValue([
      { id: "u1", name: "U", active: true },
      { id: "u2", name: "X", active: false },
    ]);
    const { result } = renderHook(() => usePlanosData({ tenantId: "tenant-1" }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.catalogUnits).toHaveLength(1);
  });

  it("exibe toast de erro quando o carregamento falha", async () => {
    m.getPlans.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => usePlanosData({ tenantId: "tenant-1" }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(m.toast).toHaveBeenCalledWith("Erro ao carregar planos. Tente novamente.", "error");
  });
});
