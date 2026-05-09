import { CategoriasDespesaClient } from "@/components/admin/catalogos/categorias-despesa-client";
import { getCategoriasDespesa } from "@/app/actions/contas-pagar-categorias";

export const metadata = {
  title: "Categorias de despesa — Catálogos — PlanoCerto",
};

export default async function CategoriasDespesaPage() {
  const categorias = await getCategoriasDespesa();
  return <CategoriasDespesaClient initial={categorias} />;
}
