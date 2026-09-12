"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { getPlans, getItems, getPlanosBootstrap, getPlanItemsBundle } from "@/app/actions/action-plan";
import type { ItemContasSummary } from "@/app/actions/contas-pagar";
import type { ActionPlan, ActionItem, AuditEntry } from "@/types/action-plan";
import type { Area, Unit } from "@/types/catalog";

interface UsePlanosDataParams {
  tenantId: string | undefined;
}

export function usePlanosData({ tenantId }: UsePlanosDataParams) {
  const { toast } = useToast();

  const [allPlans, setAllPlans] = useState<ActionPlan[]>([]);
  const [items, setItems] = useState<ActionItem[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [contasSummary, setContasSummary] = useState<Record<string, ItemContasSummary>>({});
  const [catalogTiposPa, setCatalogTiposPa] = useState<{ id: string; name: string }[]>([]);
  const [catalogMacroAcoes, setCatalogMacroAcoes] = useState<{ id: string; name: string }[]>([]);
  const [catalogUnits, setCatalogUnits] = useState<Unit[]>([]);
  const [catalogAreas, setCatalogAreas] = useState<Area[]>([]);
  const [userAreaIds, setUserAreaIds] = useState<string[]>([]);
  const [userUnitIds, setUserUnitIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setItems([]);
      setAuditLog([]);
      setContasSummary({});
      try {
        // Uma única server action (um POST, uma passagem pelo middleware).
        const { plans, tiposPa, macroAcoes, units, areas, scope } = await getPlanosBootstrap(tenantId);
        if (cancelled) return;
        setAllPlans(plans);
        setCatalogTiposPa(tiposPa);
        setCatalogMacroAcoes(macroAcoes);
        setCatalogUnits(units.filter((item) => item.active));
        setCatalogAreas(areas.filter((item) => item.active));
        setUserAreaIds(scope.areaIds);
        setUserUnitIds(scope.unitIds);
      } catch {
        if (!cancelled) toast("Erro ao carregar planos. Tente novamente.", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  async function loadPlanItems(planId: string) {
    setLoadingItems(true);
    try {
      const { items: i, auditLog: a, contasSummary: cs } = await getPlanItemsBundle(planId);
      setItems(i);
      setAuditLog(a);
      setContasSummary(cs);
    } catch {
      toast("Erro ao carregar ações do plano.", "error");
    } finally {
      setLoadingItems(false);
    }
  }

  async function refreshPlans() {
    if (!tenantId) return;
    const plans = await getPlans(tenantId);
    setAllPlans(plans);
    return plans;
  }

  async function refreshItems(planId: string) {
    const i = await getItems(planId);
    setItems(i);
  }

  return {
    allPlans,
    setAllPlans,
    items,
    setItems,
    auditLog,
    setAuditLog,
    contasSummary,
    setContasSummary,
    catalogTiposPa,
    catalogMacroAcoes,
    catalogUnits,
    catalogAreas,
    userAreaIds,
    userUnitIds,
    loading,
    loadingItems,
    loadPlanItems,
    refreshPlans,
    refreshItems,
  };
}
