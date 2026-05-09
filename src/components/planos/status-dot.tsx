'use client';

import { cn } from "@/lib/utils";
import type { ActionItem } from "@/types/action-plan";
import { STATUS_FAROL } from "@/types/action-plan";

interface StatusDotProps {
  status: number;
  item?: ActionItem;
  onClick?: () => void;
}

// Map status to CSS colors (without bg- prefix for better styling)
const STATUS_COLORS: Record<number, string> = {
  1: "text-zinc-400", // Não Iniciada - Gray
  2: "text-amber-500", // Pendente - Yellow
  3: "text-red-500", // Em andamento (atraso) - Red
  4: "text-blue-500", // Em andamento - Blue
  5: "text-emerald-500", // Concluído - Green
};

const STATUS_BG_HOVER: Record<number, string> = {
  1: "hover:bg-zinc-100 dark:hover:bg-zinc-800",
  2: "hover:bg-amber-50 dark:hover:bg-amber-950/30",
  3: "hover:bg-red-50 dark:hover:bg-red-950/30",
  4: "hover:bg-blue-50 dark:hover:bg-blue-950/30",
  5: "hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
};

export function StatusDot({ status, item, onClick }: StatusDotProps) {
  const st = STATUS_FAROL[status] || STATUS_FAROL[1];
  const colorClass = STATUS_COLORS[status] || STATUS_COLORS[1];
  const hoverClass = STATUS_BG_HOVER[status] || STATUS_BG_HOVER[1];

  // Build tooltip text
  const tooltipText = item
    ? `Status: ${st.label}${item.responsible ? ` • Responsável: ${item.responsible}` : ""}${item.planned_end ? ` • Prazo: ${item.planned_end}` : ""}`
    : `Status: ${st.label}`;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors",
        hoverClass,
        "group relative"
      )}
      title={tooltipText}
    >
      {/* Bullet dot */}
      <div className={cn("h-2 w-2 rounded-full", colorClass)} />

      {/* Tooltip on hover */}
      <div className={cn(
        "invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50",
        "bg-zinc-900 dark:bg-zinc-950 text-white text-xs rounded px-2.5 py-1.5 whitespace-nowrap",
        "pointer-events-none"
      )}>
        {st.label}
        {item?.responsible && (
          <>
            <br />
            <span className="text-zinc-300">{item.responsible}</span>
          </>
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
