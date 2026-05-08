"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  sanitizeText,
  mapPgError,
  requireAdmin,
} from "@/app/actions/_catalog-utils";
import { prioridadeSchema } from "@/lib/schemas/catalog-schemas";
import type { PrioridadeRow, CatalogFormState } from "@/types/catalog";

export async function getPrioridadesAdmin(): Promise<PrioridadeRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("prioridades")
      .select("*")
      .order("sort_order")
      .order("name");
    return (data || []) as PrioridadeRow[];
  } catch (error) {
    console.error("[getPrioridadesAdmin] Error:", error);
    return [];
  }
}

export async function upsertPrioridade(
  _prev: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const id = formData.get("id") as string | null;
    const name = await sanitizeText(formData.get("name"), 40);
    const v = prioridadeSchema.safeParse({
      name,
      sort_order: formData.get("sort_order") || 0,
      active:
        formData.get("active") === "on" || formData.get("active") === "true",
      color: formData.get("color") || "zinc",
    });
    if (!v.success) {
      return {
        errors: v.error.flatten().fieldErrors,
        message: "Verifique os campos.",
      };
    }
    const supabase = await createClient();
    if (id) {
      const { error } = await supabase
        .from("prioridades")
        .update({ ...v.data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return { message: await mapPgError(error, "Prioridade") };
    } else {
      const { error } = await supabase.from("prioridades").insert(v.data);
      if (error) return { message: await mapPgError(error, "Prioridade") };
    }
    revalidatePath("/admin/catalogos/prioridades");
    return {
      success: true,
      message: id ? "Prioridade atualizada!" : "Prioridade criada!",
    };
  } catch (error) {
    console.error("[upsertPrioridade] Error:", error);
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
}

export async function deletePrioridade(
  _prev: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const id = formData.get("id") as string;
    if (!id) return { message: "ID obrigatório." };
    const supabase = await createClient();
    const { error } = await supabase.from("prioridades").delete().eq("id", id);
    if (error) return { message: await mapPgError(error, "Prioridade") };
    revalidatePath("/admin/catalogos/prioridades");
    return { success: true, message: "Prioridade excluída!" };
  } catch (error) {
    console.error("[deletePrioridade] Error:", error);
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
}

export async function togglePrioridadeActive(
  id: string,
  active: boolean,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const supabase = await createClient();
    const { error } = await supabase
      .from("prioridades")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { message: await mapPgError(error, "Prioridade") };
    revalidatePath("/admin/catalogos/prioridades");
    return {
      success: true,
      message: active ? "Prioridade ativada." : "Prioridade desativada.",
    };
  } catch (error) {
    console.error("[togglePrioridadeActive] Error:", error);
    return { message: "Serviço indisponível." };
  }
}
