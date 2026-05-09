'use client';

import { cn } from "@/lib/utils";
import type { ActionItem } from "@/types/action-plan";
import { STATUS_FAROL } from "@/types/action-plan";

interface StatusBadgeProps {
  status: number;
  item?: ActionItem;
  children?: ActionItem[];
  onClick?: () => void;
}

// Map status to badge colors
const STATUS_BADGE_COLORS: Record<number, string> = {
  1: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  2: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  3: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
  4: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  5: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
};

const STATUS_BG_HOVER: Record<number, string> = {
  1: "hover:bg-zinc-200 dark:hover:bg-zinc-700",
  2: "hover:bg-amber-200 dark:hover:bg-amber-900/60",
  3: "hover:bg-red-200 dark:hover:bg-red-900/60",
  4: "hover:bg-blue-200 dark:hover:bg-blue-900/60",
  5: "hover:bg-emerald-200 dark:hover:bg-emerald-900/60",
};

export function StatusBadge({ status, item, children, onClick }: StatusBadgeProps) {
  const st = STATUS_FAROL[status] || STATUS_FAROL[1];
  const badgeColor = STATUS_BADGE_COLORS[status] || STATUS_BADGE_COLORS[1];
  const hoverClass = STATUS_BG_HOVER[status] || STATUS_BG_HOVER[1];

  // Calculate percentage completed (for groups with children)
  let percentage = 0;
  if (children && children.length > 0) {
    const completed = children.filter(c => c.status === 5).length;
    percentage = Math.round((completed / children.length) * 100);
  }

  // Build tooltip text
  const tooltipLines = [st.label];
  if (item?.responsible) {
    tooltipLines.push(`Responsável: ${item.responsible}`);
  }
  if (item?.planned_end) {
    tooltipLines.push(`Prazo: ${item.planned_end}`);
  }
  if (percentage > 0) {
    tooltipLines.push(`Conclusão: ${percentage}%`);
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
        badgeColor,
        hoverClass,
        "group relative cursor-pointer"
      )}
      title={tooltipLines.join(" • ")}
    >
      <span className="opacity-70">{st.label}</span>
      {percentage > 0 && <span className="font-semibold opacity-90">({percentage}%)</span>}

      {/* Tooltip on hover */}
      <div className={cn(
        "invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50",
        "bg-zinc-900 dark:bg-zinc-950 text-white text-xs rounded px-3 py-2 whitespace-nowrap",
        "pointer-events-none"
      )}>
        <div className="font-medium">{st.label}</div>
        {item?.responsible && (
          <div className="text-zinc-300 text-[11px]">Resp: {item.responsible}</div>
        )}
        {item?.planned_end && (
          <div className="text-zinc-300 text-[11px]">Prazo: {item.planned_end}</div>
        )}
        {percentage > 0 && (
          <div className="text-zinc-300 text-[11px] mt-1 font-semibold">
            Conclusão: {percentage}%
          </div>
        )}
      </div>

      {/* Tooltip arrow */}
      <div className={cn(
        "invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 z-50",
        "w-1.5 h-1.5 bg-zinc-900 dark:bg-zinc-950 rotate-45",
        "pointer-events-none",
        "mb-0.5"
      )} />
    </button>
  );
}
