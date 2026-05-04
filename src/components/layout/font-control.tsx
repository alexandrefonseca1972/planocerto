"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Minus } from "lucide-react";

const MIN = 0.8;
const MAX = 1.5;
const STEP = 0.1;

function getStoredScale(): number {
  if (typeof window === "undefined") return 1;
  const saved = localStorage.getItem("font-scale");
  if (saved) {
    const v = parseFloat(saved);
    if (v >= MIN && v <= MAX) return v;
  }
  return 1;
}

export function FontControl() {
  const [scale, setScale] = useState<number>(() => getStoredScale());

  useEffect(() => {
    document.documentElement.style.fontSize = `${scale * 100}%`;
  }, [scale]);

  const adjust = useCallback((delta: number) => {
    setScale((prev) => {
      const next = Math.round((prev + delta) * 10) / 10;
      if (next < MIN || next > MAX) return prev;
      document.documentElement.style.fontSize = `${next * 100}%`;
      localStorage.setItem("font-scale", String(next));
      return next;
    });
  }, []);

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => adjust(-STEP)}
        disabled={scale <= MIN}
        className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        aria-label="Diminuir fonte"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="font-mono text-xs text-zinc-400 w-8 text-center select-none tabular-nums">
        {Math.round(scale * 100)}%
      </span>
      <button
        onClick={() => adjust(STEP)}
        disabled={scale >= MAX}
        className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        aria-label="Aumentar fonte"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
