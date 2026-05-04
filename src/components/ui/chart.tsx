import { cn } from "@/lib/utils";

interface RingSegment { value: number; color: string; label: string; }

export function RingChart({ segments, size = 120, strokeWidth = 10, className }: {
  segments: RingSegment[]; size?: number; strokeWidth?: number; className?: string;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const arcs: { length: number; offset: number; color: string; value: number }[] = [];
  let cumulative = 0;
  for (const seg of segments) {
    const length = (seg.value / total) * circumference;
    arcs.push({ ...seg, length, offset: cumulative });
    cumulative += length;
  }

  const completed = segments.find(s => s.color.includes("emerald"))?.value || 0;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={center} cy={center} r={radius}
            fill="none" stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arc.length} ${circumference - arc.length}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {Math.round((completed / total) * 100)}%
        </span>
        <span className="text-[10px] text-zinc-400">concluído</span>
      </div>
    </div>
  );
}

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
              className={cn("h-full rounded-full transition-all duration-700 flex items-center justify-end pr-1.5", d.color)}
              style={{ width: `${Math.round((d.value / max) * 100)}%` }}
            >
              <span className="text-[10px] font-semibold text-white">{d.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
