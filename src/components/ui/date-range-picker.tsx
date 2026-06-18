"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatDateBR } from "@/lib/format-br";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIso(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

interface DateRangePickerProps {
  from: string;
  to: string;
  /** Chamado com (from, to) ao concluir uma seleção ou ao limpar ("", ""). */
  onChange: (from: string, to: string) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Seletor de intervalo de datas: um botão único que abre um popover com
 * calendário de mês, seleção de início/fim e atalhos rápidos. Datas em
 * YYYY-MM-DD. Sem dependências externas.
 */
export function DateRangePicker({
  from,
  to,
  onChange,
  className,
  placeholder = "Período",
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState<string | null>(from || null);
  const [end, setEnd] = useState<string | null>(to || null);
  const [hover, setHover] = useState<string | null>(null);
  const today = new Date();
  const seed = parseIso(from) ?? today;
  const [view, setView] = useState({ year: seed.getFullYear(), month: seed.getMonth() });
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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

  function openPanel() {
    // Reidrata a seleção a partir das props e posiciona o mês exibido.
    setStart(from || null);
    setEnd(to || null);
    setHover(null);
    const base = parseIso(from) ?? new Date();
    setView({ year: base.getFullYear(), month: base.getMonth() });
    setOpen(true);
  }

  function navigate(offset: number) {
    setView((prev) => {
      const total = prev.year * 12 + prev.month + offset;
      return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
    });
  }

  function pick(iso: string) {
    // Sem início, ou intervalo já completo, ou clique antes do início → recomeça.
    if (!start || (start && end) || iso < start) {
      setStart(iso);
      setEnd(null);
      return;
    }
    // Segundo clique (>= início): fecha o intervalo e confirma.
    setEnd(iso);
    onChange(start, iso);
    setOpen(false);
  }

  function commit(f: string, t: string) {
    setStart(f || null);
    setEnd(t || null);
    onChange(f, t);
    setOpen(false);
  }

  function applyPreset(f: Date, t: Date) {
    commit(toIso(f), toIso(t));
  }

  const previewEnd = end ?? hover;
  const lo = start && previewEnd ? (start < previewEnd ? start : previewEnd) : start;
  const hi = start && previewEnd ? (start < previewEnd ? previewEnd : start) : start;

  // Grid de 42 células (6 semanas) do mês exibido.
  const { year, month } = view;
  const firstWeekday = new Date(year, month, 1).getDay();
  const cells: { iso: string; day: number; inMonth: boolean }[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    const d = new Date(year, month, -firstWeekday + i + 1);
    cells.push({ iso: toIso(d), day: d.getDate(), inMonth: false });
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: toIso(new Date(year, month, d)), day: d, inMonth: true });
  }
  while (cells.length < 42) {
    const last = parseIso(cells[cells.length - 1].iso)!;
    last.setDate(last.getDate() + 1);
    cells.push({ iso: toIso(last), day: last.getDate(), inMonth: false });
  }

  const todayIso = toIso(today);
  const hasValue = Boolean(from && to);
  const label = hasValue ? `${formatDateBR(from)} – ${formatDateBR(to)}` : placeholder;

  return (
    <div ref={ref} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex h-10 items-center gap-2 rounded-md border bg-white pl-2.5 pr-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 dark:bg-zinc-900",
          hasValue
            ? "border-accent-500 text-zinc-900 dark:text-zinc-50"
            : "border-zinc-200 text-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800",
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-zinc-400" />
        <span className="whitespace-nowrap tabular-nums">{label}</span>
        {hasValue ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Limpar intervalo de datas"
            onClick={(e) => { e.stopPropagation(); commit("", ""); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); commit("", ""); } }}
            className="ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white hover:bg-accent-600"
          >
            <X className="h-2.5 w-2.5" />
          </span>
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 rotate-90 text-zinc-400" />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Selecionar intervalo de datas"
          className="absolute right-0 z-50 mt-2 w-[19rem] rounded-lg border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          {/* Cabeçalho com navegação de mês */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Mês anterior"
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold tracking-tight">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => navigate(1)}
              aria-label="Próximo mês"
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 gap-y-1">
            {WEEKDAYS.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-semibold uppercase text-zinc-400">
                {d}
              </div>
            ))}
            {cells.map((c) => {
              const isStart = c.iso === start;
              const isEnd = c.iso === end;
              const isEdge = c.iso === lo || c.iso === hi;
              const inRange = Boolean(lo && hi && lo !== hi && c.iso > lo && c.iso < hi);
              const selected = isStart || isEnd || isEdge;
              return (
                <button
                  key={c.iso}
                  type="button"
                  aria-label={formatDateBR(c.iso)}
                  onClick={() => pick(c.iso)}
                  onMouseEnter={() => start && !end && setHover(c.iso)}
                  className={cn(
                    "relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs tabular-nums transition-colors",
                    selected && "bg-accent-500 font-semibold text-white",
                    !selected && inRange && "bg-accent-100 text-accent-800 dark:bg-accent-950/40 dark:text-accent-200",
                    !selected && !inRange && c.inMonth && "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
                    !selected && !inRange && !c.inMonth && "text-zinc-300 hover:bg-zinc-100 dark:text-zinc-600 dark:hover:bg-zinc-800",
                    !selected && !inRange && c.iso === todayIso && "font-bold text-accent-600 dark:text-accent-300",
                  )}
                >
                  {c.day}
                </button>
              );
            })}
          </div>

          {/* Atalhos */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <Preset label="Este mês" onClick={() => applyPreset(new Date(today.getFullYear(), today.getMonth(), 1), new Date(today.getFullYear(), today.getMonth() + 1, 0))} />
            <Preset label="Próx. 30 dias" onClick={() => { const t = new Date(today); const e = new Date(today); e.setDate(e.getDate() + 29); applyPreset(t, e); }} />
            <Preset label="Este ano" onClick={() => applyPreset(new Date(today.getFullYear(), 0, 1), new Date(today.getFullYear(), 11, 31))} />
            <button
              type="button"
              onClick={() => commit("", "")}
              className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Preset({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition-colors hover:border-accent-300 hover:bg-accent-50 hover:text-accent-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-accent-950/30"
    >
      {label}
    </button>
  );
}
