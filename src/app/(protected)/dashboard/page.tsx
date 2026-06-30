import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getUserTenants } from "@/app/actions/tenant";
import { getCurrentUserPlanScope } from "@/app/actions/action-plan";
import { getPermissionsMap, buildCustomRolesMap } from "@/lib/permissions";
import { filterUnitsByScope, filterAreasByScope } from "@/components/dashboard/dashboard-access";
import { isWithinRange } from "@/components/dashboard/dashboard-range";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Resumo executivo.",
};

/** Resumo de uma Unidade (catalog). */
export interface SubTotals {
  total: number; completed: number; inProgress: number; pending: number; overdue: number;
  preco: number; insE: number; insR: number; fE: number; fR: number; aE: number; aR: number;
}

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
  // Classificação para filtros
  tiposPa: string[];
  macroAcoes: string[];
  // Aggregates por filtro (para totais precisos ao filtrar)
  tiposPaBreakdown: Record<string, SubTotals>;
  macroAcoesBreakdown: Record<string, SubTotals>;
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

/** Linha enxuta para a "relação de ações" exibida ao clicar nos cards de status. */
export interface DashboardActionRow {
  id: string;
  number: string;
  title: string;
  responsible: string | null;
  planned_end: string | null;
  status: number;
  bucket: "completed" | "overdue" | "progress" | "pending";
  unitId: string;
  unitName: string;
  tenantId: string | null;
  tipoPa: string | null;
  macroAcao: string | null;
  planId: string;
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

function accBreakdown(
  map: Record<string, SubTotals>,
  key: string,
  status: number,
  isOv: boolean,
  preco: number,
  iE: number, iR: number,
  mfE: number, mfR: number,
  maE: number, maR: number,
) {
  if (!map[key]) {
    map[key] = { total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0, preco: 0, insE: 0, insR: 0, fE: 0, fR: 0, aE: 0, aR: 0 };
  }
  const b = map[key];
  b.total++;
  if (status === 5) b.completed++;
  else if (isOv) b.overdue++;
  else if (status === 3 || status === 4) b.inProgress++;
  else b.pending++;
  b.preco += preco;
  b.insE += iE; b.insR += iR;
  b.fE += mfE; b.fR += mfR;
  b.aE += maE; b.aR += maR;
}

/** Aceita apenas datas no formato YYYY-MM-DD; caso contrário, ignora. */
function parseRangeDate(value: string | undefined): string | null {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ from?: string; to?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const rangeFrom = parseRangeDate(params.from);
  const rangeTo = parseRangeDate(params.to);
  const hasRange = Boolean(rangeFrom && rangeTo);

  let userName = "Usuário";
  let userPermissions: Record<string, boolean> = {};
  let role = "user";
  const unitSummaries: UnitSummary[] = [];
  const areas: AreaInfo[] = [];
  const deadlines: DeadlineItem[] = [];
  const actionRows: DashboardActionRow[] = [];
  const myTasks: {
    id: string; planId: string; title: string; number: string;
    planned_end: string | null; status: number; unitName: string;
    planTitle: string; daysLeft: number | null;
    kind: "overdue" | "near" | "future" | "completed";
  }[] = [];
  const sparklineData: number[] = [];
  let catalogTiposPa: { id: string; name: string }[] = [];
  let catalogMacroAcoes: { id: string; name: string }[] = [];

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
    if (!tenants.length) return <DashboardClient userName={userName} userPermissions={userPermissions} unitSummaries={[]} areas={[]} deadlines={[]} actionRows={[]} sparklineData={[]} catalogTiposPa={[]} catalogMacroAcoes={[]} myTasks={[]} dateFrom="" dateTo="" />;
    const tenantIds = tenants.map((t) => t.id);

    // Áreas e Unidades dos tenants do usuário (catálogo)
    const [
      { data: areaRows },
      { data: unitRows },
      { data: tiposPaRows },
      { data: macroAcoesRows },
      scope,
    ] = await Promise.all([
      supabase
        .from("areas")
        .select("id,name,tenant_id")
        .or(`tenant_id.in.(${tenantIds.join(",")}),tenant_id.is.null`),
      supabase
        .from("units")
        .select("id,name,uf,area_id,tenant_id,active")
        .in("tenant_id", tenantIds),
      supabase.from("tipos_pa").select("id,name,active").eq("active", true).order("sort_order"),
      supabase.from("macro_acoes").select("id,name,active").eq("active", true).order("sort_order"),
      getCurrentUserPlanScope(),
    ]);

    catalogTiposPa = (tiposPaRows || []) as { id: string; name: string }[];
    catalogMacroAcoes = (macroAcoesRows || []) as { id: string; name: string }[];

    interface UnitRow {
      id: string;
      name: string;
      uf: string;
      area_id: string | null;
      tenant_id: string | null;
      active: boolean;
    }

    // Escopo de acesso do usuário: exibe apenas unidades/áreas liberadas
    // (user_units / user_areas). Escopo vazio = sem restrição.
    const allUnits: UnitRow[] = filterUnitsByScope(
      (unitRows || []) as UnitRow[],
      scope,
    );

    for (const a of filterAreasByScope((areaRows || []) as AreaInfo[], allUnits, scope)) {
      areas.push({ id: a.id, name: a.name, tenant_id: a.tenant_id });
    }

    // Plans + Items
    const { data: allPlans } = await supabase
      .from("action_plans")
      .select("id,tenant_id,title,unit,unit_id");

    const planIds = (allPlans || []).map((p) => p.id);

    interface ItemRow {
      id: string;
      plan_id: string;
      parent_id: string | null;
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
      tipo_pa: string | null;
      responsible: string | null;
    }

    interface PlanRow {
      id: string;
      tenant_id: string;
      title: string;
      unit: string;
      unit_id?: string | null;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: chunk, error } = await (supabase as any)
          .from("action_items")
          .select(
            "id,plan_id,parent_id,status,action,number,planned_end,created_at,updated_at,preco,inscritos_esperado,inscritos_real,mat_fin_esperado,mat_fin_real,mat_acad_esperado,mat_acad_real,tipo_pa,responsible",
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

    // Intervalo de datas (?from=&to=): restringe as ações ao período por
    // planned_end. Ações sem prazo ficam fora quando há intervalo ativo. Todo o
    // pipeline a jusante (itemsByUnit, unitSummaries, actionRows, deadlines)
    // herda esse recorte; sparkline e Minhas Tarefas usam allItems (full).
    const rangeItems = hasRange
      ? allItems.filter((it) => isWithinRange(it.planned_end, rangeFrom, rangeTo))
      : allItems;

    const itemsByPlan = new Map<string, ItemRow[]>();
    for (const item of rangeItems) {
      if (!itemsByPlan.has(item.plan_id)) itemsByPlan.set(item.plan_id, []);
      itemsByPlan.get(item.plan_id)!.push(item);
    }

    // Match principal: action_plans.unit_id → units.id.
    // Fallback temporário: action_plans.unit (texto) → units.name.
    const unitsByTenantAndName = new Map<string, UnitRow>();
    const unitsById = new Map<string, UnitRow>();
    for (const u of allUnits) {
      unitsById.set(u.id, u);
      unitsByTenantAndName.set(`${u.tenant_id}|${norm(u.name)}`, u);
    }

    const itemsByUnit = new Map<string, ItemRow[]>();
    const plansWithoutUnit: PlanRow[] = [];
    for (const plan of (allPlans || []) as PlanRow[]) {
      const matchedUnit =
        (plan.unit_id ? unitsById.get(plan.unit_id) : null) ||
        unitsByTenantAndName.get(`${plan.tenant_id}|${norm(plan.unit || "")}`);
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

    // Mapa de item pai (parent_id = null) por plan para obter macro_acoes
    // Cada item pai representa uma macro_acao
    const parentItemsById = new Map<string, ItemRow>();
    for (const item of allItems) {
      if (item.parent_id === null) {
        parentItemsById.set(item.id, item);
      }
    }

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

      // Itens que são "pai" (têm filhos) — pré-computado uma vez (evita O(n²)).
      const parentIdsWithChildren = new Set(
        items.filter((i) => i.parent_id).map((i) => i.parent_id as string),
      );

      // Soma das métricas e breakdowns por Tipo PA / Macro Ação
      const tiposPaBreakdown: Record<string, SubTotals> = {};
      const macroAcoesBreakdown: Record<string, SubTotals> = {};
      let preco = 0;
      let insE = 0, insR = 0, fE = 0, fR = 0, aE = 0, aR = 0;
      const tiposPaSet = new Set<string>();
      const macroAcoesSet = new Set<string>();
      for (const it of items) {
        const isOv = Boolean(it.planned_end && it.planned_end < today && it.status !== 5);
        const p = Number(it.preco) || 0;
        preco += p;
        insE += it.inscritos_esperado;
        insR += it.inscritos_real;
        fE += it.mat_fin_esperado;
        fR += it.mat_fin_real;
        aE += it.mat_acad_esperado;
        aR += it.mat_acad_real;
        if (it.tipo_pa) {
          tiposPaSet.add(it.tipo_pa);
          accBreakdown(tiposPaBreakdown, it.tipo_pa, it.status, isOv, p, it.inscritos_esperado, it.inscritos_real, it.mat_fin_esperado, it.mat_fin_real, it.mat_acad_esperado, it.mat_acad_real);
        }
        // macro_acao: se o item tem parent, o pai é a macro_acao
        if (it.parent_id) {
          const parent = parentItemsById.get(it.parent_id);
          if (parent?.action) {
            macroAcoesSet.add(parent.action);
            accBreakdown(macroAcoesBreakdown, parent.action, it.status, isOv, p, it.inscritos_esperado, it.inscritos_real, it.mat_fin_esperado, it.mat_fin_real, it.mat_acad_esperado, it.mat_acad_real);
          }
        } else if (parentIdsWithChildren.has(it.id)) {
          macroAcoesSet.add(it.action);
          accBreakdown(macroAcoesBreakdown, it.action, it.status, isOv, p, it.inscritos_esperado, it.inscritos_real, it.mat_fin_esperado, it.mat_fin_real, it.mat_acad_esperado, it.mat_acad_real);
        }

        // Linha para a relação de ações (mesma bucketização dos cards/totais).
        const macroAcaoTag = it.parent_id
          ? parentItemsById.get(it.parent_id)?.action ?? null
          : parentIdsWithChildren.has(it.id)
          ? it.action
          : null;
        actionRows.push({
          id: it.id,
          number: it.number,
          title: it.action,
          responsible: it.responsible,
          planned_end: it.planned_end,
          status: it.status,
          bucket:
            it.status === 5
              ? "completed"
              : isOv
              ? "overdue"
              : it.status === 3 || it.status === 4
              ? "progress"
              : "pending",
          unitId: u.id,
          unitName: u.name,
          tenantId: u.tenant_id,
          tipoPa: it.tipo_pa,
          macroAcao: macroAcaoTag,
          planId: it.plan_id,
        });
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
        tiposPa: Array.from(tiposPaSet).sort(),
        macroAcoes: Array.from(macroAcoesSet).sort(),
        tiposPaBreakdown,
        macroAcoesBreakdown,
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

    // ─── My Tasks ───────────────────────────────────────────────────────────────
    const planMap = new Map((allPlans || []).map(p => [p.id, p as PlanRow]));
    const todayStr = now.toISOString().split("T")[0];

    for (const item of allItems) {
      if (!item.responsible) continue;
      if (item.responsible.trim().toLowerCase() !== userName.toLowerCase()) continue;

      const plan = planMap.get(item.plan_id);
      let daysLeft: number | null = null;
      let kind: "overdue" | "near" | "future" | "completed" = "future";

      if (item.status === 5) {
        kind = "completed";
      } else if (item.planned_end) {
        const ds = new Date(item.planned_end + "T00:00:00");
        daysLeft = Math.ceil((ds.getTime() - nowMs) / 86400000);
        kind = item.planned_end < todayStr ? "overdue" : daysLeft <= 7 ? "near" : "future";
      }

      myTasks.push({
        id: item.id,
        planId: item.plan_id,
        title: item.action,
        number: item.number,
        planned_end: item.planned_end,
        status: item.status,
        unitName: plan?.unit || "—",
        planTitle: plan?.title || "—",
        daysLeft,
        kind,
      });
    }

    myTasks.sort((a, b) => {
      const order = { overdue: 0, near: 1, future: 2, completed: 3 };
      const ka = order[a.kind]; const kb = order[b.kind];
      if (ka !== kb) return ka - kb;
      return (a.planned_end || "").localeCompare(b.planned_end || "");
    });

  return (
    <DashboardClient
      userName={userName}
      userPermissions={userPermissions}
      unitSummaries={unitSummaries}
      areas={areas}
      deadlines={deadlines}
      actionRows={actionRows}
      sparklineData={sparklineData}
      catalogTiposPa={catalogTiposPa}
      catalogMacroAcoes={catalogMacroAcoes}
      myTasks={myTasks}
      dateFrom={rangeFrom ?? ""}
      dateTo={rangeTo ?? ""}
    />
  );
}
