"use client";

import { type SelectHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  icon?: ReactNode;
};

/**
 * Glyphs for icons used in select. Avoids React rendering issues.
 */
const ICON_SVG: Record<string, string> = {
  GraduationCap: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`,
  Flag: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`,
  Layers: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 12.5-8.58 3.91a2 2 0 0 1-1.66 0L2.6 12.5"/><path d="m22 17.5-8.58 3.91a2 2 0 0 1-1.66 0L2.6 17.5"/></svg>`,
};

export function Select({ className, children, icon, ...props }: SelectProps) {
  let iconName = "";
  if (icon && typeof icon === "object" && "type" in icon) {
    const t = icon.type as { displayName?: string; name?: string };
    iconName = t.displayName || t.name || "";
  }

  const bgSvg = ICON_SVG[iconName];

  return (
    <div className="relative inline-flex w-full">
      <select
        className={cn(
          "flex h-10 w-full appearance-none rounded-md border border-zinc-200 bg-white text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-accent-400",
          bgSvg ? "py-2 pl-9 pr-9" : "py-2 pl-3 pr-9",
          className,
        )}
        style={
          bgSvg
            ? {
                backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(bgSvg)}")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "left 12px center",
                backgroundSize: "16px 16px",
              }
            : undefined
        }
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}
