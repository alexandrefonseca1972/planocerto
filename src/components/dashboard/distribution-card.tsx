"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DonutChart, ProgressGauge, BarChart } from "@/components/ui/chart";
import {
  Activity,
  CheckCircle2,
  TrendingUp,
  Pause,
  AlertTriangle,
  PieChart,
  Gauge,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SegData {
  value: number;
  color: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Tailwind classes for hover row tint. */
  tint: string;
}

type ViewMode = "donut" | "gauge" | "bar";

const VIEW_OPTIONS: { value: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "donut", label: "Rosca", icon: PieChart },
  { value: "gauge", label: "Medidor", icon: Gauge },
  { value: "bar", label: "Barras", icon: BarChart3 },
];

export function DistributionCard({
  completed,
  progress,
  pending,
  overdue,
  total,
  sparkline,
}: {
  completed: number;
  progress: number;
  pending: number;
  overdue: number;
  total: number;
  sparkline?: React.ReactNode;
}) {
  const [view, setView] = useState<ViewMode>("donut");

  const segments: SegData[] = useMemo(
    () => [
      {
        value: completed,
        color: "#10b981",
        label: "Concluído",
        icon: CheckCircle2,
        tint: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
      },
      {
        value: progress,
        color: "#3b82f6",
        label: "Em andamento",
        icon: TrendingUp,
        tint: "hover:bg-blue-50 dark:hover:bg-blue-950/30",
      },
      {
        value: pending,
        color: "#f59e0b",
        label: "Pendente",
        icon: Pause,
        tint: "hover:bg-amber-50 dark:hover:bg-amber-950/30",
      },
      {
        value: overdue,
        color: "#ef4444",
        label: "Atrasado",
        icon: AlertTriangle,
        tint: "hover:bg-red-50 dark:hover:bg-red-950/30",
      },
    ],
    [completed, progress, pending, overdue],
  );

  const onTrackPct = total > 0 ? Math.round(((completed + progress) / total) * 100) : 0;
  const overduePct = total > 0 ? Math.round((overdue / total) * 100) : 0;
  const healthLabel =
    overduePct >= 30
      ? { txt: "Crítico", color: "bg-red-500", text: "text-red-700 dark:text-red-400" }
      : overduePct >= 15
      ? { txt: "Atenção", color: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" }
      : onTrackPct >= 70
      ? { txt: "Saudável", color: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" }
      : { txt: "Em ritmo", color: "bg-accent-500", text: "text-accent-700 dark:text-accent-300" };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-50 text-accent-700 dark:bg-accent-950/30 dark:text-accent-300">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Distribuição
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {total.toLocaleString("pt-BR")}{" "}
                {total === 1 ? "ação" : "ações"} no total
              </p>
            </div>
          </div>
          <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800/40">
            {VIEW_OPTIONS.map((v) => {
              const active = view === v.value;
              return (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setView(v.value)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                    active
                      ? "bg-white text-brand-700 shadow-sm dark:bg-zinc-700 dark:text-accent-300"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
                  )}
                  aria-pressed={active}
                >
                  <v.icon className="h-3 w-3" />
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
            <p className="mt-2 text-xs text-zinc-500">Sem ações nas unidades selecionadas.</p>
          </div>
        ) : (
          <>
            {view === "donut" && (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
                <DonutChart segments={segments} size={150} />
                <div className="flex-1 space-y-1.5 self-center">
                  {segments.map((s) => (
                    <LegendRow key={s.label} segment={s} total={total} />
                  ))}
                </div>
              </div>
            )}

            {view === "gauge" && (
              <div className="flex flex-col items-center gap-4">
                <ProgressGauge completed={completed} total={total} size={180} />
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                  {segments.map((s) => (
                    <MiniStat key={s.label} segment={s} total={total} />
                  ))}
                </div>
              </div>
            )}

            {view === "bar" && (
              <div className="space-y-3">
                <BarChart
                  data={segments.map((s) => ({
                    label: s.label,
                    value: s.value,
                    color: s.color,
                  }))}
                />
              </div>
            )}

            {/* Footer com indicador de saúde */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-2 w-2 rounded-full",
                    healthLabel.color,
                  )}
                />
                <span className="text-[11px] text-zinc-500">Saúde geral</span>
                <span className={cn("text-xs font-semibold", healthLabel.text)}>
                  {healthLabel.txt}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-zinc-500">
                  No prazo:{" "}
                  <strong className="text-zinc-900 tabular-nums dark:text-zinc-50">
                    {onTrackPct}%
                  </strong>
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span className="text-zinc-500">
                  Atraso:{" "}
                  <strong className="tabular-nums text-red-600 dark:text-red-400">
                    {overduePct}%
                  </strong>
                </span>
              </div>
            </div>
          </>
        )}
        {sparkline}
      </CardContent>
    </Card>
  );
}

function LegendRow({ segment, total }: { segment: SegData; total: number }) {
  const Icon = segment.icon;
  const pct = total > 0 ? (segment.value / total) * 100 : 0;
  const pctRound = Math.round(pct);
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors",
        segment.tint,
      )}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: segment.color + "20", color: segment.color }}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {segment.label}
          </span>
          <span className="text-[11px] tabular-nums">
            <strong className="text-zinc-900 dark:text-zinc-50">
              {segment.value.toLocaleString("pt-BR")}
            </strong>
            <span className="ml-1 text-zinc-400">({pctRound}%)</span>
          </span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: segment.color,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ segment, total }: { segment: SegData; total: number }) {
  const Icon = segment.icon;
  const pct = total > 0 ? Math.round((segment.value / total) * 100) : 0;
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-1.5">
        <span style={{ color: segment.color }} className="inline-flex">
          <Icon className="h-3 w-3" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {segment.label}
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-base font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {segment.value.toLocaleString("pt-BR")}
        </span>
        <span className="text-[10px] tabular-nums text-zinc-400">{pct}%</span>
      </div>
    </div>
  );
}
