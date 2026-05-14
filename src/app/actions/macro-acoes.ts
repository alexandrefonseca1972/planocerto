"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  sanitizeText,
  mapPgError,
  requireAdmin,
} from "@/app/actions/_catalog-utils";
import { macroAcaoSchema } from "@/lib/schemas/catalog-schemas";
import type { MacroAcao, CatalogFormState } from "@/types/catalog";

export async function getMacroAcoesAdmin(): Promise<MacroAcao[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("macro_acoes")
      .select("*")
      .order("sort_order")
      .order("name");
    return (data || []) as MacroAcao[];
  } catch (error) {
    console.error("[getMacroAcoesAdmin] Error:", error);
    return [];
  }
}

export async function upsertMacroAcao(
  _prev: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const id = formData.get("id") as string | null;
    const name = await sanitizeText(formData.get("name"), 100);
    const v = macroAcaoSchema.safeParse({
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
        .from("macro_acoes")
        .update({ ...v.data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return { message: await mapPgError(error, "Macro Ação") };
    } else {
      const { error } = await supabase.from("macro_acoes").insert(v.data);
      if (error) return { message: await mapPgError(error, "Macro Ação") };
    }
    revalidatePath("/admin/catalogos/macro-acoes");
    revalidateTag("catalog-macro-acoes", "max");
    return {
      success: true,
      message: id ? "Macro Ação atualizada!" : "Macro Ação criada!",
    };
  } catch (error) {
    console.error("[upsertMacroAcao] Error:", error);
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
}

export async function deleteMacroAcao(
  _prev: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const id = formData.get("id") as string;
    if (!id) return { message: "ID obrigatório." };
    const supabase = await createClient();
    const { error } = await supabase.from("macro_acoes").delete().eq("id", id);
    if (error) return { message: await mapPgError(error, "Macro Ação") };
    revalidatePath("/admin/catalogos/macro-acoes");
    revalidateTag("catalog-macro-acoes", "max");
    return { success: true, message: "Macro Ação excluída!" };
  } catch (error) {
    console.error("[deleteMacroAcao] Error:", error);
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
}

export async function toggleMacroAcaoActive(
  id: string,
  active: boolean,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const supabase = await createClient();
    const { error } = await supabase
      .from("macro_acoes")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { message: await mapPgError(error, "Macro Ação") };
    revalidatePath("/admin/catalogos/macro-acoes");
    revalidateTag("catalog-macro-acoes", "max");
    return {
      success: true,
      message: active ? "Macro Ação ativada." : "Macro Ação desativada.",
    };
  } catch (error) {
    console.error("[toggleMacroAcaoActive] Error:", error);
    return { message: "Serviço indisponível." };
  }
}
