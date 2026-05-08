"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  sanitizeText,
  mapPgError,
  requireAdmin,
} from "@/app/actions/_catalog-utils";
import { areaSchema } from "@/lib/schemas/catalog-schemas";
import type { Area, CatalogFormState } from "@/types/catalog";

export async function getAreasAdmin(): Promise<Area[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("areas")
      .select("*")
      .order("sort_order")
      .order("name");
    return (data || []) as Area[];
  } catch (error) {
    console.error("[getAreasAdmin] Error:", error);
    return [];
  }
}

export async function upsertArea(
  _prev: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const id = formData.get("id") as string | null;
    const name = await sanitizeText(formData.get("name"), 80);
    const v = areaSchema.safeParse({
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
        .from("areas")
        .update({ ...v.data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return { message: await mapPgError(error, "Área") };
    } else {
      const { error } = await supabase.from("areas").insert(v.data);
      if (error) return { message: await mapPgError(error, "Área") };
    }
    revalidatePath("/admin/catalogos/areas");
    return { success: true, message: id ? "Área atualizada!" : "Área criada!" };
  } catch (error) {
    console.error("[upsertArea] Error:", error);
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
}

export async function deleteArea(
  _prev: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const id = formData.get("id") as string;
    if (!id) return { message: "ID obrigatório." };
    const supabase = await createClient();
    const { error } = await supabase.from("areas").delete().eq("id", id);
    if (error) return { message: await mapPgError(error, "Área") };
    revalidatePath("/admin/catalogos/areas");
    return { success: true, message: "Área excluída!" };
  } catch (error) {
    console.error("[deleteArea] Error:", error);
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
}

export async function toggleAreaActive(
  id: string,
  active: boolean,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const supabase = await createClient();
    const { error } = await supabase
      .from("areas")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { message: await mapPgError(error, "Área") };
    revalidatePath("/admin/catalogos/areas");
    return {
      success: true,
      message: active ? "Área ativada." : "Área desativada.",
    };
  } catch (error) {
    console.error("[toggleAreaActive] Error:", error);
    return { message: "Serviço indisponível." };
  }
}
