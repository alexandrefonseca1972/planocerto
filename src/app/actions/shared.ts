"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// --- Copy Plan ---

export async function copyPlan(sourcePlanId: string, targetTenantId: string): Promise<{ message: string; success?: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };

    // Get source plan
    const { data: source } = await supabase.from("action_plans").select("*").eq("id", sourcePlanId).single();
    if (!source) return { message: "Plano origem não encontrado." };

    // Create new plan
    const { data: newPlan, error: planError } = await supabase.from("action_plans").insert({
      tenant_id: targetTenantId,
      title: `${source.title} (cópia)`,
      unit: source.unit,
      director: source.director,
      goal: source.goal,
      user_id: user.id,
    }).select().single();

    if (planError || !newPlan) return { message: "Erro ao criar cópia do plano." };

    // Get all items recursively
    const { data: items } = await supabase.from("action_items").select("*").eq("plan_id", sourcePlanId).order("sort_order");
    if (!items?.length) {
      revalidatePath("/planos");
      return { success: true, message: "Plano copiado (sem itens)!" };
    }

    // Map old IDs to new IDs
    const idMap = new Map<string, string>();

    // Insert all items with new IDs
    for (const item of items) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);

      await supabase.from("action_items").insert({
        id: newId,
        plan_id: newPlan.id,
        parent_id: null, // Will be updated after all items are created
        number: item.number,
        sort_order: item.sort_order,
        action: item.action,
        why: item.why,
        where: item.where,
        responsible: item.responsible,
        planned_start: item.planned_start,
        planned_end: item.planned_end,
        cost: item.cost,
        expected_result: item.expected_result,
        status: 1, // Reset status to "Not Started"
        observations: item.observations,
      });
    }

    // Update parent_id references
    for (const item of items) {
      if (item.parent_id && idMap.has(item.parent_id)) {
        const newId = idMap.get(item.id);
        const newParentId = idMap.get(item.parent_id);
        if (newId && newParentId) {
          await supabase.from("action_items").update({ parent_id: newParentId }).eq("id", newId);
        }
      }
    }

    revalidatePath("/planos");
    return { success: true, message: `Plano copiado com ${items.length} itens!` };
  } catch (error) { console.error("[copyPlan] Error:", error); return { message: "Serviço indisponível." }; }
}

// --- Comments ---

const commentSchema = z.object({
  content: z.string().trim().min(1, "Comentário obrigatório.").max(2000),
});

export async function addComment(itemId: string, content: string): Promise<{ message: string; success?: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };

    const v = commentSchema.safeParse({ content });
    if (!v.success) return { message: "Comentário inválido." };

    const { error } = await supabase.from("item_comments").insert({
      item_id: itemId,
      user_id: user.id,
      content: v.data.content,
    });

    if (error) return { message: "Erro ao comentar." };

    revalidatePath("/planos");
    return { success: true, message: "Comentário adicionado!" };
  } catch (error) { console.error("[addComment] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function getComments(itemId: string): Promise<{ id: string; content: string; user_id: string; author: string; created_at: string }[]> {
  try {
    const supabase = await createClient();
    const { data: comments } = await supabase.from("item_comments").select("id, content, user_id, created_at").eq("item_id", itemId).order("created_at", { ascending: true });

    if (!comments?.length) return [];

    // Get author names
    const userIds = [...new Set(comments.map(c => c.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, name, email").in("id", userIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    return comments.map(c => ({
      ...c,
      author: profileMap.get(c.user_id)?.name || "Usuário",
    }));
  } catch (error) { console.error("[getComments] Error:", error); return []; }
}

export async function deleteComment(commentId: string): Promise<{ message: string; success?: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };

    await supabase.from("item_comments").delete().eq("id", commentId).eq("user_id", user.id);
    revalidatePath("/planos");
    return { success: true, message: "Comentário removido." };
  } catch (error) { console.error("[deleteComment] Error:", error); return { message: "Serviço indisponível." }; }
}

// --- Public Links ---

export async function createPublicLink(planId: string, expiresInDays?: number): Promise<{ message: string; success?: boolean; token?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };

    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : null;

    const { error } = await supabase.from("public_links").insert({
      plan_id: planId,
      token,
      expires_at: expiresAt,
      created_by: user.id,
    });

    if (error) return { message: "Erro ao criar link." };

    revalidatePath("/planos");
    return { success: true, message: "Link criado!", token };
  } catch (error) { console.error("[createPublicLink] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function deletePublicLink(linkId: string): Promise<{ message: string; success?: boolean }> {
  try {
    const supabase = await createClient();
    await supabase.from("public_links").delete().eq("id", linkId);
    revalidatePath("/planos");
    return { success: true, message: "Link removido." };
  } catch (error) { console.error("[deletePublicLink] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function getPublicLinks(planId: string): Promise<{ id: string; token: string; expires_at: string | null; created_at: string }[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("public_links").select("id, token, expires_at, created_at").eq("plan_id", planId).order("created_at", { ascending: false });
    return (data || []) as { id: string; token: string; expires_at: string | null; created_at: string }[];
  } catch (error) { console.error("[getPublicLinks] Error:", error); return []; }
}

// --- Templates ---

export async function getTemplates(): Promise<{ id: string; name: string; title: string; unit: string; director: string; goal: string }[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("plan_templates").select("id, name, title, unit, director, goal").eq("is_system", true).order("name");
    return (data || []) as { id: string; name: string; title: string; unit: string; director: string; goal: string }[];
  } catch (error) { console.error("[getTemplates] Error:", error); return []; }
}

export async function createPlanFromTemplate(templateId: string, tenantId: string): Promise<{ message: string; success?: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: "Não autenticado." };

    // Get template
    const { data: template } = await supabase.from("plan_templates").select("*").eq("id", templateId).single();
    if (!template) return { message: "Template não encontrado." };

    // Create plan
    const { data: newPlan, error: planError } = await supabase.from("action_plans").insert({
      tenant_id: tenantId,
      title: template.title,
      unit: template.unit,
      director: template.director,
      goal: template.goal,
      user_id: user.id,
    }).select().single();

    if (planError || !newPlan) return { message: "Erro ao criar plano." };

    // Get template items
    const { data: templateItems } = await supabase.from("plan_template_items").select("*").eq("template_id", templateId).order("sort_order");
    if (!templateItems?.length) {
      revalidatePath("/planos");
      return { success: true, message: "Plano criado (sem itens)!" };
    }

    // Map old IDs to new IDs and insert items
    const idMap = new Map<string, string>();

    // First pass: create all items
    for (const item of templateItems) {
      const newId = crypto.randomUUID();
      idMap.set(item.id, newId);

      await supabase.from("action_items").insert({
        id: newId,
        plan_id: newPlan.id,
        parent_id: null,
        number: item.number,
        sort_order: item.sort_order,
        action: item.action,
        why: item.why,
        where: item.where_field,
        responsible: item.responsible,
        cost: item.cost,
        expected_result: item.expected_result,
        status: 1,
      });
    }

    // Second pass: update parent references
    for (const item of templateItems) {
      if (item.parent_id && idMap.has(item.parent_id)) {
        const newId = idMap.get(item.id);
        const newParentId = idMap.get(item.parent_id);
        if (newId && newParentId) {
          await supabase.from("action_items").update({ parent_id: newParentId }).eq("id", newId);
        }
      }
    }

    revalidatePath("/planos");
    return { success: true, message: `Plano criado com ${templateItems.length} itens!` };
  } catch (error) { console.error("[createPlanFromTemplate] Error:", error); return { message: "Serviço indisponível." }; }
}
