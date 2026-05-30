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
      "q=teste&status=5&plan_year=2026&view=kanban&plan_status=archived&plan_visibility=restricted&plan=p1",
    );
    const { result } = renderHook(() => usePlanosUrlParams());
    expect(result.current.searchQuery).toBe("teste");
    expect(result.current.statusFilter).toBe(5);
    expect(result.current.exercicioFilter).toBe(2026);
    expect(result.current.viewMode).toBe("kanban");
    expect(result.current.planStatusFilter).toBe("archived");
    expect(result.current.visibilityFilter).toBe("restricted");
    expect(result.current.requestedPlanId).toBe("p1");
  });

  it("usa defaults quando ausentes", () => {
    const { result } = renderHook(() => usePlanosUrlParams());
    expect(result.current.searchQuery).toBe("");
    expect(result.current.statusFilter).toBeNull();
    expect(result.current.viewMode).toBe("table");
    expect(result.current.exercicioFilter).toBeNull();
  });

  it("setSearchQuery chama router.replace com a query string", () => {
    const { result } = renderHook(() => usePlanosUrlParams());
    result.current.setSearchQuery("abc");
    expect(h.replace).toHaveBeenCalledWith("/planos?q=abc", { scroll: false });
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
