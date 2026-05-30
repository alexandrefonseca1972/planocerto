"use server";

import { tipoPaSchema } from "@/lib/schemas/catalog-schemas";
import { createCatalogCrud } from "@/app/actions/_catalog-crud-factory";
import type { TipoPA } from "@/types/catalog";

const crud = createCatalogCrud<TipoPA>({
  table: "tipos_pa",
  schema: tipoPaSchema,
  label: "Tipo PA",
  gender: "m",
  revalidatePaths: ["/admin/catalogos/tipos-pa"],
  revalidateTags: [["catalog-tipos-pa", "max"]],
});

export const getTiposPA = crud.getAll;
export const upsertTipoPA = crud.upsert;
export const deleteTipoPA = crud.delete;
export const toggleTipoPAActive = crud.toggleActive;
