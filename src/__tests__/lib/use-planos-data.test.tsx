import { renderHook, waitFor } from "@testing-library/react";
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
});
