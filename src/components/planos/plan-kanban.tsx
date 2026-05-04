"use client";

import type { ActionItem } from "@/types/action-plan";
import { cn } from "@/lib/utils";
import { flattenWithStatus, fmt } from "@/components/planos/plan-utils";
import { UserCircle } from "lucide-react";

const columns = [
  { status: 1, label: "Não Iniciada", color: "border-zinc-300 dark:border-zinc-600", bg: "bg-zinc-50/50 dark:bg-zinc-800/20", dot: "bg-zinc-400" },
  { status: 2, label: "Pendente", color: "border-amber-300 dark:border-amber-700", bg: "bg-amber-50/30 dark:bg-amber-950/20", dot: "bg-amber-400" },
  { status: 4, label: "Em andamento", color: "border-blue-300 dark:border-blue-700", bg: "bg-blue-50/30 dark:bg-blue-950/20", dot: "bg-blue-400" },
  { status: 3, label: "Em andamento (atraso)", color: "border-red-300 dark:border-red-700", bg: "bg-red-50/30 dark:bg-red-950/20", dot: "bg-red-500" },
  { status: 5, label: "Concluído", color: "border-emerald-300 dark:border-emerald-700", bg: "bg-emerald-50/30 dark:bg-emerald-950/20", dot: "bg-emerald-400" },
];

export function KanbanBoard({ items, onEdit, onShowForm }: {
  items: ActionItem[]; onEdit: (i: ActionItem) => void; onShowForm: (s: boolean) => void;
}) {
  const allItems = flattenWithStatus(items).filter(i => !i.children?.length);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {columns.map((col) => {
        const colItems = allItems.filter(i => i.status === col.status);
        return (
          <div key={col.status} className={cn("rounded-xl border-2", col.color, col.bg)}>
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-200/50 dark:border-zinc-700/50">
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", col.dot)} />
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{col.label}</span>
              </div>
              <span className="text-xs font-mono text-zinc-400">{colItems.length}</span>
            </div>
            <div className="space-y-2 p-2 min-h-[120px]">
              {colItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { onEdit(item); onShowForm(true); }}
                  className="w-full rounded-lg border border-zinc-200/60 bg-white p-2.5 text-left shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:border-zinc-700/60 dark:bg-zinc-900 dark:hover:border-zinc-600"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 font-mono text-[10px] text-zinc-400">{item.number}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 leading-snug line-clamp-2">{item.action}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-400">
                        {item.responsible && <span className="flex items-center gap-1"><UserCircle className="h-3 w-3" />{item.responsible}</span>}
                        {item.planned_end && <span>{fmt(item.planned_end)}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {colItems.length === 0 && (
                <p className="py-6 text-center text-xs text-zinc-400">Nenhuma ação</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
