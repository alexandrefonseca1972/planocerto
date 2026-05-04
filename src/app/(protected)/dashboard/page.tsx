import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DistributionCard } from "@/components/dashboard/distribution-card";
import { ProgressByUnit } from "@/components/dashboard/progress-by-unit";
import { DetailTable } from "@/components/dashboard/detail-table";
import { getUserTenants } from "@/app/actions/tenant";
import { Building2, CheckCircle2, Clock, Calendar, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard | PlanoCerto", description: "Resumo executivo." };

interface TenantSummary { id: string; name: string; totalActions: number; completed: number; inProgress: number; pending: number; progress: number; progressPct: number; overdue: number; }

interface DeadlineItem { id: string; title: string; deadline: string; tenant: string; number: string; urgent: boolean; daysLeft: number; planId: string; }

export default async function DashboardPage() {
  let userName = "Usuário";
  let isAdmin = false;
  const tenantSummaries: TenantSummary[] = [];
  const deadlines: DeadlineItem[] = [];
  let globalTotal = 0, globalCompleted = 0, globalProgress = 0, globalPending = 0, globalOverdue = 0;
  let weeklyCreated = 0, weeklyCompleted = 0;
  let trendUp = false;
  const sparklineData: number[] = [];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário";

    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      isAdmin = profile?.role === "admin";
    }

    const tenants = await getUserTenants();
    if (!tenants.length) throw null;

    // Fetch all plans and items in bulk
    const { data: allPlans } = await supabase.from("action_plans").select("id,tenant_id,title");
    const plansByTenant = new Map<string, { id: string; title: string }[]>();
    for (const p of allPlans || []) {
      if (!plansByTenant.has(p.tenant_id)) plansByTenant.set(p.tenant_id, []);
      plansByTenant.get(p.tenant_id)!.push(p);
    }

    // Fetch all items across all plans
    const planIds = (allPlans || []).map(p => p.id);
    const { data: allItems } = planIds.length > 0
      ? await supabase.from("action_items").select("id,plan_id,status,action,number,planned_end,created_at,updated_at").in("plan_id", planIds).limit(5000)
      : { data: [] };

    interface ItemRow { id: string; plan_id: string; status: number; action: string; number: string; planned_end: string | null; created_at: string; updated_at: string; }
    const itemsByPlan = new Map<string, ItemRow[]>();
    for (const item of (allItems || []) as ItemRow[]) {
      if (!itemsByPlan.has(item.plan_id)) itemsByPlan.set(item.plan_id, []);
      itemsByPlan.get(item.plan_id)!.push(item);
    }

    // Weekly summary
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
    const weekStartStr = weekStart.toISOString();
    for (const item of (allItems || []) as ItemRow[]) {
      if (item.created_at >= weekStartStr) weeklyCreated++;
      if (item.status === 5 && item.updated_at >= weekStartStr) weeklyCompleted++;
    }

    // Trend calculation (compare with last week)
    const lastWeekStart = new Date(weekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    let lastWeekCompleted = 0;
    for (const item of (allItems || []) as ItemRow[]) {
      if (item.status === 5 && item.updated_at >= lastWeekStart.toISOString() && item.updated_at < weekStartStr) lastWeekCompleted++;
    }
    trendUp = weeklyCompleted >= lastWeekCompleted;

    // Sparkline: last 4 weeks of completions
    const sparklineData: number[] = [];
    for (let w = 3; w >= 0; w--) {
      const ws = new Date(weekStart); ws.setDate(ws.getDate() - w * 7);
      const we = new Date(ws); we.setDate(we.getDate() + 7);
      let count = 0;
      for (const item of (allItems || []) as ItemRow[]) {
        if (item.status === 5 && item.updated_at >= ws.toISOString() && item.updated_at < we.toISOString()) count++;
      }
      sparklineData.push(count);
    }

    const today = new Date().toISOString().split("T")[0];
    const allDeadlines: { id: string; title: string; deadline: string; plan: string; number: string; planId: string }[] = [];

    for (const tenant of tenants) {
      const tenantPlans = plansByTenant.get(tenant.id) || [];
      let total = 0, completed = 0, progress = 0, pending = 0, overdue = 0;

      for (const plan of tenantPlans) {
        const items = itemsByPlan.get(plan.id) || [];
        total += items.length;
        const c = items.filter(i => i.status === 5);
        completed += c.length;
        const o = items.filter(i => i.planned_end && i.planned_end < today && i.status !== 5);
        overdue += o.length;
        const p = items.filter(i => (i.status === 3 || i.status === 4) && !o.includes(i));
        progress += p.length;
        const pend = items.filter(i => (i.status === 1 || i.status === 2) && !o.includes(i));
        pending += pend.length;

        // Collect up to 3 upcoming deadlines per plan
        const upcoming = items.filter(i => i.planned_end && i.planned_end >= today && i.status !== 5)
          .sort((a, b) => (a.planned_end || "").localeCompare(b.planned_end || ""));
        for (const item of upcoming.slice(0, 3)) {
          allDeadlines.push({ id: item.id, title: item.action, deadline: item.planned_end!, plan: plan.title, number: item.number, planId: plan.id });
        }
      }

      tenantSummaries.push({ id: tenant.id, name: tenant.name, totalActions: total, completed, inProgress: progress, pending,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        progressPct: total > 0 ? Math.round(((completed + progress * 0.5) / total) * 100) : 0,
        overdue });
      globalTotal += total; globalCompleted += completed; globalProgress += progress; globalPending += pending; globalOverdue += overdue;
    }

    allDeadlines.sort((a, b) => a.deadline.localeCompare(b.deadline));
    for (const d of allDeadlines.slice(0, 12)) {
      const ds = new Date(d.deadline + "T00:00:00");
      const daysLeft = Math.ceil((ds.getTime() - Date.now()) / 86400000);
      deadlines.push({ ...d, tenant: d.plan, urgent: daysLeft <= 3, daysLeft });
    }
  } catch { /* fallback */ }

  globalTotal = globalTotal || 0;
  const completionRate = globalTotal > 0 ? Math.round((globalCompleted / globalTotal) * 100) : 0;
  const greeting = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">{greeting}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{userName}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Resumo executivo{isAdmin ? ` · ${tenantSummaries.length} unidades` : ""}
            {(weeklyCreated > 0 || weeklyCompleted > 0) && (
              <span className="ml-1 text-xs">· esta semana: {weeklyCreated > 0 && <span className="text-blue-500">+{weeklyCreated} criadas</span>}{weeklyCreated > 0 && weeklyCompleted > 0 && ", "}{weeklyCompleted > 0 && <span className="text-emerald-500">{weeklyCompleted} concluídas</span>}</span>
            )}
          </p>
        </div>
        <Link href="/planos" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
          Ver planos <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* KPI Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Building2} label="Unidades" value={tenantSummaries.length} subtitle="empresas ativas" color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/30" />
        <KpiCard icon={CheckCircle2} label="Concluídas" value={`${completionRate}%`} subtitle={`${globalCompleted} de ${globalTotal}`} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/30" trend={trendUp} />
        <KpiCard icon={Clock} label="Em andamento" value={globalProgress} subtitle={`${globalPending} pendentes`} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-950/30" />
        <KpiCard icon={AlertTriangle} label="Atrasadas" value={globalOverdue} subtitle="ações com prazo vencido" color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-950/30" />
      </div>

      {/* Middle Row: Charts + Deadlines + Progress */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Distribution Chart */}
        <DistributionCard
          completed={globalCompleted} progress={globalProgress} pending={globalPending} overdue={globalOverdue} total={globalTotal}
          sparkline={sparklineData.some(v => v > 0) ? (
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-700">
              <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-2">Concluídas por semana</p>
              <Sparkline data={sparklineData} />
            </div>
          ) : undefined}
        />

        {/* Deadlines */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><Calendar className="h-4 w-4 text-zinc-500" /> Prazos próximos</CardTitle></CardHeader>
          <CardContent>
            {deadlines.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center"><Calendar className="h-8 w-8 text-zinc-300 dark:text-zinc-600" /><p className="mt-2 text-sm text-zinc-500">Nenhum prazo.</p></div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {deadlines.map((d) => (
                  <Link key={d.id} href="/planos" className="flex items-start gap-2.5 rounded-md p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 block">
                    <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", d.urgent ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400")}>
                      {d.urgent ? "!" : d.number.slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-zinc-500">
                        {d.tenant} · {new Date(d.deadline + "T00:00:00").toLocaleDateString("pt-BR")}
                        {d.daysLeft <= 0 ? <span className="font-semibold text-red-500"> (hoje)</span> : d.urgent ? <span className="font-semibold text-red-500"> ({d.daysLeft}d)</span> : <span className="text-zinc-400"> ({d.daysLeft}d)</span>}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress per Unit */}
        <ProgressByUnit units={tenantSummaries.map(t => ({
          id: t.id, name: t.name, totalActions: t.totalActions, completed: t.completed,
          inProgress: t.inProgress, pending: t.pending, progressPct: t.progressPct, overdue: t.overdue
        }))} />
      </div>

      {/* Detail Table */}
      <DetailTable units={tenantSummaries.map(t => ({
        id: t.id, name: t.name, totalActions: t.totalActions, completed: t.completed,
        inProgress: t.inProgress, pending: t.pending, progressPct: t.progressPct, overdue: t.overdue
      }))} />
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, subtitle, color, bg, trend }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number; subtitle: string; color: string; bg: string;
  trend?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</CardTitle>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", bg)}><Icon className={cn("h-4.5 w-4.5", color)} /></div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{value}</span>
          {trend !== undefined && (
            <span className={cn("text-xs", trend ? "text-emerald-500" : "text-red-500")}>
              {trend ? <TrendingUp className="h-3 w-3 inline" /> : <TrendingDown className="h-3 w-3 inline" />}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const h = 24;
  const points = data.map((v, i) => `${i * 40},${h - (v / max) * h}`).join(" ");
  const fillPoints = `0,${h} ${points} ${(data.length - 1) * 40},${h}`;

  return (
    <svg viewBox={`0 0 ${(data.length - 1) * 40} ${h}`} className="w-full h-6">
      <polygon points={fillPoints} fill="url(#sparkGrad)" />
      <polyline points={points} fill="none" stroke="#10b981" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {data.map((v, i) => (
        <circle key={i} cx={i * 40} cy={h - (v / max) * h} r="2" fill="#10b981" />
      ))}
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
