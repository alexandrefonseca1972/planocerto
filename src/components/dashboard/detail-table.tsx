"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DetailRow {
  id: string; name: string; totalActions: number; completed: number;
  inProgress: number; pending: number; progressPct: number; overdue: number;
}

type SortKey = "name" | "total" | "completed" | "inProgress" | "pending" | "overdue" | "progressPct";

const columns: { key: SortKey; label: string; align: string }[] = [
  { key: "name", label: "Unidade", align: "text-left" },
  { key: "total", label: "Total", align: "text-center" },
  { key: "completed", label: "Concluídas", align: "text-center" },
  { key: "inProgress", label: "Andamento", align: "text-center" },
  { key: "pending", label: "Pendentes", align: "text-center" },
  { key: "overdue", label: "Atrasadas", align: "text-center" },
  { key: "progressPct", label: "Progresso", align: "text-center" },
];

export function DetailTable({ units }: { units: DetailRow[] }) {
  const [sort, setSort] = useState<SortKey>("progressPct");
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    const arr = [...units];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sort) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "total": cmp = a.totalActions - b.totalActions; break;
        case "completed": cmp = a.completed - b.completed; break;
        case "inProgress": cmp = a.inProgress - b.inProgress; break;
        case "pending": cmp = a.pending - b.pending; break;
        case "overdue": cmp = a.overdue - b.overdue; break;
        case "progressPct": cmp = a.progressPct - b.progressPct; break;
      }
      return asc ? cmp : -cmp;
    });
    return arr;
  }, [units, sort, asc]);

  const globalTotal = units.reduce((s, u) => s + u.totalActions, 0);
  const globalCompleted = units.reduce((s, u) => s + u.completed, 0);
  const globalInProgress = units.reduce((s, u) => s + u.inProgress, 0);
  const globalPending = units.reduce((s, u) => s + u.pending, 0);
  const globalOverdue = units.reduce((s, u) => s + u.overdue, 0);
  const globalProgressPct = globalTotal > 0 ? Math.round(((globalCompleted + globalInProgress * 0.5) / globalTotal) * 100) : 0;

  const handleSort = (key: SortKey) => {
    if (sort === key) setAsc(!asc);
    else { setSort(key); setAsc(false); }
  };

  const SortArrow = ({ col }: { col: SortKey }) => {
    if (sort !== col) return null;
    return asc ? <ArrowUp className="h-3 w-3 inline ml-0.5" /> : <ArrowDown className="h-3 w-3 inline ml-0.5" />;
  };

  if (units.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4 text-zinc-500" /> Detalhamento por unidade</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                {columns.map(c => (
                  <th key={c.key} className={`${c.align} px-4 py-2.5`}>
                    <button onClick={() => handleSort(c.key)}
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wider transition-colors hover:text-zinc-900 dark:hover:text-zinc-200 inline-flex items-center gap-0.5",
                        sort === c.key ? "text-zinc-900 dark:text-zinc-200" : "text-zinc-500"
                      )}>
                      {c.label}
                      <SortArrow col={c.key} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {sorted.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-2.5">
                    <Link href="/planos" className="font-medium text-zinc-900 hover:underline dark:text-zinc-50 truncate max-w-[200px] block">{t.name}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-center font-mono text-xs text-zinc-600">{t.totalActions}</td>
                  <td className="px-4 py-2.5 text-center font-mono text-xs text-emerald-600">{t.completed}</td>
                  <td className="px-4 py-2.5 text-center font-mono text-xs text-blue-600">{t.inProgress}</td>
                  <td className="px-4 py-2.5 text-center font-mono text-xs text-amber-600">{t.pending}</td>
                  <td className="px-4 py-2.5 text-center font-mono text-xs text-red-600">{t.overdue}</td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge variant="outline" className={cn("text-xs font-mono", t.progressPct >= 80 ? "border-emerald-300 text-emerald-700 bg-emerald-50" : t.progressPct >= 50 ? "border-blue-300 text-blue-700 bg-blue-50" : "border-amber-300 text-amber-700 bg-amber-50")}>{t.progressPct}%</Badge>
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-zinc-200 bg-zinc-50/50 font-semibold dark:border-zinc-700 dark:bg-zinc-800/50">
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5 text-center font-mono text-xs">{globalTotal}</td>
                <td className="px-4 py-2.5 text-center font-mono text-xs">{globalCompleted}</td>
                <td className="px-4 py-2.5 text-center font-mono text-xs">{globalInProgress}</td>
                <td className="px-4 py-2.5 text-center font-mono text-xs">{globalPending}</td>
                <td className="px-4 py-2.5 text-center font-mono text-xs">{globalOverdue}</td>
                <td className="px-4 py-2.5 text-center font-mono text-xs">{globalProgressPct}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
