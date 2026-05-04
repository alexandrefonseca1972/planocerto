"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { ActionPlan, ActionItem, AuditEntry, ActionPlanFormState } from "@/types/action-plan";
import { notifyPlanAction } from "@/lib/teams";

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

const planSchema = z.object({
  title: z.string().trim().min(2).max(200),
  unit: z.string().max(200).trim().optional(),
  director: z.string().max(200).trim().optional(),
  goal: z.string().max(1000).trim().optional(),
});

const itemSchema = z.object({
  action: z.string().trim().min(1, "Ação obrigatória.").max(500),
  number: z.string().trim().min(1).max(20),
  parent_id: z.string().optional(),
  sort_order: z.coerce.number().int().default(0),
  why: z.string().max(1000).trim().optional(),
  where: z.string().max(500).trim().optional(),
  responsible: z.string().max(200).trim().optional(),
  planned_start: z.string().optional(),
  planned_end: z.string().optional(),
  actual_start: z.string().optional(),
  actual_end: z.string().optional(),
  cost: z.string().max(100).trim().optional(),
  expected_result: z.string().max(1000).trim().optional(),
  actual_result: z.string().max(1000).trim().optional(),
  status: z.coerce.number().int().min(1).max(5).default(1),
  observations: z.string().max(2000).trim().optional(),
});

export async function createPlan(_prev: ActionPlanFormState, formData: FormData): Promise<ActionPlanFormState> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };
    const { data: profile } = await supabase.from("profiles").select("active_tenant_id").eq("id", user.id).maybeSingle();
    const tenantId = (formData.get("tenantId") as string) || profile?.active_tenant_id;
    if (!tenantId) return { message: "Nenhuma empresa." };
    const raw = { title: formData.get("title"), unit: formData.get("unit"), director: formData.get("director"), goal: formData.get("goal") };
    const v = planSchema.safeParse(raw);
    if (!v.success) return { errors: v.error.flatten().fieldErrors, message: "Verifique os campos." };
    const { data: plan, error } = await supabase.from("action_plans").insert({ tenant_id: tenantId, user_id: user.id, ...v.data }).select().single();
    if (error) return { message: "Erro ao criar plano." };
    if (plan) await logAudit(plan.id, "CREATE_PLAN", { ...v.data });
    revalidatePath("/planos");
    revalidatePath("/dashboard");
    revalidatePath("/calendario");
    return { success: true, message: "Plano criado!" };
  } catch (error) { console.error("[createPlan] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function updatePlan(_prev: ActionPlanFormState, formData: FormData): Promise<ActionPlanFormState> {
  try {
    const planId = formData.get("planId") as string;
    const raw = { title: formData.get("title"), unit: formData.get("unit"), director: formData.get("director"), goal: formData.get("goal") };
    const v = planSchema.safeParse(raw);
    if (!v.success) return { errors: v.error.flatten().fieldErrors, message: "Verifique os campos." };
    const supabase = await createClient();
    const { error } = await supabase.from("action_plans").update({ ...v.data, updated_at: new Date().toISOString() }).eq("id", planId);
    if (error) return { message: "Erro ao atualizar." };
    await logAudit(planId, "UPDATE_PLAN", { ...v.data });
    revalidatePath("/planos");
    revalidatePath("/dashboard");
    revalidatePath("/calendario");
    return { success: true, message: "Plano atualizado!" };
  } catch (error) { console.error("[updatePlan] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function deletePlan(_prev: ActionPlanFormState, formData: FormData): Promise<ActionPlanFormState> {
  try {
    const planId = formData.get("planId") as string;
    const supabase = await createClient();
    const { data: plan } = await supabase.from("action_plans").select("title").eq("id", planId).single();
    await supabase.from("action_plans").delete().eq("id", planId);
    if (plan) await logAudit(planId, "DELETE_PLAN", { deleted: plan.title });
    revalidatePath("/planos");
    revalidatePath("/dashboard");
    revalidatePath("/calendario");
    return { success: true, message: "Plano excluído!" };
  } catch (error) { console.error("[deletePlan] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function upsertItem(_prev: ActionPlanFormState, formData: FormData): Promise<ActionPlanFormState> {
  try {
    const itemId = formData.get("itemId") as string;
    const planId = formData.get("planId") as string;
    if (!planId) return { message: "Plano obrigatório." };
    const raw: Record<string, unknown> = {};
    const textFields = ["number", "action", "why", "where", "responsible", "cost", "expected_result", "actual_result", "observations"];
    for (const f of textFields) raw[f] = formData.get(f) || "";
    const dateFields = ["planned_start", "planned_end", "actual_start", "actual_end"];
    for (const f of dateFields) raw[f] = formData.get(f) || undefined;
    raw.status = formData.get("status") || "1";
    raw.sort_order = formData.get("sort_order") || "0";
    raw.parent_id = formData.get("parent_id") || null;
    const v = itemSchema.safeParse(raw);
    if (!v.success) return { errors: v.error.flatten().fieldErrors, message: "Verifique os campos." };
    const supabase = await createClient();
    const payload = { ...v.data, plan_id: planId };
    if (itemId) {
      const { error } = await supabase.from("action_items").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", itemId);
      if (error) return { message: "Erro ao atualizar." };
      await logAudit(planId, "UPDATE_ITEM", { ...payload }, itemId);
    } else {
      const { data: created, error } = await supabase.from("action_items").insert(payload).select().single();
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
    const itemId = formData.get("itemId") as string;
    if (!itemId) return { message: "ID obrigatório." };
    const supabase = await createClient();
    const { data: item } = await supabase.from("action_items").select("plan_id,number,action").eq("id", itemId).single();
    await supabase.from("action_items").delete().eq("id", itemId);
    if (item) await logAudit(item.plan_id, "DELETE_ITEM", { number: item.number, action: item.action }, itemId);
    revalidatePath("/planos");
    revalidatePath("/dashboard");
    revalidatePath("/calendario");
    return { success: true, message: "Item excluído!" };
  } catch (error) { console.error("[deleteItem] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function updateItemStatus(itemId: string, status: number): Promise<ActionPlanFormState> {
  try {
    if (!itemId) return { message: "ID obrigatório." };
    if (status < 1 || status > 5) return { message: "Status inválido." };

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

export async function bulkUpdateStatus(planId: string, itemIds: string[], status: number): Promise<ActionPlanFormState> {
  try {
    if (!planId) return { message: "Plano obrigatório." };
    if (!itemIds.length) return { message: "Selecione pelo menos um item." };
    if (status < 1 || status > 5) return { message: "Status inválido." };

    const supabase = await createClient();
    const { error } = await supabase.from("action_items").update({ status, updated_at: new Date().toISOString() }).in("id", itemIds);
    if (error) return { message: "Erro ao atualizar." };

    revalidatePath("/planos");
    revalidatePath("/dashboard");
    revalidatePath("/calendario");

    return { success: true, message: `${itemIds.length} itens atualizados!` };
  } catch (error) { console.error("[bulkUpdateStatus] Error:", error); return { message: "Serviço indisponível." }; }
}
