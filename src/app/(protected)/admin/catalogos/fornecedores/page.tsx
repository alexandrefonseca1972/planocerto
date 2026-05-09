import { FornecedoresClient } from "@/components/admin/catalogos/fornecedores-client";
import { getFornecedores } from "@/app/actions/fornecedores";

export const metadata = { title: "Fornecedores — Catálogos — PlanoCerto" };

export default async function FornecedoresPage() {
  const fornecedores = await getFornecedores();
  return <FornecedoresClient initial={fornecedores} />;
}
