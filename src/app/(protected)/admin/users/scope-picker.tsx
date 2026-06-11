"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { sanitize } from "@/lib/sanitize";

export function ScopePicker({
  id,
  label,
  icon,
  inputName,
  items,
  selectedIds,
  emptyMessage,
  helperText,
  touchedFieldName,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  inputName: string;
  items: { id: string; label: string }[];
  selectedIds: string[];
  emptyMessage: string;
  helperText?: string;
  touchedFieldName?: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedIds),
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query]);

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };

  const toggleOne = (itemId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          {icon}
          {label}
          {selected.size > 0 && (
            <span className="ml-1 rounded-full bg-accent-100 px-1.5 py-0.5 text-[10px] font-semibold text-accent-700 dark:bg-accent-950/40 dark:text-accent-300">
              {selected.size}
            </span>
          )}
        </Label>
        {items.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="text-[11px] font-medium text-accent-600 hover:underline dark:text-accent-400"
          >
            {selected.size === items.length ? "Limpar" : "Selecionar todas"}
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="rounded-md border border-zinc-200 p-3 text-xs text-zinc-400 dark:border-zinc-700">
          {emptyMessage}
        </p>
      ) : (
        <>
          {touchedFieldName && <input type="hidden" name={touchedFieldName} value="1" />}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <Input
              id={`scope-${id}-search`}
              placeholder={`Buscar ${label.toLowerCase()}...`}
              value={query}
              onChange={(e) => setQuery(sanitize(e.target.value))}
              className="h-8 pl-7 text-xs"
            />
          </div>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
            {filtered.length === 0 ? (
              <p className="py-2 text-center text-xs text-zinc-400">
                Nada encontrado.
              </p>
            ) : (
              filtered.map((item) => (
                <Checkbox
                  key={item.id}
                  id={`scope-${id}-${item.id}`}
                  name={inputName}
                  value={item.id}
                  label={item.label}
                  checked={selected.has(item.id)}
                  onChange={() => toggleOne(item.id)}
                />
              ))
            )}
          </div>
        </>
      )}
      {helperText && (
        <p className="text-[11px] text-zinc-400">{helperText}</p>
      )}
    </div>
  );
}
