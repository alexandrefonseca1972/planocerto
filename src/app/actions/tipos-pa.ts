"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  sanitizeText,
  mapPgError,
  requireAdmin,
} from "@/app/actions/_catalog-utils";
import { tipoPaSchema } from "@/lib/schemas/catalog-schemas";
import type { TipoPA, CatalogFormState } from "@/types/catalog";

export async function getTiposPA(): Promise<TipoPA[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tipos_pa")
      .select("*")
      .order("sort_order")
      .order("name");
    return (data || []) as TipoPA[];
  } catch (error) {
    console.error("[getTiposPA] Error:", error);
    return [];
  }
}

export async function upsertTipoPA(
  _prev: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const id = formData.get("id") as string | null;
    const name = await sanitizeText(formData.get("name"), 80);
    const v = tipoPaSchema.safeParse({
      name,
      sort_order: formData.get("sort_order") || 0,
      active:
        formData.get("active") === "on" || formData.get("active") === "true",
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
        .from("tipos_pa")
        .update({ ...v.data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return { message: await mapPgError(error, "Tipo PA") };
    } else {
      const { error } = await supabase.from("tipos_pa").insert(v.data);
      if (error) return { message: await mapPgError(error, "Tipo PA") };
    }
    revalidatePath("/admin/catalogos/tipos-pa");
    return { success: true, message: id ? "Tipo PA atualizado!" : "Tipo PA criado!" };
  } catch (error) {
    console.error("[upsertTipoPA] Error:", error);
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
}

export async function deleteTipoPA(
  _prev: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const id = formData.get("id") as string;
    if (!id) return { message: "ID obrigatório." };
    const supabase = await createClient();
    const { error } = await supabase.from("tipos_pa").delete().eq("id", id);
    if (error) return { message: await mapPgError(error, "Tipo PA") };
    revalidatePath("/admin/catalogos/tipos-pa");
    return { success: true, message: "Tipo PA excluído!" };
  } catch (error) {
    console.error("[deleteTipoPA] Error:", error);
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
}

export async function toggleTipoPAActive(
  id: string,
  active: boolean,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const supabase = await createClient();
    const { error } = await supabase
      .from("tipos_pa")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { message: await mapPgError(error, "Tipo PA") };
    revalidatePath("/admin/catalogos/tipos-pa");
    return { success: true, message: active ? "Tipo PA ativado." : "Tipo PA desativado." };
  } catch (error) {
    console.error("[toggleTipoPAActive] Error:", error);
    return { message: "Serviço indisponível." };
  }
}
