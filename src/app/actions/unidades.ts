"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/validation/sanitize";
import { mapPgError, requireAdmin } from "@/app/actions/_catalog-utils";
import { unitSchema } from "@/lib/schemas/catalog-schemas";
import { getCurrentTenantId } from "@/app/actions/_helpers";
import type { Unit, CatalogFormState } from "@/types/catalog";

export async function getUnitsAdmin(): Promise<Unit[]> {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return [];
    const supabase = await createClient();
    const { data } = await supabase
      .from("units")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("sort_order")
      .order("name");
    return (data || []) as Unit[];
  } catch (error) {
    console.error("[getUnitsAdmin] Error:", error);
    return [];
  }
}

/** Cota de unidades da empresa ativa: usadas e limite (null = ilimitado). */
export async function getUnitsQuota(): Promise<{ used: number; max: number | null }> {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return { used: 0, max: 0 };
    const supabase = await createClient();
    const [{ count }, { data: tenant }] = await Promise.all([
      supabase.from("units").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId),
      supabase.from("tenants").select("max_units").eq("id", tenantId).maybeSingle(),
    ]);
    return { used: count ?? 0, max: (tenant?.max_units as number | null) ?? null };
  } catch (error) {
    console.error("[getUnitsQuota] Error:", error);
    return { used: 0, max: null };
  }
}

export async function upsertUnit(
  _prev: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const id = formData.get("id") as string | null;
    const areaIdRaw = formData.get("area_id");
    const name = await sanitizeText(formData.get("name"), 100);
    const v = unitSchema.safeParse({
      name,
      area_id: areaIdRaw && areaIdRaw !== "" ? String(areaIdRaw) : null,
      uf: String(formData.get("uf") || "").toUpperCase(),
      responsavel: String(formData.get("responsavel") || ""),
      email: String(formData.get("email") || ""),
      fone: String(formData.get("fone") || ""),
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
        .from("units")
        .update({ ...v.data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return { message: await mapPgError(error, "Unidade") };
    } else {
      const tenantId = await getCurrentTenantId();
      if (!tenantId) return { message: "Nenhuma empresa ativa para vincular a unidade." };

      // Enforce o limite de unidades da empresa (max_units; null = ilimitado).
      const { data: tenant } = await supabase
        .from("tenants")
        .select("max_units")
        .eq("id", tenantId)
        .maybeSingle();
      const max = (tenant?.max_units as number | null) ?? null;
      if (max != null) {
        const { count } = await supabase
          .from("units")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId);
        if ((count ?? 0) >= max) {
          return {
            message: `Limite de ${max} unidade(s) atingido para esta empresa. Exclua uma unidade ou aumente o limite.`,
          };
        }
      }

      const { error } = await supabase.from("units").insert({
        name: v.data.name,
        area_id: v.data.area_id ?? null,
        uf: v.data.uf,
        responsavel: v.data.responsavel,
        email: v.data.email,
        fone: v.data.fone,
        sort_order: v.data.sort_order,
        active: v.data.active,
        tenant_id: tenantId,
      });
      if (error) return { message: await mapPgError(error, "Unidade") };
    }
    revalidatePath("/admin/catalogos/unidades");
    return {
      success: true,
      message: id ? "Unidade atualizada!" : "Unidade criada!",
    };
  } catch (error) {
    console.error("[upsertUnit] Error:", error);
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
}

export async function deleteUnit(
  _prev: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const id = formData.get("id") as string;
    if (!id) return { message: "ID obrigatório." };
    const supabase = await createClient();
    const { error } = await supabase.from("units").delete().eq("id", id);
    if (error) return { message: await mapPgError(error, "Unidade") };
    revalidatePath("/admin/catalogos/unidades");
    return { success: true, message: "Unidade excluída!" };
  } catch (error) {
    console.error("[deleteUnit] Error:", error);
    return { message: "Serviço indisponível. Tente novamente em instantes." };
  }
}

export async function updateUnitRegionalContext(
  unitId: string,
  context: NonNullable<Unit["regional_context"]>,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const supabase = await createClient();
    const { error } = await supabase
      .from("units")
      .update({ regional_context: context, updated_at: new Date().toISOString() })
      .eq("id", unitId);

    if (error) return { message: await mapPgError(error, "Unidade") };

    revalidatePath("/admin/catalogos/unidades");
    return { success: true, message: "Contexto regional atualizado!" };
  } catch (error) {
    console.error("[updateUnitRegionalContext] Error:", error);
    return { message: "Serviço indisponível." };
  }
}

export async function toggleUnitActive(
  id: string,
  active: boolean,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const supabase = await createClient();
    const { error } = await supabase
      .from("units")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { message: await mapPgError(error, "Unidade") };
    revalidatePath("/admin/catalogos/unidades");
    return {
      success: true,
      message: active ? "Unidade ativada." : "Unidade desativada.",
    };
  } catch (error) {
    console.error("[toggleUnitActive] Error:", error);
    return { message: "Serviço indisponível." };
  }
}
