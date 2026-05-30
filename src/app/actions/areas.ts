"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { mapPgError, requireAdmin } from "@/app/actions/_catalog-utils";
import { createCatalogCrud } from "@/app/actions/_catalog-crud-factory";
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
});

export const getAreasAdmin = crud.getAll;
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
