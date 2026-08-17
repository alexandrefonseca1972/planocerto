"use client";

import { Search, X, Tag, Layers, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sanitize } from "@/lib/sanitize";
import { STATUS_FAROL } from "@/types/action-plan";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface PlanFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: number | null;
  setStatusFilter: (status: number | null) => void;
  planStatusFilter: "active" | "archived" | null;
  setPlanStatusFilter: (status: "active" | "archived" | null) => void;
  visibilityFilter: "public" | "restricted" | null;
  setVisibilityFilter: (visibility: "public" | "restricted" | null) => void;
  exercicioFilter: number | null;
  setExercicioFilter: (exercicio: number | null) => void;
  dateFrom: string;
  dateTo: string;
  setDateRange: (from: string, to: string) => void;
  tipoPaFilter: string;
  setTipoPaFilter: (value: string) => void;
  macroAcaoFilter: string;
  setMacroAcaoFilter: (value: string) => void;
  tipoPaOptions: string[];
  macroAcaoOptions: string[];
  availableExercises: number[];
  filteredCount: number;
  totalCount: number;
  filteredPlanCount: number;
  totalPlanCount: number;
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  showClear,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  showClear?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel ?? placeholder}
        className="h-9 rounded-md border border-zinc-200 bg-white pl-3 pr-7 text-sm text-zinc-700 shadow-sm appearance-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {value && showClear && (
        <button
          onClick={(e) => { e.stopPropagation(); onChange(""); }}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          title="Limpar filtro"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </span>
    </div>
  );
}

function IconFilterSelect({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  icon,
  widthClass,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  ariaLabel: string;
  icon: ReactNode;
  widthClass: string;
}) {
  // Garante que o valor atual apareça no <select> mesmo se sumir das opções
  // (ex.: catálogo mudou), para não desincronizar o dropdown do filtro ativo.
  const displayOptions = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <div className="relative shrink-0">
      <span className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400">
        {icon}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={cn(
          "h-10 appearance-none rounded-md border border-zinc-200 bg-white pl-8 pr-8 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:border-zinc-700 dark:bg-zinc-900",
          widthClass,
          value ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400",
        )}
      >
        <option value="">{placeholder}</option>
        {displayOptions.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-7 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full bg-accent-500 text-white hover:bg-accent-600"
          aria-label={`Limpar filtro ${placeholder}`}
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

export function PlanFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  planStatusFilter,
  setPlanStatusFilter,
  visibilityFilter,
  setVisibilityFilter,
  exercicioFilter,
  setExercicioFilter,
  dateFrom,
  dateTo,
  setDateRange,
  tipoPaFilter,
  setTipoPaFilter,
  macroAcaoFilter,
  setMacroAcaoFilter,
  tipoPaOptions,
  macroAcaoOptions,
  availableExercises,
  filteredCount,
  totalCount,
  filteredPlanCount,
  totalPlanCount,
}: PlanFiltersProps) {
  const hasDateRange = Boolean(dateFrom && dateTo);
  const hasItemFilters =
    Boolean(searchQuery) ||
    statusFilter !== null ||
    hasDateRange ||
    Boolean(tipoPaFilter) ||
    Boolean(macroAcaoFilter);
  const hasPlanFilters = planStatusFilter !== null || visibilityFilter !== null || exercicioFilter !== null;

  function clearAllPlanFilters() {
    setPlanStatusFilter(null);
    setVisibilityFilter(null);
    setExercicioFilter(null);
  }

  function clearAllItemFilters() {
    setSearchQuery("");
    setStatusFilter(null);
    setDateRange("", "");
    setTipoPaFilter("");
    setMacroAcaoFilter("");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          value={planStatusFilter || ""}
          onChange={(v) => setPlanStatusFilter((v || null) as "active" | "archived" | null)}
          options={[
            { value: "active", label: "Ativos" },
            { value: "archived", label: "Arquivados" },
          ]}
          placeholder="Todos os planos"
          ariaLabel="Situação do plano"
          showClear
        />
        <FilterSelect
          value={visibilityFilter || ""}
          onChange={(v) => setVisibilityFilter((v || null) as "public" | "restricted" | null)}
          options={[
            { value: "public", label: "Público" },
            { value: "restricted", label: "Restrito" },
          ]}
          placeholder="Toda visibilidade"
          ariaLabel="Visibilidade do plano"
          showClear
        />
        <FilterSelect
          value={exercicioFilter ? String(exercicioFilter) : ""}
          onChange={(v) => setExercicioFilter(v ? Number(v) : null)}
          options={availableExercises.map((e) => ({ value: String(e), label: String(e) }))}
          placeholder="Todos os exercícios"
          ariaLabel="Exercício do plano"
          showClear
        />
        {hasPlanFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllPlanFilters}
            className="h-7 text-[11px] text-zinc-400 hover:text-zinc-600"
          >
            <X className="mr-1 h-3 w-3" />
            Limpar filtros
          </Button>
        )}
        {hasPlanFilters && (
          <span className="text-xs text-zinc-500">
            {filteredPlanCount} de {totalPlanCount} planos
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Buscar ações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(sanitize(e.target.value))}
            className="h-10 pl-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              title="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <IconFilterSelect
          value={tipoPaFilter}
          onChange={setTipoPaFilter}
          options={tipoPaOptions}
          placeholder="Tipo PA"
          ariaLabel="Tipo PA"
          icon={<Tag className="h-4 w-4" />}
          widthClass="w-36"
        />
        <IconFilterSelect
          value={macroAcaoFilter}
          onChange={setMacroAcaoFilter}
          options={macroAcaoOptions}
          placeholder="Macro Ação"
          ariaLabel="Macro Ação"
          icon={<Layers className="h-4 w-4" />}
          widthClass="w-40"
        />
        <DateRangePicker from={dateFrom} to={dateTo} onChange={setDateRange} />
        {hasItemFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllItemFilters}
            className="h-7 text-[11px] text-zinc-400 hover:text-zinc-600 shrink-0"
          >
            <X className="mr-1 h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(STATUS_FAROL).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setStatusFilter(statusFilter === Number(k) ? null : Number(k))}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
              v.color,
              statusFilter === Number(k)
                ? "ring-1 ring-zinc-400 dark:ring-zinc-500 scale-105"
                : "opacity-60 hover:opacity-100",
            )}
          >
            {v.dot} {v.label}
          </button>
        ))}
      </div>
      {hasItemFilters && (
        <span className="text-xs text-zinc-500">
          {filteredCount} de {totalCount}
        </span>
      )}
    </div>
  );
}
