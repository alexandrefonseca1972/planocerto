"use server";

import { macroAcaoSchema } from "@/lib/schemas/catalog-schemas";
import { createCatalogCrud } from "@/app/actions/_catalog-crud-factory";
import type { MacroAcao } from "@/types/catalog";

const crud = createCatalogCrud<MacroAcao>({
  table: "macro_acoes",
  schema: macroAcaoSchema,
  label: "Macro Ação",
  gender: "f",
  revalidatePaths: ["/admin/catalogos/macro-acoes"],
  revalidateTags: [["catalog-macro-acoes", "max"]],
  nameMaxLength: 100,
});

export const getMacroAcoesAdmin = crud.getAll;
export const upsertMacroAcao = crud.upsert;
export const deleteMacroAcao = crud.delete;
export const toggleMacroAcaoActive = crud.toggleActive;
