"use client";

import { useActionState, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTenant } from "@/lib/contexts/tenant-context";
import { useToast } from "@/components/ui/toast";
import { 
  getPlans, 
  getItems, 
  getAuditLog, 
  createPlan, 
  updatePlan, 
  deletePlan, 
  upsertItem, 
  deleteItem, 
  updateItemStatus,
  getCurrentUserPlanScope,
  recalculateAndGetItems,
  quickUpdateItemAction,
} from "@/app/actions/action-plan";
import { getTiposPA } from "@/app/actions/tipos-pa";
import { getAreas, getMacroAcoes, getUnits } from "@/app/actions/catalog";
import { getContasSummaryByPlan, type ItemContasSummary } from "@/app/actions/contas-pagar";
import type { ActionPlan, ActionItem, AuditEntry, ActionPlanFormState } from "@/types/action-plan";
import type { Area, Unit } from "@/types/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonHeader, SkeletonTable } from "@/components/ui/loading";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format-br";
import { flattenItems, calculatePlanFinancials } from "@/components/planos/plan-utils";
import { resolveSelectedPlanId, filterCatalogByAccess, filterPlansByGovernance, getAvailablePlanExercises } from "@/components/planos/planos-page-helpers";
import { KanbanBoard } from "@/components/planos/plan-kanban";
import { GanttChart } from "@/components/planos/plan-gantt";
import { CopyPlanButton } from "@/components/planos/copy-plan-button";
import { UploadPlanosDialog } from "@/components/planos/upload-planos-dialog";
import { Plus, Pencil, Trash2, ClipboardList, UserCircle, Building2, Target, Upload, CalendarDays, Lock, Archive, AlertOctagon, Wallet } from "lucide-react";

// New components
import { PlanFormDialog } from "@/components/planos/plan-form-dialog";
import { ItemFormDialog } from "@/components/planos/item-form-dialog";
import { PlanStats } from "@/components/planos/plan-stats";
import { PlanFilters } from "@/components/planos/plan-filters";
import { PlanTable } from "@/components/planos/plan-table";
import { PlanQuickActions } from "@/components/planos/plan-quick-actions";

const init: ActionPlanFormState = { message: undefined, errors: {} };

export default function PlanosPage() {
  const { currentTenant, selectedUnitIds } = useTenant();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [allPlans, setAllPlans] = useState<ActionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [items, setItems] = useState<ActionItem[]>([]);
  const [contasSummary, setContasSummary] = useState<Record<string, ItemContasSummary>>({});
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [catalogTiposPa, setCatalogTiposPa] = useState<{ id: string; name: string }[]>([]);
  const [catalogMacroAcoes, setCatalogMacroAcoes] = useState<{ id: string; name: string }[]>([]);
  const [catalogUnits, setCatalogUnits] = useState<Unit[]>([]);
  const [catalogAreas, setCatalogAreas] = useState<Area[]>([]);
  const [userAreaIds, setUserAreaIds] = useState<string[]>([]);
  const [userUnitIds, setUserUnitIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // URL State Migration
  const searchQuery = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") ? Number(searchParams.get("status")) : null;
  const viewMode = (searchParams.get("view") as "table" | "kanban" | "gantt") || "table";
  const planStatusFilter = (searchParams.get("plan_status") as "active" | "archived" | null) || null;
  const visibilityFilter = (searchParams.get("plan_visibility") as "public" | "restricted" | null) || null;
  const exercicioFilter = searchParams.get("plan_year") ? Number(searchParams.get("plan_year")) : null;

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

  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<ActionPlan | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [editingItemTab, setEditingItemTab] = useState<"modelo" | "anexos" | "comentarios" | "historico">("modelo");
  const [deletingItem, setDeletingItem] = useState<ActionItem | null>(null);

  const [planCreateState, planCreateAction, isPlanCreating] = useActionState(createPlan, init);
  const [planUpdateState, planUpdateAction, isPlanUpdating] = useActionState(updatePlan, init);
  const [, planDeleteAction, isPlanDeleting] = useActionState(deletePlan, init);
  const [itemState, itemAction, isItemSaving] = useActionState(upsertItem, init);
  const [inlineState, inlineAction, isInlineSaving] = useActionState(quickUpdateItemAction, init);
  const [, itemDeleteAction, isItemDeleting] = useActionState(deleteItem, init);
  const requestedPlanId = searchParams.get("plan");
  const filteredPlans = useMemo(() => {
    const byGovernance = filterPlansByGovernance(allPlans, {
      exercicio: exercicioFilter,
      visibility: visibilityFilter,
      status: planStatusFilter,
    });
    if (selectedUnitIds.length === 0) return byGovernance;
    const unitSet = new Set(selectedUnitIds);
    return byGovernance.filter((p) => p.unit_id && unitSet.has(p.unit_id));
  }, [allPlans, exercicioFilter, visibilityFilter, planStatusFilter, selectedUnitIds]);
  const availableExercises = useMemo(() => getAvailablePlanExercises(allPlans), [allPlans]);
  const hasGovernanceFilters = planStatusFilter !== null || visibilityFilter !== null || exercicioFilter !== null;

  // Carrega lista de planos ao trocar tenant
  useEffect(() => {
    if (!currentTenant?.id) return;
    const tenantId = currentTenant.id;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setItems([]);
      setAuditLog([]);
      setContasSummary({});
      setPlan(null);
      try {
        const [plans, tiposPa, macroAcoes, units, areas, scope] = await Promise.all([
          getPlans(tenantId),
          getTiposPA(),
          getMacroAcoes(),
          getUnits(),
          getAreas(),
          getCurrentUserPlanScope(),
        ]);
        if (cancelled) return;
        setAllPlans(plans);
        setCatalogTiposPa(tiposPa.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })));
        setCatalogMacroAcoes(macroAcoes.map((m: { id: string; name: string }) => ({ id: m.id, name: m.name })));
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
  }, [currentTenant?.id, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // The selected plan must track URL/governance filters until this page is refactored further.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedPlanId(resolveSelectedPlanId(filteredPlans, requestedPlanId));
  }, [filteredPlans, requestedPlanId]);

  // Carrega itens, auditoria e contas ao trocar o plano selecionado
  useEffect(() => {
    if (!selectedPlanId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlan(null);
      setItems([]);
      setAuditLog([]);
      setContasSummary({});
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingItems(true);
      const selectedPlan = allPlans.find((p) => p.id === selectedPlanId) || null;
      setPlan(selectedPlan);
      if (selectedPlan?.id) {
        try {
          const [i, a, cs] = await Promise.all([
            recalculateAndGetItems(selectedPlan.id),
            getAuditLog(selectedPlan.id),
            getContasSummaryByPlan(selectedPlan.id),
          ]);
          if (cancelled) return;
          setItems(i);
          setAuditLog(a);
          setContasSummary(cs);
        } catch {
          if (!cancelled) toast("Erro ao carregar ações do plano.", "error");
        }
      }
      if (!cancelled) setLoadingItems(false);
    })();
    return () => { cancelled = true; };
  }, [selectedPlanId, allPlans, toast]);

  // Recarrega lista de planos e seleciona o recém-criado/atualizado
  useEffect(() => {
    if (!planCreateState.success || !currentTenant?.id) return;
    toast(planCreateState.message || "Plano criado!");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowPlanForm(false);
    getPlans(currentTenant.id).then((plans) => {
      setAllPlans(plans);
      if (plans[0]) setSelectedPlanId(plans[0].id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planCreateState.success]);

  useEffect(() => {
    if (!planUpdateState.success || !currentTenant?.id) return;
    toast(planUpdateState.message || "Plano atualizado!");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowPlanForm(false);
    getPlans(currentTenant.id).then((plans) => {
      setAllPlans(plans);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planUpdateState.success]);

  useEffect(() => {
    if (!itemState.success) return;
    toast(itemState.message || "Item salvo!");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowItemForm(false);
    setEditingItem(null);
    if (selectedPlanId) {
      getItems(selectedPlanId).then(setItems);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemState.success]);

  useEffect(() => {
    if (!inlineState.success) return;
    toast(inlineState.message || "Item salvo!");
    if (selectedPlanId) {
      getItems(selectedPlanId).then(setItems);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inlineState.success]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: globalThis.KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") { e.preventDefault(); if (plan) { setEditingItem(null); setShowItemForm(true); } }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [plan]);

  const allItems = useMemo(() => flattenItems(items), [items]);
  const { totalCost, isOverBudget, percentUsed } = useMemo(
    () => calculatePlanFinancials(items, plan?.budget_limit),
    [items, plan?.budget_limit],
  );
  const filteredItems = allItems.filter(i => {
    const matchesSearch = !searchQuery || i.action.toLowerCase().includes(searchQuery.toLowerCase()) || i.number.includes(searchQuery) || (i.responsible || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === null || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = { total: allItems.length, done: allItems.filter(i => i.status === 5).length, progress: allItems.filter(i => i.status === 4 || i.status === 3).length, pending: allItems.filter(i => i.status === 1 || i.status === 2).length };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-5">
        <SkeletonHeader withActions />
        <SkeletonTable rows={8} cols={6} />
      </div>
    );
  }

  // No plan for this tenant
  if (!plan) {
    const hasPlansWithoutMatch = allPlans.length > 0 && filteredPlans.length === 0;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Planos de Ação</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{currentTenant?.name || "Sem empresa"}</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center py-20 text-center">
            <ClipboardList className="mb-4 h-16 w-16 text-zinc-200 dark:text-zinc-700" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {hasPlansWithoutMatch ? "Nenhum plano corresponde aos filtros" : "Nenhum plano cadastrado"}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
              {hasPlansWithoutMatch ? (
                <>Ajuste os filtros de governança para localizar um plano já existente em <strong>{currentTenant?.name}</strong>.</>
              ) : (
                <>Crie um plano de ação 5W2H para a empresa <strong>{currentTenant?.name}</strong>.</>
              )}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {!hasPlansWithoutMatch && (
                <Button size="lg" onClick={() => setShowPlanForm(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Criar plano de ação
                </Button>
              )}
              {hasGovernanceFilters && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    router.replace(`${pathname}?${createQueryString({ plan_status: null, plan_visibility: null, plan_year: null })}`, { scroll: false });
                  }}
                >
                  Limpar filtros
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" /> Importar do Excel
              </Button>
            </div>
          </CardContent>
        </Card>
        {showPlanForm && (
          <PlanFormDialog plan={null} tenantId={currentTenant?.id || ""}
            catalogUnits={catalogUnits} catalogAreas={catalogAreas}
            state={planCreateState} action={planCreateAction} isPending={isPlanCreating}
            onClose={() => setShowPlanForm(false)} />
        )}
        {showUploadDialog && (
          <UploadPlanosDialog
            onClose={() => setShowUploadDialog(false)}
            onSuccess={() => {
              setShowUploadDialog(false);
              if (currentTenant?.id) {
                getPlans(currentTenant.id).then((plans) => {
                  setAllPlans(plans);
                  if (plans[0]) setSelectedPlanId(plans[0].id);
                });
              }
            }}
          />
        )}
      </div>
    );
  }

  const handleOpenTab = (it: ActionItem, tab: "modelo" | "anexos" | "comentarios" | "historico") => { 
    setEditingItem(it); 
    setEditingItemTab(tab); 
    setShowItemForm(true); 
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {filteredPlans.length > 1 ? (
            <div className="flex flex-col gap-1">
              <label htmlFor="plan-selector" className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Plano de ação
              </label>
              <select
                id="plan-selector"
                value={selectedPlanId ?? ""}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                disabled={loadingItems}
                className="h-10 w-full max-w-sm rounded-md border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              >
                {filteredPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.unit ? `${p.unit} — ` : ""}{p.title}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">{plan?.title || "Planos de Ação"}</h1>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {plan?.exercicio && <Badge variant="secondary" className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"><CalendarDays className="mr-1 h-3 w-3" />{plan.exercicio}</Badge>}
            {plan?.visibility === "restricted" && <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50"><Lock className="mr-1 h-3 w-3" />Restrito</Badge>}
            {plan?.status === "archived" && <Badge variant="outline" className="text-xs border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"><Archive className="mr-1 h-3 w-3" />Arquivado</Badge>}
            {plan?.unit && <Badge variant="outline" className="text-xs"><Building2 className="mr-1 h-3 w-3" />{plan.unit}</Badge>}
            {plan?.director && <Badge variant="outline" className="text-xs"><UserCircle className="mr-1 h-3 w-3" />{plan.director}</Badge>}
            {plan?.goal && <Badge variant="default" className="text-xs"><Target className="mr-1 h-3 w-3" />{plan.goal}</Badge>}
            {selectedUnitIds.length > 0 && (
              <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50">
                <Building2 className="mr-1 h-3 w-3" />
                {selectedUnitIds.length === 1 ? "1 unidade" : `${selectedUnitIds.length} unidades`} · filtro do dashboard
              </Badge>
            )}
          </div>

          {/* Budget Health */}
          {(plan?.budget_limit || 0) > 0 && (
            <div className={cn(
              "mt-3 flex max-w-fit items-center gap-3 rounded-xl border p-2.5 transition-all",
              isOverBudget 
                ? "border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10" 
                : "border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/20 dark:bg-emerald-950/5"
            )}>
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg shadow-sm",
                isOverBudget ? "bg-red-100 text-red-600 dark:bg-red-900/40" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40"
              )}>
                {isOverBudget ? <AlertOctagon className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Saúde Financeira</span>
                  {isOverBudget && <Badge className="h-4 px-1.5 text-[9px] bg-red-500 hover:bg-red-600">ORÇAMENTO ESTOURADO</Badge>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {formatBRL(totalCost)} <span className="text-xs font-normal text-zinc-400">/ {formatBRL(plan?.budget_limit || 0)}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div 
                        className={cn("h-full transition-all", isOverBudget ? "bg-red-500" : percentUsed > 80 ? "bg-amber-500" : "bg-emerald-500")}
                        style={{ width: `${Math.min(percentUsed, 100)}%` }}
                      />
                    </div>
                    <span className={cn("text-[10px] font-bold tabular-nums", isOverBudget ? "text-red-600" : "text-zinc-500")}>
                      {Math.round(percentUsed)}%
                    </span>
                  </div>
                </div>
              </div>
              {!isOverBudget && percentUsed > 0 && (
                <div className="ml-2 hidden border-l border-zinc-200 pl-3 dark:border-zinc-800 sm:block">
                  <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Saldo Disponivél</p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatBRL((plan?.budget_limit || 0) - totalCost)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => { setPlan(null); setShowPlanForm(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Novo Plano
          </Button>
          {plan && (
            <>
              <Button variant="outline" size="sm" onClick={() => { setShowPlanForm(true); }}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
              </Button>
              <Button variant="outline" size="sm" className="text-red-600" onClick={() => setDeletingPlan(plan)}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
              </Button>
              <PlanQuickActions plan={plan} plans={allPlans} toast={toast} router={router} />
            </>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <PlanStats
        counts={counts}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        setShowUploadDialog={setShowUploadDialog}
        setShowItemForm={setShowItemForm}
        setEditingItem={setEditingItem}
      />

      {/* Loading items overlay */}
      {loadingItems && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {/* History */}
      {!loadingItems && showHistory && auditLog.length > 0 && (
        <Card className="animate-[slideDown_200ms_ease-out]">
          <CardContent className="max-h-40 space-y-1 overflow-y-auto p-3">
            {auditLog.slice(0, 20).map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 rounded px-2 py-1 text-xs">
                <span className={cn("font-bold",
                  entry.action.includes("CREATE") ? "text-emerald-600" : entry.action.includes("UPDATE") ? "text-blue-600" : "text-red-600")}>
                  {entry.action.includes("CREATE") ? "+" : entry.action.includes("DELETE") ? "−" : "~"}
                </span>
                <span className="truncate text-zinc-600 dark:text-zinc-400">
                  {entry.action.includes("ITEM") ? `${entry.snapshot?.number} ${entry.snapshot?.action}` : entry.action === "UPDATE_PLAN" ? "Plano editado" : entry.action === "CREATE_PLAN" ? "Plano criado" : ""}
                </span>
                <span className="ml-auto shrink-0 text-zinc-400">{new Date(entry.created_at).toLocaleString("pt-BR")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters row + views */}
      {!loadingItems && <>

      <PlanFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        planStatusFilter={planStatusFilter}
        setPlanStatusFilter={setPlanStatusFilter}
        visibilityFilter={visibilityFilter}
        setVisibilityFilter={setVisibilityFilter}
        exercicioFilter={exercicioFilter}
        setExercicioFilter={setExercicioFilter}
        availableExercises={availableExercises}
        filteredCount={filteredItems.length}
        totalCount={allItems.length}
        filteredPlanCount={filteredPlans.length}
        totalPlanCount={allPlans.length}
      />

      {/* Clone button always visible */}
      {!plan && <div className="flex items-center gap-2">
        <CopyPlanButton plan={null} plans={allPlans} toast={toast} router={router} />
        <span className="text-[11px] text-zinc-400">Clonar um plano existente</span>
      </div>}

      {/* Table, Kanban, or Gantt View */}
      {viewMode === "gantt" ? (
        items.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center py-16 text-center"><p className="text-sm text-zinc-500">Nenhuma ação para exibir.</p></CardContent></Card>
        ) : (
          <GanttChart items={items} />
        )
      ) : viewMode === "kanban" ? (
        <KanbanBoard items={items} onEdit={setEditingItem} onShowForm={setShowItemForm}
          onStatusChange={async (itemId, newStatus) => {
            await updateItemStatus(itemId, newStatus as 1 | 2 | 3 | 4 | 5);
            router.refresh();
            toast("Status atualizado!");
          }} />
      ) : (
        items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <ClipboardList className="h-7 w-7 text-zinc-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {searchQuery || statusFilter !== null ? "Nenhum resultado" : "Nenhuma ação"}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {searchQuery || statusFilter !== null ? "Tente ajustar os filtros." : "Adicione ações ao plano 5W2H."}
            </p>
            {!searchQuery && statusFilter === null && (
              <Button className="mt-4" onClick={() => { setEditingItem(null); setShowItemForm(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar primeira ação
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <PlanTable 
          items={items}
          contasSummary={contasSummary}
          onEdit={setEditingItem}
          onShowForm={setShowItemForm}
          onDelete={setDeletingItem}
          onOpenTab={handleOpenTab}
          inlineAction={inlineAction}
          isInlineSaving={isInlineSaving}
        />
      ))}

      </>}

      {/* Dialogs */}
      {showPlanForm && (
        <PlanFormDialog plan={plan} tenantId={currentTenant?.id || ""}
          catalogUnits={catalogUnits} catalogAreas={catalogAreas}
          state={plan ? planUpdateState : planCreateState}
          action={plan ? planUpdateAction : planCreateAction}
          isPending={plan ? isPlanUpdating : isPlanCreating}
          onClose={() => setShowPlanForm(false)} />
      )}

      <AlertDialog open={!!deletingPlan} onOpenChange={(o) => { if (!o) setDeletingPlan(null); }}>
        {deletingPlan && <ConfirmDlg title="Excluir plano" msg={`Excluir "${deletingPlan.title}" e todas as ações?`} name="planId" value={deletingPlan.id} action={planDeleteAction} pending={isPlanDeleting} />}
      </AlertDialog>

      {showItemForm && (
        <ItemFormDialog item={editingItem} planId={plan.id} items={items} initialTab={editingItemTab}
          planUnit={plan.unit}
          catalogAreas={filterCatalogByAccess(catalogAreas, userAreaIds)}
          catalogUnits={filterCatalogByAccess(catalogUnits, userUnitIds)}
          catalogTiposPa={catalogTiposPa} catalogMacroAcoes={catalogMacroAcoes}
          state={itemState} action={itemAction} isPending={isItemSaving}
          onClose={() => { setShowItemForm(false); setEditingItem(null); setEditingItemTab("modelo"); }} />
      )}

      <AlertDialog open={!!deletingItem} onOpenChange={(o) => { if (!o) setDeletingItem(null); }}>
        {deletingItem && <ConfirmDlg title="Excluir ação" msg={`Excluir "${deletingItem.action}"?`} name="itemId" value={deletingItem.id} action={itemDeleteAction} pending={isItemDeleting} />}
      </AlertDialog>

      {showUploadDialog && (
        <UploadPlanosDialog
          onClose={() => setShowUploadDialog(false)}
          planId={plan.id}
          planTitle={plan.title}
          onSuccess={() => {
            if (selectedPlanId) getItems(selectedPlanId).then(setItems);
          }}
        />
      )}
    </div>
  );
}

function ConfirmDlg({ title, msg, name, value, action, pending }: { title: string; msg: string; name: string; value: string; action: (p: FormData) => void; pending: boolean; }) {
  return <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{msg}</AlertDialogDescription></AlertDialogHeader><form action={action}><input type="hidden" name={name} value={value} /><AlertDialogFooter><AlertDialogCancel /><Button type="submit" variant="destructive" isLoading={pending}><Trash2 className="h-4 w-4 mr-1" />Excluir</Button></AlertDialogFooter></form></AlertDialogContent>;
}
