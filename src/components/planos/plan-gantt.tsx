"use client";

import { useMemo, useState } from "react";
import type { ActionItem } from "@/types/action-plan";
import { flattenItems } from "@/components/planos/plan-utils";

type Zoom = "month" | "quarter" | "year";

const statusColors: Record<number, string> = {
  1: "#a1a1aa",
  2: "#f59e0b",
  3: "#ef4444",
  4: "#3b82f6",
  5: "#10b981",
};

function getBarColor(item: { status: number; planned_start?: string; planned_end?: string }): string {
  if (item.status === 5) return "#10b981";
  if (item.planned_end && new Date(item.planned_end) < new Date() && item.status !== 5) return "#ef4444";
  return statusColors[item.status] || "#a1a1aa";
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

export function GanttChart({ items }: { items: ActionItem[] }) {
  const [zoom, setZoom] = useState<Zoom>("month");

  const chartData = useMemo(() => {
    const flat = flattenItems(items);
    const withDates = flat.filter((i: ActionItem) => i.planned_start || i.planned_end);
    let min = new Date("2099-01-01");
    let max = new Date("2000-01-01");
    for (const item of flat) {
      if (item.planned_start) { const d = new Date(item.planned_start); if (d < min) min = d; if (d > max) max = d; }
      if (item.planned_end) { const d = new Date(item.planned_end); if (d < min) min = d; if (d > max) max = d; }
    }
    if (withDates.length === 0) { min = new Date(); max = new Date(); max.setMonth(max.getMonth() + 1); }
    const padding = zoom === "month" ? 7 : zoom === "quarter" ? 30 : 90;
    const startDate = new Date(min); startDate.setDate(startDate.getDate() - padding);
    const endDate = new Date(max); endDate.setDate(endDate.getDate() + padding);
    const totalDays = daysBetween(startDate, endDate);

    const monthMarkers: { label: string; x: number }[] = [];
    const steps = zoom === "month" ? 1 : zoom === "quarter" ? 3 : 12;
    for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + steps)) {
      monthMarkers.push({ label: formatMonthYear(d), x: (daysBetween(startDate, d) / totalDays) * 100 });
    }

    return { flat, startDate, endDate, totalDays, monthMarkers };
  }, [items, zoom]);

  const { flat, startDate, totalDays, monthMarkers } = chartData;

  const today = new Date();
  const todayOffset = daysBetween(startDate, today);
  const showToday = todayOffset >= 0 && todayOffset <= totalDays;

  const rowH = 26;
  const labelW = 280;
  const chartW = 600;
  const totalH = flat.length * rowH + 40;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-zinc-500">Zoom:</span>
        {(["month", "quarter", "year"] as Zoom[]).map(z => (
          <button key={z} onClick={() => setZoom(z)} className={`rounded px-2 py-0.5 text-xs border transition-colors ${zoom === z ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-50 dark:text-zinc-900" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"}`}>
            {{ month: "Mês", quarter: "Trimestre", year: "Ano" }[z]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <svg viewBox={`0 0 ${labelW + chartW} ${totalH}`} className="w-full min-w-[800px]" style={{ maxHeight: "70vh" }}>
          {/* Month markers */}
          <line x1={labelW} y1={0} x2={labelW} y2={totalH} stroke="#e4e4e7" strokeWidth={1} />
          {monthMarkers.map((m, i) => (
            <g key={i}>
              <line x1={labelW + (m.x / 100) * chartW} y1={0} x2={labelW + (m.x / 100) * chartW} y2={totalH} stroke="#f4f4f5" strokeWidth={0.5} />
              <text x={labelW + (m.x / 100) * chartW + 3} y={12} fontSize={9} fill="#a1a1aa">{m.label}</text>
            </g>
          ))}

          {/* Today line */}
          {showToday && (
            <line x1={labelW + (todayOffset / totalDays) * chartW} y1={0} x2={labelW + (todayOffset / totalDays) * chartW} y2={totalH}
              stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" />
          )}

          {/* Items */}
          {flat.map((item, idx) => {
            const y = 22 + idx * rowH;
            const hasDates = item.planned_start || item.planned_end;
            if (!hasDates) {
              return (
                <g key={item.id}>
                  <text x={4 + ((item as ActionItem & { depth?: number }).depth ?? 0) * 16} y={y + 16} fontSize={11} fill="#a1a1aa" fontFamily="monospace" className="select-none">
                    {item.number} {item.action.slice(0, 50)}{item.action.length > 50 ? "…" : ""}
                  </text>
                </g>
              );
            }

            const barStart = item.planned_start ? new Date(item.planned_start) : startDate;
            const barEnd = item.planned_end ? new Date(item.planned_end) : new Date(barStart.getTime() + 86400000);
            const x1 = (daysBetween(startDate, barStart) / totalDays) * chartW;
            const x2 = (daysBetween(startDate, barEnd) / totalDays) * chartW;
            const barW = Math.max(x2 - x1, 4);
            const color = getBarColor({ status: item.status, planned_start: item.planned_start ?? undefined, planned_end: item.planned_end ?? undefined });
            const depth = (item as ActionItem & { depth?: number }).depth ?? 0;

            return (
              <g key={item.id}>
                <text x={4 + depth * 16} y={y + 12} fontSize={10} fill="#71717a" fontFamily="monospace" className="select-none">
                  {item.number}
                </text>
                <rect x={labelW + x1} y={y + 4} width={barW} height={16} rx={3} fill={color} opacity={0.8} />
                <text x={labelW + x1 + barW + 4} y={y + 16} fontSize={10} fill="#3f3f46" className="select-none">
                  {item.action.slice(0, 40)}{item.action.length > 40 ? "…" : ""}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center gap-4 text-xs text-zinc-500 flex-wrap">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Concluído</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Em andamento</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Pendente</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Atrasado</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-zinc-400" /> Não iniciado</span>
      </div>
    </div>
  );
}
