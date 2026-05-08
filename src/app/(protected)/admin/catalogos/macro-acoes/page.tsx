import { MacroAcoesClient } from "@/components/admin/catalogos/macro-acoes-client";
import { getMacroAcoesAdmin } from "@/app/actions/macro-acoes";

export const metadata = { title: "Macro Ações — Catálogos — PlanoCerto" };

export default async function MacroAcoesPage() {
  const macros = await getMacroAcoesAdmin();
  return <MacroAcoesClient initial={macros} />;
}
