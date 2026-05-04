"use client";

import { cn } from "@/lib/utils";

interface RingSegment { value: number; color: string; label: string; }

// ─── Modern Donut Chart (gap between segments, gradient) ───
export function DonutChart({ segments, size = 140, className }: {
  segments: RingSegment[]; size?: number; className?: string;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const strokeW = 14;
  const gap = 3;
  const radius = (size - strokeW) / 2;
  const circ = 2 * Math.PI * radius;
  const center = size / 2;

  const completed = segments.find(s => s.label === "Concluído")?.value || 0;
  const pct = Math.round((completed / total) * 100);

  const arcs: { length: number; offset: number; color: string }[] = [];
  const totalGap = segments.filter(s => s.value > 0).length * gap;
  const usable = circ - totalGap;
  let cumulative = 0;
  for (const seg of segments) {
    if (seg.value === 0) continue;
    const len = (seg.value / total) * usable;
    arcs.push({ length: len, offset: cumulative, color: seg.color });
    cumulative += len + gap;
  }

  const gradients = {
    "#10b981": ["#10b981", "#059669"],
    "#3b82f6": ["#3b82f6", "#1d4ed8"],
    "#f59e0b": ["#f59e0b", "#d97706"],
    "#ef4444": ["#ef4444", "#dc2626"],
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {arcs.map((arc, i) => {
          const gradId = `g-${i}-${arc.color.replace("#", "")}`;
          const [from, to] = gradients[arc.color as keyof typeof gradients] || [arc.color, arc.color];
          return (
            <g key={i}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={from} />
                  <stop offset="100%" stopColor={to} />
                </linearGradient>
              </defs>
              <circle cx={center} cy={center} r={radius} fill="none"
                stroke={`url(#${gradId})`} strokeWidth={strokeW}
                strokeDasharray={`${arc.length} ${circ - arc.length}`}
                strokeDashoffset={-arc.offset} strokeLinecap="round"
                className="transition-all duration-700" />
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{pct}%</span>
        <span className="text-[10px] text-zinc-400">concluído</span>
      </div>
    </div>
  );
}

// ─── Semi‑circular Progress Gauge ───
export function ProgressGauge({ completed, total, size = 140, className }: {
  completed: number; total: number; size?: number; className?: string;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const strokeW = 14;
  const radius = (size - strokeW) / 2;
  const circ = Math.PI * radius;
  const center = size / 2;
  const filled = (pct / 100) * circ;

  const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#3b82f6" : pct >= 25 ? "#f59e0b" : "#ef4444";

  // Tick marks
  const ticks = [0, 25, 50, 75, 100];
  const tickR = radius - 8;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size * 0.7 }}>
      <svg width={size} height={size} className="overflow-visible" viewBox={`0 0 ${size} ${size}`}>
        {/* Background arc */}
        <path d={`M ${strokeW/2 + 4} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeW/2 - 4} ${center}`}
          fill="none" stroke="#e4e4e7" strokeWidth={strokeW} strokeLinecap="round" className="dark:stroke-zinc-700" />
        {/* Filled arc */}
        {pct > 0 && (
          <path d={`M ${strokeW/2 + 4} ${center} A ${radius} ${radius} 0 ${pct > 50 ? 1 : 0} 1 ${strokeW/2 + 4 + (size - strokeW - 8) * (pct / 100)} ${center - radius + (radius * 2) * (pct > 50 ? 1 - (pct-50)/50 : 1) * (pct/100)}`}
            fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round"
            className="transition-all duration-700" style={{ strokeDasharray: `${filled} ${circ - filled}`, strokeDashoffset: 0 }} />
        )}
        {/* Tick marks */}
        {ticks.map(t => {
          const angle = (t / 100) * Math.PI;
          const x1 = center + Math.cos(Math.PI - angle) * tickR;
          const y1 = center - Math.sin(Math.PI - angle) * tickR;
          const x2 = center + Math.cos(Math.PI - angle) * (tickR - 6);
          const y2 = center - Math.sin(Math.PI - angle) * (tickR - 6);
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d4d4d8" strokeWidth="1" className="dark:stroke-zinc-600" />;
        })}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center" style={{ top: "40%" }}>
        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{pct}%</span>
        <span className="text-[10px] text-zinc-400">concluído</span>
      </div>
    </div>
  );
}

// ─── Horizontal Stacked Bar (with inline labels) ───
export function StackedBar({ segments, total, className }: {
  segments: { value: number; color: string; label: string }[]; total: number; className?: string;
}) {
  const t = total || 1;
  const nonZero = segments.filter(s => s.value > 0);
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex h-6 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        {nonZero.map((s, i) => (
          <div key={i} className="h-full transition-all duration-500 flex items-center justify-center min-w-0"
            style={{ width: `${(s.value / t) * 100}%`, backgroundColor: s.color }}>
            {s.value / t > 0.08 && <span className="text-[9px] font-semibold text-white truncate px-1">{s.value}</span>}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{s.label} <strong className="text-zinc-700 dark:text-zinc-300">{s.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Simple Bar Chart ───
export function BarChart({ data, className }: {
  data: { label: string; value: number; color: string; maxValue?: number }[];
  className?: string;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className={cn("space-y-2", className)}>
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{d.label}</span>
          <div className="flex-1 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700 flex items-center justify-end pr-1.5")}
              style={{ width: `${Math.round((d.value / max) * 100)}%`, backgroundColor: d.color }}
            >
              <span className="text-[10px] font-semibold text-white">{d.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
