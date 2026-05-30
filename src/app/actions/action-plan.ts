"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/errors";
import { isValidUuid } from "@/lib/validations/uuid";
import { sanitizeText } from "@/app/actions/_catalog-utils";
import { planSchema, itemSchema } from "@/lib/schemas/action-plan-schemas";
import type { ActionPlan, ActionItem, AuditEntry, ActionPlanFormState, ActionItemStatus } from "@/types/action-plan";
import { notifyPlanAction } from "@/lib/teams";
import { checkPermission } from "@/app/actions/admin";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { deriveActionItemStatus } from "@/lib/action-item-status";
import { resolvePlanUnitReference } from "@/lib/action-plan-units";
import { getCurrentTenantId } from "@/app/actions/_helpers";

async function logAudit(planId: string, action: string, data: Record<string, unknown>, itemId?: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = user ? await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle() : { data: null };
    const snapshot = JSON.parse(JSON.stringify(data));
    await supabase.from("plan_audit_log").insert({
      plan_id: planId, item_id: itemId || null, action,
      snapshot, user_id: user?.id,
      user_name: profile?.name || user?.email || "",
    });
  } catch (error) { console.error("[logAudit] Error:", error); }
}

async function resolveMacroActionGroupId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planId: string,
  macroAction: string,
  currentItemId?: string,
): Promise<string | null> {
  if (!macroAction) return null;

  const { data: existingGroups } = await supabase
    .from("action_items")
    .select("id,action,number,sort_order")
    .eq("plan_id", planId)
    .is("parent_id", null)
    .order("sort_order");

  const matchingGroup = (existingGroups || []).find(
    (group) => group.id !== currentItemId && group.action.trim().toLowerCase() === macroAction.trim().toLowerCase(),
  );

  if (matchingGroup) return matchingGroup.id;

  const maxSortOrder = Math.max(0, ...(existingGroups || []).map((g) => g.sort_order ?? 0));
  const nextIndex = maxSortOrder + 1;
  const { data: createdGroup, error } = await supabase
    .from("action_items")
    .insert({
      plan_id: planId,
      parent_id: null,
      number: String(nextIndex),
      sort_order: nextIndex,
      action: macroAction,
      status: 1,
    })
    .select("id")
    .single();

  if (error || !createdGroup) {
    // Concurrent insert may have created the group — recover instead of returning null
    const { data: retry } = await supabase
      .from("action_items")
      .select("id")
      .eq("plan_id", planId)
      .is("parent_id", null)
      .ilike("action", macroAction.trim())
      .maybeSingle();
    return retry?.id ?? null;
  }
  return createdGroup.id;
}

export async function getCurrentUserPlanScope(): Promise<{ areaIds: string[]; unitIds: string[] }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { areaIds: [], unitIds: [] };

    const adminClient = createAdminClient();
    const [{ data: areaRows }, { data: unitRows }] = await Promise.all([
      adminClient.from("user_areas").select("area_id").eq("user_id", user.id),
      adminClient.from("user_units").select("unit_id").eq("user_id", user.id),
    ]);

    return {
      areaIds: (areaRows || []).map((row) => row.area_id),
      unitIds: (unitRows || []).map((row) => row.unit_id),
    };
  } catch (error) {
    console.error("[getCurrentUserPlanScope] Error:", error);
    return { areaIds: [], unitIds: [] };
  }
}

export async function getAuditLog(planId: string): Promise<AuditEntry[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("plan_audit_log").select("*").eq("plan_id", planId).order("created_at", { ascending: false }).limit(50);
    return (data || []) as AuditEntry[];
  } catch (error) { console.error("[getAuditLog] Error:", error); return []; }
}

export async function getItemAuditLog(itemId: string): Promise<AuditEntry[]> {
  try {
    if (!isValidUuid(itemId)) return [];
    const supabase = await createClient();
    const { data } = await supabase
      .from("plan_audit_log")
      .select("*")
      .eq("item_id", itemId)
      .order("created_at", { ascending: false })
      .limit(20);
    return (data || []) as AuditEntry[];
  } catch (error) {
    console.error("[getItemAuditLog] Error:", error);
    return [];
  }
}

export async function getPlans(tenantId: string): Promise<ActionPlan[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("action_plans").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    return (data || []) as ActionPlan[];
  } catch (error) { console.error("[getPlans] Error:", error); return []; }
}

export async function getItems(planId: string): Promise<ActionItem[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("action_items").select("*").eq("plan_id", planId).order("sort_order");
    const items = (data || []) as ActionItem[];
    const map = new Map<string, ActionItem>();
    const roots: ActionItem[] = [];
    for (const item of items) { map.set(item.id, { ...item, children: [] }); }
    for (const item of items) {
      const node = map.get(item.id)!;
      if (item.parent_id && map.has(item.parent_id)) {
        map.get(item.parent_id)!.children!.push(node);
      } else { roots.push(node); }
    }
    return roots;
  } catch (error) { console.error("[getItems] Error:", error); return []; }
}

export async function createPlan(_prev: ActionPlanFormState, formData: FormData): Promise<ActionPlanFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.PLANS_CREATE);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };
    const tenantId = (formData.get("tenantId") as string) || await getCurrentTenantId();
    if (!tenantId) return { message: "Nenhuma empresa." };
    const raw = { 
      title: formData.get("title"), 
      unit_id: formData.get("unit_id"),
      unit: formData.get("unit"), 
      director: formData.get("director"), 
      goal: formData.get("goal"),
      status: formData.get("status"),
      exercicio: formData.get("exercicio"),
      budget_limit: formData.get("budget_limit"),
      visibility: formData.get("visibility"),
    };
    const v = planSchema.safeParse(raw);
    if (!v.success) return { errors: v.error.flatten().fieldErrors, message: "Verifique os campos." };
    const resolvedUnit = await resolvePlanUnitReference(supabase, {
      tenantId,
      unitId: v.data.unit_id,
      unitName: v.data.unit,
      requireMatch: true,
    });
    if (resolvedUnit.error) return { message: resolvedUnit.error };

    const [title, director, goal] = await Promise.all([
      sanitizeText(v.data.title),
      sanitizeText(v.data.director || ""),
      sanitizeText(v.data.goal || ""),
    ]);
    const sanitized = {
      ...v.data,
      title,
      unit_id: resolvedUnit.unitId,
      unit: resolvedUnit.unitName,
      director,
      goal,
    };
    const { data: plan, error } = await supabase.from("action_plans").insert({ tenant_id: tenantId, user_id: user.id, ...sanitized }).select().single();
    if (error) return { message: "Erro ao criar plano." };
    if (plan) await logAudit(plan.id, "CREATE_PLAN", { ...sanitized });
    revalidatePath("/planos");
    revalidatePath("/dashboard");
    revalidatePath("/calendario");
    return { success: true, message: "Plano criado!" };
  } catch (error) { console.error("[createPlan] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function updatePlan(_prev: ActionPlanFormState, formData: FormData): Promise<ActionPlanFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.PLANS_UPDATE);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };
    const planId = formData.get("planId") as string;
    if (!isValidUuid(planId)) return { message: "ID do plano inválido." };
    const raw = {
      title: formData.get("title"),
      unit_id: formData.get("unit_id"),
      unit: formData.get("unit"),
      director: formData.get("director"),
      goal: formData.get("goal"),
      status: formData.get("status"),
      exercicio: formData.get("exercicio"),
      budget_limit: formData.get("budget_limit"),
      visibility: formData.get("visibility"),
    };
    const v = planSchema.safeParse(raw);
    if (!v.success) return { errors: v.error.flatten().fieldErrors, message: "Verifique os campos." };
    const supabase = await createClient();
    const { data: planRecord } = await supabase.from("action_plans").select("tenant_id").eq("id", planId).single();
    if (!planRecord?.tenant_id) return { message: "Plano não encontrado." };
    const resolvedUnit = await resolvePlanUnitReference(supabase, {
      tenantId: planRecord.tenant_id,
      unitId: v.data.unit_id,
      unitName: v.data.unit,
      requireMatch: true,
    });
    if (resolvedUnit.error) return { message: resolvedUnit.error };
    const [title, director, goal] = await Promise.all([
      sanitizeText(v.data.title),
      sanitizeText(v.data.director || ""),
      sanitizeText(v.data.goal || ""),
    ]);
    const sanitized = {
      ...v.data,
      title,
      unit_id: resolvedUnit.unitId,
      unit: resolvedUnit.unitName,
      director,
      goal,
    };
    const { error } = await supabase.from("action_plans").update({ ...sanitized, updated_at: new Date().toISOString() }).eq("id", planId);
    if (error) return { message: "Erro ao atualizar." };
    await logAudit(planId, "UPDATE_PLAN", { ...sanitized });
    revalidatePath("/planos");
    revalidatePath("/dashboard");
    revalidatePath("/calendario");
    return { success: true, message: "Plano atualizado!" };
  } catch (error) { console.error("[updatePlan] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function deletePlan(_prev: ActionPlanFormState, formData: FormData): Promise<ActionPlanFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.PLANS_DELETE);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };
    const planId = formData.get("planId") as string;
    if (!isValidUuid(planId)) return { message: "ID do plano inválido." };
    const supabase = await createClient();
    const { data: plan } = await supabase.from("action_plans").select("title,tenant_id").eq("id", planId).single();
    if (!plan) return { message: "Plano não encontrado." };
    const { error } = await supabase.from("action_plans").delete().eq("id", planId);
    if (error) {
      logSupabaseError("deletePlan", error);
      return { message: "Erro ao excluir plano." };
    }
    await logAudit(planId, "DELETE_PLAN", { deleted: plan.title });
    revalidatePath("/planos");
    revalidatePath("/dashboard");
    revalidatePath("/calendario");
    return { success: true, message: "Plano excluído!" };
  } catch (error) { console.error("[deletePlan] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function upsertItem(_prev: ActionPlanFormState, formData: FormData): Promise<ActionPlanFormState> {
  try {
    const itemId = formData.get("itemId") as string;
    const requiredPermission = itemId ? PERMISSIONS.PLANS_UPDATE : PERMISSIONS.PLANS_CREATE;
    const hasPerm = await checkPermission(requiredPermission);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };
    const planId = formData.get("planId") as string;
    if (!planId) return { message: "Plano obrigatório." };
    if (!isValidUuid(planId)) return { message: "ID do plano inválido." };
    if (itemId && !isValidUuid(itemId)) return { message: "ID do item inválido." };
    const macroAcaoRaw = formData.get("macro_acao");
    const raw: Record<string, unknown> = {};
    const textFields = ["number", "action", "why", "where", "responsible", "cost", "expected_result", "actual_result", "observations", "tipo_pa", "area", "prioridade", "subacao", "como"];
    for (const f of textFields) raw[f] = formData.get(f) || "";
    const dateFields = ["planned_start", "planned_end", "actual_start", "actual_end"];
    for (const f of dateFields) raw[f] = formData.get(f) || undefined;
    raw.sort_order = formData.get("sort_order") || "0";
    raw.parent_id = formData.get("parent_id") || null;
    const numericFields = ["preco", "inscritos_esperado", "inscritos_real", "mat_fin_esperado", "mat_fin_real", "mat_acad_esperado", "mat_acad_real"];
    for (const f of numericFields) { const v = formData.get(f); raw[f] = v !== null && v !== "" ? v : undefined; }
    const v = itemSchema.safeParse(raw);
    if (!v.success) return { errors: v.error.flatten().fieldErrors, message: "Verifique os campos." };
    const [action, why, where, responsible, cost, expected_result, actual_result, observations, tipo_pa, area, prioridade, subacao, como] = await Promise.all([
      sanitizeText(v.data.action),
      sanitizeText(v.data.why || ""),
      sanitizeText(v.data.where || ""),
      sanitizeText(v.data.responsible || ""),
      sanitizeText(v.data.cost || ""),
      sanitizeText(v.data.expected_result || ""),
      sanitizeText(v.data.actual_result || ""),
      sanitizeText(v.data.observations || ""),
      sanitizeText(v.data.tipo_pa || ""),
      sanitizeText(v.data.area || ""),
      sanitizeText(v.data.prioridade || ""),
      sanitizeText(v.data.subacao || ""),
      sanitizeText(v.data.como || ""),
    ]);
    const sanitized = { ...v.data, action, why, where, responsible, cost, expected_result, actual_result, observations, tipo_pa, area, prioridade, subacao, como };
    const supabase = await createClient();
    const macroAcao = await sanitizeText(typeof macroAcaoRaw === "string" ? macroAcaoRaw : "");
    const resolvedParentId = macroAcao
      ? await resolveMacroActionGroupId(supabase, planId, macroAcao, itemId)
      : sanitized.parent_id || null;
    const derivedStatus = deriveActionItemStatus(sanitized);
    const payload = { ...sanitized, plan_id: planId, parent_id: resolvedParentId, status: derivedStatus };
    if (itemId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("action_items").update({ ...(payload as any), updated_at: new Date().toISOString() }).eq("id", itemId);
      if (error) return { message: "Erro ao atualizar." };
      await logAudit(planId, "UPDATE_ITEM", { ...payload }, itemId);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: created, error } = await supabase.from("action_items").insert(payload as any).select().single();
      if (error) return { message: "Erro ao criar." };
      if (created) await logAudit(planId, "CREATE_ITEM", { ...payload }, created.id);
    }
    revalidatePath("/planos");
    revalidatePath("/dashboard");
    revalidatePath("/calendario");

    // Teams notification
    try {
      const { data: plan } = await supabase.from("action_plans").select("tenant_id").eq("id", planId).single();
      if (plan) {
        const { data: tenant } = await supabase.from("tenants").select("name, teams_webhook_url").eq("id", plan.tenant_id).single();
        if (tenant?.teams_webhook_url) {
          await notifyPlanAction(tenant.teams_webhook_url, itemId ? "Atualizada" : "Criada", {
            number: payload.number, action: payload.action,
            responsible: payload.responsible || "", status: Number(payload.status),
            tenant: tenant.name,
          });
        }
      }
    } catch (error) { console.error("[upsertItem] Teams notification error:", error); }

    // Email notification
    try {
      const { data: plan } = await supabase.from("action_plans").select("title, tenant_id").eq("id", planId).single();
      if (plan && payload.responsible) {
        const { data: profiles } = await supabase.from("profiles").select("email").eq("name", payload.responsible).limit(1);
        const email = profiles?.[0]?.email;
        if (email) {
          const wasCompleted = Number(payload.status) === 5;
          const { sendEmail, itemCreatedEmail, itemCompletedEmail } = await import("@/lib/email");
          const itemData = { number: payload.number, action: payload.action, responsible: payload.responsible || "", planTitle: plan.title };
          if (wasCompleted) {
            await sendEmail(email, itemCompletedEmail(itemData).subject, itemCompletedEmail(itemData).html);
          } else if (!itemId) {
            await sendEmail(email, itemCreatedEmail(itemData).subject, itemCreatedEmail(itemData).html);
          }
        }
      }
    } catch (error) { console.error("[upsertItem] Email notification error:", error); }

    return { success: true, message: itemId ? "Item atualizado!" : "Item criado!" };
  } catch (error) { console.error("[upsertItem] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function deleteItem(_prev: ActionPlanFormState, formData: FormData): Promise<ActionPlanFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.PLANS_DELETE);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };
    const itemId = formData.get("itemId") as string;
    if (!itemId) return { message: "ID obrigatório." };
    if (!isValidUuid(itemId)) return { message: "ID do item inválido." };
    const supabase = await createClient();
    const { data: item } = await supabase.from("action_items").select("plan_id,number,action").eq("id", itemId).single();
    if (!item) return { message: "Item não encontrado." };
    const { error } = await supabase.from("action_items").delete().eq("id", itemId);
    if (error) {
      logSupabaseError("deleteItem", error);
      return { message: "Erro ao excluir item." };
    }
    await logAudit(item.plan_id, "DELETE_ITEM", { number: item.number, action: item.action }, itemId);
    revalidatePath("/planos");
    revalidatePath("/dashboard");
    revalidatePath("/calendario");
    return { success: true, message: "Item excluído!" };
  } catch (error) { console.error("[deleteItem] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function updateItemStatus(itemId: string, _status: ActionItemStatus): Promise<ActionPlanFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.PLANS_UPDATE);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };
    if (!itemId) return { message: "ID obrigatório." };
    if (!isValidUuid(itemId)) return { message: "ID do item inválido." };

    const supabase = await createClient();
    const { data: item } = await supabase
      .from("action_items")
      .select("plan_id,number,action,responsible,prioridade,planned_start,planned_end,actual_start,actual_end,expected_result,actual_result,observations,cost,\"where\",why,como,inscritos_real,mat_fin_real,mat_acad_real,status")
      .eq("id", itemId)
      .single();
    if (!item) return { message: "Item não encontrado." };

    const status = deriveActionItemStatus(item);
    
    // FASE 3: Evidência Obrigatória para Prioridade Alta
    if (status === 5 && item.prioridade === "Alta") {
      const [{ count: commentCount }, { count: attachCount }] = await Promise.all([
        supabase.from("item_comments").select("*", { count: "exact", head: true }).eq("item_id", itemId),
        supabase.from("plan_attachments").select("*", { count: "exact", head: true }).eq("item_id", itemId),
      ]);
      if ((commentCount || 0) === 0 && (attachCount || 0) === 0) {
        return { message: "Ações de prioridade ALTA exigem pelo menos uma evidência (comentário ou anexo) para conclusão." };
      }
    }

    const { error } = await supabase.from("action_items").update({ status, updated_at: new Date().toISOString() }).eq("id", itemId);
    if (error) return { message: "Erro ao atualizar." };

    await logAudit(item.plan_id, "UPDATE_ITEM", { status }, itemId);

    revalidatePath("/planos");
    revalidatePath("/dashboard");
    revalidatePath("/calendario");

    // Email on completion
    if (status === 5 && item.responsible) {
      try {
        const { data: plan } = await supabase.from("action_plans").select("title").eq("id", item.plan_id).single();
        if (plan) {
          const { data: profiles } = await supabase.from("profiles").select("email").eq("name", item.responsible).limit(1);
          const email = profiles?.[0]?.email;
          if (email) {
            const { sendEmail, itemCompletedEmail } = await import("@/lib/email");
            const itemData = { number: item.number, action: item.action, responsible: item.responsible, planTitle: plan.title };
            await sendEmail(email, itemCompletedEmail(itemData).subject, itemCompletedEmail(itemData).html);
          }
        }
      } catch { /* non-critical */ }
    }

    return { success: true, message: "Farol recalculado automaticamente!" };
  } catch (error) { console.error("[updateItemStatus] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function quickUpdateItemAction(_prev: ActionPlanFormState, formData: FormData): Promise<ActionPlanFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.PLANS_UPDATE);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };

    const itemId = formData.get("itemId") as string;
    if (!itemId || !isValidUuid(itemId)) return { message: "ID do item inválido." };

    const actual_start = (formData.get("actual_start") as string) || null;
    const actual_end = (formData.get("actual_end") as string) || null;
    const actual_result = (formData.get("actual_result") as string) || "";

    const supabase = await createClient();
    const { data: item } = await supabase
      .from("action_items")
      .select("plan_id,number,action,responsible,prioridade,planned_start,planned_end,expected_result,observations,cost,\"where\",why,como,inscritos_real,mat_fin_real,mat_acad_real")
      .eq("id", itemId)
      .single();
    if (!item) return { message: "Item não encontrado." };

    const status = deriveActionItemStatus({ ...item, actual_start, actual_end, actual_result });

    const { error } = await supabase
      .from("action_items")
      .update({ actual_start, actual_end, actual_result, status, updated_at: new Date().toISOString() })
      .eq("id", itemId);
    if (error) return { message: "Erro ao atualizar item." };

    await logAudit(item.plan_id, "QUICK_UPDATE_ITEM", { actual_start, actual_end, actual_result, status }, itemId);
    revalidatePath("/planos");
    revalidatePath("/dashboard");
    revalidatePath("/calendario");

    return { success: true, message: "Item atualizado! Farol recalculado." };
  } catch (error) {
    console.error("[quickUpdateItemAction] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

export async function clonePlanWithDateShift(planId: string, newStartDate: string): Promise<ActionPlanFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.PLANS_CREATE);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };
    if (!isValidUuid(planId)) return { message: "ID do plano inválido." };
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };
    const { data: sourcePlan } = await supabase.from("action_plans").select("*").eq("id", planId).single();
    if (!sourcePlan) return { message: "Plano original não encontrado." };

    const { data: sourceItems } = await supabase.from("action_items").select("*").eq("plan_id", planId).order("sort_order");
    if (!sourceItems) return { message: "Erro ao buscar itens do plano original." };

    // 1. Criar novo cabeçalho
    const { data: newPlan, error: planError } = await supabase.from("action_plans").insert({
      tenant_id: sourcePlan.tenant_id,
      title: `${sourcePlan.title} (Cópia)`,
      unit_id: sourcePlan.unit_id ?? null,
      unit: sourcePlan.unit,
      director: sourcePlan.director,
      goal: sourcePlan.goal,
      status: "active",
      exercicio: sourcePlan.exercicio,
      budget_limit: sourcePlan.budget_limit,
      visibility: sourcePlan.visibility,
      user_id: user.id,
    }).select().single();

    if (planError || !newPlan) return { message: "Erro ao criar novo cabeçalho do plano." };

    // 2. Calcular shift de data — usa a data mínima entre todos os itens como referência
    let dateShiftDays = 0;
    if (newStartDate) {
      const allDates = sourceItems.map(i => i.planned_start).filter(Boolean) as string[];
      if (allDates.length > 0) {
        const earliestDate = allDates.reduce((min, d) => (d < min ? d : min));
        const originalStart = new Date(earliestDate + "T00:00:00");
        const targetStart = new Date(newStartDate + "T00:00:00");
        dateShiftDays = Math.round((targetStart.getTime() - originalStart.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    const shiftDate = (isoDate: string | null) => {
      if (!isoDate || dateShiftDays === 0) return isoDate;
      const d = new Date(isoDate + "T00:00:00");
      d.setDate(d.getDate() + dateShiftDays);
      return d.toISOString().split("T")[0];
    };

    // 3. Clonar itens em batch mantendo hierarquia
    const idMap = new Map<string, string>();
    const batchItems = sourceItems.map(item => {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);
      return {
        id: newId,
        plan_id: newPlan.id,
        number: item.number,
        sort_order: item.sort_order,
        tipo_pa: item.tipo_pa,
        area: item.area,
        prioridade: item.prioridade,
        subacao: item.subacao,
        como: item.como,
        action: item.action,
        why: item.why,
        where: item.where,
        responsible: item.responsible,
        parent_id: null, // resolver depois
        planned_start: shiftDate(item.planned_start),
        planned_end: shiftDate(item.planned_end),
        actual_start: null,
        actual_end: null,
        cost: item.cost,
        expected_result: item.expected_result,
        actual_result: "",
        status: 1,
        observations: item.observations,
        preco: item.preco,
        inscritos_esperado: item.inscritos_esperado,
        inscritos_real: 0,
        mat_fin_esperado: item.mat_fin_esperado,
        mat_fin_real: 0,
        mat_acad_esperado: item.mat_acad_esperado,
        mat_acad_real: 0,
      };
    });

    await supabase.from("action_items").insert(batchItems);

    // Batch update dos parent_ids
    const parentUpdates = sourceItems
      .filter(item => item.parent_id && idMap.has(item.parent_id))
      .map(item => ({ id: idMap.get(item.id)!, parent_id: idMap.get(item.parent_id!)! }));

    if (parentUpdates.length > 0) {
      await Promise.all(
        parentUpdates.map(({ id, parent_id }) =>
          supabase.from("action_items").update({ parent_id }).eq("id", id),
        ),
      );
    }

    await logAudit(newPlan.id, "CLONE_PLAN", { source_plan_id: planId, date_shift: dateShiftDays });
    revalidatePath("/planos");
    
    return { success: true, message: "Plano clonado com sucesso!" };
  } catch (error) {
    console.error("[clonePlanWithDateShift] Error:", error);
    return { message: "Erro ao clonar plano." };
  }
}

export async function bulkUpdateStatus(planId: string, itemIds: string[], _status: ActionItemStatus): Promise<ActionPlanFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.PLANS_UPDATE);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };
    if (!planId) return { message: "Plano obrigatório." };
    if (!isValidUuid(planId)) return { message: "ID do plano inválido." };
    if (!itemIds.length) return { message: "Selecione pelo menos um item." };
    if (!itemIds.every(isValidUuid)) return { message: "Lista de itens contém ID inválido." };

    const supabase = await createClient();
    const { data: items, error: fetchError } = await supabase
      .from("action_items")
      .select("id,plan_id,planned_start,planned_end,actual_start,actual_end,expected_result,actual_result,observations,cost,\"where\",why,como,inscritos_real,mat_fin_real,mat_acad_real,action,responsible,prioridade")
      .in("id", itemIds);
    if (fetchError || !items) return { message: "Erro ao recalcular." };

    let updatedCount = 0;
    let blockedHighPriorityCount = 0;

    for (const item of items) {
      const status = deriveActionItemStatus(item);

      if (status === 5 && item.prioridade === "Alta") {
        const [{ count: commentCount }, { count: attachCount }] = await Promise.all([
          supabase.from("item_comments").select("*", { count: "exact", head: true }).eq("item_id", item.id),
          supabase.from("plan_attachments").select("*", { count: "exact", head: true }).eq("item_id", item.id),
        ]);

        if ((commentCount || 0) === 0 && (attachCount || 0) === 0) {
          blockedHighPriorityCount += 1;
          continue;
        }
      }

      const { error } = await supabase.from("action_items").update({ status, updated_at: new Date().toISOString() }).eq("id", item.id);
      if (error) return { message: "Erro ao recalcular." };
      updatedCount += 1;
    }

    revalidatePath("/planos");
    revalidatePath("/dashboard");
    revalidatePath("/calendario");

    const messageParts = [`${updatedCount} item(ns) recalculado(s) automaticamente.`];
    if (blockedHighPriorityCount > 0) {
      messageParts.push(
        `${blockedHighPriorityCount} item(ns) de prioridade ALTA foram mantidos fora de "Concluído" por falta de evidência.`,
      );
    }

    return { success: true, message: messageParts.join(" ") };
  } catch (error) { console.error("[bulkUpdateStatus] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function recalculateAndGetItems(planId: string): Promise<ActionItem[]> {
  try {
    const supabase = await createClient();
    const { data: items } = await supabase
      .from("action_items")
      .select("*")
      .eq("plan_id", planId)
      .order("sort_order");

    if (!items || items.length === 0) return [];

    const today = new Date();
    const updates: { id: string; status: number }[] = [];

    for (const item of items) {
      const newStatus = deriveActionItemStatus(item, today);
      if (newStatus !== item.status) {
        updates.push({ id: item.id, status: newStatus });
      }
    }

    if (updates.length > 0) {
      // Batch update in parallel
      const promises = updates.map(({ id, status }) =>
        supabase.from("action_items").update({ status, updated_at: new Date().toISOString() }).eq("id", id)
      );
      await Promise.all(promises);
    }

    // Re-fetch with updated statuses and build tree
    const { data: updatedItems } = await supabase
      .from("action_items")
      .select("*")
      .eq("plan_id", planId)
      .order("sort_order");

    const rows = (updatedItems || []) as ActionItem[];
    const map = new Map<string, ActionItem>();
    const roots: ActionItem[] = [];
    for (const item of rows) { map.set(item.id, { ...item, children: [] }); }
    for (const item of rows) {
      const node = map.get(item.id)!;
      if (item.parent_id && map.has(item.parent_id)) {
        map.get(item.parent_id)!.children!.push(node);
      } else { roots.push(node); }
    }

    return roots;
  } catch (error) {
    console.error("[recalculateAndGetItems] Error:", error);
    return [];
  }
}
