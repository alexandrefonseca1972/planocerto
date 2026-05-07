"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DistributionCard } from "@/components/dashboard/distribution-card";
import { ProgressByUnit } from "@/components/dashboard/progress-by-unit";
import { DetailTable } from "@/components/dashboard/detail-table";
import { useTenant } from "@/lib/contexts/tenant-context";
import {
  Building2,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ListTodo,
  CircleDashed,
} from "lucide-react";
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

export function DashboardClient({
  userName,
  isAdmin,
  tenantSummaries,
  deadlines: allDeadlines,
}: DashboardClientProps) {
  const { selectedTenantIds } = useTenant();

  const filteredSummaries = tenantSummaries.filter((t) =>
    selectedTenantIds.includes(t.id)
  );

  const filteredDeadlines = allDeadlines.filter((d) =>
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

  const pct = (n: number) =>
    globalTotal > 0 ? Math.round((n / globalTotal) * 100) : 0;
  const completedPct = pct(globalCompleted);
  const progressPct = pct(globalProgress);
  const pendingPct = pct(globalPending);
  const overduePct = pct(globalOverdue);

  const greeting =
    new Date().getHours() < 12
      ? "Bom dia"
      : new Date().getHours() < 18
        ? "Boa tarde"
        : "Boa noite";

  return (
    <div className="space-y-4">
      {/* Header (compact) */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">
            {greeting}
          </p>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {userName}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Resumo executivo
            {isAdmin && ` · ${tenantSummaries.length} unidades`}
            {filteredSummaries.length !== tenantSummaries.length &&
              ` · ${filteredSummaries.length} selecionadas`}
          </p>
        </div>
        <Link
          href="/planos"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Ver planos <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Status Row — 5 compact cards */}
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatusCard
          icon={ListTodo}
          label="Total"
          value={globalTotal}
          subtitle={`${filteredSummaries.length} unidades`}
          color="text-zinc-700 dark:text-zinc-300"
          accent="bg-zinc-500"
        />
        <StatusCard
          icon={CheckCircle2}
          label="Concluídas"
          value={globalCompleted}
          percent={completedPct}
          color="text-emerald-600 dark:text-emerald-400"
          accent="bg-emerald-500"
        />
        <StatusCard
          icon={Clock}
          label="Em andamento"
          value={globalProgress}
          percent={progressPct}
          color="text-amber-600 dark:text-amber-400"
          accent="bg-amber-500"
        />
        <StatusCard
          icon={CircleDashed}
          label="Pendentes"
          value={globalPending}
          percent={pendingPct}
          color="text-blue-600 dark:text-blue-400"
          accent="bg-blue-500"
        />
        <StatusCard
          icon={AlertTriangle}
          label="Atrasadas"
          value={globalOverdue}
          percent={overduePct}
          color="text-red-600 dark:text-red-400"
          accent="bg-red-500"
        />
      </div>

      {/* Middle Row: Charts + Deadlines + Progress */}
      <div className="grid gap-3 lg:grid-cols-3">
        <DistributionCard
          completed={globalCompleted}
          progress={globalProgress}
          pending={globalPending}
          overdue={globalOverdue}
          total={globalTotal}
        />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Calendar className="h-4 w-4 text-zinc-500" /> Prazos próximos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredDeadlines.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <Calendar className="h-7 w-7 text-zinc-300 dark:text-zinc-600" />
                <p className="mt-2 text-xs text-zinc-500">Nenhum prazo.</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {filteredDeadlines.map((d) => (
                  <Link
                    key={d.id}
                    href="/planos"
                    className="flex items-start gap-2 rounded-md p-1.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 block"
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
                      <p className="truncate text-xs font-medium">{d.title}</p>
                      <p className="text-[11px] text-zinc-500">
                        {d.tenant} ·{" "}
                        {new Date(d.deadline + "T00:00:00").toLocaleDateString(
                          "pt-BR"
                        )}
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
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {label}
          </span>
          <Icon className={cn("h-3.5 w-3.5 shrink-0", color)} />
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {value}
          </span>
          {percent !== undefined && (
            <span className={cn("text-xs font-semibold tabular-nums", color)}>
              {percent}%
            </span>
          )}
        </div>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        ) : percent !== undefined ? (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={cn("h-full rounded-full transition-all", accent)}
              style={{ width: `${percent}%` }}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
