"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  Check,
  Minus,
  Search,
  X,
  Building,
  MapPin,
  ChevronRight,
} from "lucide-react";

export interface FilterArea {
  id: string;
  name: string;
}

export interface FilterUnit {
  id: string;
  name: string;
  area_id: string | null;
  uf?: string;
}

interface AreaUnitFilterProps {
  areas: FilterArea[];
  units: FilterUnit[];
  /** Lista de unidades selecionadas. Vazia = todas. */
  selectedUnitIds: string[];
  onChangeUnits: (ids: string[]) => void;
}

/**
 * Filtro hierárquico em UMA única selectlist.
 *
 * - Cada Área é um header clicável que tocla todas as suas Unidades.
 * - Cada Unidade tem checkbox individual.
 * - Áreas mostram tri-state: vazia, parcial (minus), cheia (check).
 * - Output: somente `selectedUnitIds`. Vazio = todas.
 *
 * Áreas sem unidades não aparecem. Unidades sem área aparecem em "Sem área".
 */
export function AreaUnitFilter({
  areas,
  units,
  selectedUnitIds,
  onChangeUnits,
}: AreaUnitFilterProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set());
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora / Esc
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

  const selectedSet = useMemo(() => new Set(selectedUnitIds), [selectedUnitIds]);

  // Agrupa unidades por área (e ordena por nome)
  const groups = useMemo(() => {
    const map = new Map<string, { area: FilterArea | null; units: FilterUnit[] }>();
    for (const u of units) {
      const k = u.area_id ?? "_none";
      if (!map.has(k)) {
        map.set(k, {
          area: u.area_id ? areas.find((a) => a.id === u.area_id) ?? null : null,
          units: [],
        });
      }
      map.get(k)!.units.push(u);
    }
    // Garante áreas mesmo vazias se quiser, mas só listamos áreas com unidades
    return Array.from(map.values())
      .map((g) => ({
        ...g,
        units: g.units.slice().sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => {
        const an = a.area?.name ?? "ZZZ";
        const bn = b.area?.name ?? "ZZZ";
        return an.localeCompare(bn);
      });
  }, [units, areas]);

  // Filtra por busca (texto bate em nome de área ou unidade)
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => {
        const areaMatch = (g.area?.name || "").toLowerCase().includes(q);
        if (areaMatch) return g; // mostra todas as unidades da área que bateu
        const matchedUnits = g.units.filter((u) =>
          u.name.toLowerCase().includes(q),
        );
        if (matchedUnits.length > 0) return { ...g, units: matchedUnits };
        return null;
      })
      .filter(Boolean) as typeof groups;
  }, [groups, query]);

  const totalUnits = units.length;
  const selectedCount = selectedUnitIds.length;

  // Estado tri-state por área
  function areaState(g: typeof groups[number]): "none" | "partial" | "all" {
    const ids = g.units.map((u) => u.id);
    let count = 0;
    for (const id of ids) if (selectedSet.has(id)) count++;
    if (count === 0) return "none";
    if (count === ids.length) return "all";
    return "partial";
  }

  function toggleUnit(id: string) {
    if (selectedSet.has(id)) {
      onChangeUnits(selectedUnitIds.filter((x) => x !== id));
    } else {
      onChangeUnits([...selectedUnitIds, id]);
    }
  }

  function toggleArea(g: typeof groups[number]) {
    const ids = g.units.map((u) => u.id);
    const idsSet = new Set(ids);
    const state = areaState(g);
    if (state === "all") {
      // remove todos os ids da área
      onChangeUnits(selectedUnitIds.filter((id) => !idsSet.has(id)));
    } else {
      // adiciona todos os ids da área
      const next = new Set(selectedUnitIds);
      for (const id of ids) next.add(id);
      onChangeUnits(Array.from(next));
    }
  }

  function selectAll() {
    onChangeUnits(units.map((u) => u.id));
  }

  function clearAll() {
    onChangeUnits([]);
  }

  function toggleCollapse(areaKey: string) {
    setCollapsedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(areaKey)) next.delete(areaKey);
      else next.add(areaKey);
      return next;
    });
  }

  // Texto do trigger
  const triggerText = useMemo(() => {
    if (selectedCount === 0) return "Todas as áreas e unidades";
    if (selectedCount === totalUnits && totalUnits > 0)
      return `Todas (${totalUnits})`;
    // Quantas áreas inteiras estão selecionadas?
    const fullAreas = groups.filter(
      (g) => g.units.length > 0 && areaState(g) === "all",
    );
    if (fullAreas.length === groups.length && fullAreas.length > 0)
      return `Todas (${totalUnits})`;
    if (selectedCount === 1) {
      const u = units.find((x) => x.id === selectedUnitIds[0]);
      return u?.name || "1 unidade";
    }
    if (fullAreas.length > 0) {
      const remaining =
        selectedCount -
        fullAreas.reduce((acc, g) => acc + g.units.length, 0);
      const areaPart =
        fullAreas.length === 1
          ? `1 área`
          : `${fullAreas.length} áreas`;
      return remaining > 0
        ? `${areaPart} + ${remaining} unidade${remaining === 1 ? "" : "s"}`
        : areaPart;
    }
    return `${selectedCount} unidades`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCount, totalUnits, groups, units, selectedUnitIds]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex h-10 w-full items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:border-zinc-700 dark:bg-zinc-900 sm:max-w-md",
          open && "ring-2 ring-accent-500",
        )}
      >
        <Building className="h-4 w-4 shrink-0 text-zinc-400" />
        <span
          className={cn(
            "flex-1 truncate text-left",
            selectedCount === 0
              ? "text-zinc-400"
              : "text-zinc-900 dark:text-zinc-50",
          )}
        >
          {triggerText}
        </span>
        {selectedCount > 0 && (
          <span className="shrink-0 rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {selectedCount}
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
          className="absolute left-0 z-50 mt-1 w-full overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900 sm:max-w-md"
          role="listbox"
        >
          {/* Busca */}
          <div className="relative border-b border-zinc-100 p-1.5 dark:border-zinc-800">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar área ou unidade..."
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

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-1.5 text-[11px] dark:border-zinc-800">
            <span className="text-zinc-500">
              {selectedCount}/{totalUnits} unidade{totalUnits === 1 ? "" : "s"}
            </span>
            <div className="flex gap-2">
              {selectedCount < totalUnits && (
                <button
                  type="button"
                  onClick={selectAll}
                  className="font-medium text-accent-600 hover:underline dark:text-accent-400"
                >
                  Marcar tudo
                </button>
              )}
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="font-medium text-zinc-500 hover:underline dark:text-zinc-400"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Tree */}
          <div className="max-h-80 overflow-y-auto py-1">
            {filteredGroups.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs italic text-zinc-400">
                {query.trim()
                  ? `Nenhum resultado para "${query}".`
                  : "Nenhuma unidade cadastrada."}
              </p>
            ) : (
              filteredGroups.map((g) => {
                const areaKey = g.area?.id ?? "_none";
                const collapsed = collapsedAreas.has(areaKey);
                const state = areaState(g);
                const areaName = g.area?.name ?? "Sem área";
                return (
                  <div key={areaKey}>
                    {/* Header da Área (clicável: toggla; chevron: colapsa) */}
                    <div className="flex items-center gap-1 px-2 py-1">
                      <button
                        type="button"
                        onClick={() => toggleCollapse(areaKey)}
                        className="rounded p-0.5 text-zinc-400 hover:text-zinc-600"
                        aria-label={
                          collapsed ? "Expandir área" : "Colapsar área"
                        }
                      >
                        <ChevronRight
                          className={cn(
                            "h-3.5 w-3.5 transition-transform",
                            !collapsed && "rotate-90",
                          )}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleArea(g)}
                        className={cn(
                          "flex flex-1 items-center gap-2 rounded px-2 py-1 text-left text-xs font-semibold transition-colors",
                          state === "all"
                            ? "bg-accent-50 text-accent-900 dark:bg-accent-950/30 dark:text-accent-100"
                            : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                            state === "all"
                              ? "border-accent-500 bg-accent-500 text-white"
                              : state === "partial"
                              ? "border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-950/30 dark:text-accent-300"
                              : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800",
                          )}
                        >
                          {state === "all" && <Check className="h-3 w-3" />}
                          {state === "partial" && (
                            <Minus className="h-3 w-3" />
                          )}
                        </span>
                        <MapPin className="h-3 w-3 text-zinc-400" />
                        <span className="flex-1 uppercase tracking-wider text-[10px]">
                          {areaName}
                        </span>
                        <span className="text-[10px] font-normal text-zinc-400 tabular-nums">
                          {
                            g.units.filter((u) => selectedSet.has(u.id))
                              .length
                          }
                          /{g.units.length}
                        </span>
                      </button>
                    </div>

                    {/* Unidades */}
                    {!collapsed && (
                      <div className="pl-6">
                        {g.units.map((u) => {
                          const checked = selectedSet.has(u.id);
                          return (
                            <button
                              key={u.id}
                              type="button"
                              role="option"
                              aria-selected={checked}
                              onClick={() => toggleUnit(u.id)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded px-3 py-1 text-left text-sm transition-colors",
                                checked
                                  ? "bg-brand-50 text-brand-900 dark:bg-brand-950/30 dark:text-brand-100"
                                  : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                                  checked
                                    ? "border-brand-600 bg-brand-600 text-white"
                                    : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800",
                                )}
                              >
                                {checked && <Check className="h-3 w-3" />}
                              </span>
                              <Building className="h-3 w-3 text-zinc-400" />
                              <span className="flex-1 truncate">{u.name}</span>
                              {u.uf && (
                                <span className="shrink-0 text-[10px] font-medium text-zinc-400">
                                  {u.uf}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
