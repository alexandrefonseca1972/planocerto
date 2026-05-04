import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUserTenants } from "@/app/actions/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, Clock, Target, Building2 } from "lucide-react";
import { STATUS_FAROL } from "@/types/action-plan";

export const metadata: Metadata = { title: "Calendário | PlanoCerto", description: "Prazos e deadlines." };

interface DeadlineItem {
  id: string; title: string; number: string; planned_end: string;
  status: number; responsible: string; tenant: string; planTitle: string;
}

export default async function CalendarioPage() {
  const deadlines: Record<string, DeadlineItem[]> = {};
  let currentTenantName = "";
  let currentTenantId = "";

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get active tenant
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("active_tenant_id").eq("id", user.id).maybeSingle();
      if (profile?.active_tenant_id) currentTenantId = profile.active_tenant_id;
    }

    const tenants = await getUserTenants();
    const activeTenant = tenants.find(t => t.id === currentTenantId) || tenants[0];
    if (activeTenant) currentTenantName = activeTenant.name;

    // Fetch plans only for active tenant
    const query = supabase.from("action_plans").select("id,tenant_id,title");
    const { data: allPlans } = activeTenant
      ? await query.eq("tenant_id", activeTenant.id)
      : await query;

    const planMap = new Map(allPlans?.map(p => [p.id, p]) || []);

    // Fetch items with deadlines
    const planIds = allPlans?.map(p => p.id) || [];
    if (planIds.length > 0) {
      const { data: items } = await supabase
        .from("action_items")
        .select("id,plan_id,number,action,status,responsible,planned_end")
        .not("planned_end", "is", null)
        .in("plan_id", planIds)
        .order("planned_end")
        .limit(500);

      for (const item of items || []) {
        const plan = planMap.get(item.plan_id);
        const date = item.planned_end!;
        if (!deadlines[date]) deadlines[date] = [];
        deadlines[date].push({
          id: item.id, title: item.action, number: item.number,
          planned_end: date, status: item.status, responsible: item.responsible || "",
          tenant: activeTenant?.name || "", planTitle: plan?.title || "",
        });
      }
    }
  } catch { /* fallback */ }

  const sortedDates = Object.keys(deadlines).sort();
  const today = new Date().toISOString().split("T")[0];
  const upcoming = sortedDates.filter(d => d >= today);
  const past = sortedDates.filter(d => d < today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Calendário</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Prazos de {currentTenantName || "todas as unidades"}</p>
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Calendar className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Nenhum prazo cadastrado</h3>
            <p className="text-sm text-zinc-500">Adicione datas de término nas ações.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Upcoming */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              <Target className="h-5 w-5 text-blue-500" /> Próximos prazos
            </h2>
            <div className="space-y-4">
              {upcoming.map(date => (
                <div key={date}>
                  <div className="mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      {new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                    <Badge variant="secondary" className="text-xs">{deadlines[date].length} ações</Badge>
                  </div>
                  <Card>
                    <CardContent className="divide-y divide-zinc-100 p-0 dark:divide-zinc-700">
                      {deadlines[date].map(item => {
                        const st = STATUS_FAROL[item.status] || STATUS_FAROL[1];
                        return (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                            <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-mono", st.color)}>{item.number}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-zinc-800 dark:text-zinc-200">{item.title}</p>
                              <p className="flex items-center gap-2 text-xs text-zinc-500">
                                <Building2 className="h-3 w-3" /> {item.tenant}
                                {item.responsible && <><span className="text-zinc-300">·</span> {item.responsible}</>}
                              </p>
                            </div>
                            <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium", st.color)}>{st.dot} {st.label}</span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-500">
                <Clock className="h-5 w-5" /> Prazos vencidos
              </h2>
              <div className="space-y-4 opacity-60">
                {past.map(date => (
                  <div key={date}>
                    <div className="mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-zinc-400" />
                      <span className="text-sm font-semibold text-zinc-500">
                        {new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                      </span>
                    </div>
                    <Card>
                      <CardContent className="divide-y divide-zinc-100 p-0 dark:divide-zinc-700">
                        {deadlines[date].map(item => (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-mono text-zinc-500 dark:bg-zinc-800">{item.number}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-zinc-500">{item.title}</p>
                              <p className="flex items-center gap-2 text-xs text-zinc-400">
                                <Building2 className="h-3 w-3" /> {item.tenant}
                              </p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
