"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { mapPgError, requireAdmin } from "@/app/actions/_catalog-utils";
import { createCatalogCrud } from "@/app/actions/_catalog-crud-factory";
import { getCurrentTenantId } from "@/app/actions/_helpers";
import { areaSchema } from "@/lib/schemas/catalog-schemas";
import type { Area, CatalogFormState } from "@/types/catalog";
import { logger } from "@/lib/logger";

const log = logger.child({ component: "actions:areas" });

const crud = createCatalogCrud<Area>({
  table: "areas",
  schema: areaSchema,
  label: "Área",
  gender: "f",
  revalidatePaths: ["/admin/catalogos/areas"],
  revalidateTags: [["catalog-areas", "max"]],
  // Áreas são escopadas por empresa: leitura/inserção herdam o tenant ativo e
  // update/delete/toggle só afetam linhas do tenant ativo (impede edição
  // cruzada por id).
  tenantScoped: true,
  beforeInsert: async (data) => {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) throw new Error("Nenhuma empresa ativa para vincular a área.");
    return { ...data, tenant_id: tenantId };
  },
});

/** Áreas da empresa ativa (escopadas por tenant, como as unidades). */
export async function getAreasAdmin(): Promise<Area[]> {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) return [];
    const supabase = await createClient();
    const { data } = await supabase
      .from("areas")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("sort_order")
      .order("name");
    return (data || []) as Area[];
  } catch (error) {
    log.error({ error }, "[getAreasAdmin] Erro");
    return [];
  }
}

export const upsertArea = crud.upsert;
export const deleteArea = crud.delete;
export const toggleAreaActive = crud.toggleActive;

export async function updateAreaRegionalContext(
  areaId: string,
  context: NonNullable<Area["regional_context"]>,
): Promise<CatalogFormState> {
  try {
    const guard = await requireAdmin();
    if (guard) return { message: guard };

    const supabase = await createClient();
    const { error } = await supabase
      .from("areas")
      .update({ regional_context: context as Json, updated_at: new Date().toISOString() })
      .eq("id", areaId);

    if (error) return { message: await mapPgError(error, "Área") };

    revalidatePath("/admin/catalogos/areas");
    revalidateTag("catalog-areas", "max");
    return { success: true, message: "Contexto regional da área atualizado!" };
  } catch (error) {
    log.error({ error }, "[updateAreaRegionalContext] Erro");
    return { message: "Serviço indisponível." };
  }
}
