"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/validation/sanitize";
import { mapPgError, requireAdmin } from "@/app/actions/_catalog-utils";
import { categoriaDespesaSchema } from "@/lib/schemas/financeiro-schemas";
import type { CategoriaDespesa, FinanceFormState } from "@/types/financeiro";

export async function getCategoriasDespesa(): Promise<CategoriaDespesa[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("categorias_despesa")
      .select("*")
      .order("sort_order")
      .order("name");
    return (data || []) as CategoriaDespesa[];
  } catch (error) {
    console.error("[getCategoriasDespesa] Error:", error);
    return [];
  }
}

export async function upsertCategoriaDespesa(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const id = formData.get("id") as string | null;
    const tenantIdRaw = formData.get("tenant_id");
    const tenantId =
      tenantIdRaw && tenantIdRaw !== "" ? String(tenantIdRaw) : null;

    const payload = {
      name: await sanitizeText(formData.get("name"), 80),
      sort_order: formData.get("sort_order") || 0,
      active:
        formData.get("active") === "on" || formData.get("active") === "true",
    };

    const v = categoriaDespesaSchema.safeParse(payload);
    if (!v.success) {
      return {
        errors: v.error.flatten().fieldErrors,
        message: "Verifique os campos.",
      };
    }

    const supabase = await createClient();
    if (id) {
      const { error } = await supabase
        .from("categorias_despesa")
        .update({ ...v.data, tenant_id: tenantId })
        .eq("id", id);
      if (error) return { message: await mapPgError(error, "Categoria de despesa") };
    } else {
      const { error } = await supabase
        .from("categorias_despesa")
        .insert({ ...v.data, tenant_id: tenantId });
      if (error) return { message: await mapPgError(error, "Categoria de despesa") };
    }

    revalidatePath("/admin/catalogos/categorias-despesa");
    revalidatePath("/financeiro/contas-a-pagar");
    return {
      success: true,
      message: id ? "Categoria atualizada!" : "Categoria criada!",
    };
  } catch (error) {
    console.error("[upsertCategoriaDespesa] Error:", error);
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
}

export async function deleteCategoriaDespesa(
  _prev: FinanceFormState,
  formData: FormData,
): Promise<FinanceFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const id = formData.get("id") as string;
    if (!id) return { message: "ID obrigatório." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("categorias_despesa")
      .delete()
      .eq("id", id);
    if (error) return { message: await mapPgError(error, "Categoria de despesa") };
    revalidatePath("/admin/catalogos/categorias-despesa");
    revalidatePath("/financeiro/contas-a-pagar");
    return { success: true, message: "Categoria excluída!" };
  } catch (error) {
    console.error("[deleteCategoriaDespesa] Error:", error);
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
}

export async function toggleCategoriaDespesaActive(
  id: string,
  active: boolean,
): Promise<FinanceFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const supabase = await createClient();
    const { error } = await supabase
      .from("categorias_despesa")
      .update({ active })
      .eq("id", id);
    if (error) return { message: await mapPgError(error, "Categoria de despesa") };
    revalidatePath("/admin/catalogos/categorias-despesa");
    revalidatePath("/financeiro/contas-a-pagar");
    return {
      success: true,
      message: active ? "Categoria ativada." : "Categoria desativada.",
    };
  } catch (error) {
    console.error("[toggleCategoriaDespesaActive] Error:", error);
    return { message: "Serviço indisponível." };
  }
}
