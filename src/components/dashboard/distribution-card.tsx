"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutChart, ProgressGauge, BarChart } from "@/components/ui/chart";
import { Activity } from "lucide-react";

interface SegData { value: number; color: string; label: string; }

export function DistributionCard({ completed, progress, pending, overdue, total, sparkline }: {
  completed: number; progress: number; pending: number; overdue: number; total: number;
  sparkline?: React.ReactNode;
}) {
  const [view, setView] = useState<"donut" | "gauge" | "bar">("donut");

  const segments: SegData[] = [
    { value: completed, color: "#10b981", label: "Concluído" },
    { value: progress, color: "#3b82f6", label: "Andamento" },
    { value: pending, color: "#f59e0b", label: "Pendente" },
    { value: overdue, color: "#ef4444", label: "Atrasado" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="h-4 w-4 text-zinc-500" /> Distribuição
          </CardTitle>
          <div className="flex rounded-md bg-zinc-100 p-0.5 dark:bg-zinc-800">
            {(["donut", "gauge", "bar"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  view === v ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}>
                {{ donut: "Rosca", gauge: "Medidor", bar: "Barras" }[v]}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {view === "donut" ? (
          <div className="flex items-center gap-6">
            <DonutChart segments={segments} size={130} />
            <Legend segments={segments} total={total} />
          </div>
        ) : view === "gauge" ? (
          <div className="flex flex-col items-center gap-3">
            <ProgressGauge completed={completed} total={total} size={150} />
          </div>
        ) : (
          <div className="space-y-2">
            <BarChart data={segments.map(s => ({ label: s.label, value: s.value, color: s.color }))} />
            <LegendCompact segments={segments} total={total} />
          </div>
        )}
        {sparkline}
      </CardContent>
    </Card>
  );
}

function Legend({ segments, total }: { segments: SegData[]; total: number }) {
  return (
    <div className="flex-1 space-y-1.5">
      {segments.map(s => (
        <div key={s.label} className="flex items-center gap-2 text-xs">
          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
          <span className="text-zinc-600 dark:text-zinc-400">{s.label}</span>
          <span className="ml-auto font-mono font-semibold text-zinc-900 dark:text-zinc-50">{s.value}</span>
          {total > 0 && <span className="text-zinc-400">({Math.round((s.value / total) * 100)}%)</span>}
        </div>
      ))}
    </div>
  );
}

function LegendCompact({ segments, total }: { segments: SegData[]; total: number }) {
  return (
    <div className="flex flex-wrap gap-3 pt-1">
      {segments.map(s => (
        <div key={s.label} className="flex items-center gap-1.5 text-[11px]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
          <span className="text-zinc-500">{s.label} <strong className="text-zinc-700 dark:text-zinc-300">{s.value}</strong>
            {total > 0 && <span className="text-zinc-400"> ({Math.round((s.value / total) * 100)}%)</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
