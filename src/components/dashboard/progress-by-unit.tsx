"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Building2, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UnitProgress {
  id: string; name: string; totalActions: number; completed: number;
  inProgress: number; pending: number; progressPct: number; overdue: number;
}

type SortKey = "name" | "progress" | "total" | "overdue" | "completed";

const sortLabels: Record<SortKey, string> = {
  progress: "Progresso",
  name: "Nome",
  total: "Total",
  overdue: "Atrasadas",
  completed: "Concluídas",
};

export function ProgressByUnit({ units }: { units: UnitProgress[] }) {
  const [sort, setSort] = useState<SortKey>("progress");
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    const arr = [...units];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sort) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "progress": cmp = a.progressPct - b.progressPct; break;
        case "total": cmp = a.totalActions - b.totalActions; break;
        case "overdue": cmp = a.overdue - b.overdue; break;
        case "completed": cmp = a.completed - b.completed; break;
      }
      return asc ? cmp : -cmp;
    });
    return arr;
  }, [units, sort, asc]);

  if (units.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-zinc-500" /> Progresso por unidade</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8 text-center"><Building2 className="h-8 w-8 text-zinc-300 dark:text-zinc-600" /><p className="mt-2 text-sm text-zinc-500">Nenhuma unidade.</p></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-zinc-500" /> Progresso por unidade</CardTitle>
          <button onClick={() => setAsc(!asc)} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800" title={asc ? "Decrescente" : "Crescente"}>
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        </div>
        {/* Sort pills */}
        <div className="flex gap-1.5 mt-1.5 overflow-x-auto pb-0.5">
          {(["progress", "name", "total", "overdue", "completed"] as SortKey[]).map(key => (
            <button key={key} onClick={() => { if (sort === key) setAsc(!asc); else { setSort(key); setAsc(false); } }}
              className={cn(
                "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors whitespace-nowrap",
                sort === key ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              )}>
              {sortLabels[key]}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {sorted.map((t) => {
            const doneW = t.totalActions > 0 ? Math.round((t.completed / t.totalActions) * 100) : 0;
            const progW = t.totalActions > 0 ? Math.round((t.inProgress / t.totalActions) * 100 * 0.5) : 0;
            return (
              <Link key={t.id} href="/planos" className="block">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-700 hover:underline dark:text-zinc-300 truncate max-w-[65%]">{t.name}</span>
                  <span className="font-mono text-zinc-500">{t.progressPct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 flex">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.max(doneW, doneW > 0 ? 3 : 0)}%` }} />
                  <div className="h-full bg-blue-400 transition-all" style={{ width: `${Math.max(progW, progW > 0 ? 3 : 0)}%` }} />
                </div>
                <p className="mt-0.5 text-xs text-zinc-400">{t.completed}/{t.totalActions} concluídas · {t.inProgress} andamento · {t.overdue} atrasadas</p>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
