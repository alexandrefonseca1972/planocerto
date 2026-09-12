"use client";

import { useActionState, useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/lib/contexts/tenant-context";
import { AreaUnitFilter } from "@/components/dashboard/area-unit-filter";
import { filterUnitsByScope, filterAreasByScope, filterByUnitIds } from "@/components/dashboard/dashboard-access";
import { useToast } from "@/components/ui/toast";
import { usePlanosUrlParams } from "@/lib/hooks/use-planos-url-params";
import { usePlanosData } from "@/lib/hooks/use-planos-data";
import {
  createPlan,
  updatePlan,
  deletePlan,
  upsertItem,
  deleteItem,
  updateItemStatus,
  quickUpdateItemAction,
  duplicateItem,
} from "@/app/actions/action-plan";
import type { ActionPlan, ActionItem, ActionPlanFormState } from "@/types/action-plan";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonHeader, SkeletonTable } from "@/components/ui/loading";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { cn } from "@/lib/utils";
import { flattenItems, calculatePlanFinancials } from "@/components/planos/plan-utils";
import {
  resolveSelectedPlanId,
  filterCatalogByAccess,
  filterPlansByGovernance,
  getAvailablePlanExercises,
  filterItemTree,
  getActionById,
  getParentById,
  itemMatchesTipoPa,
  itemMatchesMacroAcao,
  collectItemClassificationOptions,
  mergeCatalogNames,
  hasActiveItemFilters,
} from "@/components/planos/planos-page-helpers";
import { isWithinRange } from "@/lib/date-range";
import { KanbanBoard } from "@/components/planos/plan-kanban";
import { GanttChart } from "@/components/planos/plan-gantt";
import { BudgetHealthBar } from "@/components/planos/budget-health-bar";
import { UploadPlanosDialog } from "@/components/planos/upload-planos-dialog";
import { PlanFormDialog } from "@/components/planos/plan-form-dialog";
import { ItemFormDialog } from "@/components/planos/item-form-dialog";
import { PlanStats } from "@/components/planos/plan-stats";
import { PlanFilters } from "@/components/planos/plan-filters";
import { PlanTable } from "@/components/planos/plan-table";
import { PlanQuickActions } from "@/components/planos/plan-quick-actions";
import { Plus, Pencil, Trash2, ClipboardList, Building2, CalendarDays, Lock, Archive, UserCircle, Target, Upload } from "lucide-react";

const init: ActionPlanFormState = { message: undefined, errors: {} };

export default function PlanosPage() {
  const { currentTenant, selectedUnitIds, setSelectedUnitIds } = useTenant();
  const router = useRouter();
  const { toast } = useToast();

  const url = usePlanosUrlParams();
  const data = usePlanosData({ tenantId: currentTenant?.id });

  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Dialog states
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<ActionPlan | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [editingItemTab, setEditingItemTab] = useState<"modelo" | "anexos" | "comentarios" | "historico">("modelo");
  const [deletingItem, setDeletingItem] = useState<ActionItem | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Server actions
  const [planCreateState, planCreateAction, isPlanCreating] = useActionState(createPlan, init);
  const [planUpdateState, planUpdateAction, isPlanUpdating] = useActionState(updatePlan, init);
  const [, planDeleteAction, isPlanDeleting] = useActionState(deletePlan, init);
  const [itemState, itemAction, isItemSaving] = useActionState(upsertItem, init);
  const [inlineState, inlineAction, isInlineSaving] = useActionState(quickUpdateItemAction, init);
  const [isItemDeleting, setIsItemDeleting] = useState(false);

  // Áreas/unidades visíveis ao usuário (mesma semântica de escopo do dashboard)
  const filterScope = useMemo(
    () => ({ areaIds: data.userAreaIds, unitIds: data.userUnitIds }),
    [data.userAreaIds, data.userUnitIds],
  );
  const scopedUnits = useMemo(
    () => filterUnitsByScope(data.catalogUnits, filterScope),
    [data.catalogUnits, filterScope],
  );
  const scopedAreas = useMemo(
    () => filterAreasByScope(data.catalogAreas, scopedUnits, filterScope),
    [data.catalogAreas, scopedUnits, filterScope],
  );

  // Filtered plans. Sem cidade marcada = nenhum plano (mesma regra do
  // Dashboard/Calendário): o usuário escolhe o recorte antes de carregar.
  const noSelection = selectedUnitIds.length === 0;
  const filteredPlans = useMemo(
    () =>
      noSelection
        ? []
        : filterByUnitIds(
            filterPlansByGovernance(data.allPlans, {
              exercicio: url.exercicioFilter,
              visibility: url.visibilityFilter,
              status: url.planStatusFilter,
            }),
            selectedUnitIds,
          ),
    [data.allPlans, url.exercicioFilter, url.visibilityFilter, url.planStatusFilter, selectedUnitIds, noSelection],
  );

  const availableExercises = useMemo(() => getAvailablePlanExercises(data.allPlans), [data.allPlans]);
  const hasPlanFilters =
    url.planStatusFilter !== null || url.visibilityFilter !== null || url.exercicioFilter !== null || selectedUnitIds.length > 0;
  // Limpa governança (URL) e unidades (contexto) juntos: são o mesmo recorte para o usuário.
  const clearPlanFilters = () => {
    url.clearFilters();
    setSelectedUnitIds([]);
  };

  // /planos inicia sem cidade marcada (não herda a seleção do Dashboard),
  // salvo atalhos: ?unit= marca a cidade; ?plan= é tratado pelo efeito abaixo.
  useEffect(() => {
    if (url.requestedUnitId) {
      setSelectedUnitIds([url.requestedUnitId]);
      url.setParams({ unit: null });
    } else if (!url.requestedPlanId) {
      setSelectedUnitIds([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve selected plan
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  useEffect(() => {
    // Deep link (?plan=) para um plano fora do recorte (ex.: vindo de Minhas
    // Tarefas sem cidade marcada): marca a cidade do plano e deixa o efeito
    // rodar de novo já com o recorte certo.
    const requested = url.requestedPlanId ? data.allPlans.find((p) => p.id === url.requestedPlanId) : null;
    if (!data.loading && requested?.unit_id && !selectedUnitIds.includes(requested.unit_id)) {
      setSelectedUnitIds([requested.unit_id]);
      return;
    }
    const resolved = resolveSelectedPlanId(filteredPlans, url.requestedPlanId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedPlanId(resolved);
    // O plano da URL saiu do recorte: realinha a URL para o plano exibido
    // (só após os planos carregarem, senão apagaria ?plan= no primeiro render).
    if (!data.loading && url.requestedPlanId && resolved !== url.requestedPlanId) {
      url.setSelectedPlan(resolved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPlans, url.requestedPlanId, data.loading, data.allPlans, selectedUnitIds]);

  // Várias cidades MARCADAS → vários planos: exibe as ações de todos combinadas.
  // Sem seleção o recorte é o tenant inteiro, mas a página segue mostrando um plano.
  const multi = selectedUnitIds.length > 1 && filteredPlans.length > 1;
  const activePlanIds = useMemo(
    () => (multi ? filteredPlans.map((p) => p.id) : selectedPlanId ? [selectedPlanId] : []),
    [multi, filteredPlans, selectedPlanId],
  );
  const activeKey = activePlanIds.join(",");
  const unitByPlanId = useMemo(
    () => Object.fromEntries(filteredPlans.map((p) => [p.id, p.unit || p.title])),
    [filteredPlans],
  );

  // Load plan items when the active plan set changes
  useEffect(() => {
    if (!selectedPlanId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlan(null);
      data.setItems([]);
      data.setAuditLog([]);
      data.setContasSummary({});
      return;
    }
    setPlan(data.allPlans.find((p) => p.id === selectedPlanId) || null);
    if (activePlanIds.length) data.loadPlanItems(activePlanIds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlanId, activeKey]);

  // Deep-link: ?item=<id> abre a ação diretamente assim que os itens carregam
  // (usado pelos cards/listas do dashboard "ir direto para a ação").
  const openedItemRef = useRef<string | null>(null);
  useEffect(() => {
    const itemId = url.requestedItemId;
    if (!itemId || !plan || data.items.length === 0) return;
    if (openedItemRef.current === itemId) return;
    const found = flattenItems(data.items).find((i) => i.id === itemId);
    if (found) {
      openedItemRef.current = itemId;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditingItem(found);
      setEditingItemTab("modelo");
      setShowItemForm(true);
    }
  }, [url.requestedItemId, plan, data.items]);

  // Action success effects
  useEffect(() => {
    if (!planCreateState.success || !currentTenant?.id) return;
    toast(planCreateState.message || "Plano criado!");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowPlanForm(false);
    data.refreshPlans().then((plans) => {
      if (plans && plans[0]) setSelectedPlanId(plans[0].id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planCreateState.success]);

  useEffect(() => {
    if (!planUpdateState.success || !currentTenant?.id) return;
    toast(planUpdateState.message || "Plano atualizado!");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowPlanForm(false);
    data.refreshPlans();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planUpdateState.success]);

  useEffect(() => {
    if (!itemState.success) return;
    toast(itemState.message || "Item salvo!");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowItemForm(false);
    setEditingItem(null);
    if (activePlanIds.length) data.refreshItems(activePlanIds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemState.success]);

  useEffect(() => {
    if (!inlineState.success) return;
    toast(inlineState.message || "Item salvo!");
    if (activePlanIds.length) data.refreshItems(activePlanIds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inlineState.success]);

  // Keyboard shortcut
  useEffect(() => {
    function handleKey(e: globalThis.KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        if (plan && !multi) { setEditingItem(null); setShowItemForm(true); }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [plan, multi]);

  // Computed item values
  const allItems = useMemo(() => flattenItems(data.items), [data.items]);
  const { totalCost, isOverBudget, percentUsed } = useMemo(
    () => calculatePlanFinancials(data.items, plan?.budget_limit),
    [data.items, plan?.budget_limit],
  );

  // Filtros de item (busca + status + intervalo + Tipo PA + Macro Ação)
  // aplicados à árvore, preservando a hierarquia pai/filho.
  const hasItemFilters = hasActiveItemFilters(url);
  const classificationOptions = useMemo(() => {
    const fromItems = collectItemClassificationOptions(data.items);
    return {
      tiposPa: mergeCatalogNames(data.catalogTiposPa, fromItems.tiposPa),
      macroAcoes: mergeCatalogNames(data.catalogMacroAcoes, fromItems.macroAcoes),
    };
  }, [data.items, data.catalogTiposPa, data.catalogMacroAcoes]);
  const visibleItems = useMemo(() => {
    if (!hasItemFilters) return data.items;
    const q = url.searchQuery.toLowerCase();
    const actionById = getActionById(data.items);
    const parentById = getParentById(data.items);
    const matchesSearch = (i: ActionItem) =>
      !url.searchQuery ||
      i.action.toLowerCase().includes(q) ||
      i.number.includes(url.searchQuery) ||
      (i.responsible || "").toLowerCase().includes(q);
    const matchesStatus = (i: ActionItem) => url.statusFilter === null || i.status === url.statusFilter;
    return filterItemTree(
      data.items,
      (i) =>
        matchesSearch(i) &&
        matchesStatus(i) &&
        isWithinRange(i.planned_end, url.dateFrom || null, url.dateTo || null) &&
        itemMatchesTipoPa(i, url.tipoPaFilter || null) &&
        itemMatchesMacroAcao(i, url.macroAcaoFilter || null, actionById, parentById),
    );
  }, [data.items, hasItemFilters, url.searchQuery, url.statusFilter, url.dateFrom, url.dateTo, url.tipoPaFilter, url.macroAcaoFilter]);
  const filteredCount = useMemo(() => flattenItems(visibleItems).length, [visibleItems]);

  const counts = {
    total: allItems.length,
    done: allItems.filter((i) => i.status === 5).length,
    progress: allItems.filter((i) => i.status === 4 || i.status === 3).length,
    pending: allItems.filter((i) => i.status === 1 || i.status === 2).length,
  };

  // Loading state
  if (data.loading) {
    return (
      <div className="space-y-5">
        <SkeletonHeader withActions />
        <SkeletonTable rows={8} cols={6} />
      </div>
    );
  }

  // No plan selected
  if (!plan) {
    const hasPlans = data.allPlans.length > 0;
    const hasPlansWithoutMatch = hasPlans && !noSelection && filteredPlans.length === 0;
    const askSelection = hasPlans && noSelection;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Planos de Acao</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{currentTenant?.name || "Sem empresa"}</p>
          </div>
        </div>
        {hasPlans && (
          <div className="min-w-0 sm:max-w-md">
            <AreaUnitFilter
              areas={scopedAreas}
              units={scopedUnits.map((u) => ({ id: u.id, name: u.name, area_id: u.area_id, uf: u.uf }))}
              selectedUnitIds={selectedUnitIds}
              onChangeUnits={setSelectedUnitIds}
            />
          </div>
        )}
        <Card>
          <CardContent className="flex flex-col items-center py-20 text-center">
            {askSelection ? (
              <Building2 className="mb-4 h-16 w-16 text-zinc-200 dark:text-zinc-700" />
            ) : (
              <ClipboardList className="mb-4 h-16 w-16 text-zinc-200 dark:text-zinc-700" />
            )}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {askSelection ? "Selecione as cidades" : hasPlansWithoutMatch ? "Nenhum plano corresponde aos filtros" : "Nenhum plano cadastrado"}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
              {askSelection ? (
                <>Marque uma ou mais cidades no filtro acima para ver os planos de acao.</>
              ) : hasPlansWithoutMatch ? (
                <>Ajuste os filtros de plano ou de areas/unidades para localizar um plano ja existente em <strong>{currentTenant?.name}</strong>.</>
              ) : (
                <>Crie um plano de acao 5W2H para a empresa <strong>{currentTenant?.name}</strong>.</>
              )}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {(!hasPlans || askSelection) && (
                <Button size="lg" onClick={() => setShowPlanForm(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Criar plano de acao
                </Button>
              )}
              {hasPlanFilters && (
                <Button size="lg" variant="outline" onClick={clearPlanFilters}>
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
            catalogUnits={data.catalogUnits} catalogAreas={data.catalogAreas}
            state={planCreateState} action={planCreateAction} isPending={isPlanCreating}
            onClose={() => setShowPlanForm(false)} />
        )}
        {showUploadDialog && (
          <UploadPlanosDialog
            catalogUnits={filterCatalogByAccess(data.catalogUnits, data.userUnitIds)}
            onClose={() => setShowUploadDialog(false)}
            onSuccess={() => {
              setShowUploadDialog(false);
              if (currentTenant?.id) {
                data.refreshPlans().then((plans) => {
                  if (plans && plans[0]) setSelectedPlanId(plans[0].id);
                });
              }
            }}
          />
        )}
      </div>
    );
  }

  // Criar ação / importar exigem um plano só: com várias cidades, orienta.
  const requireSinglePlan = () => toast("Selecione uma única cidade para adicionar ou importar ações.", "error");

  const handleOpenTab = (it: ActionItem, tab: "modelo" | "anexos" | "comentarios" | "historico") => {
    setEditingItem(it);
    setEditingItemTab(tab);
    setShowItemForm(true);
  };

  const handleConfirmDeleteItem = async (formData: FormData) => {
    if (isItemDeleting) return;
    setIsItemDeleting(true);
    try {
      const result = await deleteItem({}, formData);
      if (result.success) {
        toast(result.message || "Item excluído!");
        setDeletingItem(null);
        if (activePlanIds.length) await data.refreshItems(activePlanIds);
      } else {
        toast(result.message || "Erro ao excluir ação.", "error");
      }
    } catch {
      toast("Serviço indisponível.", "error");
    } finally {
      setIsItemDeleting(false);
    }
  };

  const handleDuplicateItem = async (item: ActionItem) => {
    if (duplicatingId) return;
    setDuplicatingId(item.id);
    try {
      const result = await duplicateItem(item.id);
      if (result.success) {
        toast(result.message || "Ação duplicada!");
        if (activePlanIds.length) await data.refreshItems(activePlanIds);
      } else {
        toast(result.message || "Erro ao duplicar ação.", "error");
      }
    } catch {
      toast("Serviço indisponível.", "error");
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
            {multi ? `${filteredPlans.length} planos` : plan.title || "Planos de Acao"}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {multi && filteredPlans.map((p) => (
              <Badge key={p.id} variant="outline" className="text-xs"><Building2 className="mr-1 h-3 w-3" />{p.unit || p.title}</Badge>
            ))}
            {!multi && plan.exercicio && <Badge variant="secondary" className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"><CalendarDays className="mr-1 h-3 w-3" />{plan.exercicio}</Badge>}
            {!multi && plan.visibility === "restricted" && <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50"><Lock className="mr-1 h-3 w-3" />Restrito</Badge>}
            {!multi && plan.status === "archived" && <Badge variant="outline" className="text-xs border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"><Archive className="mr-1 h-3 w-3" />Arquivado</Badge>}
            {!multi && plan.unit && <Badge variant="outline" className="text-xs"><Building2 className="mr-1 h-3 w-3" />{plan.unit}</Badge>}
            {!multi && plan.director && <Badge variant="outline" className="text-xs"><UserCircle className="mr-1 h-3 w-3" />{plan.director}</Badge>}
            {!multi && plan.goal && <Badge variant="default" className="text-xs"><Target className="mr-1 h-3 w-3" />{plan.goal}</Badge>}
          </div>

          {!multi && (
            <BudgetHealthBar totalCost={totalCost} budgetLimit={plan.budget_limit || 0} isOverBudget={isOverBudget} percentUsed={percentUsed} />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => { setPlan(null); setShowPlanForm(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Novo Plano
          </Button>
          {!multi && <>
            <Button variant="outline" size="sm" onClick={() => setShowPlanForm(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
            </Button>
            <Button variant="outline" size="sm" className="text-red-600" onClick={() => setDeletingPlan(plan)}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
            </Button>
            <PlanQuickActions plan={plan} plans={data.allPlans} toast={toast} router={router} />
          </>}
        </div>
      </div>

      {/* Stats bar */}
      <PlanStats
        counts={counts}
        viewMode={url.viewMode}
        setViewMode={url.setViewMode}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        setShowUploadDialog={multi ? requireSinglePlan : setShowUploadDialog}
        setShowItemForm={multi ? requireSinglePlan : setShowItemForm}
        setEditingItem={setEditingItem}
      />

      {/* Loading items overlay */}
      {data.loadingItems && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {/* History */}
      {!data.loadingItems && showHistory && data.auditLog.length > 0 && (
        <Card className="animate-[slideDown_200ms_ease-out]">
          <CardContent className="max-h-40 space-y-1 overflow-y-auto p-3">
            {data.auditLog.slice(0, 20).map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 rounded px-2 py-1 text-xs">
                <span className={cn("font-bold",
                  entry.action.includes("CREATE") ? "text-emerald-600" : entry.action.includes("UPDATE") ? "text-blue-600" : "text-red-600")}>
                  {entry.action.includes("CREATE") ? "+" : entry.action.includes("DELETE") ? "-" : "~"}
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

      {/* Filters + Views */}
      {!data.loadingItems && <>
        <PlanFilters
          leading={
            <div className="min-w-0 flex-1 sm:max-w-md">
              <AreaUnitFilter
                areas={scopedAreas}
                units={scopedUnits.map((u) => ({ id: u.id, name: u.name, area_id: u.area_id, uf: u.uf }))}
                selectedUnitIds={selectedUnitIds}
                onChangeUnits={setSelectedUnitIds}
                placeholder={plan.unit || undefined}
              />
            </div>
          }
          searchQuery={url.searchQuery}
          setSearchQuery={url.setSearchQuery}
          statusFilter={url.statusFilter}
          setStatusFilter={url.setStatusFilter}
          planStatusFilter={url.planStatusFilter}
          setPlanStatusFilter={url.setPlanStatusFilter}
          visibilityFilter={url.visibilityFilter}
          setVisibilityFilter={url.setVisibilityFilter}
          exercicioFilter={url.exercicioFilter}
          setExercicioFilter={url.setExercicioFilter}
          availableExercises={availableExercises}
          dateFrom={url.dateFrom}
          dateTo={url.dateTo}
          setDateRange={url.setDateRange}
          tipoPaFilter={url.tipoPaFilter}
          setTipoPaFilter={url.setTipoPaFilter}
          macroAcaoFilter={url.macroAcaoFilter}
          setMacroAcaoFilter={url.setMacroAcaoFilter}
          tipoPaOptions={classificationOptions.tiposPa}
          macroAcaoOptions={classificationOptions.macroAcoes}
          filteredCount={filteredCount}
          totalCount={allItems.length}
          filteredPlanCount={filteredPlans.length}
          totalPlanCount={data.allPlans.length}
          onClearPlanFilters={clearPlanFilters}
          onClearItemFilters={url.clearItemFilters}
        />

        {url.viewMode === "gantt" ? (
          visibleItems.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center py-16 text-center"><p className="text-sm text-zinc-500">Nenhuma acao para exibir.</p></CardContent></Card>
          ) : (
            <GanttChart items={visibleItems} />
          )
        ) : url.viewMode === "kanban" ? (
          <KanbanBoard items={visibleItems} onEdit={setEditingItem} onShowForm={setShowItemForm}
            onStatusChange={async (itemId, newStatus) => {
              await updateItemStatus(itemId, newStatus as 1 | 2 | 3 | 4 | 5);
              router.refresh();
              toast("Status atualizado!");
            }} />
        ) : (
          visibleItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <ClipboardList className="h-7 w-7 text-zinc-400" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {hasItemFilters ? "Nenhum resultado" : "Nenhuma acao"}
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {hasItemFilters ? "Tente ajustar os filtros." : "Adicione acoes ao plano 5W2H."}
                </p>
                {!hasItemFilters && (
                  <Button className="mt-4" onClick={() => { if (multi) return requireSinglePlan(); setEditingItem(null); setShowItemForm(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar primeira acao
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <PlanTable
              items={visibleItems}
              contasSummary={data.contasSummary}
              onEdit={setEditingItem}
              onShowForm={setShowItemForm}
              onDelete={setDeletingItem}
              onDuplicate={handleDuplicateItem}
              duplicatingId={duplicatingId}
              onOpenTab={handleOpenTab}
              inlineAction={inlineAction}
              isInlineSaving={isInlineSaving}
              unitByPlanId={multi ? unitByPlanId : undefined}
            />
          )
        )}
      </>}

      {/* Dialogs */}
      {showPlanForm && (
        <PlanFormDialog plan={plan} tenantId={currentTenant?.id || ""}
          catalogUnits={data.catalogUnits} catalogAreas={data.catalogAreas}
          state={plan ? planUpdateState : planCreateState}
          action={plan ? planUpdateAction : planCreateAction}
          isPending={plan ? isPlanUpdating : isPlanCreating}
          onClose={() => setShowPlanForm(false)} />
      )}

      <AlertDialog open={!!deletingPlan} onOpenChange={(o) => { if (!o) setDeletingPlan(null); }}>
        {deletingPlan && <ConfirmActionDialog title="Excluir plano" msg={`Excluir "${deletingPlan.title}" e todas as acoes?`} name="planId" value={deletingPlan.id} action={planDeleteAction} pending={isPlanDeleting} />}
      </AlertDialog>

      {showItemForm && (
        <ItemFormDialog item={editingItem} planId={editingItem?.plan_id ?? plan.id}
          items={editingItem ? data.items.filter((i) => i.plan_id === editingItem.plan_id) : data.items}
          initialTab={editingItemTab}
          planUnit={(multi && editingItem ? data.allPlans.find((p) => p.id === editingItem.plan_id)?.unit : undefined) ?? plan.unit}
          catalogAreas={filterCatalogByAccess(data.catalogAreas, data.userAreaIds)}
          catalogUnits={filterCatalogByAccess(data.catalogUnits, data.userUnitIds)}
          catalogTiposPa={data.catalogTiposPa} catalogMacroAcoes={data.catalogMacroAcoes}
          state={itemState} action={itemAction} isPending={isItemSaving}
          onClose={() => { setShowItemForm(false); setEditingItem(null); setEditingItemTab("modelo"); }} />
      )}

      <AlertDialog open={!!deletingItem} onOpenChange={(o) => { if (!o) setDeletingItem(null); }}>
        {deletingItem && (
          <ConfirmActionDialog
            title="Excluir acao"
            msg={
              deletingItem.children?.length
                ? `Excluir "${deletingItem.action}" e as subações desta cópia?`
                : `Excluir "${deletingItem.action}"?`
            }
            name="itemId"
            value={deletingItem.id}
            action={handleConfirmDeleteItem}
            pending={isItemDeleting}
          />
        )}
      </AlertDialog>

      {showUploadDialog && (
        <UploadPlanosDialog
          onClose={() => setShowUploadDialog(false)}
          planId={plan.id}
          planTitle={plan.title}
          onSuccess={() => {
            if (activePlanIds.length) data.refreshItems(activePlanIds);
          }}
        />
      )}
    </div>
  );
}
