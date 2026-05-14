"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  ChevronDown, 
  ChevronUp,
  ChevronsUpDown,
  MoreVertical, 
  Paperclip, 
  History,
  MessageSquare, 
  Receipt, 
  Pencil, 
  Check, 
  Trash2, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel 
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format-br";
import { fmt } from "@/components/planos/plan-utils";
import { StatusDot } from "@/components/planos/status-dot";
import type { ActionItem } from "@/types/action-plan";
import type { ItemContasSummary } from "@/app/actions/contas-pagar";
import { isValidActionText } from "@/components/planos/planos-page-helpers";

const PAGE_SIZE = 20;

type SortKey = "number" | "action" | "tipo_pa" | "prioridade" | "responsible" | "why" | "planned_end" | "where" | "planned_start" | "cost" | "status" | null;

interface SortState {
  key: SortKey;
  dir: "asc" | "desc";
}

interface PlanTableProps {
  items: ActionItem[];
  contasSummary: Record<string, ItemContasSummary>;
  onEdit: (item: ActionItem) => void;
  onShowForm: (show: boolean) => void;
  onDelete: (item: ActionItem) => void;
  onOpenTab: (item: ActionItem, tab: "modelo" | "anexos" | "comentarios" | "historico") => void;
  inlineAction: (p: FormData) => void;
  isInlineSaving: boolean;
}

export function PlanTable({
  items,
  contasSummary,
  onEdit,
  onShowForm,
  onDelete,
  onOpenTab,
  inlineAction,
  isInlineSaving,
}: PlanTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>({ key: null, dir: "asc" });
  const [page, setPage] = useState(0);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allGroupIds = useMemo(() => {
    const ids = new Set<string>();
    function collect(list: ActionItem[]) {
      for (const item of list) {
        if (item.children?.length) { ids.add(item.id); collect(item.children); }
      }
    }
    collect(items);
    return ids;
  }, [items]);

  const allExpanded = allGroupIds.size > 0 && [...allGroupIds].every((id) => expandedRows.has(id));

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedRows(new Set());
    } else {
      setExpandedRows(new Set(allGroupIds));
    }
    setPage(0);
  };

  const toggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: "asc" };
    });
  };

  // Flatten and optionally sort items
  const { flatItems, totalPages } = useMemo(() => {
    const flat: ActionItem[] = [];

    function flattenVisible(list: ActionItem[], forceVisible?: boolean) {
      for (const item of list) {
        flat.push(item);
        const isGroup = !!(item.children && item.children.length > 0);
        const isExpanded = expandedRows.has(item.id);
        if (isGroup && (forceVisible || isExpanded) && item.children) {
          flattenVisible(item.children, forceVisible);
        } else if (!isGroup && item.children) {
          flattenVisible(item.children, forceVisible);
        }
      }
    }

    const sorted = items.map(i => ({ ...i, children: i.children ? [...i.children] : undefined }));

    if (sort.key) {
      const cmp = sortValue.bind(null, sort.key);
      sortTree(sorted, sort.dir, cmp);
    }

    flattenVisible(sorted);

    const pages = Math.max(1, Math.ceil(flat.length / PAGE_SIZE));

    return { flatItems: flat, totalPages: pages };
  }, [items, sort, expandedRows]);

  // Clamp page when filtered results shrink
  useEffect(() => {
    if (page >= totalPages) setPage(Math.max(0, totalPages - 1));
  }, [totalPages, page]);

  const pageItems = flatItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function SortHeader({ column, label, className }: { column: SortKey; label: string; className?: string }) {
    return (
      <th
        onClick={() => toggleSort(column)}
        className={cn(
          "cursor-pointer select-none px-2 sm:px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors",
          className,
        )}
      >
        <span className="inline-flex items-center gap-0.5">
          {label}
          {sort.key === column ? (
            sort.dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronsUpDown className="h-3 w-3 opacity-30" />
          )}
        </span>
      </th>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-xl border border-zinc-200/60 bg-white shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/80">
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="min-w-[1080px]">
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10">
                <tr className="border-b-2 border-zinc-200/80 bg-zinc-50/80 backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-800/70">
                  <th className="sticky left-0 z-20 bg-inherit backdrop-blur-md px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 w-14">
                    Nº
                  </th>
                  <SortHeader column="action" label="Ação" className="min-w-[180px]" />
                  <SortHeader column="tipo_pa" label="Tipo" className="w-24" />
                  <SortHeader column="prioridade" label="Prior" className="w-20" />
                  <SortHeader column="responsible" label="Resp." className="min-w-[100px]" />
                  <SortHeader column="why" label="Por Que" className="min-w-[100px]" />
                  <SortHeader column="planned_end" label="Término" className="min-w-[80px]" />
                  <SortHeader column="where" label="Onde" className="min-w-[80px]" />
                  <SortHeader column="planned_start" label="Início" className="min-w-[80px]" />
                  <SortHeader column="cost" label="Custo" className="min-w-[90px]" />
                  <th className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 w-16">
                    Status
                  </th>
                  <th className="sticky right-0 z-20 bg-inherit backdrop-blur-md px-2 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, idx) => {
                  const isGroup = !!(item.children && item.children.length > 0);
                  const isExpanded = expandedRows.has(item.id);
                  const isEditing = inlineEditId === item.id;
                  const depth = itemDepth(items, item.id, 0);

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "group transition-colors duration-75",
                        isEditing && "bg-amber-50/90 dark:bg-amber-950/20",
                        !isEditing && isGroup && "cursor-pointer bg-zinc-50/80 dark:bg-zinc-800/60",
                        !isEditing && !isGroup && idx % 2 === 0 && "bg-white dark:bg-zinc-900/80",
                        !isEditing && !isGroup && idx % 2 !== 0 && "bg-zinc-50/30 dark:bg-zinc-800/30",
                        !isEditing && "hover:bg-blue-50/50 dark:hover:bg-blue-950/20",
                      )}
                      onClick={!isEditing && isGroup ? () => toggleRow(item.id) : undefined}
                      tabIndex={0}
                      onKeyDown={
                        !isEditing && isGroup
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleRow(item.id);
                              }
                            }
                          : undefined
                      }
                    >
                      {isEditing ? (
                        <EditRow
                          item={item}
                          planId={item.plan_id}
                          inlineAction={inlineAction}
                          inlinePending={isInlineSaving}
                          onCancel={() => setInlineEditId(null)}
                        />
                      ) : (
                        <ViewRow
                          item={item}
                          depth={depth}
                          isGroup={isGroup}
                          isExpanded={isExpanded}
                          onEdit={onEdit}
                          onShowForm={onShowForm}
                          onDelete={onDelete}
                          setInlineEditId={setInlineEditId}
                          inlineEditId={inlineEditId}
                          onOpenTab={onOpenTab}
                          contasSummary={contasSummary[item.id]}
                        />
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {/* Scroll edge shadows */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent dark:from-zinc-900/80" />
        <div className="pointer-events-none absolute left-14 top-0 bottom-0 w-8 bg-gradient-to-r from-white/80 to-transparent dark:from-zinc-900/80" />
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
        <div className="flex items-center gap-3">
          <span className="tabular-nums">
            {flatItems.length} {flatItems.length === 1 ? "item" : "itens"}
            {totalPages > 1 && ` · Página ${page + 1} de ${totalPages}`}
          </span>
          <button
            onClick={toggleExpandAll}
            className="text-[11px] text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            {allExpanded ? "Recolher tudo" : "Expandir tudo"}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setPage(0)} disabled={page === 0}>
            ««
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
            «
          </Button>
          <span className="px-2 tabular-nums">{page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
            »
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>
            »»
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function itemDepth(items: ActionItem[], targetId: string, currentDepth: number): number {
  for (const item of items) {
    if (item.id === targetId) return currentDepth;
    if (item.children && item.children.length > 0) {
      const found = itemDepth(item.children, targetId, currentDepth + 1);
      if (found >= 0) return found;
    }
  }
  return currentDepth;
}

function sortValue(key: SortKey, item: ActionItem): string | number {
  switch (key) {
    case "number": return item.number;
    case "action": return item.action || "";
    case "tipo_pa": return item.tipo_pa || "";
    case "prioridade": return item.prioridade || "";
    case "responsible": return item.responsible || "";
    case "why": return item.why || "";
    case "planned_end": return item.planned_end || "";
    case "where": return item.where || "";
    case "planned_start": return item.planned_start || "";
    case "cost": return parseFloat(item.cost || "0") || 0;
    case "status": return item.status;
    default: return "";
  }
}

function sortTree(items: ActionItem[], dir: "asc" | "desc", cmp: (item: ActionItem) => string | number) {
  items.sort((a, b) => {
    const va = cmp(a);
    const vb = cmp(b);
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });
  for (const item of items) {
    if (item.children && item.children.length > 0) {
      sortTree(item.children, dir, cmp);
    }
  }
}

export { PlanTable as default };

// ─── ViewRow ───────────────────────────────────────────────────────────────────

function ViewRow({
  item,
  depth,
  isGroup,
  isExpanded,
  onEdit,
  onShowForm,
  onDelete,
  setInlineEditId,
  inlineEditId,
  onOpenTab,
  contasSummary,
}: {
  item: ActionItem;
  depth: number;
  isGroup: boolean;
  isExpanded: boolean;
  onEdit: (i: ActionItem) => void;
  onShowForm: (s: boolean) => void;
  onDelete: (i: ActionItem) => void;
  setInlineEditId: (id: string | null) => void;
  inlineEditId: string | null;
  onOpenTab: (i: ActionItem, tab: "modelo" | "anexos" | "comentarios" | "historico") => void;
  contasSummary?: ItemContasSummary;
}) {
  const showFull = isExpanded && isGroup;
  return (
    <>
      <td className="sticky left-0 z-10 bg-inherit px-3 py-2.5 font-mono text-[11px] text-zinc-400 dark:text-zinc-500 align-top">
        <span className="inline-flex items-center gap-1.5" style={{ paddingLeft: `${Math.max(depth * 14, 0)}px` }}>
          {isGroup && (
            <span
              className={cn(
                "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm transition-colors",
                isExpanded
                  ? "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                  : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
              )}
            >
              <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isExpanded || "-rotate-90")} />
            </span>
          )}
          {!isGroup && depth > 0 && <span className="text-zinc-300 dark:text-zinc-600">└</span>}
          <span className={isGroup ? "font-semibold" : ""}>{item.number}</span>
        </span>
      </td>
      <td className="px-3 py-2.5 align-top min-w-[180px]">
        <div className="max-w-[240px]">
          <p
            className={cn(
              "truncate text-[13px] leading-snug",
              isGroup ? "font-semibold text-zinc-800 dark:text-zinc-200" : "text-zinc-700 dark:text-zinc-300",
            )}
            title={item.action}
          >
            {item.action}
          </p>
          {!isGroup && item.why && (
            <p className="mt-0.5 truncate text-[11px] text-zinc-400 dark:text-zinc-500" title={item.why}>{item.why}</p>
          )}
        </div>
      </td>
      <td className="px-2 py-2.5 align-top">
        {item.tipo_pa ? (
          <span className="inline-block max-w-[88px] truncate rounded bg-accent-50 px-1.5 py-0.5 text-[10px] font-medium text-accent-700 dark:bg-accent-950/30 dark:text-accent-300" title={item.tipo_pa}>
            {item.tipo_pa}
          </span>
        ) : <span className="text-[11px] text-zinc-300 dark:text-zinc-600">—</span>}
      </td>
      <td className="px-2 py-2.5 align-top">
        {item.prioridade ? (
          <span className={cn(
            "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
            item.prioridade === "Alta" && "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
            item.prioridade === "Media" && "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
            item.prioridade === "Baixa" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
          )}>
            {item.prioridade}
          </span>
        ) : <span className="text-[11px] text-zinc-300 dark:text-zinc-600">—</span>}
      </td>
      <td className="px-2 py-2.5 text-[12px] text-zinc-600 dark:text-zinc-300 align-top font-medium max-w-[120px] truncate" title={item.responsible || ""}>
        {item.responsible || "—"}
      </td>
      <td className="px-2 py-2.5 text-[12px] text-zinc-500 dark:text-zinc-400 align-top max-w-[120px] truncate" title={item.why || ""}>
        {item.why || "—"}
      </td>
      <td className="px-2 py-2.5 text-[12px] text-zinc-500 dark:text-zinc-400 align-top tabular-nums">
        {item.planned_end ? fmt(item.planned_end) : "—"}
      </td>
      <td className="px-2 py-2.5 text-[12px] text-zinc-500 dark:text-zinc-400 align-top max-w-[100px] truncate" title={item.where || ""}>
        {item.where || "—"}
      </td>
      <td className="px-2 py-2.5 text-[12px] text-zinc-500 dark:text-zinc-400 align-top tabular-nums">
        {item.planned_start ? fmt(item.planned_start) : "—"}
      </td>
      <td className="px-2 py-2.5 text-[12px] text-zinc-500 dark:text-zinc-400 align-top font-mono tabular-nums">
        <div className="flex flex-col gap-0.5">
          {((): React.ReactNode => {
            if (!item.cost) return "—";
            const n = Number(item.cost);
            return !isNaN(n) && n > 0 ? formatBRL(n) : item.cost;
          })()}
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
              title={`${contasSummary.count} conta(s) — em aberto: ${formatBRL(
                contasSummary.total_em_aberto,
              )} • pago: ${formatBRL(contasSummary.total_pago)}`}
            >
              <Receipt className="h-2.5 w-2.5" />
              {contasSummary.count} • {formatBRL(contasSummary.total_em_aberto)}
            </Link>
          )}
        </div>
      </td>
      <td className="px-1 sm:px-3 py-2.5 text-center align-top" onClick={(e) => e.stopPropagation()}>
        <StatusDot
          status={item.status}
          item={item}
          subItems={item.children}
          onClick={() => setInlineEditId(inlineEditId === item.id ? null : item.id)}
        />
      </td>
      <td className="sticky right-0 z-20 bg-inherit px-1 sm:px-2 py-2.5 text-right align-top" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
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
            <DropdownMenuItem onClick={() => { onEdit(item); onShowForm(true); }}>
              <Pencil className="h-4 w-4" />
              <span>Editar completo</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setInlineEditId(item.id)}>
              <Check className="h-4 w-4" />
              <span>Edição rápida</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(item)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30">
              <Trash2 className="h-4 w-4" />
              <span>Excluir</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </>
  );
}

// ─── EditRow (edição rápida de execução) ──────────────────────────────────────

function EditRow({
  item,
  inlineAction,
  inlinePending,
  onCancel,
}: {
  item: ActionItem;
  planId: string;
  inlineAction: (p: FormData) => void;
  inlinePending: boolean;
  onCancel: () => void;
}) {
  return (
    <>
      <td className="sticky left-0 z-10 bg-inherit px-3 py-2 font-mono text-[11px] text-zinc-400 align-middle">
        {item.number}
      </td>
      <td className="px-3 py-2 align-middle" colSpan={10}>
        <form action={inlineAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="itemId" value={item.id} />
          <span className="max-w-[160px] truncate text-[12px] font-medium text-zinc-700 dark:text-zinc-300" title={item.action}>
            {item.action}
          </span>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <label className="flex items-center gap-1 text-[11px] text-zinc-500">
            Início real
            <input
              type="date"
              name="actual_start"
              defaultValue={item.actual_start || ""}
              className="h-7 rounded border border-zinc-200 bg-white px-1.5 text-[11px] dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex items-center gap-1 text-[11px] text-zinc-500">
            Conclusão
            <input
              type="date"
              name="actual_end"
              defaultValue={item.actual_end || ""}
              className="h-7 rounded border border-zinc-200 bg-white px-1.5 text-[11px] dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex items-center gap-1 text-[11px] text-zinc-500">
            Resultado
            <input
              type="text"
              name="actual_result"
              defaultValue={item.actual_result || ""}
              placeholder="Resultado obtido..."
              className="h-7 w-36 rounded border border-zinc-200 bg-white px-1.5 text-[11px] dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <Button type="submit" size="sm" variant="outline" disabled={inlinePending} className="h-7 text-xs">
            <Check className="mr-1 h-3 w-3" />
            {inlinePending ? "Salvando..." : "Salvar"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">
            <X className="mr-1 h-3 w-3" />
            Cancelar
          </Button>
        </form>
      </td>
      <td className="sticky right-0 z-20 bg-inherit px-2 py-2 align-middle"></td>
    </>
  );
}
