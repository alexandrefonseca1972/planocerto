"use client";

import { useActionState, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/lib/contexts/tenant-context";
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
import { resolveSelectedPlanId, filterCatalogByAccess, filterPlansByGovernance, getAvailablePlanExercises } from "@/components/planos/planos-page-helpers";
import { KanbanBoard } from "@/components/planos/plan-kanban";
import { GanttChart } from "@/components/planos/plan-gantt";
import { CopyPlanButton } from "@/components/planos/copy-plan-button";
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
  const { currentTenant, selectedUnitIds } = useTenant();
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

  // Server actions
  const [planCreateState, planCreateAction, isPlanCreating] = useActionState(createPlan, init);
  const [planUpdateState, planUpdateAction, isPlanUpdating] = useActionState(updatePlan, init);
  const [, planDeleteAction, isPlanDeleting] = useActionState(deletePlan, init);
  const [itemState, itemAction, isItemSaving] = useActionState(upsertItem, init);
  const [inlineState, inlineAction, isInlineSaving] = useActionState(quickUpdateItemAction, init);
  const [, itemDeleteAction, isItemDeleting] = useActionState(deleteItem, init);

  // Filtered plans
  const filteredPlans = useMemo(() => {
    const byGovernance = filterPlansByGovernance(data.allPlans, {
      exercicio: url.exercicioFilter,
      visibility: url.visibilityFilter,
      status: url.planStatusFilter,
    });
    if (selectedUnitIds.length === 0) return byGovernance;
    const unitSet = new Set(selectedUnitIds);
    return byGovernance.filter((p) => p.unit_id && unitSet.has(p.unit_id));
  }, [data.allPlans, url.exercicioFilter, url.visibilityFilter, url.planStatusFilter, selectedUnitIds]);

  const availableExercises = useMemo(() => getAvailablePlanExercises(data.allPlans), [data.allPlans]);
  const hasGovernanceFilters = url.planStatusFilter !== null || url.visibilityFilter !== null || url.exercicioFilter !== null;

  // Resolve selected plan
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedPlanId(resolveSelectedPlanId(filteredPlans, url.requestedPlanId));
  }, [filteredPlans, url.requestedPlanId]);

  // Load plan items when selected plan changes
  useEffect(() => {
    if (!selectedPlanId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlan(null);
      data.setItems([]);
      data.setAuditLog([]);
      data.setContasSummary({});
      return;
    }
    const selectedPlan = data.allPlans.find((p) => p.id === selectedPlanId) || null;
    setPlan(selectedPlan);
    if (selectedPlan?.id) {
      data.loadPlanItems(selectedPlan.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlanId]);

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
    if (selectedPlanId) data.refreshItems(selectedPlanId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemState.success]);

  useEffect(() => {
    if (!inlineState.success) return;
    toast(inlineState.message || "Item salvo!");
    if (selectedPlanId) data.refreshItems(selectedPlanId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inlineState.success]);

  // Keyboard shortcut
  useEffect(() => {
    function handleKey(e: globalThis.KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        if (plan) { setEditingItem(null); setShowItemForm(true); }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [plan]);

  // Computed item values
  const allItems = useMemo(() => flattenItems(data.items), [data.items]);
  const { totalCost, isOverBudget, percentUsed } = useMemo(
    () => calculatePlanFinancials(data.items, plan?.budget_limit),
    [data.items, plan?.budget_limit],
  );
  const filteredItems = allItems.filter((i) => {
    const matchesSearch = !url.searchQuery || i.action.toLowerCase().includes(url.searchQuery.toLowerCase()) || i.number.includes(url.searchQuery) || (i.responsible || "").toLowerCase().includes(url.searchQuery.toLowerCase());
    const matchesStatus = url.statusFilter === null || i.status === url.statusFilter;
    return matchesSearch && matchesStatus;
  });

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
    const hasPlansWithoutMatch = data.allPlans.length > 0 && filteredPlans.length === 0;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Planos de Acao</h1>
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
                <>Ajuste os filtros de governanca para localizar um plano ja existente em <strong>{currentTenant?.name}</strong>.</>
              ) : (
                <>Crie um plano de acao 5W2H para a empresa <strong>{currentTenant?.name}</strong>.</>
              )}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {!hasPlansWithoutMatch && (
                <Button size="lg" onClick={() => setShowPlanForm(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Criar plano de acao
                </Button>
              )}
              {hasGovernanceFilters && (
                <Button size="lg" variant="outline" onClick={url.clearFilters}>
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
                Plano de acao
              </label>
              <select
                id="plan-selector"
                value={selectedPlanId ?? ""}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                disabled={data.loadingItems}
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
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">{plan.title || "Planos de Acao"}</h1>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {plan.exercicio && <Badge variant="secondary" className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"><CalendarDays className="mr-1 h-3 w-3" />{plan.exercicio}</Badge>}
            {plan.visibility === "restricted" && <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50"><Lock className="mr-1 h-3 w-3" />Restrito</Badge>}
            {plan.status === "archived" && <Badge variant="outline" className="text-xs border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"><Archive className="mr-1 h-3 w-3" />Arquivado</Badge>}
            {plan.unit && <Badge variant="outline" className="text-xs"><Building2 className="mr-1 h-3 w-3" />{plan.unit}</Badge>}
            {plan.director && <Badge variant="outline" className="text-xs"><UserCircle className="mr-1 h-3 w-3" />{plan.director}</Badge>}
            {plan.goal && <Badge variant="default" className="text-xs"><Target className="mr-1 h-3 w-3" />{plan.goal}</Badge>}
            {selectedUnitIds.length > 0 && (
              <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50">
                <Building2 className="mr-1 h-3 w-3" />
                {selectedUnitIds.length === 1 ? "1 unidade" : `${selectedUnitIds.length} unidades`} · filtro do dashboard
              </Badge>
            )}
          </div>

          <BudgetHealthBar totalCost={totalCost} budgetLimit={plan.budget_limit || 0} isOverBudget={isOverBudget} percentUsed={percentUsed} />
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => { setPlan(null); setShowPlanForm(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Novo Plano
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPlanForm(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
          </Button>
          <Button variant="outline" size="sm" className="text-red-600" onClick={() => setDeletingPlan(plan)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
          </Button>
          <PlanQuickActions plan={plan} plans={data.allPlans} toast={toast} router={router} />
        </div>
      </div>

      {/* Stats bar */}
      <PlanStats
        counts={counts}
        viewMode={url.viewMode}
        setViewMode={url.setViewMode}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        setShowUploadDialog={setShowUploadDialog}
        setShowItemForm={setShowItemForm}
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
          filteredCount={filteredItems.length}
          totalCount={allItems.length}
          filteredPlanCount={filteredPlans.length}
          totalPlanCount={data.allPlans.length}
        />

        {!plan && (
          <div className="flex items-center gap-2">
            <CopyPlanButton plan={null} plans={data.allPlans} toast={toast} router={router} />
            <span className="text-[11px] text-zinc-400">Clonar um plano existente</span>
          </div>
        )}

        {url.viewMode === "gantt" ? (
          data.items.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center py-16 text-center"><p className="text-sm text-zinc-500">Nenhuma acao para exibir.</p></CardContent></Card>
          ) : (
            <GanttChart items={data.items} />
          )
        ) : url.viewMode === "kanban" ? (
          <KanbanBoard items={data.items} onEdit={setEditingItem} onShowForm={setShowItemForm}
            onStatusChange={async (itemId, newStatus) => {
              await updateItemStatus(itemId, newStatus as 1 | 2 | 3 | 4 | 5);
              router.refresh();
              toast("Status atualizado!");
            }} />
        ) : (
          data.items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <ClipboardList className="h-7 w-7 text-zinc-400" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {url.searchQuery || url.statusFilter !== null ? "Nenhum resultado" : "Nenhuma acao"}
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {url.searchQuery || url.statusFilter !== null ? "Tente ajustar os filtros." : "Adicione acoes ao plano 5W2H."}
                </p>
                {!url.searchQuery && url.statusFilter === null && (
                  <Button className="mt-4" onClick={() => { setEditingItem(null); setShowItemForm(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar primeira acao
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <PlanTable
              items={data.items}
              contasSummary={data.contasSummary}
              onEdit={setEditingItem}
              onShowForm={setShowItemForm}
              onDelete={setDeletingItem}
              onOpenTab={handleOpenTab}
              inlineAction={inlineAction}
              isInlineSaving={isInlineSaving}
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
        <ItemFormDialog item={editingItem} planId={plan.id} items={data.items} initialTab={editingItemTab}
          planUnit={plan.unit}
          catalogAreas={filterCatalogByAccess(data.catalogAreas, data.userAreaIds)}
          catalogUnits={filterCatalogByAccess(data.catalogUnits, data.userUnitIds)}
          catalogTiposPa={data.catalogTiposPa} catalogMacroAcoes={data.catalogMacroAcoes}
          state={itemState} action={itemAction} isPending={isItemSaving}
          onClose={() => { setShowItemForm(false); setEditingItem(null); setEditingItemTab("modelo"); }} />
      )}

      <AlertDialog open={!!deletingItem} onOpenChange={(o) => { if (!o) setDeletingItem(null); }}>
        {deletingItem && <ConfirmActionDialog title="Excluir acao" msg={`Excluir "${deletingItem.action}"?`} name="itemId" value={deletingItem.id} action={itemDeleteAction} pending={isItemDeleting} />}
      </AlertDialog>

      {showUploadDialog && (
        <UploadPlanosDialog
          onClose={() => setShowUploadDialog(false)}
          planId={plan.id}
          planTitle={plan.title}
          onSuccess={() => {
            if (selectedPlanId) data.refreshItems(selectedPlanId);
          }}
        />
      )}
    </div>
  );
}
