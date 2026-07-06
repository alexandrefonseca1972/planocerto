import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUserTenants } from "@/app/actions/tenant";
import { checkPermission } from "@/app/actions/admin";
import { PERMISSIONS } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Building2 } from "lucide-react";
import {
  CalendarGrid,
  type CalendarDeadlineItem,
  type DeadlineKind,
} from "@/components/calendario/calendar-grid";

export const metadata: Metadata = {
  title: "Calendário | PlanoCerto",
  description: "Prazos e deadlines.",
};

const norm = (s: string | undefined) => (s || "").toString().toLowerCase();

function isFilterKind(v: string | undefined): v is DeadlineKind {
  return v === "overdue" || v === "near" || v === "future";
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const params = (await searchParams) || {};
  const initialFilter = isFilterKind(params.filter) ? params.filter : null;

  let currentTenantName = "";
  let noTenant = false;
  const items: CalendarDeadlineItem[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let activeTenantId = "";
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_tenant_id")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.active_tenant_id) activeTenantId = profile.active_tenant_id;
    }

    const tenants = await getUserTenants();
    const activeTenant =
      tenants.find((t) => t.id === activeTenantId) || tenants[0];

    const hasReadPerm = await checkPermission(PERMISSIONS.PLANS_READ, activeTenant?.id ?? null);
    if (!hasReadPerm) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
          <Card>
            <CardContent className="flex flex-col items-center py-16">
              <Calendar className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
              <h3 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Acesso negado
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Você não tem permissão para visualizar planos.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!activeTenant) {
      noTenant = true;
    } else {
      currentTenantName = activeTenant.name;

      const { data: allPlans } = await supabase
        .from("action_plans")
        .select("id,tenant_id,title,unit_id")
        .eq("tenant_id", activeTenant.id);
      const planMap = new Map(allPlans?.map((p) => [p.id, p]) || []);
      const planIds = allPlans?.map((p) => p.id) || [];

      const all: {
        id: string;
        plan_id: string;
        number: string;
        action: string;
        where: string | null;
        status: number;
        responsible: string | null;
        planned_end: string;
      }[] = [];
      if (planIds.length > 0) {
        const PAGE = 1000;
        for (let from = 0; ; from += PAGE) {
          const { data: chunk, error } = await supabase
            .from("action_items")
            .select(
              "id,plan_id,number,action,where,status,responsible,planned_end",
            )
            .not("planned_end", "is", null)
            .neq("status", 5)
            .in("plan_id", planIds)
            .order("planned_end")
            .order("id")
            .range(from, from + PAGE - 1);
          if (error) break;
          const rows = chunk || [];
          all.push(
            ...rows.map((r) => ({
              ...r,
              planned_end: r.planned_end as string,
              responsible: r.responsible as string | null,
            })),
          );
          if (rows.length < PAGE) break;
          if (from > 50000) break;
        }
      }

      const today = new Date();
      const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      const todayMs = todayUTC.getTime();
      const todayISO = todayUTC.toISOString().split("T")[0];

      const seenIds = new Set<string>();
      for (const it of all) {
        if (seenIds.has(it.id)) continue;
        seenIds.add(it.id);

        const ds = new Date(it.planned_end + "T00:00:00");
        const daysLeft = Math.round((ds.getTime() - todayMs) / 86400000);
        const plan = planMap.get(it.plan_id);
        const kind: DeadlineKind =
          it.planned_end < todayISO
            ? "overdue"
            : daysLeft <= 7
            ? "near"
            : "future";
        items.push({
          id: it.id,
          planId: it.plan_id,
          title: it.action,
          number: it.number,
          where: it.where || "",
          planned_end: it.planned_end,
          status: it.status,
          responsible: norm(it.responsible || ""),
          tenant: activeTenant.name,
          planTitle: plan?.title || "",
          unit_id: plan && "unit_id" in plan ? (plan.unit_id as string | null) : null,
          daysLeft,
          kind,
        });
      }
    }
  } catch {
    /* fallback */
  }

  if (noTenant) return <CalendarioEmpty />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          <Calendar className="h-6 w-6 text-accent-600" /> Calendário
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {items.length} prazo{items.length === 1 ? "" : "s"} ·{" "}
          <Building2 className="-mt-0.5 inline h-3 w-3" />{" "}
          {currentTenantName || "—"}
        </p>
      </div>

      <CalendarGrid
        items={items}
        filterKinds={initialFilter ? [initialFilter] : undefined}
      />
    </div>
  );
}

function CalendarioEmpty() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <Card>
        <CardContent className="flex flex-col items-center py-16">
          <Calendar className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
          <h3 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Nenhuma empresa selecionada
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Selecione uma empresa para visualizar o calendário.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
