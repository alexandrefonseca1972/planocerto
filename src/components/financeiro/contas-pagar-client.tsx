"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Plus,
  Search,
  Receipt,
  Calendar,
  AlertTriangle,
  FileText,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ContaForm } from "./conta-form";
import { getContasPagar, getItemBasicsForConta } from "@/app/actions/contas-pagar";
import type {
  ContaComParcelas,
  ContaListFilters,
  ContaStatus,
} from "@/types/financeiro";
import type { Fornecedor } from "@/types/catalog";
import type { CategoriaDespesa } from "@/types/financeiro";
import { formatBRL, formatDateBR } from "@/lib/format-br";

type StatusFiltro = ContaStatus | "atrasado" | "todos";

const STATUS_OPTIONS: { value: StatusFiltro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendente", label: "Pendentes" },
  { value: "parcial", label: "Parcialmente pagas" },
  { value: "atrasado", label: "Atrasadas" },
  { value: "quitado", label: "Quitadas" },
  { value: "cancelado", label: "Canceladas" },
];

function statusBadge(c: ContaComParcelas) {
  if (c.status === "cancelado") return <Badge variant="muted">Cancelada</Badge>;
  if (c.status === "quitado") return <Badge variant="success">Quitada</Badge>;
  if (c.tem_atrasada)
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" /> Atrasada
      </Badge>
    );
  if (c.status === "parcial") return <Badge variant="warning">Parcial</Badge>;
  return <Badge variant="outline">Pendente</Badge>;
}

function diasUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(`${iso}T00:00:00`);
  return Math.round((venc.getTime() - hoje.getTime()) / 86400000);
}

function venceEmBadge(iso: string | null | undefined) {
  const d = diasUntil(iso);
  if (d === null || d > 3 || d < 0) return null;
  if (d === 0)
    return (
      <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        vence hoje
      </span>
    );
  if (d === 1)
    return (
      <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        amanhã
      </span>
    );
  return (
    <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
      em {d}d
    </span>
  );
}

type SortKey = "descricao" | "proxima_vencimento" | "valor_total" | "status";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;

export function ContasPagarClient({
  initial,
  fornecedores,
  categorias,
}: {
  initial: ContaComParcelas[];
  fornecedores: Fornecedor[];
  categorias: CategoriaDespesa[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [items, setItems] = useState<ContaComParcelas[]>(initial);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ContaListFilters>(() => ({
    status: "todos",
    search: "",
    item_id: searchParams.get("item_id") || null,
  }));
  const [sortKey, setSortKey] = useState<SortKey>("proxima_vencimento");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [prefill, setPrefill] = useState<{
    descricao: string;
    plan_id: string;
    item_id: string;
    valor_total: number;
  } | null>(null);

  // Estado do form derivado da URL — imune ao cache do router
  const formParam = searchParams.get("form");
  const editId = searchParams.get("edit_id");
  const showForm = formParam === "new" || formParam === "edit";
  const editing = useMemo(
    () => (formParam === "edit" && editId ? (items.find((c) => c.id === editId) ?? null) : null),
    [formParam, editId, items],
  );

  function openCreate() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("form", "new");
    params.delete("edit_id");
    router.replace(`/financeiro/contas-a-pagar?${params.toString()}`);
  }

  function closeForm() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("form");
    params.delete("edit_id");
    router.replace(`/financeiro/contas-a-pagar?${params.toString()}`);
  }

  useEffect(() => {
    const itemId = searchParams.get("item_id");
    if (itemId) {
      refetch({ status: "todos", search: "", item_id: itemId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const fromItem = searchParams.get("from_item");
    if (!fromItem) return;
    let cancelled = false;

    getItemBasicsForConta(fromItem).then((info) => {
      if (cancelled || !info) return;
      const valorEstimado = parseFloat(
        (info.cost || "").replace(/[^0-9.,-]/g, "").replace(",", "."),
      );
      setPrefill({
        descricao: info.action.slice(0, 200),
        plan_id: info.plan_id,
        item_id: info.id,
        valor_total: Number.isFinite(valorEstimado) ? valorEstimado : 0,
      });
      const params = new URLSearchParams(searchParams.toString());
      params.set("form", "new");
      params.delete("edit_id");
      params.delete("from_item");
      router.replace(`/financeiro/contas-a-pagar?${params.toString()}`);
    });

    return () => {
      cancelled = true;
    };
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  async function refetch(next?: ContaListFilters) {
    setLoading(true);
    try {
      const data = await getContasPagar(next ?? filters);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  function applyFilter<K extends keyof ContaListFilters>(
    key: K,
    value: ContaListFilters[K],
  ) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    refetch(next);
  }

  const sortedItems = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "descricao") {
        cmp = a.descricao.localeCompare(b.descricao, "pt-BR");
      } else if (sortKey === "proxima_vencimento") {
        const av = a.proxima_vencimento ?? "9999-99-99";
        const bv = b.proxima_vencimento ?? "9999-99-99";
        cmp = av.localeCompare(bv);
      } else if (sortKey === "valor_total") {
        cmp = Number(a.valor_total) - Number(b.valor_total);
      } else if (sortKey === "status") {
        cmp = a.status.localeCompare(b.status);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [items, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () =>
      sortedItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sortedItems, safePage],
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setPage(1);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [items.length]);

  const totais = useMemo(() => {
    let aberto = 0;
    let atrasado = 0;
    let pago = 0;
    for (const c of items) {
      if (c.status === "cancelado") continue;
      aberto += c.total_pendente ?? 0;
      pago += c.total_pago ?? 0;
      if (c.tem_atrasada) atrasado += c.total_pendente ?? 0;
    }
    return { aberto, atrasado, pago };
  }, [items]);

  function openEdit(conta: ContaComParcelas) {
    if (conta.status === "cancelado") {
      toast("Conta cancelada não pode ser editada.", "error");
      return;
    }
    if ((conta.total_pago ?? 0) > 0) {
      toast(
        "Estorne os pagamentos antes de editar esta conta.",
        "error",
      );
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("form", "edit");
    params.set("edit_id", conta.id);
    router.replace(`/financeiro/contas-a-pagar?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/financeiro">Financeiro</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Contas a pagar</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Receipt className="h-5 w-5 text-accent-600" /> Contas a pagar
          </h2>
          <p className="text-sm text-zinc-500">
            {items.length} {items.length === 1 ? "conta" : "contas"} no filtro.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nova conta
          </Button>
        </div>
      </div>

      {/* Mini-resumo */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-zinc-500">Em aberto</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatBRL(totais.aberto)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-zinc-500">Atrasado</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-red-600 dark:text-red-400">
              {formatBRL(totais.atrasado)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-zinc-500">Pago (no filtro)</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatBRL(totais.pago)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.status ?? "todos"}
          onChange={(e) =>
            applyFilter("status", e.target.value as StatusFiltro)
          }
          className="h-9 w-44"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>

        <Select
          value={filters.fornecedor_id ?? ""}
          onChange={(e) =>
            applyFilter("fornecedor_id", e.target.value || null)
          }
          className="h-9 w-56"
        >
          <option value="">Todos fornecedores</option>
          {fornecedores
            .filter((f) => f.active)
            .map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
        </Select>

        <Select
          value={filters.categoria_id ?? ""}
          onChange={(e) =>
            applyFilter("categoria_id", e.target.value || null)
          }
          className="h-9 w-56"
        >
          <option value="">Todas categorias</option>
          {categorias
            .filter((c) => c.active)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </Select>

        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={filters.search ?? ""}
            onChange={(e) =>
              setFilters((p) => ({ ...p, search: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") refetch();
            }}
            onBlur={() => refetch()}
            placeholder="Buscar descrição ou nº documento..."
            className="h-9 pl-8"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800/50"
              />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            <Receipt className="mx-auto mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-700" />
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              Nenhuma conta encontrada
            </p>
            <p className="mt-1 text-xs">
              Ajuste os filtros ou clique em &ldquo;Nova conta&rdquo; para
              começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr className="text-left text-xs font-medium uppercase text-zinc-500">
                  <SortHeader
                    label="Descrição"
                    sortKey="descricao"
                    activeSort={sortKey}
                    activeDir={sortDir}
                    onClick={toggleSort}
                  />
                  <th className="px-3 py-2 hidden md:table-cell">Fornecedor</th>
                  <th className="px-3 py-2 hidden lg:table-cell">Categoria</th>
                  <SortHeader
                    label="Próx. venc."
                    sortKey="proxima_vencimento"
                    activeSort={sortKey}
                    activeDir={sortDir}
                    onClick={toggleSort}
                    className="hidden md:table-cell"
                  />
                  <SortHeader
                    label="Valor"
                    sortKey="valor_total"
                    activeSort={sortKey}
                    activeDir={sortDir}
                    onClick={toggleSort}
                    align="right"
                  />
                  <th className="px-3 py-2 text-right hidden sm:table-cell">
                    Em aberto
                  </th>
                  <SortHeader
                    label="Status"
                    sortKey="status"
                    activeSort={sortKey}
                    activeDir={sortDir}
                    onClick={toggleSort}
                  />
                  <th className="px-3 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {pageItems.map((c) => {
                  const atrasada =
                    c.tem_atrasada && c.status !== "cancelado";
                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors ${
                        atrasada
                          ? "bg-red-50/50 hover:bg-red-50 dark:bg-red-950/15 dark:hover:bg-red-950/25"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                      } ${c.status === "cancelado" ? "opacity-60" : ""}`}
                    >
                      <td className="px-3 py-2 font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/financeiro/contas-a-pagar/${c.id}`}
                            className="hover:underline"
                          >
                            {c.descricao}
                          </Link>
                          {c.documento && (
                            <span className="text-xs text-zinc-400">
                              • {c.documento}
                            </span>
                          )}
                        </div>
                        {c.plan_id && (
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-300">
                            <FileText className="h-3 w-3" />
                            Plano: {c.plan_title || c.plan_id.slice(0, 8)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300 hidden md:table-cell">
                        {c.fornecedor_nome || "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300 hidden lg:table-cell">
                        {c.categoria_nome || "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-500 hidden md:table-cell">
                        {c.proxima_vencimento ? (
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Calendar className="h-3 w-3" />
                            {formatDateBR(c.proxima_vencimento)}
                            {!atrasada && venceEmBadge(c.proxima_vencimento)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatBRL(Number(c.valor_total))}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell">
                        {formatBRL(c.total_pendente ?? 0)}
                      </td>
                      <td className="px-3 py-2">{statusBadge(c)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/financeiro/contas-a-pagar/${c.id}`}
                            className={buttonVariants({
                              variant: "ghost",
                              size: "sm",
                            })}
                          >
                            Detalhes
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(c)}
                            disabled={
                              c.status === "cancelado" ||
                              (c.total_pago ?? 0) > 0
                            }
                          >
                            Editar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 px-1 text-xs text-zinc-500">
              <span>
                {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, sortedItems.length)} de{" "}
                {sortedItems.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="h-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="tabular-nums px-2">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="h-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <ContaForm
          key={`${formParam}-${editId ?? "new"}`}
          open
          conta={editing}
          fornecedores={fornecedores}
          categorias={categorias}
          prefill={prefill ?? undefined}
          onClose={() => {
            setPrefill(null);
            closeForm();
          }}
          onSuccess={(contaId) => {
            setPrefill(null);
            refetch();
            if (contaId && !editing) {
              router.replace(`/financeiro/contas-a-pagar/${contaId}`);
            } else {
              closeForm();
            }
          }}
        />
      )}
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  activeSort,
  activeDir,
  onClick,
  align = "left",
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  activeSort: SortKey;
  activeDir: SortDir;
  onClick: (k: SortKey) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const isActive = activeSort === sortKey;
  return (
    <th className={`px-3 py-2 ${align === "right" ? "text-right" : ""} ${className}`}>
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={`inline-flex items-center gap-1 ${
          align === "right" ? "justify-end" : ""
        } font-medium uppercase hover:text-zinc-900 dark:hover:text-zinc-50 ${
          isActive ? "text-zinc-900 dark:text-zinc-50" : ""
        }`}
      >
        {label}
        {isActive &&
          (activeDir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          ))}
      </button>
    </th>
  );
}
