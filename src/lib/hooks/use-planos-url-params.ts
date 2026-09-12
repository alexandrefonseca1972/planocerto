"use client";

import { useCallback } from "react";
import { useSearchParams, usePathname } from "next/navigation";

type Params = Record<string, string | number | null>;

/** Número inteiro positivo ou null (descarta "abc", "", "0", "-1"). */
function parseIntParam(value: string | null): number | null {
  const n = Number(value);
  return value && Number.isInteger(n) && n > 0 ? n : null;
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

export const PLAN_FILTER_KEYS = ["plan_status", "plan_visibility", "plan_year"] as const;
export const ITEM_FILTER_KEYS = ["q", "status", "date_from", "date_to", "tipo_pa", "macro"] as const;

export function usePlanosUrlParams() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchQuery = searchParams.get("q") || "";
  const statusFilter = parseIntParam(searchParams.get("status"));
  const viewMode = oneOf(searchParams.get("view"), ["table", "kanban", "gantt"] as const) || "table";
  const planStatusFilter = oneOf(searchParams.get("plan_status"), ["active", "archived"] as const);
  const visibilityFilter = oneOf(searchParams.get("plan_visibility"), ["public", "restricted"] as const);
  const exercicioFilter = parseIntParam(searchParams.get("plan_year"));
  // Intervalo só vale com as duas pontas; meia seleção é ignorada.
  const rawFrom = searchParams.get("date_from") || "";
  const rawTo = searchParams.get("date_to") || "";
  const dateFrom = rawFrom && rawTo ? rawFrom : "";
  const dateTo = rawFrom && rawTo ? rawTo : "";
  const tipoPaFilter = searchParams.get("tipo_pa") || "";
  const macroAcaoFilter = searchParams.get("macro") || "";
  const requestedPlanId = searchParams.get("plan");
  const requestedItemId = searchParams.get("item");

  const createQueryString = useCallback(
    (params: Params) => {
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

  /**
   * Aplica várias chaves em UM único replace (setters encadeados se sobrescrevem).
   * history.replaceState em vez de router.replace: o Next sincroniza useSearchParams
   * sem ir ao servidor (router.replace passava pelo middleware a cada filtro).
   */
  const setParams = useCallback(
    (params: Params) => {
      const qs = createQueryString(params);
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [createQueryString, pathname]
  );

  const clearKeys = (keys: readonly string[]) =>
    setParams(Object.fromEntries(keys.map((k) => [k, null])));

  return {
    searchQuery,
    statusFilter,
    viewMode,
    planStatusFilter,
    visibilityFilter,
    exercicioFilter,
    dateFrom,
    dateTo,
    tipoPaFilter,
    macroAcaoFilter,
    requestedPlanId,
    requestedItemId,
    createQueryString,
    setParams,
    setSearchQuery: (q: string) => setParams({ q }),
    setStatusFilter: (status: number | null) => setParams({ status }),
    setViewMode: (view: "table" | "kanban" | "gantt") => setParams({ view }),
    setPlanStatusFilter: (status: "active" | "archived" | null) => setParams({ plan_status: status }),
    setVisibilityFilter: (visibility: "public" | "restricted" | null) => setParams({ plan_visibility: visibility }),
    setExercicioFilter: (exercicio: number | null) => setParams({ plan_year: exercicio }),
    setDateRange: (from: string, to: string) =>
      setParams(from && to ? { date_from: from, date_to: to } : { date_from: null, date_to: null }),
    setTipoPaFilter: (tipoPa: string) => setParams({ tipo_pa: tipoPa }),
    setMacroAcaoFilter: (macroAcao: string) => setParams({ macro: macroAcao }),
    setSelectedPlan: (planId: string | null) => setParams({ plan: planId, item: null }),
    clearFilters: () => clearKeys(PLAN_FILTER_KEYS),
    clearItemFilters: () => clearKeys(ITEM_FILTER_KEYS),
  };
}
