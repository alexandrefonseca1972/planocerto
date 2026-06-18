"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function usePlanosUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchQuery = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") ? Number(searchParams.get("status")) : null;
  const viewMode = (searchParams.get("view") as "table" | "kanban" | "gantt") || "table";
  const planStatusFilter = (searchParams.get("plan_status") as "active" | "archived" | null) || null;
  const visibilityFilter = (searchParams.get("plan_visibility") as "public" | "restricted" | null) || null;
  const exercicioFilter = searchParams.get("plan_year") ? Number(searchParams.get("plan_year")) : null;
  const dateFrom = searchParams.get("date_from") || "";
  const dateTo = searchParams.get("date_to") || "";
  const requestedPlanId = searchParams.get("plan");
  const requestedItemId = searchParams.get("item");

  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === "") {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }
      return newSearchParams.toString();
    },
    [searchParams]
  );

  const setSearchQuery = (query: string) => {
    router.replace(`${pathname}?${createQueryString({ q: query })}`, { scroll: false });
  };

  const setStatusFilter = (status: number | null) => {
    router.replace(`${pathname}?${createQueryString({ status })}`, { scroll: false });
  };

  const setViewMode = (view: "table" | "kanban" | "gantt") => {
    router.replace(`${pathname}?${createQueryString({ view })}`, { scroll: false });
  };

  const setPlanStatusFilter = (status: "active" | "archived" | null) => {
    router.replace(`${pathname}?${createQueryString({ plan_status: status })}`, { scroll: false });
  };

  const setVisibilityFilter = (visibility: "public" | "restricted" | null) => {
    router.replace(`${pathname}?${createQueryString({ plan_visibility: visibility })}`, { scroll: false });
  };

  const setExercicioFilter = (exercicio: number | null) => {
    router.replace(`${pathname}?${createQueryString({ plan_year: exercicio })}`, { scroll: false });
  };

  const setDateRange = (from: string, to: string) => {
    router.replace(`${pathname}?${createQueryString({ date_from: from || null, date_to: to || null })}`, { scroll: false });
  };

  const clearFilters = () => {
    router.replace(`${pathname}?${createQueryString({ plan_status: null, plan_visibility: null, plan_year: null })}`, { scroll: false });
  };

  return {
    searchQuery,
    statusFilter,
    viewMode,
    planStatusFilter,
    visibilityFilter,
    exercicioFilter,
    dateFrom,
    dateTo,
    requestedPlanId,
    requestedItemId,
    createQueryString,
    setSearchQuery,
    setStatusFilter,
    setViewMode,
    setPlanStatusFilter,
    setVisibilityFilter,
    setExercicioFilter,
    setDateRange,
    clearFilters,
  };
}
