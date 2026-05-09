"use client";

import { useActionState, useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenant } from "@/lib/contexts/tenant-context";
import { useToast } from "@/components/ui/toast";
import { getPlans, getItems, getAuditLog, createPlan, updatePlan, deletePlan, upsertItem, deleteItem, updateItemStatus, bulkUpdateStatus } from "@/app/actions/action-plan";
import { getTemplates, createPlanFromTemplate } from "@/app/actions/shared";
import { getContasSummaryByPlan, type ItemContasSummary } from "@/app/actions/contas-pagar";
import { formatBRL } from "@/lib/format-br";
import type { ActionPlan, ActionItem, AuditEntry, ActionPlanFormState } from "@/types/action-plan";
import { STATUS_FAROL } from "@/types/action-plan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { sanitize } from "@/lib/sanitize";
import { flattenItems, fmt, trunc, FarolIcon } from "@/components/planos/plan-utils";
import { KanbanBoard } from "@/components/planos/plan-kanban";
import { GanttChart } from "@/components/planos/plan-gantt";
import { CopyPlanButton } from "@/components/planos/copy-plan-button";
import { ShareLinkButton } from "@/components/planos/share-link-button";
import { AttachmentSection } from "@/components/planos/attachment-section";
import { CommentSection } from "@/components/planos/comment-section";
import { StatusBadge } from "@/components/planos/status-dot";
import { Plus, Pencil, Trash2, ClipboardList, X, Check, Save, History, UserCircle, Building2, Target, ChevronDown, EyeOff, Search, Columns3, Table2, GanttChart as GanttIcon, Paperclip, MessageSquare, Receipt, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

const init: ActionPlanFormState = { message: undefined, errors: {} };

export default function PlanosPage() {
  const { currentTenant } = useTenant();
  const router = useRouter();
  const { toast } = useToast();
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [items, setItems] = useState<ActionItem[]>([]);
  const [contasSummary, setContasSummary] = useState<Record<string, ItemContasSummary>>({});
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "kanban" | "gantt">(() => {
    if (typeof window !== "undefined") return (localStorage.getItem("planos-view") as "table" | "kanban" | "gantt") || "table";
    return "table";
  });

  const [showPlanForm, setShowPlanForm] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<ActionPlan | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [editingItemTab, setEditingItemTab] = useState<"principal" | "datas" | "resultados" | "anexos" | "comentarios">("principal");
  const [deletingItem, setDeletingItem] = useState<ActionItem | null>(null);

  const [planCreateState, planCreateAction, isPlanCreating] = useActionState(createPlan, init);
  const [planUpdateState, planUpdateAction, isPlanUpdating] = useActionState(updatePlan, init);
  const [, planDeleteAction, isPlanDeleting] = useActionState(deletePlan, init);
  const [itemState, itemAction, isItemSaving] = useActionState(upsertItem, init);
  const [inlineState, inlineAction, isInlineSaving] = useActionState(upsertItem, init);
  const [, itemDeleteAction, isItemDeleting] = useActionState(deleteItem, init);

  // Auto-load plan for current tenant
  useEffect(() => {
    if (!currentTenant?.id) return;
    let c = false;
    (async () => {
      setLoading(true);
      const plans = await getPlans(currentTenant.id);
      if (!c) {
        setPlan(plans[0] || null);
        setLoading(false);
      }
    })();
    return () => { c = true; };
  }, [currentTenant]);

  // Load items when plan changes
  useEffect(() => {
    if (!plan?.id) return;
    let c = false;
    (async () => {
      setLoading(true);
      const [i, a, cs] = await Promise.all([
        getItems(plan.id),
        getAuditLog(plan.id),
        getContasSummaryByPlan(plan.id),
      ]);
      if (!c) { setItems(i); setAuditLog(a); setContasSummary(cs); setLoading(false); }
    })();
    return () => { c = true; };
  }, [plan?.id]);

  // Close modals on success and refresh data
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (planCreateState.success) { toast(planCreateState.message || "Plano criado!"); setShowPlanForm(false); router.refresh(); }
    if (planUpdateState.success) { toast(planUpdateState.message || "Plano atualizado!"); setShowPlanForm(false); router.refresh(); }
    if (itemState.success) { toast(itemState.message || "Item salvo!"); setShowItemForm(false); setEditingItem(null); router.refresh(); }
    if (inlineState.success) { toast(inlineState.message || "Item salvo!"); setInlineEditId(null); router.refresh(); }
    /* eslint-enable react-hooks/set-state-in-effect */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planCreateState.success, planUpdateState.success, itemState.success, inlineState.success]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: globalThis.KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") { e.preventDefault(); if (plan) { setEditingItem(null); setShowItemForm(true); } }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [plan]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const allItems = useMemo(() => flattenItems(items), [items]);
  const filteredItems = allItems.filter(i => {
    const matchesSearch = !searchQuery || i.action.toLowerCase().includes(searchQuery.toLowerCase()) || i.number.includes(searchQuery) || (i.responsible || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === null || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = { total: allItems.length, done: allItems.filter(i => i.status === 5).length, progress: allItems.filter(i => i.status === 4 || i.status === 3).length, pending: allItems.filter(i => i.status === 1 || i.status === 2).length };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4 py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-16 w-full" />
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  // No plan for this tenant
  if (!plan) {
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
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Nenhum plano cadastrado</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
              Crie um plano de ação 5W2H para a empresa <strong>{currentTenant?.name}</strong>.
            </p>
            <Button className="mt-6" size="lg" onClick={() => setShowPlanForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Criar plano de ação
            </Button>
          </CardContent>
        </Card>
        {showPlanForm && (
          <PlanFormDialog plan={null} tenantId={currentTenant?.id || ""}
            state={planCreateState} action={planCreateAction} isPending={isPlanCreating}
            onClose={() => setShowPlanForm(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">{plan.title}</h1>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {plan.unit && <Badge variant="outline" className="text-xs"><Building2 className="mr-1 h-3 w-3" />{plan.unit}</Badge>}
            {plan.director && <Badge variant="outline" className="text-xs"><UserCircle className="mr-1 h-3 w-3" />{plan.director}</Badge>}
            {plan.goal && <Badge variant="default" className="text-xs"><Target className="mr-1 h-3 w-3" />{plan.goal}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => { setShowPlanForm(true); }}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
          </Button>
          <Button variant="outline" size="sm" className="text-red-600" onClick={() => setDeletingPlan(plan)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
          </Button>
          <CopyPlanButton plan={plan} toast={toast} router={router} />
          <ShareLinkButton planId={plan.id} toast={toast} />
        </div>
      </div>

      {/* Stats bar */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-4">
            <StatPill color="bg-zinc-400" label="Total" value={counts.total} />
            <StatPill color="bg-blue-500" label="Em andamento" value={counts.progress} />
            <StatPill color="bg-emerald-500" label="Concluídas" value={counts.done} />
            <StatPill color="bg-amber-500" label="Pendentes" value={counts.pending} />
            <div className="ml-auto flex items-center gap-2">
              <BulkStatusButton planId={plan?.id || ""} filteredItems={filteredItems} toast={toast} router={router} />
              <Button variant="ghost" size="sm" onClick={() => { const modes: ("table" | "kanban" | "gantt")[] = ["table", "kanban", "gantt"]; const idx = modes.indexOf(viewMode); const next = modes[(idx + 1) % 3]; setViewMode(next); localStorage.setItem("planos-view", next); }} title="Alternar visualização">
                {viewMode === "table" ? <Columns3 className="h-4 w-4 mr-1" /> : viewMode === "kanban" ? <GanttIcon className="h-4 w-4 mr-1" /> : <Table2 className="h-4 w-4 mr-1" />}
                {viewMode === "table" ? "Kanban" : viewMode === "kanban" ? "Gantt" : "Tabela"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
                {showHistory ? <EyeOff className="h-4 w-4 mr-1" /> : <History className="h-4 w-4 mr-1" />}
                Histórico
              </Button>
              <Button size="sm" onClick={() => { setEditingItem(null); setShowItemForm(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Nova ação
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      {showHistory && auditLog.length > 0 && (
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

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <Input placeholder="Buscar ações..." value={searchQuery}
            onChange={e => setSearchQuery(sanitize(e.target.value))}
            className="pl-8 h-9 text-sm" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(STATUS_FAROL).map(([k, v]) => (
            <button key={k} onClick={() => setStatusFilter(statusFilter === Number(k) ? null : Number(k))}
              className={cn("rounded-full border px-2.5 py-1 text-xs font-medium transition-all", v.color,
                statusFilter === Number(k) ? "ring-1 ring-zinc-400 dark:ring-zinc-500 scale-105" : "opacity-60 hover:opacity-100")}>
              {v.dot} {v.label}
            </button>
          ))}
        </div>
        {(searchQuery || statusFilter !== null) && (
          <span className="text-xs text-zinc-500">{filteredItems.length} de {allItems.length}</span>
        )}
      </div>

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
            await updateItemStatus(itemId, newStatus);
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
        <div className="relative overflow-hidden rounded-xl border border-zinc-200/60 bg-white shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/80">
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory" }}>
            <div className="min-w-[480px] sm:min-w-[640px] md:min-w-[860px] lg:min-w-0">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b-2 border-zinc-200/80 bg-zinc-50/80 backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-800/70">
                    <th className="sticky left-0 z-20 w-10 sm:w-14 bg-inherit backdrop-blur-md px-1.5 sm:px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500">Nº</th>
                    <th className="px-2 sm:px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 min-w-[100px] sm:min-w-[160px]">Ação</th>
                    <th className="px-2 sm:px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 min-w-[70px] hidden sm:table-cell">Resp.</th>
                    <th className="px-2 sm:px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 min-w-[80px] hidden md:table-cell">Por Que</th>
                    <th className="px-2 sm:px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 min-w-[65px] hidden md:table-cell">Término</th>
                    <th className="px-2 sm:px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 min-w-[70px] hidden lg:table-cell">Onde</th>
                    <th className="px-2 sm:px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 min-w-[65px] hidden lg:table-cell">Início</th>
                    <th className="px-2 sm:px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 min-w-[65px] hidden lg:table-cell">Custo</th>
                    <th className="px-2 sm:px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 w-10 sm:w-16">Status</th>
                    <th className="sticky right-0 z-20 bg-inherit backdrop-blur-md px-1 sm:px-2 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 w-10 sm:w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {renderItems(items, 0, expandedRows, toggleRow, setEditingItem, setShowItemForm, setDeletingItem, inlineEditId, setInlineEditId, inlineAction, isInlineSaving, (it, tab) => { setEditingItem(it); setEditingItemTab(tab); setShowItemForm(true); }, contasSummary)}
                </tbody>
              </table>
            </div>
          </div>
          {/* Scroll edge shadows */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white/60 to-transparent dark:from-zinc-800/60 lg:hidden" />
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white/60 to-transparent dark:from-zinc-800/60 lg:hidden" />
          {/* Swipe hint on very small screens */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 to-transparent py-1.5 text-center text-[10px] text-zinc-400 dark:from-zinc-900/90 sm:hidden">
            ← deslize para ver mais →
          </div>
        </div>
      ))}

      {/* Dialogs */}
      {showPlanForm && (
        <PlanFormDialog plan={plan} tenantId={currentTenant?.id || ""}
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
          state={itemState} action={itemAction} isPending={isItemSaving}
          onClose={() => { setShowItemForm(false); setEditingItem(null); setEditingItemTab("principal"); }} />
      )}

      <AlertDialog open={!!deletingItem} onOpenChange={(o) => { if (!o) setDeletingItem(null); }}>
        {deletingItem && <ConfirmDlg title="Excluir ação" msg={`Excluir "${deletingItem.action}"?`} name="itemId" value={deletingItem.id} action={itemDeleteAction} pending={isItemDeleting} />}
      </AlertDialog>
    </div>
  );
}

function StatPill({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {label} <span className="font-semibold text-zinc-900 dark:text-zinc-50">{value}</span>
    </span>
  );
}

function renderItems(
  items: ActionItem[], depth: number, expandedRows: Set<string>, toggleRow: (id: string) => void,
  onEdit: (i: ActionItem) => void, onShowForm: (s: boolean) => void, onDelete: (i: ActionItem) => void,
  inlineEditId: string | null, setInlineEditId: (id: string | null) => void,
  inlineAction: (p: FormData) => void, inlinePending: boolean,
  onOpenTab: (i: ActionItem, tab: "principal" | "datas" | "resultados" | "anexos" | "comentarios") => void,
  contasSummary: Record<string, ItemContasSummary>,
  rowIndex = { value: 0 },
): React.ReactNode[] {
  const rows: React.ReactNode[] = [];
  for (const item of items) {
    const st = STATUS_FAROL[item.status] || STATUS_FAROL[1];
    const isGroup = !!(item.children && item.children.length > 0);
    const isExpanded = expandedRows.has(item.id);
    const isEditing = inlineEditId === item.id;
    const isEven = rowIndex.value % 2 === 0;

    rows.push(
      <tr key={item.id} className={cn(
        "group transition-colors duration-75",
        isEditing && "bg-amber-50/90 dark:bg-amber-950/20",
        !isEditing && isGroup && "cursor-pointer bg-zinc-50/80 dark:bg-zinc-800/60",
        !isEditing && !isGroup && isEven && "bg-white dark:bg-zinc-900/80",
        !isEditing && !isGroup && !isEven && "bg-zinc-50/30 dark:bg-zinc-800/30",
        !isEditing && "hover:bg-blue-50/50 dark:hover:bg-blue-950/20",
      )}
        onClick={!isEditing && isGroup ? () => toggleRow(item.id) : undefined}
        tabIndex={0}
        onKeyDown={!isEditing && isGroup ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleRow(item.id); } } : undefined}
      >
        {isEditing ? (
          <EditRow item={item} planId={item.plan_id} inlineAction={inlineAction} inlinePending={inlinePending} onCancel={() => setInlineEditId(null)} />
        ) : (
          <ViewRow item={item} depth={depth} isGroup={isGroup} isExpanded={isExpanded} st={st}
            onEdit={onEdit} onShowForm={onShowForm} onDelete={onDelete} setInlineEditId={setInlineEditId} inlineEditId={inlineEditId} onOpenTab={onOpenTab}
            contasSummary={contasSummary[item.id]} />
        )}
      </tr>
    );
    rowIndex.value++;
    if (isGroup && isExpanded && item.children) {
      rows.push(...renderItems(item.children, depth + 1, expandedRows, toggleRow, onEdit, onShowForm, onDelete, inlineEditId, setInlineEditId, inlineAction, inlinePending, onOpenTab, contasSummary, rowIndex));
    }
    if (!isGroup && item.children) {
      rows.push(...renderItems(item.children, depth + 1, expandedRows, toggleRow, onEdit, onShowForm, onDelete, inlineEditId, setInlineEditId, inlineAction, inlinePending, onOpenTab, contasSummary, rowIndex));
    }
  }
  return rows;
}

function ViewRow({ item, depth, isGroup, isExpanded, st, onEdit: _onEdit, onShowForm: _onShowForm, onDelete, setInlineEditId, inlineEditId, onOpenTab, contasSummary }: {
  item: ActionItem; depth: number; isGroup: boolean; isExpanded: boolean; st: typeof STATUS_FAROL[number];
  onEdit: (i: ActionItem) => void; onShowForm: (s: boolean) => void; onDelete: (i: ActionItem) => void; setInlineEditId: (id: string | null) => void; inlineEditId: string | null;
  onOpenTab: (i: ActionItem, tab: "principal" | "datas" | "resultados" | "anexos" | "comentarios") => void;
  contasSummary?: ItemContasSummary;
}) {
  const showFull = isExpanded && isGroup;
  return <>
    <td className="sticky left-0 z-10 bg-inherit px-1.5 sm:px-3 py-2.5 font-mono text-[11px] text-zinc-400 dark:text-zinc-500 align-top">
      <span className="inline-flex items-center gap-1.5" style={{ paddingLeft: `${Math.max(depth * 14, 0)}px` }}>
        {isGroup && (
          <span className={cn("inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm transition-colors",
            isExpanded ? "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
          )}>
            <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isExpanded || "-rotate-90")} />
          </span>
        )}
        {!isGroup && depth > 0 && <span className="text-zinc-300 dark:text-zinc-600">└</span>}
        <span className={isGroup ? "font-semibold" : ""}>{item.number}</span>
      </span>
    </td>
    <td className="px-2 sm:px-3 py-2.5 align-top min-w-[100px] sm:min-w-[160px]">
      <div className="max-w-[180px] sm:max-w-xs lg:max-w-sm">
        <p className={cn("truncate text-[13px] leading-snug", isGroup ? "font-semibold text-zinc-800 dark:text-zinc-200" : "text-zinc-700 dark:text-zinc-300")} title={item.action}>{item.action}</p>
        {(!isGroup || showFull) && item.why && <p className="mt-0.5 truncate text-[11px] text-zinc-400 dark:text-zinc-500">{item.why}</p>}
      </div>
    </td>
    <td className="px-2 sm:px-3 py-2.5 text-[12px] text-zinc-600 dark:text-zinc-300 align-top font-medium hidden sm:table-cell">{item.responsible || "—"}</td>
    <td className={cn("px-2 sm:px-3 py-2.5 text-[12px] text-zinc-500 dark:text-zinc-400 align-top max-w-[120px] truncate", showFull ? "table-cell" : "hidden md:table-cell")} title={item.why || ""}>{item.why || "—"}</td>
    <td className="px-2 sm:px-3 py-2.5 text-[12px] text-zinc-500 dark:text-zinc-400 align-top tabular-nums hidden md:table-cell">{item.planned_end ? fmt(item.planned_end) : "—"}</td>
    <td className={cn("px-2 sm:px-3 py-2.5 text-[12px] text-zinc-500 dark:text-zinc-400 align-top", showFull ? "table-cell" : "hidden lg:table-cell")}>{item.where || "—"}</td>
    <td className="px-2 sm:px-3 py-2.5 text-[12px] text-zinc-500 dark:text-zinc-400 align-top tabular-nums hidden lg:table-cell">{item.planned_start ? fmt(item.planned_start) : "—"}</td>
    <td className="px-2 sm:px-3 py-2.5 text-[12px] text-zinc-500 dark:text-zinc-400 align-top font-mono tabular-nums hidden lg:table-cell">
      <div className="flex flex-col gap-0.5">
        <span>{item.cost || "—"}</span>
        {contasSummary && contasSummary.count > 0 && (
          <Link
            href={`/financeiro/contas-a-pagar?item_id=${item.id}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "inline-flex items-center gap-1 self-start rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors hover:opacity-80",
              contasSummary.tem_atrasada
                ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                : contasSummary.total_em_aberto > 0
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
            )}
            title={`${contasSummary.count} conta(s) — em aberto: ${formatBRL(contasSummary.total_em_aberto)} • pago: ${formatBRL(contasSummary.total_pago)}`}
          >
            <Receipt className="h-2.5 w-2.5" />
            {contasSummary.count} • {formatBRL(contasSummary.total_em_aberto)}
          </Link>
        )}
      </div>
    </td>
    <td className="px-1 sm:px-3 py-2.5 text-center align-top" onClick={e => e.stopPropagation()}>
      <StatusBadge
        status={item.status}
        item={item}
        children={item.children}
        onClick={() => setInlineEditId(inlineEditId === item.id ? null : item.id)}
      />
    </td>
    <td className="sticky right-0 z-10 bg-inherit px-1 sm:px-2 py-2.5 align-top" onClick={e => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition-colors">
            <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="sr-only">Abrir menu de ações</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onOpenTab(item, "anexos")}>
            <Paperclip className="h-4 w-4" />
            <span>Anexos</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onOpenTab(item, "comentarios")}>
            <MessageSquare className="h-4 w-4" />
            <span>Comentários</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/financeiro/contas-a-pagar?from_item=${item.id}`} onClick={(e) => e.stopPropagation()}>
              <Receipt className="h-4 w-4" />
              <span>Contas a pagar</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setInlineEditId(item.id)}>
            <Pencil className="h-4 w-4" />
            <span>Editar</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(item)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30">
            <Trash2 className="h-4 w-4" />
            <span>Excluir</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </td>
  </>;
}

/**
 * Portaliza dialogs para document.body — necessário quando o componente
 * renderiza dentro de uma tabela (`<tr>`/`<td>`), onde divs de overlay são
 * HTML inválido e causam hydration mismatch.
 */
function DialogsPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

function EditRow({ item, planId, inlineAction, inlinePending, onCancel }: {
  item: ActionItem; planId: string; inlineAction: (p: FormData) => void; inlinePending: boolean; onCancel: () => void;
}) {
  const [action, setAction] = useState(item.action);
  const [responsible, setResponsible] = useState(item.responsible || "");
  const [plannedEnd, setPlannedEnd] = useState(item.planned_end || "");
  const [status, setStatus] = useState(String(item.status));
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [touched, setTouched] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const isDirty =
    action !== item.action ||
    responsible !== (item.responsible || "") ||
    plannedEnd !== (item.planned_end || "") ||
    status !== String(item.status);

  const isValid = action.trim().length >= 1;
  const showActionError = touched && !isValid;

  // Diff legível para o diálogo de confirmação
  const diff = useMemo(() => {
    const out: { label: string; from: string; to: string }[] = [];
    if (action !== item.action) {
      out.push({ label: "Ação", from: item.action || "—", to: action || "—" });
    }
    if (responsible !== (item.responsible || "")) {
      out.push({
        label: "Responsável",
        from: item.responsible || "—",
        to: responsible || "—",
      });
    }
    if (plannedEnd !== (item.planned_end || "")) {
      out.push({
        label: "Prazo",
        from: item.planned_end ? fmt(item.planned_end) : "—",
        to: plannedEnd ? fmt(plannedEnd) : "—",
      });
    }
    if (status !== String(item.status)) {
      out.push({
        label: "Status",
        from: STATUS_FAROL[item.status]?.label || "—",
        to: STATUS_FAROL[Number(status)]?.label || "—",
      });
    }
    return out;
  }, [action, responsible, plannedEnd, status, item]);

  const tryCancel = () => {
    if (isDirty) setConfirmCancel(true);
    else onCancel();
  };

  const tryDiscard = () => {
    setConfirmCancel(false);
    onCancel();
  };

  const tryRequestSave = () => {
    if (!isValid) {
      setTouched(true);
      return;
    }
    if (!isDirty) {
      // Sem alterações: fecha sem ação
      onCancel();
      return;
    }
    setConfirmSave(true);
  };

  const confirmAndSave = () => {
    setConfirmSave(false);
    formRef.current?.requestSubmit();
  };

  // ESC fecha (com confirmação se dirty)
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      // Dialogs próprios cuidam do Esc deles
      if (confirmCancel || confirmSave) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        tryCancel();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, confirmCancel, confirmSave]);

  function handleSubmit(fd: FormData) {
    if (!isValid) {
      setTouched(true);
      return;
    }
    inlineAction(fd);
  }

  return (
    <>
      <td
        colSpan={10}
        className="border-l-2 border-l-accent-500 bg-accent-50/40 px-3 py-2 dark:bg-accent-950/20"
      >
        <form
          ref={formRef}
          action={handleSubmit}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && isValid && !inlinePending) {
              e.preventDefault();
              tryRequestSave();
            }
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="planId" value={planId} />
          <input type="hidden" name="number" value={item.number} />
          <input type="hidden" name="sort_order" value={String(item.sort_order)} />
          <input type="hidden" name="parent_id" value={item.parent_id || ""} />
          <input type="hidden" name="why" value={item.why || ""} />
          <input type="hidden" name="where" value={item.where || ""} />
          <input type="hidden" name="cost" value={item.cost || ""} />
          <input type="hidden" name="expected_result" value={item.expected_result || ""} />
          <input type="hidden" name="actual_result" value={item.actual_result || ""} />
          <input type="hidden" name="observations" value={item.observations || ""} />
          <input type="hidden" name="planned_start" value={item.planned_start || ""} />
          <input type="hidden" name="actual_start" value={item.actual_start || ""} />
          <input type="hidden" name="actual_end" value={item.actual_end || ""} />

          <div className="flex-1 min-w-[200px]">
            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Ação <span className="text-red-600">*</span>
              {isDirty && (
                <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-accent-500" aria-label="Modificado" />
              )}
            </label>
            <input
              name="action"
              value={action}
              onChange={(e) => { setAction(e.target.value); if (!touched) setTouched(true); }}
              required
              autoFocus
              maxLength={500}
              aria-invalid={showActionError}
              className={cn(
                "w-full rounded-md border bg-white px-2 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 dark:bg-zinc-800 dark:text-zinc-50",
                showActionError
                  ? "border-red-400 dark:border-red-600"
                  : "border-accent-300 dark:border-accent-700",
              )}
              placeholder="Descreva a ação..."
            />
            {showActionError && (
              <p className="mt-0.5 text-[10px] text-red-600">Ação obrigatória.</p>
            )}
          </div>

          <div className="w-32">
            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Responsável
            </label>
            <input
              name="responsible"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              maxLength={200}
              className="w-full rounded-md border border-accent-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 dark:border-accent-700 dark:bg-zinc-800 dark:text-zinc-50"
              placeholder="Nome"
            />
          </div>

          <div className="w-32">
            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Prazo
            </label>
            <input
              name="planned_end"
              type="date"
              value={plannedEnd}
              onChange={(e) => setPlannedEnd(e.target.value)}
              className="w-full rounded-md border border-accent-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 dark:border-accent-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>

          <div className="w-36">
            <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Status
            </label>
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-accent-300 bg-white px-1.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent-500 dark:border-accent-700 dark:bg-zinc-800 dark:text-zinc-50"
            >
              {Object.entries(STATUS_FAROL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.dot} {v.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-medium text-zinc-400">
              Esc · Ctrl+Enter
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                isLoading={inlinePending}
                disabled={!isValid || inlinePending}
                className="h-8"
                title="Salvar (Ctrl/⌘ + Enter)"
                onClick={tryRequestSave}
              >
                <Check className="h-3.5 w-3.5" /> Salvar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={tryCancel}
                title="Cancelar (Esc)"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </form>
      </td>

      <DialogsPortal>
        {/* Confirmação de descarte */}
        <AlertDialog open={confirmCancel} onOpenChange={(open) => !open && setConfirmCancel(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
              <AlertDialogDescription>
                Você fez modificações neste item que ainda não foram salvas. Deseja
                descartá-las?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmCancel(false)}>
                Continuar editando
              </AlertDialogCancel>
              <Button variant="destructive" onClick={tryDiscard}>
                <X className="h-4 w-4" /> Descartar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirmação ao salvar — com diff */}
        <AlertDialog open={confirmSave} onOpenChange={(open) => !open && setConfirmSave(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar alterações?</AlertDialogTitle>
              <AlertDialogDescription>
                {`Item ${item.number}: revise o que será salvo:`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <ul className="my-2 space-y-1.5 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
              {diff.map((d) => (
                <li key={d.label} className="text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {d.label}:
                  </span>{" "}
                  <span className="text-zinc-500 line-through">{d.from}</span>{" "}
                  <span className="text-zinc-400">→</span>{" "}
                  <span className="font-semibold text-accent-700 dark:text-accent-300">
                    {d.to}
                  </span>
                </li>
              ))}
            </ul>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmSave(false)}>
                Continuar editando
              </AlertDialogCancel>
              <Button onClick={confirmAndSave} isLoading={inlinePending}>
                <Check className="h-4 w-4" /> Confirmar e salvar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogsPortal>
    </>
  );
}

function PlanFormDialog({ plan, tenantId, state, action, isPending, onClose }: {
  plan: ActionPlan | null; tenantId: string; state: ActionPlanFormState; action: (p: FormData) => void; isPending: boolean; onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(plan?.title || "");
  const [unit, setUnit] = useState(plan?.unit || "");
  const [director, setDirector] = useState(plan?.director || "");
  const [goal, setGoal] = useState(plan?.goal || "");
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);

  useEffect(() => {
    if (!plan) { getTemplates().then(t => setTemplates(t.map(x => ({ id: x.id, name: x.name })))); }
  }, [plan]);

  const applyTemplate = async (templateId: string) => {
    setTemplateLoading(true);
    const result = await createPlanFromTemplate(templateId, tenantId);
    if (result.success) {
      onClose();
      router.refresh();
    } else {
      setTemplateLoading(false);
    }
  };

  const titleValid = title.length >= 2;
  const titleError = title.length > 0 && title.length < 2 ? "Mínimo 2 caracteres" : "";
  const unitValid = unit.length === 0 || unit.length >= 2;
  const directorValid = director.length === 0 || director.length >= 2;
  const goalValid = goal.length === 0 || goal.length >= 2;

  const fieldsFilled = [title.length > 0, unit.length > 0, director.length > 0, goal.length > 0].filter(Boolean).length;
  const totalFields = 4;
  const formProgress = Math.round((fieldsFilled / totalFields) * 100);

  return (
    <Modal onClose={onClose}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Novo plano</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Preencha os dados do cabeçalho</p>
        </div>
        <button onClick={onClose} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"><X className="h-5 w-5" /></button>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Progresso</span>
          <span className="text-[10px] font-mono text-zinc-400">{fieldsFilled}/{totalFields}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div className={cn("h-full rounded-full transition-all duration-300",
            formProgress === 100 ? "bg-emerald-500" : formProgress >= 50 ? "bg-blue-500" : "bg-zinc-300"
          )} style={{ width: `${Math.max(formProgress, 4)}%` }} />
        </div>
      </div>

      {/* Template selection (only for new plans) */}
      {!plan && templates.length > 0 && (
        <div className="mb-4">
          <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Usar template</label>
          <div className="flex flex-wrap gap-1.5">
            {templates.map(t => (
              <button key={t.id} type="button" disabled={templateLoading}
                onClick={() => applyTemplate(t.id)}
                className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form action={action} className="space-y-4">
        {plan && <input type="hidden" name="planId" value={plan.id} />}
        <input type="hidden" name="tenantId" value={tenantId} />

        <FieldV label="Título do plano" name="title" value={title} onChange={setTitle} required
          placeholder="Ex: Plano de Ação — Rio Branco" max={200}
          valid={titleValid} error={titleError}
          hint="Dê um nome descritivo ao plano" />

        <div className="grid grid-cols-2 gap-3">
          <FieldV label="Unidade" name="unit" value={unit} onChange={setUnit}
            placeholder="Ex: Rio Branco (Unimeta)" max={200} valid={unitValid}
            hint="Nome da unidade ou filial" />
          <FieldV label="Diretor(a)" name="director" value={director} onChange={setDirector}
            placeholder="Nome do diretor" max={200} valid={directorValid}
            hint="Responsável pelo plano" />
        </div>

        <FieldV label="Meta" name="goal" value={goal} onChange={setGoal}
          placeholder="Ex: 7.908 INSC | 1.382 MF | 1.214 ACAD" max={1000} valid={goalValid}
          hint="Meta quantificável com indicadores" />

        {state.message && !state.success && <Msg state={state} />}

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-700">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" isLoading={isPending} disabled={!titleValid}>
            <Save className="h-4 w-4 mr-1" />{plan ? "Salvar" : "Criar plano"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function FieldV({ label, name, value, onChange, multiline, required, placeholder, type, max, valid, error, hint }: {
  label: string; name: string; value?: string; onChange?: (v: string) => void; multiline?: boolean; required?: boolean; placeholder?: string; type?: string; max?: number; valid?: boolean; error?: string; hint?: string;
}) {
  const length = value?.length || 0;
  const showError = error && error.length > 0;
  const showWarning = max && length > max - 20 && !showError;
  const charsLeft = max ? max - length : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        {max && (
          <span className={cn("font-mono text-[10px] transition-colors",
            charsLeft < 0 ? "text-red-500 font-semibold" : showWarning ? "text-amber-500" : "text-zinc-400"
          )}>{charsLeft}</span>
        )}
      </div>
      {multiline ? (
        <textarea name={name} value={value} placeholder={placeholder} required={required} rows={2}
          onChange={e => { const v = sanitize(e.target.value); onChange?.(v); }}
          className={cn("flex w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 resize-none transition-all",
            showError ? "border-red-300 focus-visible:ring-red-500" : valid === false ? "border-amber-300 focus-visible:ring-amber-500" : "border-zinc-200 focus-visible:ring-zinc-500 dark:border-zinc-700"
          )} />
      ) : (
        <Input name={name} type={type} value={value} placeholder={placeholder} required={required}
          onChange={e => { const v = type !== "date" && type !== "number" ? sanitize(e.target.value) : e.target.value; onChange?.(v); }}
          className={cn("transition-all rounded-lg",
            showError ? "border-red-300 focus-visible:ring-red-500" : valid === false ? "border-amber-300 focus-visible:ring-amber-500" : "focus:shadow-md"
          )} />
      )}
      {showError && <p className="text-[11px] text-red-500 animate-[slideDown_150ms_ease-out]">{error}</p>}
      {!showError && hint && <p className="text-[11px] text-zinc-400">{hint}</p>}
    </div>
  );
}

function ItemFormDialog({ item, planId, items, state, action, isPending, onClose, initialTab = "principal" }: {
  item: ActionItem | null; planId: string; items: ActionItem[]; state: ActionPlanFormState; action: (p: FormData) => void; isPending: boolean; onClose: () => void;
  initialTab?: "principal" | "datas" | "resultados" | "anexos" | "comentarios";
}) {
  const [isGroup, setIsGroup] = useState(!item?.parent_id && !!(item?.children?.length));
  const [tab, setTab] = useState<"principal" | "datas" | "resultados" | "anexos" | "comentarios">(initialTab);
  const [actionText, setActionText] = useState(item?.action || "");
  const groups = flattenItems(items).filter(i => i.id !== item?.id && (i.children?.length || 0) > 0);
  const allItems = flattenItems(items);

  return (
    <Modal onClose={onClose}>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{item ? "Editar ação" : "Nova ação"}</h3>
        <button onClick={onClose} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"><X className="h-5 w-5" /></button>
      </div>
      <form action={action} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {item && <input type="hidden" name="itemId" value={item.id} />}
        <input type="hidden" name="planId" value={planId} />
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          {(["principal", "datas", "resultados", "anexos", "comentarios"] as const).map(t => {
            const needsItem = t === "anexos" || t === "comentarios";
            const isDisabled = needsItem && !item?.id;
            const labels: Record<typeof t, string> = { principal: "Principal", datas: "Datas", resultados: "Resultados", anexos: "Anexos", comentarios: "Comentários" };
            return (
              <button key={t} type="button" onClick={() => setTab(t)} disabled={isDisabled}
                className={cn("flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === t ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300",
                  isDisabled ? "opacity-40 cursor-not-allowed" : "")}>
                {labels[t]}
              </button>
            );
          })}
        </div>
        {tab === "principal" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Nº" name="number" value={item?.number || String(allItems.length + 1)} placeholder="1.1" required />
              <Field label="Ordem" name="sort_order" value={String(item?.sort_order || allItems.length + 1)} type="number" />
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-500">Grupo pai</Label>
                <select name="parent_id" defaultValue={item?.parent_id || ""} disabled={isGroup}
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50">
                  <option value="">{isGroup ? "(este é um grupo)" : "Nenhum — item raiz"}</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.number} — {trunc(g.action, 35)}</option>)}
                </select>
              </div>
            </div>
            <label className={cn("flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 transition-colors",
              isGroup ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30" : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700")}>
              <input type="checkbox" checked={isGroup} onChange={e => setIsGroup(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500" />
              <div><p className="text-sm font-medium">Criar como grupo</p><p className="text-xs text-zinc-500">Cabeçalho que pode conter sub-ações.</p></div>
            </label>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-zinc-500">Ação (O QUE / COMO) <span className="text-red-500">*</span></Label>
                <span className={cn("font-mono text-xs transition-colors", actionText.length > 500 ? "text-red-500 font-semibold" : actionText.length > 480 ? "text-amber-500" : "text-zinc-400")}>{actionText.length}/500</span>
              </div>
              <textarea name="action" value={actionText} required rows={2}
                onChange={e => { const v = sanitize(e.target.value); setActionText(v); }}
                placeholder="Descreva a ação"
                className={cn("flex w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 resize-none transition-all",
                  actionText.length > 0 && actionText.length < 3 ? "border-red-300 focus-visible:ring-red-500" : actionText.length > 500 ? "border-red-300 focus-visible:ring-red-500" : "border-zinc-200 focus-visible:ring-zinc-500 dark:border-zinc-700"
                )} />
              {actionText.length > 0 && actionText.length < 3 && <p className="text-[11px] text-red-500 animate-[slideDown_150ms_ease-out]">Mínimo 3 caracteres</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Por Que" name="why" value={item?.why || ""} placeholder="Motivo" />
              <Field label="Onde" name="where" value={item?.where || ""} placeholder="Local" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Responsável" name="responsible" value={item?.responsible || ""} placeholder="Nome" />
              <Field label="Custo (R$)" name="cost" value={item?.cost || ""} placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-500">Farol</Label>
              <select name="status" defaultValue={String(item?.status || 1)}
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50">
                {Object.entries(STATUS_FAROL).map(([k, v]) => <option key={k} value={k}>{v.dot} {v.label}</option>)}
              </select>
            </div>
          </div>
        )}
        {tab === "datas" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3"><p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Planejado</p>
              <div className="space-y-1.5"><Label className="text-xs">Início Previsto</Label><Input name="planned_start" type="date" defaultValue={item?.planned_start || ""} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Término Previsto</Label><Input name="planned_end" type="date" defaultValue={item?.planned_end || ""} /></div>
            </div>
            <div className="space-y-3"><p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Realizado</p>
              <div className="space-y-1.5"><Label className="text-xs">Início Real</Label><Input name="actual_start" type="date" defaultValue={item?.actual_start || ""} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Término Real</Label><Input name="actual_end" type="date" defaultValue={item?.actual_end || ""} /></div>
            </div>
          </div>
        )}
        {tab === "resultados" && (
          <div className="space-y-3">
            <Field label="Resultado Esperado" name="expected_result" value={item?.expected_result || ""} multiline placeholder="O que se espera alcançar" />
            <Field label="Resultado Real" name="actual_result" value={item?.actual_result || ""} multiline placeholder="Alcançado" />
            <Field label="Observações" name="observations" value={item?.observations || ""} multiline placeholder="Acompanhamento" />
          </div>
        )}
        {tab === "anexos" && (
          <div className="space-y-3">
            {item?.id ? (
              <AttachmentSection itemId={item.id} />
            ) : (
              <p className="text-xs text-zinc-400 text-center py-4">Salve o item antes de anexar arquivos.</p>
            )}
          </div>
        )}
        {tab === "comentarios" && (
          <div className="space-y-3">
            {item?.id ? (
              <CommentSection itemId={item.id} />
            ) : (
              <p className="text-xs text-zinc-400 text-center py-4">Salve o item antes de adicionar comentários.</p>
            )}
          </div>
        )}
        {state.message && !state.success && tab !== "anexos" && tab !== "comentarios" && <Msg state={state} />}
        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <Button type="button" variant="outline" onClick={onClose}>{tab === "anexos" || tab === "comentarios" ? "Fechar" : "Cancelar"}</Button>
          {tab !== "anexos" && tab !== "comentarios" && (
            <Button type="submit" isLoading={isPending} disabled={!actionText.trim()}><Check className="h-4 w-4 mr-1" />{item ? "Salvar" : "Criar"}</Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

function ConfirmDlg({ title, msg, name, value, action, pending }: { title: string; msg: string; name: string; value: string; action: (p: FormData) => void; pending: boolean; }) {
  return <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{msg}</AlertDialogDescription></AlertDialogHeader><form action={action}><input type="hidden" name={name} value={value} /><AlertDialogFooter><AlertDialogCancel /><Button type="submit" variant="destructive" isLoading={pending}><Trash2 className="h-4 w-4 mr-1" />Excluir</Button></AlertDialogFooter></form></AlertDialogContent>;
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]" onClick={onClose}>
    <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl animate-[slideUp_200ms_ease-out] dark:border-zinc-700 dark:bg-zinc-900" onClick={e => e.stopPropagation()}>{children}</div></div>;
}

function Field({ label, name, value, onChange, multiline, required, placeholder, type, max }: {
  label: string; name: string; value?: string; onChange?: (v: string) => void; multiline?: boolean; required?: boolean; placeholder?: string; type?: string; max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
        {max && <span className={cn("font-mono text-xs", (value?.length || 0) > max - 10 ? "text-red-500" : "text-zinc-400")}>{value?.length || 0}/{max}</span>}
      </div>
      {multiline ? (
        <textarea name={name} value={value} placeholder={placeholder} required={required} rows={2}
          onChange={e => { const v = sanitize(e.target.value); onChange?.(v); }}
          className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 resize-none transition-shadow focus:shadow-md" />
      ) : (
        <Input name={name} type={type} value={value} placeholder={placeholder} required={required}
          onChange={e => { const v = type !== "date" && type !== "number" ? sanitize(e.target.value) : e.target.value; onChange?.(v); }}
          className="transition-shadow focus:shadow-md" />
      )}
    </div>
  );
}

function Msg({ state }: { state: ActionPlanFormState }) {
  return <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-300">{state.message}</div>;
}

function BulkStatusButton({ planId, filteredItems, toast, router }: {
  planId: string; filteredItems: ActionItem[]; toast: (msg: string) => void; router: ReturnType<typeof import("next/navigation").useRouter>;
}) {
  const [show, setShow] = useState(false);
  if (!planId || !filteredItems.length) return null;

  const handleBulk = async (status: number) => {
    setShow(false);
    const ids = filteredItems.map(i => i.id);
    const result = await bulkUpdateStatus(planId, ids, status);
    if (result.success) {
      toast(result.message || "Atualizado!");
      router.refresh();
    } else {
      toast(result.message || "Erro ao atualizar.");
    }
  };

  const statusOptions = [
    { status: 1, label: "Não Iniciada" },
    { status: 2, label: "Pendente" },
    { status: 4, label: "Em andamento" },
    { status: 5, label: "Concluído" },
  ];

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" onClick={() => setShow(!show)}>
        <Save className="h-3.5 w-3.5 mr-1" />
        Lote ({filteredItems.length})
      </Button>
      {show && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="px-3 py-2 text-xs font-semibold text-zinc-500">Alterar status</div>
          {statusOptions.map(opt => (
            <button key={opt.status} onClick={() => handleBulk(opt.status)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <span className={cn("h-2 w-2 rounded-full", opt.status === 5 ? "bg-emerald-500" : opt.status === 4 ? "bg-blue-500" : opt.status === 2 ? "bg-amber-500" : "bg-zinc-400")} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

