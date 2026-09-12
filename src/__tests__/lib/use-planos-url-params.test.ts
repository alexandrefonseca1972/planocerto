import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

const h = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams(""),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/planos",
  useSearchParams: () => h.searchParams,
}));

import { usePlanosUrlParams } from "@/lib/hooks/use-planos-url-params";

const realReplaceState = window.history.replaceState.bind(window.history);
/** Simula a URL atual: no hook (useSearchParams) e no jsdom (window.location). */
function setUrl(qs: string) {
  h.searchParams = new URLSearchParams(qs);
  realReplaceState(null, "", qs ? `/planos?${qs}` : "/planos");
}

describe("usePlanosUrlParams", () => {
  beforeEach(() => {
    h.replace.mockClear();
    setUrl("");
    vi.spyOn(window.history, "replaceState").mockImplementation((d, t, url) => {
      h.replace(url);
      realReplaceState(d, t, url);
    });
  });

  it("parseia os query params presentes", () => {
    setUrl("q=teste&status=5&plan_year=2026&view=kanban&plan_status=archived&plan_visibility=restricted&plan=p1&tipo_pa=Vestibular&macro=Trade");
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

  it("setSearchQuery grava a query string na URL via replaceState", () => {
    const { result } = renderHook(() => usePlanosUrlParams());
    result.current.setSearchQuery("abc");
    expect(h.replace).toHaveBeenCalledWith("/planos?q=abc");
  });

  it("setTipoPaFilter e setMacroAcaoFilter gravam na URL", () => {
    const { result } = renderHook(() => usePlanosUrlParams());
    result.current.setTipoPaFilter("Vestibular");
    expect(h.replace).toHaveBeenCalledWith("/planos?tipo_pa=Vestibular");
    result.current.setMacroAcaoFilter("Trade");
    expect(h.replace).toHaveBeenLastCalledWith("/planos?tipo_pa=Vestibular&macro=Trade");
  });

  it("createQueryString remove chaves nulas/vazias e preserva o resto", () => {
    setUrl("q=x&status=2");
    const { result } = renderHook(() => usePlanosUrlParams());
    expect(result.current.createQueryString({ status: null })).toBe("q=x");
    expect(result.current.createQueryString({ view: "gantt" })).toContain("view=gantt");
  });

  it("clearFilters remove filtros de governança preservando a busca", () => {
    setUrl("plan_status=archived&plan_visibility=restricted&plan_year=2026&q=keep");
    const { result } = renderHook(() => usePlanosUrlParams());
    result.current.clearFilters();
    expect(h.replace).toHaveBeenCalledWith("/planos?q=keep");
  });
});

describe("usePlanosUrlParams — correções de filtros", () => {
  beforeEach(() => {
    h.replace.mockClear();
    setUrl("");
    vi.spyOn(window.history, "replaceState").mockImplementation((d, t, url) => {
      h.replace(url);
      realReplaceState(d, t, url);
    });
  });

  it("clearItemFilters remove todos os filtros de ações em UM replace", () => {
    setUrl("q=x&status=3&date_from=2026-01-01&date_to=2026-02-01&tipo_pa=A&macro=B&plan_status=active&plan=p1");
    const { result } = renderHook(() => usePlanosUrlParams());
    result.current.clearItemFilters();
    expect(h.replace).toHaveBeenCalledTimes(1);
    expect(h.replace).toHaveBeenCalledWith("/planos?plan_status=active&plan=p1");
  });

  it("sem query restante navega para o pathname puro", () => {
    setUrl("q=x");
    const { result } = renderHook(() => usePlanosUrlParams());
    result.current.setSearchQuery("");
    expect(h.replace).toHaveBeenCalledWith("/planos");
  });

  it("ignora intervalo de datas incompleto e valores inválidos", () => {
    setUrl("date_from=2026-01-01&status=abc&plan_year=0&view=x&plan_status=nope");
    const { result } = renderHook(() => usePlanosUrlParams());
    expect(result.current.dateFrom).toBe("");
    expect(result.current.dateTo).toBe("");
    expect(result.current.statusFilter).toBeNull();
    expect(result.current.exercicioFilter).toBeNull();
    expect(result.current.viewMode).toBe("table");
    expect(result.current.planStatusFilter).toBeNull();
  });

  it("setDateRange com uma ponta só limpa as duas", () => {
    setUrl("date_from=2026-01-01&date_to=2026-02-01");
    const { result } = renderHook(() => usePlanosUrlParams());
    result.current.setDateRange("2026-03-01", "");
    expect(h.replace).toHaveBeenCalledWith("/planos");
  });

  it("setSelectedPlan troca o plano e descarta o item", () => {
    setUrl("plan=p1&item=i1&q=k");
    const { result } = renderHook(() => usePlanosUrlParams());
    result.current.setSelectedPlan("p2");
    expect(h.replace).toHaveBeenCalledWith("/planos?plan=p2&q=k");
  });

  it("dois filtros em sequência (antes do hook re-renderizar) acumulam na URL", () => {
    const { result } = renderHook(() => usePlanosUrlParams());
    result.current.setTipoPaFilter("Vestibular");
    // useSearchParams ainda defasado (Next aplica em startTransition):
    // h.searchParams NÃO foi atualizado de propósito.
    result.current.setStatusFilter(3);
    expect(h.replace).toHaveBeenLastCalledWith("/planos?tipo_pa=Vestibular&status=3");
  });
});
