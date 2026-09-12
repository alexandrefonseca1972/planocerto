import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

const m = vi.hoisted(() => ({
  getPlans: vi.fn(),
  getItems: vi.fn(),
  getPlanosBootstrap: vi.fn(),
  getPlanItemsBundle: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/app/actions/action-plan", () => ({
  getPlans: m.getPlans,
  getItems: m.getItems,
  getPlanosBootstrap: m.getPlanosBootstrap,
  getPlanItemsBundle: m.getPlanItemsBundle,
}));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast: m.toast }) }));

const bootstrap = () => ({
  plans: [{ id: "p1", title: "Plano 1" }],
  tiposPa: [{ id: "t1", name: "Tipo" }],
  macroAcoes: [{ id: "mc1", name: "Macro" }],
  units: [{ id: "u1", name: "U", active: true }],
  areas: [{ id: "a1", name: "A", active: true }],
  scope: { areaIds: [], unitIds: [] },
});

import { usePlanosData } from "@/lib/hooks/use-planos-data";

describe("usePlanosData", () => {
  beforeEach(() => {
    Object.values(m).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset());
    m.getPlanosBootstrap.mockResolvedValue(bootstrap());
  });

  it("não busca dados quando tenantId é undefined", () => {
    const { result } = renderHook(() => usePlanosData({ tenantId: undefined }));
    expect(m.getPlanosBootstrap).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
  });

  it("carrega planos e catálogos quando há tenantId", async () => {
    const { result } = renderHook(() => usePlanosData({ tenantId: "tenant-1" }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(m.getPlanosBootstrap).toHaveBeenCalledWith("tenant-1");
    expect(result.current.allPlans).toEqual([{ id: "p1", title: "Plano 1" }]);
  });

  it("filtra catálogos inativos", async () => {
    m.getPlanosBootstrap.mockResolvedValue({
      ...bootstrap(),
      units: [
        { id: "u1", name: "U", active: true },
        { id: "u2", name: "X", active: false },
      ],
    });
    const { result } = renderHook(() => usePlanosData({ tenantId: "tenant-1" }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.catalogUnits).toHaveLength(1);
  });

  it("exibe toast de erro quando o carregamento falha", async () => {
    m.getPlanosBootstrap.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => usePlanosData({ tenantId: "tenant-1" }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(m.toast).toHaveBeenCalledWith("Erro ao carregar planos. Tente novamente.", "error");
  });

  it("loadPlanItems combina ações, histórico e contas de vários planos", async () => {
    m.getPlanItemsBundle
      .mockResolvedValueOnce({
        items: [{ id: "i1", plan_id: "p1" }],
        auditLog: [{ id: "a1", created_at: "2026-01-01" }],
        contasSummary: { i1: { count: 1 } },
      })
      .mockResolvedValueOnce({
        items: [{ id: "i2", plan_id: "p2" }],
        auditLog: [{ id: "a2", created_at: "2026-02-01" }],
        contasSummary: { i2: { count: 2 } },
      });
    const { result } = renderHook(() => usePlanosData({ tenantId: "tenant-1" }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.loadPlanItems(["p1", "p2"]));
    expect(result.current.items.map((i) => i.id)).toEqual(["i1", "i2"]);
    expect(result.current.auditLog.map((a) => a.id)).toEqual(["a2", "a1"]);
    expect(Object.keys(result.current.contasSummary)).toEqual(["i1", "i2"]);
  });
});
