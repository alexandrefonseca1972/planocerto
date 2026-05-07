"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DistributionCard } from "@/components/dashboard/distribution-card";
import { ProgressByUnit } from "@/components/dashboard/progress-by-unit";
import { DetailTable } from "@/components/dashboard/detail-table";
import { TenantFilter } from "@/components/dashboard/tenant-filter";
import { Building2, CheckCircle2, Clock, Calendar, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface TenantSummary {
  id: string;
  name: string;
  totalActions: number;
  completed: number;
  inProgress: number;
  pending: number;
  progress: number;
  progressPct: number;
  overdue: number;
}

interface DeadlineItem {
  id: string;
  title: string;
  deadline: string;
  tenant: string;
  number: string;
  urgent: boolean;
  daysLeft: number;
  planId: string;
}

interface DashboardClientProps {
  userName: string;
  isAdmin: boolean;
  tenantSummaries: TenantSummary[];
  deadlines: DeadlineItem[];
  sparklineData: number[];
}

const STORAGE_KEY = "dashboard_selected_tenants";

export function DashboardClient({
  userName,
  isAdmin,
  tenantSummaries,
  deadlines: allDeadlines,
  sparklineData,
}: DashboardClientProps) {
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const validIds = parsed.filter((id: string) =>
          tenantSummaries.some((t) => t.id === id)
        );
        if (validIds.length > 0) {
          setSelectedTenantIds(validIds);
          return;
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setSelectedTenantIds(tenantSummaries.map((t) => t.id));
  }, [tenantSummaries]);

  const handleSelectionChange = (ids: string[]) => {
    setSelectedTenantIds(ids.length === 0 ? tenantSummaries.map((t) => t.id) : ids);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.length === 0 ? tenantSummaries.map((t) => t.id) : ids));
  };

  if (!mounted) return null;

  const filteredSummaries =
    selectedTenantIds.length === 0
      ? tenantSummaries
      : tenantSummaries.filter((t) => selectedTenantIds.includes(t.id));

  const filteredDeadlines =
    selectedTenantIds.length === 0
      ? allDeadlines
      : allDeadlines.filter((d) =>
          filteredSummaries.some((t) => t.name === d.tenant)
        );

  let globalTotal = 0,
    globalCompleted = 0,
    globalProgress = 0,
    globalPending = 0,
    globalOverdue = 0;

  for (const summary of filteredSummaries) {
    globalTotal += summary.totalActions;
    globalCompleted += summary.completed;
    globalProgress += summary.inProgress;
    globalPending += summary.pending;
    globalOverdue += summary.overdue;
  }

  const completionRate =
    globalTotal > 0 ? Math.round((globalCompleted / globalTotal) * 100) : 0;
  const greeting =
    new Date().getHours() < 12
      ? "Bom dia"
      : new Date().getHours() < 18
        ? "Boa tarde"
        : "Boa noite";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            {greeting}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {userName}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Resumo executivo
            {isAdmin && ` · ${tenantSummaries.length} unidades`}
          </p>
        </div>
        {tenantSummaries.length > 1 && (
          <TenantFilter
            tenants={tenantSummaries.map((t) => ({
              id: t.id,
              name: t.name,
            }))}
            selectedIds={selectedTenantIds}
            onSelectionChange={handleSelectionChange}
          />
        )}
      </div>

      <Link
        href="/planos"
        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        Ver planos <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>

      {/* KPI Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Building2}
          label="Unidades"
          value={filteredSummaries.length}
          subtitle="empresas selecionadas"
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-950/30"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Concluídas"
          value={`${completionRate}%`}
          subtitle={`${globalCompleted} de ${globalTotal}`}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-50 dark:bg-emerald-950/30"
        />
        <KpiCard
          icon={Clock}
          label="Em andamento"
          value={globalProgress}
          subtitle={`${globalPending} pendentes`}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-50 dark:bg-amber-950/30"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Atrasadas"
          value={globalOverdue}
          subtitle="ações com prazo vencido"
          color="text-red-600 dark:text-red-400"
          bg="bg-red-50 dark:bg-red-950/30"
        />
      </div>

      {/* Middle Row: Charts + Deadlines + Progress */}
      <div className="grid gap-4 lg:grid-cols-3">
        <DistributionCard
          completed={globalCompleted}
          progress={globalProgress}
          pending={globalPending}
          overdue={globalOverdue}
          total={globalTotal}
        />

        {/* Deadlines */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Calendar className="h-4 w-4 text-zinc-500" /> Prazos próximos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDeadlines.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Calendar className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                <p className="mt-2 text-sm text-zinc-500">Nenhum prazo.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {filteredDeadlines.map((d) => (
                  <Link
                    key={d.id}
                    href="/planos"
                    className="flex items-start gap-2.5 rounded-md p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 block"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        d.urgent
                          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      )}
                    >
                      {d.urgent ? "!" : d.number.slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-zinc-500">
                        {d.tenant} ·{" "}
                        {new Date(
                          d.deadline + "T00:00:00"
                        ).toLocaleDateString("pt-BR")}
                        {d.daysLeft <= 0 ? (
                          <span className="font-semibold text-red-500"> (hoje)</span>
                        ) : d.urgent ? (
                          <span className="font-semibold text-red-500">
                            {" "}
                            ({d.daysLeft}d)
                          </span>
                        ) : (
                          <span className="text-zinc-400"> ({d.daysLeft}d)</span>
                        )}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress per Unit */}
        <ProgressByUnit
          units={filteredSummaries.map((t) => ({
            id: t.id,
            name: t.name,
            totalActions: t.totalActions,
            completed: t.completed,
            inProgress: t.inProgress,
            pending: t.pending,
            progressPct: t.progressPct,
            overdue: t.overdue,
          }))}
        />
      </div>

      {/* Detail Table */}
      <DetailTable
        units={filteredSummaries.map((t) => ({
          id: t.id,
          name: t.name,
          totalActions: t.totalActions,
          completed: t.completed,
          inProgress: t.inProgress,
          pending: t.pending,
          progressPct: t.progressPct,
          overdue: t.overdue,
        }))}
      />
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  bg,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle: string;
  color: string;
  bg: string;
  trend?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </CardTitle>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", bg)}>
          <Icon className={cn("h-4.5 w-4.5", color)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {value}
          </span>
          {trend !== undefined && (
            <span className={cn("text-xs", trend ? "text-emerald-500" : "text-red-500")}>
              {trend ? (
                <TrendingUp className="h-3 w-3 inline" />
              ) : (
                <TrendingDown className="h-3 w-3 inline" />
              )}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}
