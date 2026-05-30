"use server";

import { prioridadeSchema } from "@/lib/schemas/catalog-schemas";
import { createCatalogCrud } from "@/app/actions/_catalog-crud-factory";
import { sanitizeText } from "@/app/actions/_catalog-utils";
import type { PrioridadeRow } from "@/types/catalog";

async function parsePayload(formData: FormData): Promise<Record<string, unknown>> {
  return {
    name: await sanitizeText(formData.get("name"), 40),
    sort_order: formData.get("sort_order") || 0,
    active: formData.get("active") === "on" || formData.get("active") === "true",
    color: formData.get("color") || "zinc",
  };
}

const crud = createCatalogCrud<PrioridadeRow>({
  table: "prioridades",
  schema: prioridadeSchema,
  label: "Prioridade",
  gender: "f",
  revalidatePaths: ["/admin/catalogos/prioridades"],
  parsePayload,
  nameMaxLength: 40,
});

export const getPrioridadesAdmin = crud.getAll;
export const upsertPrioridade = crud.upsert;
export const deletePrioridade = crud.delete;
export const togglePrioridadeActive = crud.toggleActive;
