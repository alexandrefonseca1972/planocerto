"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Receipt, Wallet, AlertTriangle, CheckCircle, Calendar,
  ChevronLeft, ChevronRight, RefreshCw, BarChart2, List, Users,
  CircleDot,
} from "lucide-react";
import { getResumoContas } from "@/app/actions/contas-pagar";
import { formatBRL, formatDateBR } from "@/lib/format-br";
import type { ResumoFinanceiro } from "@/types/financeiro";
import type { Fornecedor } from "@/types/catalog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Helpers de período ────────────────────────────────────────────────────

const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];
const MESES_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function rangeDoMes(mes: number, ano: number) {
  const from = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const lastDay = new Date(ano, mes, 0).getDate();
  const to = `${ano}-${String(mes).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

function diasAteVencer(iso: string) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${iso}T00:00:00`).getTime() - hoje.getTime()) / 86400000);
}

// ─── Sub-componentes ───────────────────────────────────────────────────────

function UrgenciaBadge({ vencimento }: { vencimento: string }) {
  const d = diasAteVencer(vencimento);
  if (d < 0) return <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">{Math.abs(d)}d atrasado</span>;
  if (d === 0) return <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">vence hoje</span>;
  if (d <= 3) return <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">{d}d</span>;
  return null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendente:  { label: "Pendente",  color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-100 dark:bg-amber-950/40" },
  parcial:   { label: "Parcial",   color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-100 dark:bg-blue-950/40" },
  quitado:   { label: "Quitado",   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950/40" },
  cancelado: { label: "Cancelado", color: "text-zinc-400",                        bg: "bg-zinc-100 dark:bg-zinc-800" },
};

type ViewMode = "vencimentos" | "fornecedor" | "status" | "anual";

// ─── Client ────────────────────────────────────────────────────────────────

export function FinanceiroClient({
  initialResumo,
  initialFornecedores,
}: {
  initialResumo: ResumoFinanceiro | null;
  initialFornecedores: Fornecedor[];
}) {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();

  const [periodoModo, setPeriodoModo] = useState<"mes" | "customizado" | "anual">("mes");
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(anoAtual);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [fornecedorFiltro, setFornecedorFiltro] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("vencimentos");

  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(initialResumo);
  const fornecedores = initialFornecedores;
  const [loading, setLoading] = useState(false);

  // Skip the first load() run — the server already fetched the default-month data.
  const skipNextLoad = useRef(true);

  const range = useMemo(() => {
    if (periodoModo === "mes") return rangeDoMes(mes, ano);
    if (periodoModo === "customizado" && customFrom && customTo) return { from: customFrom, to: customTo };
    return undefined;
  }, [periodoModo, mes, ano, customFrom, customTo]);

  const load = useCallback(() => {
    if (skipNextLoad.current) {
      skipNextLoad.current = false;
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const data = await getResumoContas({
          range,
          fornecedor_id: fornecedorFiltro || null,
          ano: periodoModo === "anual" ? ano : anoAtual,
        });
        if (!cancelled) setResumo(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, fornecedorFiltro, periodoModo, ano]);

  useEffect(load, [load]);

  function navMes(delta: number) {
    setMes((m) => {
      const nm = m + delta;
      if (nm < 1) { setAno((a) => a - 1); return 12; }
      if (nm > 12) { setAno((a) => a + 1); return 1; }
      return nm;
    });
  }

  const isMesAtual = mes === hoje.getMonth() + 1 && ano === anoAtual;

  const periodoLabel = useMemo(() => {
    if (periodoModo === "mes") return `${MESES_FULL[mes - 1]} ${ano}`;
    if (periodoModo === "anual") return `Ano ${ano}`;
    if (customFrom && customTo) return `${formatDateBR(customFrom)} – ${formatDateBR(customTo)}`;
    return "Período personalizado";
  }, [periodoModo, mes, ano, customFrom, customTo]);

  const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: "vencimentos", label: "Vencimentos", icon: <Calendar className="h-4 w-4" /> },
    { id: "fornecedor",  label: "Fornecedor",  icon: <Users className="h-4 w-4" /> },
    { id: "status",      label: "Por status",   icon: <CircleDot className="h-4 w-4" /> },
    { id: "anual",       label: "Anual",        icon: <BarChart2 className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbPage>Financeiro</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Wallet className="h-5 w-5 text-accent-600" /> Financeiro
          </h2>
          <p className="text-sm text-zinc-500">Acompanhe contas a pagar, vencimentos e pagamentos.</p>
        </div>
        <Link href="/financeiro/contas-a-pagar" className={buttonVariants({ variant: "default" })}>
          <Receipt className="h-4 w-4" /> Contas a pagar
        </Link>
      </div>

      {/* Controles de filtro */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Modo de período */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Período</label>
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800/40">
            {(["mes", "customizado", "anual"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setPeriodoModo(m)}
                className={cn("rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  periodoModo === m ? "bg-white shadow-sm dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}>
                {m === "mes" ? "Mensal" : m === "customizado" ? "Personalizado" : "Anual"}
              </button>
            ))}
          </div>
        </div>

        {/* Navegação mensal */}
        {periodoModo === "mes" && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => navMes(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="min-w-[160px] text-center text-sm font-semibold">{MESES_FULL[mes - 1]} {ano}</span>
            <Button variant="outline" size="sm" onClick={() => navMes(1)}><ChevronRight className="h-4 w-4" /></Button>
            {!isMesAtual && (
              <Button variant="ghost" size="sm" onClick={() => { setMes(hoje.getMonth() + 1); setAno(anoAtual); }} className="ml-1 text-xs text-zinc-500">
                <RefreshCw className="h-3 w-3 mr-1" /> Hoje
              </Button>
            )}
          </div>
        )}

        {/* Período customizado */}
        {periodoModo === "customizado" && (
          <div className="flex items-center gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">De</label>
              <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-9 w-36" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Até</label>
              <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-9 w-36" />
            </div>
          </div>
        )}

        {/* Ano (modo anual) */}
        {periodoModo === "anual" && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setAno((a) => a - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="min-w-[80px] text-center text-sm font-semibold">{ano}</span>
            <Button variant="outline" size="sm" onClick={() => setAno((a) => a + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        )}

        {/* Fornecedor */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Fornecedor</label>
          <Select value={fornecedorFiltro} onChange={(e) => setFornecedorFiltro(e.target.value)} className="h-9 w-48">
            <option value="">Todos</option>
            {fornecedores.filter((f) => f.active).map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </Select>
        </div>

        {loading && <span className="text-xs text-zinc-400 animate-pulse pb-1">carregando...</span>}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Em aberto", value: resumo?.total_em_aberto, sub: `${resumo?.contas_quantidade ?? 0} contas ativas`,
            icon: <List className="h-4 w-4 text-zinc-400" />, color: "",
          },
          {
            label: "Atrasado", value: resumo?.total_atrasado, sub: null,
            icon: <AlertTriangle className="h-4 w-4 text-red-500" />, color: "text-red-600 dark:text-red-400",
            border: (resumo?.total_atrasado ?? 0) > 0,
          },
          {
            label: periodoModo === "anual" ? "Pago (ano)" : "Pago no período", value: resumo?.total_pago_periodo, sub: periodoLabel,
            icon: <CheckCircle className="h-4 w-4 text-emerald-500" />, color: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Próximas 7 dias", value: null, sub: formatBRL(resumo?.proximas_7d.reduce((s, p) => s + p.valor, 0) ?? 0),
            icon: <Calendar className="h-4 w-4 text-zinc-400" />, color: "",
            count: resumo?.proximas_7d.length,
          },
        ].map((card, i) => (
          <Card key={i} className={card.border ? "border-red-200 dark:border-red-900/50" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase text-zinc-500">{card.label}</p>
                {card.icon}
              </div>
              {loading ? <Skeleton className="mt-2 h-8 w-28" /> : (
                <p className={cn("mt-1 text-2xl font-semibold tabular-nums", card.color)}>
                  {card.count !== undefined ? card.count : formatBRL(card.value ?? 0)}
                </p>
              )}
              {card.sub && <p className="mt-0.5 text-xs text-zinc-500">{loading && i === 0 ? "" : card.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs de view */}
      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-700">
        {views.map((v) => (
          <button key={v.id} type="button" onClick={() => setViewMode(v.id)}
            className={cn("flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              viewMode === v.id
                ? "border-accent-500 text-accent-600 dark:text-accent-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200")}>
            {v.icon}{v.label}
          </button>
        ))}
      </div>

      {viewMode === "vencimentos" && (
        <VencimentosMes resumo={resumo} loading={loading} periodoModo={periodoModo} />
      )}
      {viewMode === "fornecedor" && (
        <PorFornecedor resumo={resumo} loading={loading} />
      )}
      {viewMode === "status" && (
        <PorStatus resumo={resumo} loading={loading} />
      )}
      {viewMode === "anual" && (
        <Anual resumo={resumo} loading={loading} ano={ano} />
      )}
    </div>
  );
}

// ─── View: Vencimentos do mês ──────────────────────────────────────────────

function VencimentosMes({ resumo, loading, periodoModo }: { resumo: ResumoFinanceiro | null; loading: boolean; periodoModo: string }) {
  const lista = periodoModo === "mes" || periodoModo === "customizado"
    ? (resumo?.vencimentos_mes ?? [])
    : (resumo?.proximas_7d.map((p) => ({ ...p, atrasada: diasAteVencer(p.vencimento) < 0 })) ?? []);

  const titulo = periodoModo === "anual" ? "Próximos vencimentos (7 dias)" : "Vencimentos no período";

  if (loading) return <Card><CardContent className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>;

  if (lista.length === 0) return (
    <Card><CardContent className="flex flex-col items-center py-12 text-center">
      <Calendar className="mb-3 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Nenhum vencimento no período</p>
    </CardContent></Card>
  );

  const total = lista.reduce((s, p) => s + p.valor, 0);
  const atrasadas = lista.filter((p) => p.atrasada);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <h3 className="text-sm font-semibold">{titulo}</h3>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            {atrasadas.length > 0 && <span className="text-red-600 dark:text-red-400 font-medium">{atrasadas.length} atrasada{atrasadas.length !== 1 ? "s" : ""}</span>}
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{formatBRL(total)}</span>
          </div>
        </div>
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {lista.map((p) => (
            <li key={p.parcela_id}
              className={cn("flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40",
                p.atrasada && "bg-red-50/40 dark:bg-red-950/10")}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/financeiro/contas-a-pagar/${p.conta_id}`} className="truncate font-medium hover:underline">{p.descricao}</Link>
                  <UrgenciaBadge vencimento={p.vencimento} />
                </div>
                <p className="text-xs text-zinc-500 tabular-nums">Vence em {formatDateBR(p.vencimento)}</p>
              </div>
              <span className="font-semibold tabular-nums">{formatBRL(p.valor)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ─── View: Por fornecedor ──────────────────────────────────────────────────

function PorFornecedor({ resumo, loading }: { resumo: ResumoFinanceiro | null; loading: boolean }) {
  if (loading) return <Card><CardContent className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>;

  const lista = resumo?.por_fornecedor ?? [];
  if (lista.length === 0) return (
    <Card><CardContent className="flex flex-col items-center py-12 text-center">
      <Users className="mb-3 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Nenhum dado de fornecedor no período</p>
    </CardContent></Card>
  );

  const maxTotal = Math.max(...lista.map((f) => f.total_pago + f.total_aberto), 1);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <h3 className="text-sm font-semibold">Por fornecedor</h3>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {lista.map((f) => {
            const total = f.total_pago + f.total_aberto;
            return (
              <div key={f.fornecedor_id ?? "sem"} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[60%]">{f.fornecedor_nome}</span>
                  <span className="tabular-nums text-zinc-600 dark:text-zinc-300 text-xs">{formatBRL(total)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div className="flex h-full">
                    <div className="bg-emerald-500 transition-all" style={{ width: `${(f.total_pago / maxTotal) * 100}%` }} />
                    <div className="bg-amber-400 transition-all" style={{ width: `${(f.total_aberto / maxTotal) * 100}%` }} />
                  </div>
                </div>
                <div className="flex gap-3 text-[11px] text-zinc-500">
                  {f.total_pago > 0 && <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />Pago {formatBRL(f.total_pago)}</span>}
                  {f.total_aberto > 0 && <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" />Em aberto {formatBRL(f.total_aberto)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── View: Por status ──────────────────────────────────────────────────────

function PorStatus({ resumo, loading }: { resumo: ResumoFinanceiro | null; loading: boolean }) {
  if (loading) return <Card><CardContent className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</CardContent></Card>;

  const lista = resumo?.por_status ?? [];
  if (lista.length === 0) return (
    <Card><CardContent className="flex flex-col items-center py-12 text-center">
      <CircleDot className="mb-3 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Nenhuma conta no período</p>
    </CardContent></Card>
  );

  const totalQtd = lista.reduce((s, x) => s + x.quantidade, 0);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {lista.map((s) => {
        const cfg = STATUS_CONFIG[s.status] ?? { label: s.status, color: "text-zinc-600", bg: "bg-zinc-100" };
        const pctQtd = totalQtd > 0 ? Math.round((s.quantidade / totalQtd) * 100) : 0;
        return (
          <Card key={s.status}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", cfg.bg, cfg.color)}>
                  <CircleDot className="h-3 w-3" />{cfg.label}
                </span>
                <span className="text-xs text-zinc-400">{pctQtd}%</span>
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums">{s.quantidade}</p>
              <p className="text-xs text-zinc-500 tabular-nums">{s.quantidade === 1 ? "conta" : "contas"} · {formatBRL(s.valor_total)}</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className={cn("h-full rounded-full", s.status === "quitado" ? "bg-emerald-500" : s.status === "pendente" ? "bg-amber-400" : s.status === "parcial" ? "bg-blue-500" : "bg-zinc-300")}
                  style={{ width: `${pctQtd}%` }} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── View: Anual ───────────────────────────────────────────────────────────

function Anual({ resumo, loading, ano }: { resumo: ResumoFinanceiro | null; loading: boolean; ano: number }) {
  if (loading) return <Card><CardContent className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>;

  const por_mes = resumo?.por_mes ?? [];
  const maxVal = Math.max(...por_mes.map((m) => m.total_pago + m.total_aberto), 1);
  const totalPago = por_mes.reduce((s, m) => s + m.total_pago, 0);
  const totalAberto = por_mes.reduce((s, m) => s + m.total_aberto, 0);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <h3 className="text-sm font-semibold">Fluxo anual — {ano}</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" /><span className="text-zinc-500">Pago</span><span className="font-semibold text-zinc-700 dark:text-zinc-200 ml-1">{formatBRL(totalPago)}</span></span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" /><span className="text-zinc-500">Em aberto</span><span className="font-semibold text-zinc-700 dark:text-zinc-200 ml-1">{formatBRL(totalAberto)}</span></span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/30">
                <th className="px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-zinc-400 w-20">Mês</th>
                <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-zinc-400">Pago</th>
                <th className="px-4 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-zinc-400">Em aberto</th>
                <th className="px-4 py-2 w-1/3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {por_mes.map((m) => {
                const total = m.total_pago + m.total_aberto;
                const pctPago = maxVal > 0 ? (m.total_pago / maxVal) * 100 : 0;
                const pctAberto = maxVal > 0 ? (m.total_aberto / maxVal) * 100 : 0;
                const monthIndex = Number(m.mes.slice(5, 7)) - 1;
                const isCurrent = m.mes === `${ano}-${String(new Date().getMonth() + 1).padStart(2, "0")}` && ano === new Date().getFullYear();
                return (
                  <tr key={m.mes} className={cn("transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30", isCurrent && "bg-accent-50/40 dark:bg-accent-950/10")}>
                    <td className="px-4 py-2.5 font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                      {MESES[monthIndex] ?? m.mes}
                      {isCurrent && <span className="ml-1.5 rounded bg-accent-100 px-1 py-0.5 text-[10px] font-semibold text-accent-700 dark:bg-accent-950/40 dark:text-accent-300">atual</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">{m.total_pago > 0 ? formatBRL(m.total_pago) : <span className="text-zinc-300 dark:text-zinc-600">—</span>}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-amber-600 dark:text-amber-400">{m.total_aberto > 0 ? formatBRL(m.total_aberto) : <span className="text-zinc-300 dark:text-zinc-600">—</span>}</td>
                    <td className="px-4 py-2.5">
                      {total > 0 && (
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div className="bg-emerald-500 transition-all" style={{ width: `${pctPago}%` }} />
                          <div className="bg-amber-400 transition-all" style={{ width: `${pctAberto}%` }} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
