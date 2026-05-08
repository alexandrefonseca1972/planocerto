import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getUserTenants } from "@/app/actions/tenant";
import { getPermissionsMap, buildCustomRolesMap } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Dashboard | PlanoCerto",
  description: "Resumo executivo.",
};

/** Resumo de uma Unidade (catalog). */
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
  // Metas (do modelo Excel)
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

export type DeadlineKind = "overdue" | "near" | "future";

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

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export default async function DashboardPage() {
  let userName = "Usuário";
  let userPermissions: Record<string, boolean> = {};
  let role = "user";
  const unitSummaries: UnitSummary[] = [];
  const areas: AreaInfo[] = [];
  const deadlines: DeadlineItem[] = [];
  const sparklineData: number[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário";

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, permissions")
        .eq("id", user.id)
        .maybeSingle();
      role = profile?.role ?? "user";
      const permissions = (profile?.permissions ?? null) as Record<
        string,
        boolean
      > | null;

      const adminClient = createAdminClient();
      const { data: roles } = await adminClient
        .from("roles")
        .select("name, permissions");
      const customRolesMap = buildCustomRolesMap(
        (roles || []) as { name: string; permissions: Record<string, boolean> }[],
      );
      userPermissions = getPermissionsMap(role, permissions, customRolesMap);
    }

    const tenants = await getUserTenants();
    if (!tenants.length) throw null;
    const tenantIds = tenants.map((t) => t.id);

    // Áreas e Unidades dos tenants do usuário (catálogo)
    const [{ data: areaRows }, { data: unitRows }] = await Promise.all([
      supabase.from("areas").select("id,name,tenant_id").in("tenant_id", tenantIds),
      supabase
        .from("units")
        .select("id,name,uf,area_id,tenant_id,active")
        .in("tenant_id", tenantIds),
    ]);

    for (const a of (areaRows || []) as AreaInfo[]) {
      areas.push({ id: a.id, name: a.name, tenant_id: a.tenant_id });
    }

    interface UnitRow {
      id: string;
      name: string;
      uf: string;
      area_id: string | null;
      tenant_id: string | null;
      active: boolean;
    }

    const allUnits: UnitRow[] = (unitRows || []) as UnitRow[];

    // Plans + Items
    const { data: allPlans } = await supabase
      .from("action_plans")
      .select("id,tenant_id,title,unit");

    const planIds = (allPlans || []).map((p) => p.id);

    interface ItemRow {
      id: string;
      plan_id: string;
      status: number;
      action: string;
      number: string;
      planned_end: string | null;
      created_at: string;
      updated_at: string;
      preco: number;
      inscritos_esperado: number;
      inscritos_real: number;
      mat_fin_esperado: number;
      mat_fin_real: number;
      mat_acad_esperado: number;
      mat_acad_real: number;
    }

    interface PlanRow {
      id: string;
      tenant_id: string;
      title: string;
      unit: string;
    }

    // Paginação manual: Supabase tem max-rows ~1000 por requisição.
    // Buscamos todos os itens em chunks por plan_id (max 50 plans/chunk
    // para manter URLs curtas) ou via .range() até esvaziar.
    const allItems: ItemRow[] = [];
    if (planIds.length > 0) {
      const PAGE = 1000;
      let from = 0;
      // Loop até a página retornar < PAGE registros
      for (;;) {
        const { data: chunk, error } = await supabase
          .from("action_items")
          .select(
            "id,plan_id,status,action,number,planned_end,created_at,updated_at,preco,inscritos_esperado,inscritos_real,mat_fin_esperado,mat_fin_real,mat_acad_esperado,mat_acad_real",
          )
          .in("plan_id", planIds)
          .order("id", { ascending: true })
          .range(from, from + PAGE - 1);
        if (error) {
          console.error("[dashboard] action_items pagination:", error);
          break;
        }
        const rows = (chunk || []) as ItemRow[];
        allItems.push(...rows);
        if (rows.length < PAGE) break;
        from += PAGE;
        if (from > 200000) break; // guardrail extremo
      }
    }

    const itemsByPlan = new Map<string, ItemRow[]>();
    for (const item of allItems) {
      if (!itemsByPlan.has(item.plan_id)) itemsByPlan.set(item.plan_id, []);
      itemsByPlan.get(item.plan_id)!.push(item);
    }

    // Match: action_plans.unit (texto) → units.name (catalog).
    // Também associa plans dentro do mesmo tenant para garantir que matching só
    // ocorre dentro do tenant correto.
    const unitsByTenantAndName = new Map<string, UnitRow>();
    for (const u of allUnits) {
      unitsByTenantAndName.set(`${u.tenant_id}|${norm(u.name)}`, u);
    }

    const itemsByUnit = new Map<string, ItemRow[]>();
    const plansWithoutUnit: PlanRow[] = [];
    for (const plan of (allPlans || []) as PlanRow[]) {
      const key = `${plan.tenant_id}|${norm(plan.unit || "")}`;
      const matchedUnit = unitsByTenantAndName.get(key);
      if (matchedUnit) {
        if (!itemsByUnit.has(matchedUnit.id)) itemsByUnit.set(matchedUnit.id, []);
        itemsByUnit.get(matchedUnit.id)!.push(...(itemsByPlan.get(plan.id) || []));
      } else {
        plansWithoutUnit.push(plan);
      }
    }

    // Sparkline: itens concluídos nas últimas 4 semanas
    const now = new Date();
    const nowMs = now.getTime();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    for (let w = 3; w >= 0; w--) {
      const ws = new Date(weekStart);
      ws.setDate(ws.getDate() - w * 7);
      const we = new Date(ws);
      we.setDate(we.getDate() + 7);
      let count = 0;
      for (const item of allItems) {
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
    const allDeadlines: DeadlineItem[] = [];

    // Sumário por Unidade
    for (const u of allUnits) {
      const items = itemsByUnit.get(u.id) || [];
      const completed = items.filter((i) => i.status === 5).length;
      const overdueArr = items.filter(
        (i) => i.planned_end && i.planned_end < today && i.status !== 5,
      );
      const overdue = overdueArr.length;
      const overdueIds = new Set(overdueArr.map((i) => i.id));
      const progress = items.filter(
        (i) => (i.status === 3 || i.status === 4) && !overdueIds.has(i.id),
      ).length;
      const pending = items.filter(
        (i) => (i.status === 1 || i.status === 2) && !overdueIds.has(i.id),
      ).length;
      const total = items.length;

      // Soma das métricas
      let preco = 0;
      let insE = 0, insR = 0, fE = 0, fR = 0, aE = 0, aR = 0;
      for (const it of items) {
        preco += Number(it.preco) || 0;
        insE += it.inscritos_esperado;
        insR += it.inscritos_real;
        fE += it.mat_fin_esperado;
        fR += it.mat_fin_real;
        aE += it.mat_acad_esperado;
        aR += it.mat_acad_real;
      }

      unitSummaries.push({
        id: u.id,
        name: u.name,
        uf: u.uf || "",
        area_id: u.area_id,
        tenant_id: u.tenant_id,
        totalActions: total,
        completed,
        inProgress: progress,
        pending,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        progressPct:
          total > 0
            ? Math.round(((completed + progress * 0.5) / total) * 100)
            : 0,
        overdue,
        preco,
        inscritosEsperado: insE,
        inscritosReal: insR,
        matFinEsperado: fE,
        matFinReal: fR,
        matAcadEsperado: aE,
        matAcadReal: aR,
      });

      // Coletor de deadlines (todos os pendentes/atrasados/próximos/futuros)
      const candidates = items.filter(
        (i) => i.planned_end && i.status !== 5,
      );
      for (const item of candidates) {
        const ds = new Date(item.planned_end! + "T00:00:00");
        const daysLeft = Math.ceil((ds.getTime() - nowMs) / 86400000);
        const kind: DeadlineKind =
          item.planned_end! < today
            ? "overdue"
            : daysLeft <= 7
            ? "near"
            : "future";
        allDeadlines.push({
          id: item.id,
          title: item.action,
          deadline: item.planned_end!,
          unitName: u.name,
          unitId: u.id,
          areaId: u.area_id,
          number: item.number,
          urgent: daysLeft <= 3,
          daysLeft,
          planId: item.plan_id,
          kind,
        });
      }
    }

    // Ordena: atrasadas (mais antigas primeiro), próximas/futuras (mais cedo primeiro)
    allDeadlines.sort((a, b) => {
      if (a.kind === "overdue" && b.kind === "overdue") {
        return a.deadline.localeCompare(b.deadline); // mais antigo primeiro
      }
      return a.deadline.localeCompare(b.deadline);
    });

    // Cliente filtra por unidades e mostra max 10 por aba (com link "ver todas").
    // Enviamos os 3 cenários separadamente para garantir que cada um receba
    // uma fatia generosa, sem que atrasadas (geralmente o maior grupo)
    // consumam a cota e deixem próximas/futuras sem dados.
    const overdueAll = allDeadlines.filter((d) => d.kind === "overdue");
    const nearAll = allDeadlines.filter((d) => d.kind === "near");
    const futureAll = allDeadlines.filter((d) => d.kind === "future");
    const PER_KIND = 500;
    deadlines.push(
      ...overdueAll.slice(0, PER_KIND),
      ...nearAll.slice(0, PER_KIND),
      ...futureAll.slice(0, PER_KIND),
    );
  } catch {
    /* fallback */
  }

  return (
    <DashboardClient
      userName={userName}
      userPermissions={userPermissions}
      unitSummaries={unitSummaries}
      areas={areas}
      deadlines={deadlines}
      sparklineData={sparklineData}
    />
  );
}
