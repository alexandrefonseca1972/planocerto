"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { DistributionCard } from "@/components/dashboard/distribution-card";
import { DetailTable } from "@/components/dashboard/detail-table";
import { AreaUnitFilter } from "@/components/dashboard/area-unit-filter";
import { useTenant } from "@/lib/contexts/tenant-context";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Clock,
  CreditCard,
  DollarSign,
  GraduationCap,
  ListTodo,
  MapPin,
  Pause,
  TrendingUp,
  Users,
} from "lucide-react";

export interface UnitSummary {
  id: string;
  name: string;
  uf: string;
  area_id: string | null;
  tenant_id: string | null;
  totalActions: number;
  completed: number;
  inProgress: number;
  pending: number;
  progress: number;
  progressPct: number;
  overdue: number;
  preco: number;
  inscritosEsperado: number;
  inscritosReal: number;
  matFinEsperado: number;
  matFinReal: number;
  matAcadEsperado: number;
  matAcadReal: number;
}

export interface AreaInfo {
  id: string;
  name: string;
  tenant_id: string | null;
}

type DeadlineKind = "overdue" | "near" | "future";

interface DeadlineItem {
  id: string;
  title: string;
  deadline: string;
  unitName: string;
  unitId: string | null;
  areaId: string | null;
  number: string;
  urgent: boolean;
  daysLeft: number;
  planId: string;
  kind: DeadlineKind;
}

interface DashboardClientProps {
  userName: string;
  userPermissions?: Record<string, boolean>;
  unitSummaries: UnitSummary[];
  areas: AreaInfo[];
  deadlines: DeadlineItem[];
  sparklineData: number[];
}

export function DashboardClient({
  userName,
  unitSummaries,
  areas,
  deadlines: allDeadlines,
}: DashboardClientProps) {
  const { selectedTenantIds, currentTenant } = useTenant();

  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set());

  function toggleArea(key: string) {
    setCollapsedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // 1ª camada: filtra por Empresa(s) selecionada(s) no TenantSwitcher
  const tenantScopedUnits = useMemo(
    () =>
      unitSummaries.filter(
        (u) => u.tenant_id && selectedTenantIds.includes(u.tenant_id),
      ),
    [unitSummaries, selectedTenantIds],
  );

  const tenantScopedAreas = useMemo(
    () =>
      areas.filter((a) => a.tenant_id && selectedTenantIds.includes(a.tenant_id)),
    [areas, selectedTenantIds],
  );

  // 2ª camada: filtra por Unidades selecionadas (vazio = todas)
  const filteredUnits = useMemo(() => {
    if (selectedUnitIds.length === 0) return tenantScopedUnits;
    const set = new Set(selectedUnitIds);
    return tenantScopedUnits.filter((u) => set.has(u.id));
  }, [tenantScopedUnits, selectedUnitIds]);

  const filteredDeadlines = useMemo(() => {
    const ids = new Set(filteredUnits.map((u) => u.id));
    return allDeadlines.filter((d) => d.unitId && ids.has(d.unitId));
  }, [allDeadlines, filteredUnits]);

  const totals = useMemo(() => {
    let total = 0,
      completed = 0,
      progress = 0,
      pending = 0,
      overdue = 0,
      preco = 0,
      insE = 0,
      insR = 0,
      fE = 0,
      fR = 0,
      aE = 0,
      aR = 0;
    for (const u of filteredUnits) {
      total += u.totalActions;
      completed += u.completed;
      progress += u.inProgress;
      pending += u.pending;
      overdue += u.overdue;
      preco += u.preco;
      insE += u.inscritosEsperado;
      insR += u.inscritosReal;
      fE += u.matFinEsperado;
      fR += u.matFinReal;
      aE += u.matAcadEsperado;
      aR += u.matAcadReal;
    }
    return { total, completed, progress, pending, overdue, preco, insE, insR, fE, fR, aE, aR };
  }, [filteredUnits]);

  const pct = (n: number) =>
    totals.total > 0 ? Math.round((n / totals.total) * 100) : 0;

  // Agrupa unidades filtradas por área
  const unitsByArea = useMemo(() => {
    const map = new Map<string | null, UnitSummary[]>();
    for (const u of filteredUnits) {
      const k = u.area_id;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(u);
    }
    return map;
  }, [filteredUnits]);

  const greeting =
    new Date().getHours() < 12
      ? "Bom dia"
      : new Date().getHours() < 18
      ? "Boa tarde"
      : "Boa noite";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
            {greeting}
          </p>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {userName}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {currentTenant?.name ? (
              <>
                <Building2 className="mr-1 inline h-3 w-3" />
                {currentTenant.name} ·{" "}
              </>
            ) : null}
            {filteredUnits.length} {filteredUnits.length === 1 ? "unidade" : "unidades"}
          </p>
        </div>
        <Link
          href="/planos"
          className="inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:underline dark:text-accent-400"
        >
          Ver planos <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Filtro Áreas + Unidades em uma única selectlist */}
      <AreaUnitFilter
        areas={tenantScopedAreas}
        units={tenantScopedUnits.map((u) => ({
          id: u.id,
          name: u.name,
          area_id: u.area_id,
          uf: u.uf,
        }))}
        selectedUnitIds={selectedUnitIds}
        onChangeUnits={setSelectedUnitIds}
      />

      <Tabs defaultValue="indicadores" className="space-y-4">
        <TabsList className="h-10 w-full sm:w-auto sm:inline-flex">
          <TabsTrigger value="indicadores">
            <TrendingUp className="mr-1.5 h-3.5 w-3.5" /> Indicadores
          </TabsTrigger>
          <TabsTrigger value="unidades">
            <Building2 className="mr-1.5 h-3.5 w-3.5" /> Unidades
          </TabsTrigger>
          <TabsTrigger value="analise">
            <ListTodo className="mr-1.5 h-3.5 w-3.5" /> Detalhamento
          </TabsTrigger>
        </TabsList>

        {/* TAB 1 — Indicadores: KPI Row + Status Row */}
        <TabsContent value="indicadores" className="space-y-3">
          {/* KPI Row — métricas do plano */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiPriceCard preco={totals.preco} totalActions={totals.total} />
            <KpiFunilCard
              icon={Users}
              label="Inscritos"
              esperado={totals.insE}
              real={totals.insR}
              color="accent"
            />
            <KpiFunilCard
              icon={CreditCard}
              label="Mat. Financeira"
              esperado={totals.fE}
              real={totals.fR}
              color="blue"
            />
            <KpiFunilCard
              icon={GraduationCap}
              label="Mat. Acadêmica"
              esperado={totals.aE}
              real={totals.aR}
              color="emerald"
            />
          </div>

          {/* Status Row */}
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <StatusCard
              icon={ListTodo}
              label="Total"
              value={totals.total}
              subtitle={`${filteredUnits.length} unidades`}
              color="text-zinc-700 dark:text-zinc-300"
              accent="bg-zinc-500"
            />
            <StatusCard
              icon={CheckCircle2}
              label="Concluídas"
              value={totals.completed}
              percent={pct(totals.completed)}
              color="text-emerald-600 dark:text-emerald-400"
              accent="bg-emerald-500"
            />
            <StatusCard
              icon={Clock}
              label="Em andamento"
              value={totals.progress}
              percent={pct(totals.progress)}
              color="text-amber-600 dark:text-amber-400"
              accent="bg-amber-500"
            />
            <StatusCard
              icon={CircleDashed}
              label="Pendentes"
              value={totals.pending}
              percent={pct(totals.pending)}
              color="text-blue-600 dark:text-blue-400"
              accent="bg-blue-500"
            />
            <StatusCard
              icon={AlertTriangle}
              label="Atrasadas"
              value={totals.overdue}
              percent={pct(totals.overdue)}
              color="text-red-600 dark:text-red-400"
              accent="bg-red-500"
            />
          </div>

          {/* Distribuição + Prazos */}
          <div className="grid gap-3 lg:grid-cols-2">
            <DistributionCard
              completed={totals.completed}
              progress={totals.progress}
              pending={totals.pending}
              overdue={totals.overdue}
              total={totals.total}
            />
            <DeadlinesCard deadlines={filteredDeadlines} />
          </div>
        </TabsContent>

        {/* TAB 2 — Unidades por Área */}
        <TabsContent value="unidades" className="space-y-3">
          {filteredUnits.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-zinc-500">
                <MapPin className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
                Nenhuma unidade encontrada com os filtros atuais.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Toolbar: ações de expandir/recolher */}
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setCollapsedAreas(new Set())}
                  className="text-[11px] font-medium text-accent-600 hover:underline dark:text-accent-400"
                >
                  Expandir todas
                </button>
                <span className="text-[11px] text-zinc-300 dark:text-zinc-700">·</span>
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedAreas(
                      new Set(
                        Array.from(unitsByArea.keys()).map((k) => k ?? "no-area"),
                      ),
                    )
                  }
                  className="text-[11px] font-medium text-zinc-500 hover:underline dark:text-zinc-400"
                >
                  Recolher todas
                </button>
              </div>

              {Array.from(unitsByArea.entries()).map(([areaId, list]) => {
                const areaName =
                  areas.find((a) => a.id === areaId)?.name || "Sem área";
                const key = areaId ?? "no-area";
                const collapsed = collapsedAreas.has(key);
                return (
                  <Card key={key}>
                    <CardHeader className="pb-2">
                      <button
                        type="button"
                        onClick={() => toggleArea(key)}
                        className="group flex w-full items-center justify-between gap-2 rounded-md text-left"
                        aria-expanded={!collapsed}
                      >
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                          <MapPin className="h-4 w-4 text-accent-600" />
                          {areaName}
                          <Badge variant="muted" className="ml-1">
                            {list.length} {list.length === 1 ? "unidade" : "unidades"}
                          </Badge>
                        </CardTitle>
                        <span className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors group-hover:bg-zinc-100 group-hover:text-zinc-700 dark:group-hover:bg-zinc-800 dark:group-hover:text-zinc-200">
                          {collapsed ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                        </span>
                      </button>
                    </CardHeader>
                    {!collapsed && (
                      <CardContent>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {list.map((u) => (
                            <UnitMiniCard key={u.id} unit={u} />
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </>
          )}
        </TabsContent>

        {/* TAB 3 — Detalhamento: tabela completa */}
        <TabsContent value="analise" className="space-y-3">
          <DetailTable
            units={filteredUnits.map((u) => ({
              id: u.id,
              name: u.name,
              totalActions: u.totalActions,
              completed: u.completed,
              inProgress: u.inProgress,
              pending: u.pending,
              progressPct: u.progressPct,
              overdue: u.overdue,
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UnitMiniCard({ unit }: { unit: UnitSummary }) {
  const total = unit.totalActions;
  const isDone = total > 0 && unit.progress >= 100;
  const isEmpty = total === 0;

  return (
    <div className="group relative">
      <Link
        href="/planos"
        className={cn(
          "block rounded-lg border border-zinc-200 bg-white p-2 transition-all duration-200 dark:border-zinc-700 dark:bg-zinc-900",
          "hover:border-accent-500 hover:bg-accent-50/40 hover:shadow-md hover:-translate-y-0.5",
          "dark:hover:bg-accent-950/20 dark:hover:border-accent-400",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight text-zinc-900 transition-colors group-hover:text-accent-700 dark:text-zinc-50 dark:group-hover:text-accent-300">
              {unit.name}
            </p>
            {unit.uf && (
              <p className="text-[9px] font-medium text-zinc-400">{unit.uf}</p>
            )}
          </div>
          {isDone && (
            <Badge variant="success" className="shrink-0 gap-1 px-1.5 py-0 text-[10px]">
              <CheckCircle2 className="h-2.5 w-2.5" />
              100%
            </Badge>
          )}
          {isEmpty && (
            <Badge variant="muted" className="shrink-0 px-1.5 py-0 text-[10px]">
              —
            </Badge>
          )}
        </div>

        {/* Barra empilhada com 4 segmentos proporcionais */}
        <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          {total > 0 && (
            <>
              <BarSeg value={unit.completed} total={total} color="bg-emerald-500" />
              <BarSeg value={unit.inProgress} total={total} color="bg-blue-500" />
              <BarSeg value={unit.pending} total={total} color="bg-amber-500" />
              <BarSeg value={unit.overdue} total={total} color="bg-red-500" />
            </>
          )}
        </div>

        {/* Linha resumo: total à esquerda, breakdown colorido à direita */}
        <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
          <span className="tabular-nums">{total} ações</span>
          <span className="flex items-center gap-1.5 tabular-nums">
            <Tally color="text-emerald-600" value={unit.completed} />
            <Tally color="text-blue-600" value={unit.inProgress} />
            <Tally color="text-amber-600" value={unit.pending} />
            <Tally color="text-red-600" value={unit.overdue} />
          </span>
        </div>
      </Link>

      {/* Legenda detalhada — aparece no hover */}
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-64 -translate-x-1/2",
          "rounded-lg border border-zinc-200 bg-white p-3 shadow-xl",
          "opacity-0 translate-y-1 transition-all duration-200 ease-out",
          "group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto",
          "dark:border-zinc-700 dark:bg-zinc-900",
        )}
        role="tooltip"
      >
        {/* Setinha */}
        <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" />

        <div className="relative">
          <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {unit.name}
              </p>
              {unit.uf && (
                <p className="text-[10px] text-zinc-400">{unit.uf}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-lg font-bold leading-none tabular-nums text-zinc-900 dark:text-zinc-50">
                {unit.totalActions}
              </p>
              <p className="text-[10px] text-zinc-400">
                {unit.totalActions === 1 ? "ação" : "ações"}
              </p>
            </div>
          </div>

          {unit.totalActions === 0 ? (
            <p className="py-3 text-center text-xs italic text-zinc-400">
              Nenhuma ação cadastrada nesta unidade.
            </p>
          ) : (
            <>
              <div className="mt-2 mb-1 flex items-center justify-between text-[10px] text-zinc-500">
                <span>Detalhamento</span>
                <span className="font-semibold tabular-nums">{unit.progress}% concluído</span>
              </div>
              <div className="space-y-1">
                <LegendRow
                  icon={<CheckCircle2 className="h-3 w-3" />}
                  label="Concluídas"
                  value={unit.completed}
                  total={unit.totalActions}
                  color="text-emerald-600 dark:text-emerald-400"
                />
                <LegendRow
                  icon={<TrendingUp className="h-3 w-3" />}
                  label="Em andamento"
                  value={unit.inProgress}
                  total={unit.totalActions}
                  color="text-amber-600 dark:text-amber-400"
                />
                <LegendRow
                  icon={<Pause className="h-3 w-3" />}
                  label="Pendentes"
                  value={unit.pending}
                  total={unit.totalActions}
                  color="text-blue-600 dark:text-blue-400"
                />
                <LegendRow
                  icon={<AlertTriangle className="h-3 w-3" />}
                  label="Atrasadas"
                  value={unit.overdue}
                  total={unit.totalActions}
                  color="text-red-600 dark:text-red-400"
                />
              </div>

              <p className="mt-2 border-t border-zinc-100 pt-2 text-[10px] text-zinc-400 dark:border-zinc-800">
                Clique para abrir os planos →
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DeadlinesCard({ deadlines }: { deadlines: DeadlineItem[] }) {
  const overdue = deadlines.filter((d) => d.kind === "overdue");
  const near = deadlines.filter((d) => d.kind === "near");
  const future = deadlines.filter((d) => d.kind === "future");

  // Atrasadas: mais antigas primeiro (maior atraso); demais: mais cedo primeiro
  const sortedOverdue = overdue
    .slice()
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const sortedNear = near
    .slice()
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const sortedFuture = future
    .slice()
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  const [tab, setTab] = useState<DeadlineKind>(
    overdue.length > 0 ? "overdue" : near.length > 0 ? "near" : "future",
  );

  const lists: Record<
    DeadlineKind,
    { items: DeadlineItem[]; label: string; emptyMsg: string }
  > = {
    overdue: {
      items: sortedOverdue.slice(0, 10),
      label: "Atrasadas",
      emptyMsg: "Nenhuma ação atrasada. ✓",
    },
    near: {
      items: sortedNear.slice(0, 10),
      label: "Próximas",
      emptyMsg: "Nenhuma ação nos próximos 7 dias.",
    },
    future: {
      items: sortedFuture.slice(0, 10),
      label: "Futuras",
      emptyMsg: "Nenhuma ação programada.",
    },
  };

  const active = lists[tab];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Calendar className="h-4 w-4 text-accent-600" /> Prazos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Tabs */}
        <div className="flex gap-1 rounded-md bg-zinc-100 p-1 dark:bg-zinc-800/40">
          <TabPill
            active={tab === "overdue"}
            onClick={() => setTab("overdue")}
            label="Atrasadas"
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            count={overdue.length}
            tone="red"
          />
          <TabPill
            active={tab === "near"}
            onClick={() => setTab("near")}
            label="Próximas"
            icon={<Clock className="h-3.5 w-3.5" />}
            count={near.length}
            tone="amber"
          />
          <TabPill
            active={tab === "future"}
            onClick={() => setTab("future")}
            label="Futuras"
            icon={<Calendar className="h-3.5 w-3.5" />}
            count={future.length}
            tone="zinc"
          />
        </div>

        {/* Lista */}
        {active.items.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <Calendar className="h-7 w-7 text-zinc-300 dark:text-zinc-600" />
            <p className="mt-2 text-xs text-zinc-500">{active.emptyMsg}</p>
          </div>
        ) : (
          <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {active.items.map((d) => (
              <DeadlineRow key={d.id} d={d} />
            ))}
            {(() => {
              const allCount =
                tab === "overdue"
                  ? overdue.length
                  : tab === "near"
                  ? near.length
                  : future.length;
              return allCount > 10 ? (
                <p className="px-2 pt-1 text-center text-[10px] text-zinc-400">
                  Mostrando 10 de {allCount} —{" "}
                  <Link
                    href={`/calendario?filter=${tab}`}
                    className="font-medium text-accent-600 hover:underline dark:text-accent-400"
                  >
                    ver no calendário
                  </Link>
                </p>
              ) : null;
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TabPill({
  active,
  onClick,
  label,
  icon,
  count,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  count: number;
  tone: "red" | "amber" | "zinc";
}) {
  const tones = {
    red: {
      activeBg: "bg-white text-red-700 dark:bg-zinc-700 dark:text-red-300",
      countBg: active
        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
        : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400",
    },
    amber: {
      activeBg: "bg-white text-amber-700 dark:bg-zinc-700 dark:text-amber-300",
      countBg: active
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
        : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400",
    },
    zinc: {
      activeBg: "bg-white text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
      countBg: active
        ? "bg-zinc-200 text-zinc-700 dark:bg-zinc-600 dark:text-zinc-200"
        : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400",
    },
  };
  const t = tones[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-[11px] font-semibold transition-all",
        active
          ? `shadow-sm ${t.activeBg}`
          : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100",
      )}
    >
      {icon}
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none tabular-nums",
          t.countBg,
        )}
      >
        {count}
      </span>
    </button>
  );
}

function DeadlineRow({ d }: { d: DeadlineItem }) {
  const dateLabel = new Date(d.deadline + "T00:00:00").toLocaleDateString("pt-BR");
  const overdueDays = d.kind === "overdue" ? Math.abs(d.daysLeft) : 0;

  const badge =
    d.kind === "overdue" ? (
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
        !
      </span>
    ) : d.kind === "near" ? (
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        {d.daysLeft}d
      </span>
    ) : (
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        {d.number.slice(0, 2)}
      </span>
    );

  return (
    <Link
      href="/planos"
      className="flex items-start gap-2 rounded-md p-1.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
    >
      <span className="mt-0.5">{badge}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{d.title}</p>
        <p className="text-[11px] text-zinc-500">
          {d.unitName} · {dateLabel}
          {d.kind === "overdue" ? (
            <span className="font-semibold text-red-500">
              {" "}
              · {overdueDays === 0 ? "hoje" : `${overdueDays}d em atraso`}
            </span>
          ) : d.daysLeft === 0 ? (
            <span className="font-semibold text-amber-600"> · hoje</span>
          ) : (
            <span className="text-zinc-400"> · em {d.daysLeft}d</span>
          )}
        </p>
      </div>
    </Link>
  );
}

function BarSeg({
  value,
  total,
  color,
}: {
  value: number;
  total: number;
  color: string;
}) {
  if (value <= 0 || total <= 0) return null;
  const pct = (value / total) * 100;
  return (
    <span
      className={cn("h-full transition-all duration-300", color)}
      style={{ width: `${pct}%` }}
      aria-hidden="true"
    />
  );
}

function Tally({ color, value }: { color: string; value: number }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", color)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span className="font-semibold">{value}</span>
    </span>
  );
}

function LegendRow({
  icon,
  label,
  value,
  total,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className={cn("inline-flex h-4 w-4 shrink-0 items-center justify-center", color)}>
        {icon}
      </span>
      <span className="flex-1 text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className={cn("tabular-nums font-semibold", color)}>{value}</span>
      <span className="w-10 text-right tabular-nums text-zinc-400">{pct}%</span>
    </div>
  );
}

/** Formato compacto para valores grandes: 1.234.567 → "1,2M" */
function formatCompactBRL(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
  }
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function KpiPriceCard({ preco, totalActions }: { preco: number; totalActions: number }) {
  const formatted = preco.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
  const compact = formatCompactBRL(preco);
  const avg = totalActions > 0 ? preco / totalActions : 0;
  const avgFormatted = avg.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

  return (
    <Card className="group transition-all duration-200 hover:border-amber-200 hover:shadow-md dark:hover:border-amber-900/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Preço
        </CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 transition-colors group-hover:bg-amber-100 dark:bg-amber-950/30 dark:group-hover:bg-amber-900/50">
          <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
      </CardHeader>
      <CardContent>
        <p
          className="truncate text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50"
          title={formatted}
        >
          {compact}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
          {totalActions > 0 ? (
            <>
              média{" "}
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {avgFormatted}
              </span>{" "}
              / ação
            </>
          ) : (
            "orçamento total"
          )}
        </p>
        {/* Espaçador para igualar altura aos outros KPI cards (que têm progress bar) */}
        <div className="mt-3 h-1" aria-hidden="true" />
      </CardContent>
    </Card>
  );
}

function KpiFunilCard({
  icon: Icon,
  label,
  esperado,
  real,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  esperado: number;
  real: number;
  color: "accent" | "blue" | "emerald";
}) {
  const pct = esperado > 0 ? Math.round((real / esperado) * 100) : 0;
  const remaining = Math.max(0, esperado - real);
  const palette = {
    accent: {
      iconBg: "bg-accent-50 dark:bg-accent-950/30",
      iconHover: "group-hover:bg-accent-100 dark:group-hover:bg-accent-900/50",
      iconFg: "text-accent-600 dark:text-accent-300",
      bar: "bg-accent-500",
      borderHover: "hover:border-accent-200 dark:hover:border-accent-900/50",
    },
    blue: {
      iconBg: "bg-blue-50 dark:bg-blue-950/30",
      iconHover: "group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50",
      iconFg: "text-blue-600 dark:text-blue-400",
      bar: "bg-blue-500",
      borderHover: "hover:border-blue-200 dark:hover:border-blue-900/50",
    },
    emerald: {
      iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
      iconHover: "group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50",
      iconFg: "text-emerald-600 dark:text-emerald-400",
      bar: "bg-emerald-500",
      borderHover: "hover:border-emerald-200 dark:hover:border-emerald-900/50",
    },
  }[color];

  return (
    <Card
      className={cn(
        "group transition-all duration-200 hover:shadow-md",
        palette.borderHover,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </CardTitle>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
            palette.iconBg,
            palette.iconHover,
          )}
        >
          <Icon className={cn("h-4 w-4", palette.iconFg)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {real.toLocaleString("pt-BR")}
          </span>
          <span className="text-xs tabular-nums text-zinc-400">
            / {esperado.toLocaleString("pt-BR")}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
          {remaining > 0 ? (
            <>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {remaining.toLocaleString("pt-BR")}
              </span>{" "}
              a realizar
            </>
          ) : (
            "meta atingida"
          )}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={cn("h-full rounded-full transition-all duration-500", palette.bar)}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <span className={cn("shrink-0 text-[11px] font-semibold tabular-nums", palette.iconFg)}>
            {pct}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusCard({
  icon: Icon,
  label,
  value,
  percent,
  subtitle,
  color,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  percent?: number;
  subtitle?: string;
  color: string;
  accent: string;
}) {
  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {label}
          </span>
          <Icon className={cn("h-3.5 w-3.5 shrink-0", color)} />
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {value.toLocaleString("pt-BR")}
          </span>
          {percent !== undefined && (
            <span className={cn("text-[11px] font-semibold tabular-nums", color)}>
              {percent}%
            </span>
          )}
        </div>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        ) : (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={cn("h-full rounded-full transition-all duration-500", accent)}
              style={{ width: `${percent ?? 0}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
