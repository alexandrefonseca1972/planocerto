import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

const h = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams(""),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: h.replace }),
  usePathname: () => "/planos",
  useSearchParams: () => h.searchParams,
}));

import { usePlanosUrlParams } from "@/lib/hooks/use-planos-url-params";

describe("usePlanosUrlParams", () => {
  beforeEach(() => {
    h.replace.mockClear();
    h.searchParams = new URLSearchParams("");
  });

  it("parseia os query params presentes", () => {
    h.searchParams = new URLSearchParams(
      "q=teste&status=5&plan_year=2026&view=kanban&plan_status=archived&plan_visibility=restricted&plan=p1&tipo_pa=Vestibular&macro=Trade",
    );
    const { result } = renderHook(() => usePlanosUrlParams());
    expect(result.current.searchQuery).toBe("teste");
    expect(result.current.statusFilter).toBe(5);
    expect(result.current.exercicioFilter).toBe(2026);
    expect(result.current.viewMode).toBe("kanban");
    expect(result.current.planStatusFilter).toBe("archived");
    expect(result.current.visibilityFilter).toBe("restricted");
    expect(result.current.requestedPlanId).toBe("p1");
    expect(result.current.tipoPaFilter).toBe("Vestibular");
    expect(result.current.macroAcaoFilter).toBe("Trade");
  });

  it("usa defaults quando ausentes", () => {
    const { result } = renderHook(() => usePlanosUrlParams());
    expect(result.current.searchQuery).toBe("");
    expect(result.current.statusFilter).toBeNull();
    expect(result.current.viewMode).toBe("table");
    expect(result.current.exercicioFilter).toBeNull();
    expect(result.current.tipoPaFilter).toBe("");
    expect(result.current.macroAcaoFilter).toBe("");
  });

  it("setSearchQuery chama router.replace com a query string", () => {
    const { result } = renderHook(() => usePlanosUrlParams());
    result.current.setSearchQuery("abc");
    expect(h.replace).toHaveBeenCalledWith("/planos?q=abc", { scroll: false });
  });

  it("setTipoPaFilter e setMacroAcaoFilter gravam na URL", () => {
    const { result } = renderHook(() => usePlanosUrlParams());
    result.current.setTipoPaFilter("Vestibular");
    expect(h.replace).toHaveBeenCalledWith("/planos?tipo_pa=Vestibular", { scroll: false });
    result.current.setMacroAcaoFilter("Trade");
    expect(h.replace).toHaveBeenCalledWith("/planos?macro=Trade", { scroll: false });
  });

  it("createQueryString remove chaves nulas/vazias e preserva o resto", () => {
    h.searchParams = new URLSearchParams("q=x&status=2");
    const { result } = renderHook(() => usePlanosUrlParams());
    expect(result.current.createQueryString({ status: null })).toBe("q=x");
    expect(result.current.createQueryString({ view: "gantt" })).toContain("view=gantt");
  });

  it("clearFilters remove filtros de governança preservando a busca", () => {
    h.searchParams = new URLSearchParams(
      "plan_status=archived&plan_visibility=restricted&plan_year=2026&q=keep",
    );
    const { result } = renderHook(() => usePlanosUrlParams());
    result.current.clearFilters();
    expect(h.replace).toHaveBeenCalledWith("/planos?q=keep", { scroll: false });
  });
});

describe("usePlanosUrlParams — correções de filtros", () => {
  beforeEach(() => {
    h.replace.mockClear();
    h.searchParams = new URLSearchParams("");
  });

  it("clearItemFilters remove todos os filtros de ações em UM replace", () => {
    h.searchParams = new URLSearchParams(
      "q=x&status=3&date_from=2026-01-01&date_to=2026-02-01&tipo_pa=A&macro=B&plan_status=active&plan=p1",
    );
    const { result } = renderHook(() => usePlanosUrlParams());
    result.current.clearItemFilters();
    expect(h.replace).toHaveBeenCalledTimes(1);
    expect(h.replace).toHaveBeenCalledWith("/planos?plan_status=active&plan=p1", { scroll: false });
  });

  it("sem query restante navega para o pathname puro", () => {
    h.searchParams = new URLSearchParams("q=x");
    const { result } = renderHook(() => usePlanosUrlParams());
    result.current.setSearchQuery("");
    expect(h.replace).toHaveBeenCalledWith("/planos", { scroll: false });
  });

  it("ignora intervalo de datas incompleto e valores inválidos", () => {
    h.searchParams = new URLSearchParams("date_from=2026-01-01&status=abc&plan_year=0&view=x&plan_status=nope");
    const { result } = renderHook(() => usePlanosUrlParams());
    expect(result.current.dateFrom).toBe("");
    expect(result.current.dateTo).toBe("");
    expect(result.current.statusFilter).toBeNull();
    expect(result.current.exercicioFilter).toBeNull();
    expect(result.current.viewMode).toBe("table");
    expect(result.current.planStatusFilter).toBeNull();
  });

  it("setDateRange com uma ponta só limpa as duas", () => {
    h.searchParams = new URLSearchParams("date_from=2026-01-01&date_to=2026-02-01");
    const { result } = renderHook(() => usePlanosUrlParams());
    result.current.setDateRange("2026-03-01", "");
    expect(h.replace).toHaveBeenCalledWith("/planos", { scroll: false });
  });

  it("setSelectedPlan troca o plano e descarta o item", () => {
    h.searchParams = new URLSearchParams("plan=p1&item=i1&q=k");
    const { result } = renderHook(() => usePlanosUrlParams());
    result.current.setSelectedPlan("p2");
    expect(h.replace).toHaveBeenCalledWith("/planos?plan=p2&q=k", { scroll: false });
  });
});
