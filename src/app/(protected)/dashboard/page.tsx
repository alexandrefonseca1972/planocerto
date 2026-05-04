import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getUserTenants } from "@/app/actions/tenant";
import { RingChart } from "@/components/ui/chart";
import { Building2, CheckCircle2, Clock, Calendar, TrendingUp, AlertTriangle, ArrowUpRight, Activity, Target } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard | PlanoCerto", description: "Resumo executivo." };

interface TenantSummary { id: string; name: string; totalActions: number; completed: number; inProgress: number; pending: number; progress: number; overdue: number; }

export default async function DashboardPage() {
  let userName = "Usuário";
  let isAdmin = false;
  const tenantSummaries: TenantSummary[] = [];
  const deadlines: { id: string; title: string; deadline: string; tenant: string; number: string; urgent: boolean }[] = [];
  let globalTotal = 0, globalCompleted = 0, globalProgress = 0, globalPending = 0, globalOverdue = 0;

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
      ? await supabase.from("action_items").select("id,plan_id,status,action,number,planned_end").in("plan_id", planIds).limit(5000)
      : { data: [] };

    interface ItemRow { id: string; plan_id: string; status: number; action: string; number: string; planned_end: string | null; }
    const itemsByPlan = new Map<string, ItemRow[]>();
    for (const item of (allItems || []) as ItemRow[]) {
      if (!itemsByPlan.has(item.plan_id)) itemsByPlan.set(item.plan_id, []);
      itemsByPlan.get(item.plan_id)!.push(item);
    }

    const today = new Date().toISOString().split("T")[0];
    const allDeadlines: { id: string; title: string; deadline: string; plan: string; number: string }[] = [];

    for (const tenant of tenants) {
      const plans = plansByTenant.get(tenant.id) || [];
      let total = 0, completed = 0, progress = 0, pending = 0, overdue = 0;

      for (const plan of plans) {
        const items = itemsByPlan.get(plan.id) || [];
        total += items.length;
        completed += items.filter(i => i.status === 5).length;
        const inProg = items.filter(i => i.status === 3 || i.status === 4);
        progress += inProg.length;
        pending += items.filter(i => i.status === 1 || i.status === 2).length;
        overdue += items.filter(i => i.planned_end && i.planned_end < today && i.status !== 5).length;

        const upcoming = items.filter(i => i.planned_end && i.planned_end >= today && i.status !== 5)
          .sort((a, b) => (a.planned_end || "").localeCompare(b.planned_end || ""));
        for (const item of upcoming.slice(0, 1)) {
          allDeadlines.push({ id: item.id, title: item.action, deadline: item.planned_end!, plan: plan.title, number: item.number });
        }
      }

      tenantSummaries.push({ id: tenant.id, name: tenant.name, totalActions: total, completed, inProgress: progress, pending, progress: total > 0 ? Math.round(((completed + progress * 0.5) / total) * 100) : 0, overdue });
      globalTotal += total; globalCompleted += completed; globalProgress += progress; globalPending += pending; globalOverdue += overdue;
    }

    allDeadlines.sort((a, b) => a.deadline.localeCompare(b.deadline));
    for (const d of allDeadlines.slice(0, 8)) {
      const ds = new Date(d.deadline + "T00:00:00");
      const daysLeft = Math.ceil((ds.getTime() - Date.now()) / 86400000);
      deadlines.push({ ...d, tenant: d.plan, urgent: daysLeft <= 3 });
    }
  } catch { /* fallback */ }

  globalTotal = globalTotal || 1;
  const completionRate = Math.round((globalCompleted / globalTotal) * 100);
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Bom dia" : now.getHours() < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">{greeting}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{userName}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Resumo executivo {isAdmin ? `· ${tenantSummaries.length} unidades` : ""}</p>
        </div>
        <Link href="/planos" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
          Ver planos <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Building2} label="Unidades" value={tenantSummaries.length} subtitle="empresas ativas" color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/30" />
        <KpiCard icon={CheckCircle2} label="Concluídas" value={`${completionRate}%`} subtitle={`${globalCompleted} de ${globalTotal}`} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/30" />
        <KpiCard icon={Clock} label="Em andamento" value={globalProgress} subtitle={`${globalPending} pendentes`} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-950/30" />
        <KpiCard icon={AlertTriangle} label="Atrasadas" value={globalOverdue} subtitle="ações com prazo vencido" color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-950/30" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4 text-zinc-500" /> Distribuição</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <RingChart segments={[
                { value: globalCompleted, color: "#10b981", label: "Concluído" },
                { value: globalProgress, color: "#3b82f6", label: "Andamento" },
                { value: globalPending, color: "#f59e0b", label: "Pendente" },
              ]} size={130} strokeWidth={14} />
              <div className="flex-1 space-y-2">
                <L c="bg-emerald-500" l="Concluído" v={globalCompleted} p={Math.round((globalCompleted / globalTotal) * 100)} />
                <L c="bg-blue-500" l="Em andamento" v={globalProgress} />
                <L c="bg-amber-500" l="Pendente" v={globalPending} />
                <L c="bg-red-500" l="Atrasadas" v={globalOverdue} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><Calendar className="h-4 w-4 text-zinc-500" /> Prazos próximos</CardTitle></CardHeader>
          <CardContent>
            {deadlines.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center"><Calendar className="h-8 w-8 text-zinc-300 dark:text-zinc-600" /><p className="mt-2 text-sm text-zinc-500">Nenhum prazo.</p></div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {deadlines.map((d) => (
                  <div key={d.id} className="flex items-start gap-2.5 rounded-md p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", d.urgent ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400")}>{d.urgent ? "!" : d.number.slice(0, 2)}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{d.title}</p><p className="text-xs text-zinc-500">{d.tenant} · {new Date(d.deadline + "T00:00:00").toLocaleDateString("pt-BR")} {d.urgent && <span className="font-semibold text-red-500">(urgente)</span>}</p></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-zinc-500" /> Progresso por unidade</CardTitle></CardHeader>
          <CardContent>
            {tenantSummaries.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center"><Building2 className="h-8 w-8 text-zinc-300 dark:text-zinc-600" /><p className="mt-2 text-sm text-zinc-500">Nenhuma unidade.</p></div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {tenantSummaries.map((t) => (
                  <div key={t.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <Link href="/planos" className="font-medium text-zinc-700 hover:underline dark:text-zinc-300 truncate max-w-[65%]">{t.name}</Link>
                      <span className="font-mono text-zinc-500">{t.progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div className={cn("h-full rounded-full transition-all", t.progress >= 80 ? "bg-emerald-500" : t.progress >= 50 ? "bg-blue-500" : t.progress >= 25 ? "bg-amber-500" : "bg-zinc-400")} style={{ width: `${Math.max(t.progress, 3)}%` }} />
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-400">{t.completed}/{t.totalActions} · {t.overdue} atrasadas</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {tenantSummaries.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4 text-zinc-500" /> Detalhamento por unidade</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50"><th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">Unidade</th><th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-center">Total</th><th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-center">Concluídas</th><th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-center">Andamento</th><th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-center">Pendentes</th><th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-center">Atrasadas</th><th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 text-center">Progresso</th></tr></thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {tenantSummaries.map((t) => (
                    <tr key={t.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-50 truncate max-w-[200px]">{t.name}</td>
                      <td className="px-4 py-2.5 text-center font-mono text-xs text-zinc-600">{t.totalActions}</td><td className="px-4 py-2.5 text-center font-mono text-xs text-emerald-600">{t.completed}</td><td className="px-4 py-2.5 text-center font-mono text-xs text-blue-600">{t.inProgress}</td><td className="px-4 py-2.5 text-center font-mono text-xs text-amber-600">{t.pending}</td><td className="px-4 py-2.5 text-center font-mono text-xs text-red-600">{t.overdue}</td>
                      <td className="px-4 py-2.5 text-center"><Badge variant="outline" className={cn("text-xs font-mono", t.progress >= 80 ? "border-emerald-300 text-emerald-700 bg-emerald-50" : t.progress >= 50 ? "border-blue-300 text-blue-700 bg-blue-50" : "border-amber-300 text-amber-700 bg-amber-50")}>{t.progress}%</Badge></td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-zinc-200 bg-zinc-50/50 font-semibold dark:border-zinc-700 dark:bg-zinc-800/50">
                    <td className="px-4 py-2.5">Total</td><td className="px-4 py-2.5 text-center font-mono text-xs">{globalTotal}</td><td className="px-4 py-2.5 text-center font-mono text-xs">{globalCompleted}</td><td className="px-4 py-2.5 text-center font-mono text-xs">{globalProgress}</td><td className="px-4 py-2.5 text-center font-mono text-xs">{globalPending}</td><td className="px-4 py-2.5 text-center font-mono text-xs">{globalOverdue}</td><td className="px-4 py-2.5 text-center font-mono text-xs">{completionRate}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, subtitle, color, bg }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; subtitle: string; color: string; bg: string; }) {
  return <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</CardTitle><div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", bg)}><Icon className={cn("h-4.5 w-4.5", color)} /></div></CardHeader><CardContent><div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{value}</div><p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p></CardContent></Card>;
}
function L({ c, l, v, p }: { c: string; l: string; v: number; p?: number }) {
  return <div className="flex items-center gap-2 text-xs"><span className={cn("h-3 w-3 rounded-full", c)} /><span className="text-zinc-600 dark:text-zinc-400">{l}</span><span className="ml-auto font-mono font-semibold text-zinc-900 dark:text-zinc-50">{v}</span>{p !== undefined && <span className="text-zinc-400">({p}%)</span>}</div>;
}
