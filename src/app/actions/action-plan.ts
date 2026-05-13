"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { logSupabaseError } from "@/lib/errors";
import { isValidUuid } from "@/lib/validations/uuid";
import { sanitizeText } from "@/app/actions/_catalog-utils";
import { planSchema, itemSchema } from "@/lib/schemas/action-plan-schemas";
import type { ActionPlan, ActionItem, AuditEntry, ActionPlanFormState, ActionItemStatus } from "@/types/action-plan";
import { notifyPlanAction } from "@/lib/teams";
import { checkPermission } from "@/app/actions/admin";
import { PERMISSIONS } from "@/lib/permissions";

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

export async function getAuditLog(planId: string): Promise<AuditEntry[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("plan_audit_log").select("*").eq("plan_id", planId).order("created_at", { ascending: false }).limit(50);
    return (data || []) as AuditEntry[];
  } catch (error) { console.error("[getAuditLog] Error:", error); return []; }
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
    const { data: profile } = await supabase.from("profiles").select("active_tenant_id").eq("id", user.id).maybeSingle();
    const tenantId = (formData.get("tenantId") as string) || profile?.active_tenant_id;
    if (!tenantId) return { message: "Nenhuma empresa." };
    const raw = { title: formData.get("title"), unit: formData.get("unit"), director: formData.get("director"), goal: formData.get("goal") };
    const v = planSchema.safeParse(raw);
    if (!v.success) return { errors: v.error.flatten().fieldErrors, message: "Verifique os campos." };
    const [title, unit, director, goal] = await Promise.all([sanitizeText(v.data.title), sanitizeText(v.data.unit || ""), sanitizeText(v.data.director || ""), sanitizeText(v.data.goal || "")]);
    const sanitized = { ...v.data, title, unit, director, goal };
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
    const raw = { title: formData.get("title"), unit: formData.get("unit"), director: formData.get("director"), goal: formData.get("goal") };
    const v = planSchema.safeParse(raw);
    if (!v.success) return { errors: v.error.flatten().fieldErrors, message: "Verifique os campos." };
    const [title, unit, director, goal] = await Promise.all([sanitizeText(v.data.title), sanitizeText(v.data.unit || ""), sanitizeText(v.data.director || ""), sanitizeText(v.data.goal || "")]);
    const sanitized = { ...v.data, title, unit, director, goal };
    const supabase = await createClient();
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
    const raw: Record<string, unknown> = {};
    const textFields = ["number", "action", "why", "where", "responsible", "cost", "expected_result", "actual_result", "observations", "tipo_pa", "area", "prioridade", "subacao", "como"];
    for (const f of textFields) raw[f] = formData.get(f) || "";
    const dateFields = ["planned_start", "planned_end", "actual_start", "actual_end"];
    for (const f of dateFields) raw[f] = formData.get(f) || undefined;
    raw.status = formData.get("status") || "1";
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
    const payload = { ...sanitized, plan_id: planId };
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

export async function updateItemStatus(itemId: string, status: ActionItemStatus): Promise<ActionPlanFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.PLANS_UPDATE);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };
    if (!itemId) return { message: "ID obrigatório." };
    if (!isValidUuid(itemId)) return { message: "ID do item inválido." };
    const parsedStatus = z.coerce.number().int().min(1).max(5).safeParse(status);
    if (!parsedStatus.success) return { message: "Status inválido." };
    status = parsedStatus.data as ActionItemStatus;

    const supabase = await createClient();
    const { data: item } = await supabase.from("action_items").select("plan_id,number,action,responsible").eq("id", itemId).single();
    if (!item) return { message: "Item não encontrado." };

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

    return { success: true, message: "Status atualizado!" };
  } catch (error) { console.error("[updateItemStatus] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function bulkUpdateStatus(planId: string, itemIds: string[], status: ActionItemStatus): Promise<ActionPlanFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.PLANS_UPDATE);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };
    if (!planId) return { message: "Plano obrigatório." };
    if (!isValidUuid(planId)) return { message: "ID do plano inválido." };
    if (!itemIds.length) return { message: "Selecione pelo menos um item." };
    if (!itemIds.every(isValidUuid)) return { message: "Lista de itens contém ID inválido." };
    const parsedStatus = z.coerce.number().int().min(1).max(5).safeParse(status);
    if (!parsedStatus.success) return { message: "Status inválido." };
    status = parsedStatus.data as ActionItemStatus;

    const supabase = await createClient();
    const { error } = await supabase.from("action_items").update({ status, updated_at: new Date().toISOString() }).in("id", itemIds);
    if (error) return { message: "Erro ao atualizar." };

    revalidatePath("/planos");
    revalidatePath("/dashboard");
    revalidatePath("/calendario");

    return { success: true, message: `${itemIds.length} itens atualizados!` };
  } catch (error) { console.error("[bulkUpdateStatus] Error:", error); return { message: "Serviço indisponível." }; }
}
