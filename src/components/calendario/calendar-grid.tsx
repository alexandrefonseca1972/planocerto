"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Building2,
} from "lucide-react";

export type DeadlineKind = "overdue" | "near" | "future";

export interface CalendarDeadlineItem {
  id: string;
  title: string;
  number: string;
  planned_end: string;
  status: number;
  responsible: string;
  tenant: string;
  planTitle: string;
  daysLeft: number;
  kind: DeadlineKind;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Props {
  items: CalendarDeadlineItem[];
  initialMonth?: { year: number; month: number };
  filterKinds?: DeadlineKind[];
  defaultView?: "calendar" | "list";
}

export function CalendarGrid({
  items,
  initialMonth,
  filterKinds,
  defaultView = "calendar",
}: Props) {
  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [view, setView] = useState<"calendar" | "list">(defaultView);
  const [{ year, month }, setMonth] = useState(
    () =>
      initialMonth || {
        year: todayDate.getFullYear(),
        month: todayDate.getMonth(),
      },
  );
  const [activeKinds, setActiveKinds] = useState<Set<DeadlineKind>>(
    () => new Set(filterKinds ?? ["overdue", "near", "future"]),
  );

  // Filtra pelas kinds selecionadas
  const filtered = useMemo(
    () => items.filter((i) => activeKinds.has(i.kind)),
    [items, activeKinds],
  );

  // Indexa por data (YYYY-MM-DD)
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarDeadlineItem[]>();
    for (const it of filtered) {
      if (!map.has(it.planned_end)) map.set(it.planned_end, []);
      map.get(it.planned_end)!.push(it);
    }
    // Ordena cada lista pela hora/título
    for (const list of map.values()) {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return map;
  }, [filtered]);

  // Constrói o grid do mês (6 semanas, 42 células)
  const grid = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startWeekday = firstOfMonth.getDay(); // 0=Dom
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: Date; iso: string; inMonth: boolean }[] = [];

    // Dias do mês anterior para preencher
    for (let i = 0; i < startWeekday; i++) {
      const d = new Date(year, month, -startWeekday + i + 1);
      cells.push({ date: d, iso: toIso(d), inMonth: false });
    }
    // Dias do mês
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      cells.push({ date, iso: toIso(date), inMonth: true });
    }
    // Completa para 42 (6 linhas × 7 colunas)
    while (cells.length < 42) {
      const last = cells[cells.length - 1].date;
      const next = new Date(last);
      next.setDate(next.getDate() + 1);
      cells.push({ date: next, iso: toIso(next), inMonth: false });
    }
    return cells;
  }, [year, month]);

  // Estatísticas do mês
  const monthStats = useMemo(() => {
    const stats = { overdue: 0, near: 0, future: 0, total: 0 };
    for (const cell of grid) {
      if (!cell.inMonth) continue;
      const list = byDate.get(cell.iso) || [];
      for (const it of list) {
        stats.total++;
        stats[it.kind]++;
      }
    }
    return stats;
  }, [grid, byDate]);

  function navigate(offset: number) {
    setMonth((prev) => {
      const m = prev.month + offset;
      let y = prev.year;
      let mm = m;
      while (mm < 0) {
        mm += 12;
        y--;
      }
      while (mm > 11) {
        mm -= 12;
        y++;
      }
      return { year: y, month: mm };
    });
  }

  function toggleKind(k: DeadlineKind) {
    setActiveKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="min-w-[180px] text-center text-base font-semibold tracking-tight">
              {MONTH_NAMES[month]} {year}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(1)}
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setMonth({
                  year: todayDate.getFullYear(),
                  month: todayDate.getMonth(),
                })
              }
            >
              Hoje
            </Button>
          </div>

          {/* Filtros por kind */}
          <div className="flex flex-wrap items-center gap-2">
            <KindFilter
              active={activeKinds.has("overdue")}
              onClick={() => toggleKind("overdue")}
              label="Atrasadas"
              count={monthStats.overdue}
              tone="red"
            />
            <KindFilter
              active={activeKinds.has("near")}
              onClick={() => toggleKind("near")}
              label="Próximas"
              count={monthStats.near}
              tone="amber"
            />
            <KindFilter
              active={activeKinds.has("future")}
              onClick={() => toggleKind("future")}
              label="Futuras"
              count={monthStats.future}
              tone="zinc"
            />
            <span className="ml-1 hidden h-5 w-px bg-zinc-200 sm:block dark:bg-zinc-700" />
            <div className="flex rounded-md border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setView("calendar")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-l-md px-2 py-1 text-[11px] font-medium transition-colors",
                  view === "calendar"
                    ? "bg-brand-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800",
                )}
                aria-pressed={view === "calendar"}
                title="Visão de calendário"
              >
                <LayoutGrid className="h-3 w-3" />
                Calendário
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-r-md px-2 py-1 text-[11px] font-medium transition-colors",
                  view === "list"
                    ? "bg-brand-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800",
                )}
                aria-pressed={view === "list"}
                title="Visão de lista"
              >
                <List className="h-3 w-3" />
                Lista
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {view === "calendar" ? (
        <CalendarMonthView
          grid={grid}
          byDate={byDate}
          today={todayDate}
          year={year}
          month={month}
        />
      ) : (
        <CalendarListView
          items={filtered}
          year={year}
          month={month}
        />
      )}
    </div>
  );
}

function CalendarMonthView({
  grid,
  byDate,
  today,
  year,
  month,
}: {
  grid: { date: Date; iso: string; inMonth: boolean }[];
  byDate: Map<string, CalendarDeadlineItem[]>;
  today: Date;
  year: number;
  month: number;
}) {
  const todayIso = toIso(today);
  return (
    <Card>
      <CardContent className="p-0">
        {/* Header de dias da semana */}
        <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-700">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="border-l border-zinc-100 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-500 first:border-l-0 dark:border-zinc-800"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-700">
          {grid.map((cell) => (
            <DayCell
              key={cell.iso + cell.inMonth}
              cell={cell}
              items={byDate.get(cell.iso) || []}
              isToday={cell.iso === todayIso}
              isCurrentMonth={cell.inMonth && cell.date.getMonth() === month && cell.date.getFullYear() === year}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DayCell({
  cell,
  items,
  isToday,
  isCurrentMonth,
}: {
  cell: { date: Date; iso: string; inMonth: boolean };
  items: CalendarDeadlineItem[];
  isToday: boolean;
  isCurrentMonth: boolean;
}) {
  const counts = {
    overdue: items.filter((i) => i.kind === "overdue").length,
    near: items.filter((i) => i.kind === "near").length,
    future: items.filter((i) => i.kind === "future").length,
  };
  const totalItems = items.length;
  const day = cell.date.getDate();

  // Cor do canto superior por severidade dominante
  const dominantTone =
    counts.overdue > 0
      ? "red"
      : counts.near > 0
      ? "amber"
      : counts.future > 0
      ? "zinc"
      : null;

  const tones = {
    red: "border-l-red-500",
    amber: "border-l-amber-500",
    zinc: "border-l-accent-500",
  };

  return (
    <div
      className={cn(
        "group relative min-h-[88px] border-l border-t border-zinc-100 p-1.5 transition-colors first:border-l-0 dark:border-zinc-800",
        !isCurrentMonth && "bg-zinc-50/40 dark:bg-zinc-950/40",
        isToday && "bg-accent-50/40 dark:bg-accent-950/30",
        totalItems > 0 && "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60",
        dominantTone && `border-l-2 ${tones[dominantTone]}`,
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
            isToday
              ? "bg-accent-500 text-white"
              : isCurrentMonth
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-zinc-400 dark:text-zinc-600",
          )}
        >
          {day}
        </span>
        {totalItems > 0 && (
          <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {totalItems}
          </span>
        )}
      </div>

      {/* Marcadores em pontos coloridos pra prévia */}
      {totalItems > 0 && (
        <div className="mt-1 flex flex-wrap gap-0.5">
          {counts.overdue > 0 && (
            <Dot color="bg-red-500" count={counts.overdue} />
          )}
          {counts.near > 0 && (
            <Dot color="bg-amber-500" count={counts.near} />
          )}
          {counts.future > 0 && (
            <Dot color="bg-accent-500" count={counts.future} />
          )}
        </div>
      )}

      {/* Tooltip com lista no hover */}
      {totalItems > 0 && (
        <div
          className={cn(
            "pointer-events-none absolute left-1/2 top-full z-30 mt-1 w-72 -translate-x-1/2",
            "rounded-lg border border-zinc-200 bg-white p-3 shadow-xl",
            "opacity-0 translate-y-1 transition-all duration-150 ease-out",
            "group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0",
            "dark:border-zinc-700 dark:bg-zinc-900",
          )}
          role="tooltip"
        >
          <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" />
          <div className="relative">
            <div className="mb-2 flex items-center justify-between border-b border-zinc-100 pb-1.5 dark:border-zinc-800">
              <p className="text-xs font-semibold capitalize">
                {cell.date.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <span className="text-[10px] text-zinc-500">
                {totalItems} {totalItems === 1 ? "ação" : "ações"}
              </span>
            </div>
            <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
              {items.slice(0, 8).map((it) => (
                <ItemRow key={it.id} item={it} />
              ))}
              {items.length > 8 && (
                <li className="pt-1 text-center text-[10px] text-zinc-400">
                  + {items.length - 8} ação(ões)
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Dot({ color, count }: { color: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] tabular-nums text-zinc-500">
      <span className={cn("h-1.5 w-1.5 rounded-full", color)} />
      {count}
    </span>
  );
}

function ItemRow({ item }: { item: CalendarDeadlineItem }) {
  const tone =
    item.kind === "overdue"
      ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20"
      : item.kind === "near"
      ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20"
      : "border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/30";
  const icon =
    item.kind === "overdue" ? (
      <AlertTriangle className="h-2.5 w-2.5 text-red-600" />
    ) : item.kind === "near" ? (
      <Clock className="h-2.5 w-2.5 text-amber-600" />
    ) : (
      <CalendarIcon className="h-2.5 w-2.5 text-accent-600" />
    );
  return (
    <li>
      <Link
        href="/planos"
        className={cn(
          "flex items-start gap-1.5 rounded border px-2 py-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800",
          tone,
        )}
      >
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium">{item.title}</p>
          <p className="truncate text-[10px] text-zinc-500">
            {item.tenant}
            {item.responsible && ` · ${item.responsible}`}
          </p>
        </div>
      </Link>
    </li>
  );
}

function KindFilter({
  active,
  onClick,
  label,
  count,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone: "red" | "amber" | "zinc";
}) {
  const palette = {
    red: {
      activeBg: "bg-red-50 border-red-300 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300",
      dot: "bg-red-500",
    },
    amber: {
      activeBg: "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300",
      dot: "bg-amber-500",
    },
    zinc: {
      activeBg: "bg-zinc-100 border-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-200",
      dot: "bg-accent-500",
    },
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
        active
          ? palette.activeBg
          : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", palette.dot)} />
      {label}
      <span className="rounded-full bg-white px-1 text-[9px] font-bold tabular-nums dark:bg-zinc-700">
        {count}
      </span>
    </button>
  );
}

function CalendarListView({
  items,
  year,
  month,
}: {
  items: CalendarDeadlineItem[];
  year: number;
  month: number;
}) {
  // Filtra apenas os do mês atual exibido
  const monthFiltered = useMemo(() => {
    return items.filter((i) => {
      const d = new Date(i.planned_end + "T00:00:00");
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [items, year, month]);

  const grouped = useMemo(() => {
    const m = new Map<string, CalendarDeadlineItem[]>();
    for (const i of monthFiltered) {
      if (!m.has(i.planned_end)) m.set(i.planned_end, []);
      m.get(i.planned_end)!.push(i);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [monthFiltered]);

  if (monthFiltered.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <CalendarIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-2 text-sm text-zinc-500">
            Nenhum prazo neste mês.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {grouped.map(([date, list]) => {
        const d = new Date(date + "T00:00:00");
        return (
          <Card key={date}>
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-700">
              <p className="text-sm font-semibold capitalize">
                {d.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <Badge variant="muted">
                {list.length} {list.length === 1 ? "ação" : "ações"}
              </Badge>
            </div>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {list.map((it) => (
                <li key={it.id}>
                  <Link
                    href="/planos"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        it.kind === "overdue"
                          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          : it.kind === "near"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                      )}
                    >
                      {it.kind === "overdue" ? "!" : it.number.slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{it.title}</p>
                      <p className="truncate text-[11px] text-zinc-500">
                        <Building2 className="-mt-0.5 mr-1 inline h-3 w-3" />
                        {it.tenant}
                        {it.responsible && ` · ${it.responsible}`}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
