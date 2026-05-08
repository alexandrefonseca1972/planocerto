"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Target,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Clock,
  Pause,
  AlertTriangle,
  ListTodo,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailRow {
  id: string;
  name: string;
  totalActions: number;
  completed: number;
  inProgress: number;
  pending: number;
  progressPct: number;
  overdue: number;
}

type SortKey =
  | "name"
  | "total"
  | "completed"
  | "inProgress"
  | "pending"
  | "overdue"
  | "progressPct";

const columns: { key: SortKey; label: string; icon?: React.ReactNode; align: string }[] = [
  { key: "name", label: "Unidade", align: "text-left" },
  { key: "total", label: "Total", icon: <ListTodo className="h-3 w-3" />, align: "text-right" },
  { key: "completed", label: "Concluídas", icon: <CheckCircle2 className="h-3 w-3 text-emerald-500" />, align: "text-right" },
  { key: "inProgress", label: "Andamento", icon: <Clock className="h-3 w-3 text-blue-500" />, align: "text-right" },
  { key: "pending", label: "Pendentes", icon: <Pause className="h-3 w-3 text-amber-500" />, align: "text-right" },
  { key: "overdue", label: "Atrasadas", icon: <AlertTriangle className="h-3 w-3 text-red-500" />, align: "text-right" },
  { key: "progressPct", label: "Distribuição & Progresso", align: "text-left" },
];

export function DetailTable({ units }: { units: DetailRow[] }) {
  const [sort, setSort] = useState<SortKey>("progressPct");
  const [asc, setAsc] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return units;
    return units.filter((u) => u.name.toLowerCase().includes(q));
  }, [units, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sort) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "total":
          cmp = a.totalActions - b.totalActions;
          break;
        case "completed":
          cmp = a.completed - b.completed;
          break;
        case "inProgress":
          cmp = a.inProgress - b.inProgress;
          break;
        case "pending":
          cmp = a.pending - b.pending;
          break;
        case "overdue":
          cmp = a.overdue - b.overdue;
          break;
        case "progressPct":
          cmp = a.progressPct - b.progressPct;
          break;
      }
      return asc ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sort, asc]);

  const totals = useMemo(() => {
    const t = { total: 0, completed: 0, progress: 0, pending: 0, overdue: 0 };
    for (const u of units) {
      t.total += u.totalActions;
      t.completed += u.completed;
      t.progress += u.inProgress;
      t.pending += u.pending;
      t.overdue += u.overdue;
    }
    return t;
  }, [units]);

  const globalProgressPct =
    totals.total > 0
      ? Math.round(((totals.completed + totals.progress * 0.5) / totals.total) * 100)
      : 0;

  // Estatísticas gerenciais
  const avgProgress =
    units.length > 0
      ? Math.round(units.reduce((s, u) => s + u.progressPct, 0) / units.length)
      : 0;
  const top = useMemo(() => {
    return [...units].sort((a, b) => b.progressPct - a.progressPct)[0];
  }, [units]);
  const worst = useMemo(() => {
    return [...units]
      .filter((u) => u.totalActions > 0)
      .sort((a, b) => a.progressPct - b.progressPct)[0];
  }, [units]);

  function handleSort(key: SortKey) {
    if (sort === key) setAsc(!asc);
    else {
      setSort(key);
      setAsc(false);
    }
  }

  function SortArrow({ col }: { col: SortKey }) {
    if (sort !== col)
      return <ArrowUpDown className="ml-0.5 inline h-3 w-3 text-zinc-300" />;
    return asc ? (
      <ArrowUp className="ml-0.5 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-0.5 inline h-3 w-3" />
    );
  }

  if (units.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-zinc-100 bg-gradient-to-r from-brand-50/50 via-transparent to-accent-50/30 pb-3 dark:border-zinc-800 dark:from-brand-950/20 dark:to-accent-950/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-50 text-accent-700 dark:bg-accent-950/30 dark:text-accent-300">
              <Target className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-base">Detalhamento por unidade</CardTitle>
              <p className="text-[11px] text-zinc-500">
                {units.length} {units.length === 1 ? "unidade" : "unidades"} ·{" "}
                {totals.total.toLocaleString("pt-BR")} ações no total
              </p>
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar unidade..."
              className="h-8 w-56 pl-8 text-xs"
            />
          </div>
        </div>

        {/* Insights gerenciais */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Insight
            label="Progresso médio"
            value={`${avgProgress}%`}
            color="text-accent-700 dark:text-accent-300"
            bg="bg-accent-50 dark:bg-accent-950/30"
          />
          <Insight
            label="Total atrasadas"
            value={totals.overdue.toLocaleString("pt-BR")}
            color="text-red-700 dark:text-red-400"
            bg="bg-red-50 dark:bg-red-950/30"
          />
          {top && (
            <Insight
              label="Melhor desempenho"
              value={top.name}
              sub={`${top.progressPct}%`}
              icon={<TrendingUp className="h-3 w-3" />}
              color="text-emerald-700 dark:text-emerald-400"
              bg="bg-emerald-50 dark:bg-emerald-950/30"
            />
          )}
          {worst && (
            <Insight
              label="Necessita atenção"
              value={worst.name}
              sub={`${worst.progressPct}%`}
              icon={<TrendingDown className="h-3 w-3" />}
              color="text-amber-700 dark:text-amber-400"
              bg="bg-amber-50 dark:bg-amber-950/30"
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-50 backdrop-blur-sm dark:bg-zinc-800/80">
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                {columns.map((c) => (
                  <th key={c.key} className={`${c.align} px-3 py-2.5`}>
                    <button
                      onClick={() => handleSort(c.key)}
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors hover:text-zinc-900 dark:hover:text-zinc-100",
                        sort === c.key
                          ? "text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-500",
                      )}
                    >
                      {c.icon}
                      {c.label}
                      <SortArrow col={c.key} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-xs italic text-zinc-400"
                  >
                    Nenhuma unidade encontrada com a busca.
                  </td>
                </tr>
              ) : (
                sorted.map((t) => (
                  <UnitRow key={t.id} row={t} maxTotal={totals.total} />
                ))
              )}
            </tbody>
            {sorted.length > 0 && (
              <tfoot className="sticky bottom-0 border-t-2 border-zinc-200 bg-zinc-50 font-semibold dark:border-zinc-700 dark:bg-zinc-800/80">
                <tr>
                  <td className="px-3 py-2.5 text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
                    Total geral
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-50">
                    {totals.total.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                    {totals.completed.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-blue-700 dark:text-blue-400">
                    {totals.progress.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-amber-700 dark:text-amber-400">
                    {totals.pending.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-red-700 dark:text-red-400">
                    {totals.overdue.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-3 py-2.5">
                    <ProgressBar
                      completed={totals.completed}
                      progress={totals.progress}
                      pending={totals.pending}
                      overdue={totals.overdue}
                      total={totals.total}
                      pct={globalProgressPct}
                    />
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function UnitRow({ row, maxTotal }: { row: DetailRow; maxTotal: number }) {
  const ratio = maxTotal > 0 ? (row.totalActions / maxTotal) * 100 : 0;
  return (
    <tr className="group transition-colors hover:bg-accent-50/30 dark:hover:bg-accent-950/20">
      <td className="px-3 py-2.5">
        <Link
          href="/planos"
          className="block max-w-[200px] truncate text-[13px] font-semibold text-zinc-900 transition-colors group-hover:text-accent-700 dark:text-zinc-50 dark:group-hover:text-accent-300"
          title={row.name}
        >
          {row.name}
        </Link>
      </td>
      <td className="px-3 py-2.5 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <span className="font-mono text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
            {row.totalActions}
          </span>
          <span
            className="h-1 w-8 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
            title={`${Math.round(ratio)}% do volume`}
          >
            <span
              className="block h-full bg-zinc-400 dark:bg-zinc-500"
              style={{ width: `${ratio}%` }}
            />
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
        {row.completed}
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-blue-600 dark:text-blue-400">
        {row.inProgress}
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-amber-600 dark:text-amber-400">
        {row.pending}
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-red-600 dark:text-red-400">
        {row.overdue}
      </td>
      <td className="px-3 py-2.5">
        <ProgressBar
          completed={row.completed}
          progress={row.inProgress}
          pending={row.pending}
          overdue={row.overdue}
          total={row.totalActions}
          pct={row.progressPct}
        />
      </td>
    </tr>
  );
}

function ProgressBar({
  completed,
  progress,
  pending,
  overdue,
  total,
  pct,
}: {
  completed: number;
  progress: number;
  pending: number;
  overdue: number;
  total: number;
  pct: number;
}) {
  const part = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  const tone =
    pct >= 70
      ? "text-emerald-700 dark:text-emerald-400"
      : pct >= 40
      ? "text-blue-700 dark:text-blue-400"
      : pct >= 15
      ? "text-amber-700 dark:text-amber-400"
      : "text-red-700 dark:text-red-400";
  return (
    <div className="flex min-w-[180px] items-center gap-2">
      <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        {completed > 0 && (
          <span
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${part(completed)}%` }}
          />
        )}
        {progress > 0 && (
          <span
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${part(progress)}%` }}
          />
        )}
        {pending > 0 && (
          <span
            className="h-full bg-amber-500 transition-all"
            style={{ width: `${part(pending)}%` }}
          />
        )}
        {overdue > 0 && (
          <span
            className="h-full bg-red-500 transition-all"
            style={{ width: `${part(overdue)}%` }}
          />
        )}
      </div>
      <span className={cn("w-9 shrink-0 text-right font-mono text-xs tabular-nums", tone)}>
        {pct}%
      </span>
    </div>
  );
}

function Insight({
  label,
  value,
  sub,
  icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-zinc-200/60 bg-white/60 px-2.5 py-2 backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-900/40",
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 truncate text-sm font-bold",
            color,
          )}
          title={value}
        >
          {icon}
          {value}
        </span>
        {sub && (
          <span className={cn("text-[10px] font-semibold tabular-nums", color)}>
            {sub}
          </span>
        )}
      </div>
      <span className={cn("absolute inset-0 -z-10 rounded-md", bg)} aria-hidden />
    </div>
  );
}
