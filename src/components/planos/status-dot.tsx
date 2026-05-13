'use client';

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import type { ActionItem } from "@/types/action-plan";
import { STATUS_FAROL } from "@/types/action-plan";

interface StatusDotProps {
  status: number;
  item?: ActionItem;
  subItems?: ActionItem[];
  onClick?: () => void;
}

const STATUS_DOT_COLORS: Record<number, string> = {
  1: "bg-zinc-400",
  2: "bg-amber-400",
  3: "bg-red-500",
  4: "bg-blue-500",
  5: "bg-emerald-500",
};

const STATUS_DOT_RING: Record<number, string> = {
  1: "group-hover:ring-zinc-300 dark:group-hover:ring-zinc-500",
  2: "group-hover:ring-amber-300 dark:group-hover:ring-amber-500",
  3: "group-hover:ring-red-300 dark:group-hover:ring-red-500",
  4: "group-hover:ring-blue-300 dark:group-hover:ring-blue-500",
  5: "group-hover:ring-emerald-300 dark:group-hover:ring-emerald-500",
};

export function StatusDot({ status, item: _item, subItems, onClick }: StatusDotProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const st = STATUS_FAROL[status] || STATUS_FAROL[1];
  const dotColor = STATUS_DOT_COLORS[status] || STATUS_DOT_COLORS[1];
  const ringColor = STATUS_DOT_RING[status] || STATUS_DOT_RING[1];

  let percentage = 0;
  if (subItems && subItems.length > 0) {
    const completed = subItems.filter(c => c.status === 5).length;
    percentage = Math.round((completed / subItems.length) * 100);
  }

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowTooltip(false);
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "inline-flex items-center justify-center h-7 w-7 rounded-full transition-all",
        "group relative cursor-pointer",
        ringColor,
        "hover:ring-2 hover:ring-offset-2 dark:hover:ring-offset-zinc-900"
      )}
    >
      <div className={cn("h-3 w-3 rounded-full shadow-sm", dotColor)} />

      {showTooltip && (
        <div className={cn(
          "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50",
          "bg-zinc-900 dark:bg-zinc-950 text-white text-xs rounded px-3 py-2 whitespace-nowrap",
          "pointer-events-none shadow-lg animate-in fade-in duration-200"
        )}>
          <div className="font-semibold">{st.label}</div>
          {percentage > 0 && (
            <div className="text-zinc-300 text-[11px] mt-1 font-semibold">
              ✓ Conclusão: {percentage}%
            </div>
          )}

          <div className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 z-50",
            "w-1.5 h-1.5 bg-zinc-900 dark:bg-zinc-950 rotate-45",
            "pointer-events-none",
            "mb-0.5"
          )} />
        </div>
      )}
    </button>
  );
}
