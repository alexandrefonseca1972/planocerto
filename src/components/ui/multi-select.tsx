"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  id: string;
  label: string;
  /** Categoria opcional (header acima do item). */
  group?: string;
  /** Texto auxiliar à direita do label (ex: UF). */
  hint?: string;
}

export interface MultiSelectProps {
  /** Texto do trigger quando nenhum item está selecionado. */
  placeholder?: string;
  /** Texto pequeno acima do trigger (ex: "Áreas"). */
  label?: string;
  /** Ícone à esquerda no trigger. */
  icon?: ReactNode;
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Mostra busca interna quando há mais de N opções. Default 8. */
  searchThreshold?: number;
  /** Largura mínima do popup. */
  minWidth?: string;
  /** Mensagem quando vazio. */
  emptyMessage?: string;
  /** Desabilita o controle. */
  disabled?: boolean;
  className?: string;
}

/**
 * Multi-select compacto: trigger + popup com checkboxes, busca, marcar
 * tudo/limpar. Substitui faixas de chips quando o espaço é restrito.
 */
export function MultiSelect({
  placeholder = "Selecionar...",
  label,
  icon,
  options,
  selectedIds,
  onChange,
  searchThreshold = 8,
  minWidth = "16rem",
  emptyMessage = "Nenhuma opção disponível.",
  disabled,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora ou pressionar Esc
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (
        popupRef.current &&
        triggerRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.group ?? "").toLowerCase().includes(q),
    );
  }, [options, query]);

  // Agrupamento (pelo campo `group` se existir)
  const grouped = useMemo(() => {
    const map = new Map<string | undefined, MultiSelectOption[]>();
    for (const o of filtered) {
      const k = o.group;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(o);
    }
    return map;
  }, [filtered]);

  const showSearch = options.length > searchThreshold;
  const allSelectedFromVisible =
    filtered.length > 0 && filtered.every((o) => selectedSet.has(o.id));

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function selectAll() {
    const ids = filtered.map((o) => o.id);
    const merged = Array.from(new Set([...selectedIds, ...ids]));
    onChange(merged);
  }

  function clearAll() {
    if (query.trim()) {
      const visibleIds = new Set(filtered.map((o) => o.id));
      onChange(selectedIds.filter((id) => !visibleIds.has(id)));
    } else {
      onChange([]);
    }
  }

  // Texto do trigger
  const triggerText =
    selectedIds.length === 0
      ? placeholder
      : selectedIds.length === options.length && options.length > 0
      ? `Todos (${options.length})`
      : selectedIds.length === 1
      ? options.find((o) => o.id === selectedIds[0])?.label || "1 selecionado"
      : `${selectedIds.length} selecionados`;

  return (
    <div className={cn("relative", className)}>
      {label && (
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex h-10 w-full items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900",
          open && "ring-2 ring-accent-500",
        )}
      >
        {icon && <span className="shrink-0 text-zinc-400">{icon}</span>}
        <span
          className={cn(
            "flex-1 truncate text-left",
            selectedIds.length === 0
              ? "text-zinc-400"
              : "text-zinc-900 dark:text-zinc-50",
          )}
        >
          {triggerText}
        </span>
        {selectedIds.length > 0 && (
          <span className="shrink-0 rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {selectedIds.length}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          ref={popupRef}
          className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          style={{ minWidth }}
          role="listbox"
        >
          {showSearch && (
            <div className="relative border-b border-zinc-100 p-1.5 dark:border-zinc-800">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="h-8 pl-8 text-xs"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  type="button"
                  aria-label="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Toolbar: marcar tudo / limpar */}
          {options.length > 0 && (
            <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-1.5 text-[11px] dark:border-zinc-800">
              <span className="text-zinc-500">
                {selectedIds.length}/{options.length} selecionado
                {selectedIds.length === 1 ? "" : "s"}
              </span>
              <div className="flex gap-2">
                {!allSelectedFromVisible && (
                  <button
                    type="button"
                    onClick={selectAll}
                    className="font-medium text-accent-600 hover:underline dark:text-accent-400"
                  >
                    {query.trim()
                      ? `Marcar visíveis (${filtered.length})`
                      : "Marcar tudo"}
                  </button>
                )}
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="font-medium text-zinc-500 hover:underline dark:text-zinc-400"
                  >
                    {query.trim() ? "Limpar visíveis" : "Limpar"}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs italic text-zinc-400">
                {query.trim() ? `Nenhum resultado para "${query}".` : emptyMessage}
              </p>
            ) : (
              Array.from(grouped.entries()).map(([group, items]) => (
                <div key={group ?? "_no-group"}>
                  {group && (
                    <p className="sticky top-0 bg-zinc-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:bg-zinc-800/80">
                      {group}
                    </p>
                  )}
                  {items.map((o) => {
                    const checked = selectedSet.has(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        role="option"
                        aria-selected={checked}
                        onClick={() => toggle(o.id)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors",
                          checked
                            ? "bg-accent-50 text-accent-900 dark:bg-accent-950/30 dark:text-accent-100"
                            : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                            checked
                              ? "border-accent-500 bg-accent-500 text-white"
                              : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800",
                          )}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </span>
                        <span className="flex-1 truncate">{o.label}</span>
                        {o.hint && (
                          <span className="shrink-0 text-[10px] font-medium text-zinc-400">
                            {o.hint}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
