"use client";

import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Cabeçalho de coluna com setinha de ordenação.
 *
 * <SortableTh
 *   label="Nome"
 *   sortKey="name"
 *   activeKey={sort.key}
 *   asc={sort.asc}
 *   onSort={setSort}
 * />
 */
export function SortableTh<K extends string>({
  label,
  sortKey,
  activeKey,
  asc,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  sortKey: K;
  activeKey: K | null;
  asc: boolean;
  onSort: (key: K) => void;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const isActive = activeKey === sortKey;
  const Arrow = !isActive ? ArrowUpDown : asc ? ArrowUp : ArrowDown;
  const justify =
    align === "right"
      ? "justify-end"
      : align === "center"
      ? "justify-center"
      : "justify-start";
  return (
    <th
      aria-sort={isActive ? (asc ? "ascending" : "descending") : "none"}
      className={cn(
        "px-3 py-2",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex w-full items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors",
          justify,
          isActive
            ? "text-zinc-900 dark:text-zinc-100"
            : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
        )}
      >
        {label}
        <Arrow
          className={cn(
            "h-3 w-3 shrink-0 transition-opacity",
            isActive ? "opacity-100" : "opacity-50",
          )}
        />
      </button>
    </th>
  );
}

/**
 * Hook que gerencia sort + paginação para uma lista filtrada.
 */
export function useDataTable<T, K extends string>(
  items: T[],
  options: {
    initialSort?: K | null;
    initialAsc?: boolean;
    initialPageSize?: 10 | 20 | 50 | 100;
    sortAccessor?: (item: T, key: K) => string | number;
  },
) {
  const [sortKey, setSortKey] = useState<K | null>(options.initialSort ?? null);
  const [asc, setAsc] = useState(options.initialAsc ?? true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 20 | 50 | 100>(
    options.initialPageSize ?? 20,
  );

  const sorted = useMemo(() => {
    if (!sortKey || !options.sortAccessor) return items;
    const accessor = options.sortAccessor;
    return [...items].sort((a, b) => {
      const av = accessor(a, sortKey);
      const bv = accessor(b, sortKey);
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv), "pt-BR");
      }
      return asc ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, sortKey, asc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;
  const pageItems = sorted.slice(offset, offset + pageSize);

  function handleSort(key: K) {
    if (sortKey === key) {
      setAsc((v) => !v);
    } else {
      setSortKey(key);
      setAsc(true);
    }
    setPage(1);
  }

  function changePageSize(size: 10 | 20 | 50 | 100) {
    setPageSize(size);
    setPage(1);
  }

  return {
    sorted,
    pageItems,
    sortKey,
    asc,
    handleSort,
    page: safePage,
    setPage,
    pageSize,
    setPageSize: changePageSize,
    totalPages,
    totalItems: sorted.length,
    offset,
  };
}

/**
 * Rodapé com paginação + seletor de tamanho de página.
 */
export function TablePagination({
  page,
  totalPages,
  pageSize,
  totalItems,
  offset,
  onPage,
  onPageSize,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  offset: number;
  onPage: (p: number) => void;
  onPageSize: (s: 10 | 20 | 50 | 100) => void;
}) {
  if (totalItems === 0) return null;
  const last = Math.min(offset + pageSize, totalItems);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-3 py-2 text-xs dark:border-zinc-800">
      <div className="flex items-center gap-2 text-zinc-500">
        <span>Exibir</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value) as 10 | 20 | 50 | 100)}
          className="h-7 rounded-md border border-zinc-200 bg-white px-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="tabular-nums">
          {offset + 1}–{last} de {totalItems.toLocaleString("pt-BR")}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPage(1)}
          disabled={page === 1}
          aria-label="Primeira página"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="px-2 text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
          Pág. <strong>{page}</strong> / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPage(totalPages)}
          disabled={page === totalPages}
          aria-label="Última página"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
