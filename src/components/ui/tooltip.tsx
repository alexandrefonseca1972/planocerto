"use client";

import { type ReactNode, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: ReactNode;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
  /** Classe aplicada ao wrapper (ex.: "flex-1" para preservar layout flex). */
  className?: string;
  /** Permite quebra de linha + largura máxima (legendas mais longas). */
  multiline?: boolean;
}

export function Tooltip({ children, content, side = "top", delay = 500, className, multiline = false }: TooltipProps) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => setShow(true), delay);
  }, [delay]);

  const handleLeave = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setShow(false);
  }, []);

  const sideClass = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  };

  return (
    <div className={cn("relative inline-flex", className)} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      {show && (
        <div className={cn(
          "pointer-events-none absolute z-50 rounded-md bg-brand-600 px-2.5 py-1.5 text-xs text-white shadow-lg dark:bg-brand-200 dark:text-brand-900",
          "animate-[fadeIn_150ms_ease-out]",
          multiline ? "w-max max-w-[240px] whitespace-normal text-center" : "whitespace-nowrap",
          sideClass[side]
        )}>
          {content}
        </div>
      )}
    </div>
  );
}
