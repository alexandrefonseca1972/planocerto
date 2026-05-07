import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getUserTenants } from "@/app/actions/tenant";

export const metadata: Metadata = {
  title: "Dashboard | PlanoCerto",
  description: "Resumo executivo.",
};

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

export default async function DashboardPage() {
  let userName = "Usuário";
  let isAdmin = false;
  const tenantSummaries: TenantSummary[] = [];
  const deadlines: DeadlineItem[] = [];
  const sparklineData: number[] = [];

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário";

    if (user) {
      isAdmin = user.user_metadata?.role === "admin";
    }

    const tenants = await getUserTenants();
    if (!tenants.length) throw null;

    const { data: allPlans } = await supabase
      .from("action_plans")
      .select("id,tenant_id,title");

    const plansByTenant = new Map<string, { id: string; title: string }[]>();
    for (const p of allPlans || []) {
      if (!plansByTenant.has(p.tenant_id)) plansByTenant.set(p.tenant_id, []);
      plansByTenant.get(p.tenant_id)!.push(p);
    }

    const planIds = (allPlans || []).map((p) => p.id);
    const { data: allItems } =
      planIds.length > 0
        ? await supabase
            .from("action_items")
            .select(
              "id,plan_id,status,action,number,planned_end,created_at,updated_at"
            )
            .in("plan_id", planIds)
            .limit(5000)
        : { data: [] };

    interface ItemRow {
      id: string;
      plan_id: string;
      status: number;
      action: string;
      number: string;
      planned_end: string | null;
      created_at: string;
      updated_at: string;
    }

    const itemsByPlan = new Map<string, ItemRow[]>();
    for (const item of (allItems || []) as ItemRow[]) {
      if (!itemsByPlan.has(item.plan_id)) itemsByPlan.set(item.plan_id, []);
      itemsByPlan.get(item.plan_id)!.push(item);
    }

    // Sparkline: last 4 weeks of completions
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    for (let w = 3; w >= 0; w--) {
      const ws = new Date(weekStart);
      ws.setDate(ws.getDate() - w * 7);
      const we = new Date(ws);
      we.setDate(we.getDate() + 7);
      let count = 0;
      for (const item of (allItems || []) as ItemRow[]) {
        if (
          item.status === 5 &&
          item.updated_at >= ws.toISOString() &&
          item.updated_at < we.toISOString()
        )
          count++;
      }
      sparklineData.push(count);
    }

    const today = new Date().toISOString().split("T")[0];
    const allDeadlines: {
      id: string;
      title: string;
      deadline: string;
      plan: string;
      number: string;
      planId: string;
    }[] = [];

    for (const tenant of tenants) {
      const tenantPlans = plansByTenant.get(tenant.id) || [];
      let total = 0,
        completed = 0,
        progress = 0,
        pending = 0,
        overdue = 0;

      for (const plan of tenantPlans) {
        const items = itemsByPlan.get(plan.id) || [];
        total += items.length;
        const c = items.filter((i) => i.status === 5);
        completed += c.length;
        const o = items.filter(
          (i) => i.planned_end && i.planned_end < today && i.status !== 5
        );
        overdue += o.length;
        const p = items.filter(
          (i) => (i.status === 3 || i.status === 4) && !o.includes(i)
        );
        progress += p.length;
        const pend = items.filter(
          (i) => (i.status === 1 || i.status === 2) && !o.includes(i)
        );
        pending += pend.length;

        const upcoming = items
          .filter(
            (i) =>
              i.planned_end && i.planned_end >= today && i.status !== 5
          )
          .sort((a, b) =>
            (a.planned_end || "").localeCompare(b.planned_end || "")
          );

        for (const item of upcoming.slice(0, 3)) {
          allDeadlines.push({
            id: item.id,
            title: item.action,
            deadline: item.planned_end!,
            plan: plan.title,
            number: item.number,
            planId: plan.id,
          });
        }
      }

      tenantSummaries.push({
        id: tenant.id,
        name: tenant.name,
        totalActions: total,
        completed,
        inProgress: progress,
        pending,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        progressPct:
          total > 0 ? Math.round(((completed + progress * 0.5) / total) * 100) : 0,
        overdue,
      });
    }

    allDeadlines.sort((a, b) => a.deadline.localeCompare(b.deadline));
    for (const d of allDeadlines.slice(0, 12)) {
      const ds = new Date(d.deadline + "T00:00:00");
      const daysLeft = Math.ceil(
        (ds.getTime() - Date.now()) / 86400000
      );
      deadlines.push({
        ...d,
        tenant: d.plan,
        urgent: daysLeft <= 3,
        daysLeft,
      });
    }
  } catch {
    /* fallback */
  }

  return (
    <DashboardClient
      userName={userName}
      isAdmin={isAdmin}
      tenantSummaries={tenantSummaries}
      deadlines={deadlines}
      sparklineData={sparklineData}
    />
  );
}
