import { ContasPagarClient } from "@/components/financeiro/contas-pagar-client";
import { getContasPagar } from "@/app/actions/contas-pagar";
import { getCategoriasDespesa } from "@/app/actions/contas-pagar-categorias";
import { getFornecedores } from "@/app/actions/fornecedores";

export const metadata = { title: "Contas a pagar — PlanoCerto" };

export default async function ContasPagarPage() {
  const [contas, categorias, fornecedores] = await Promise.all([
    getContasPagar({ status: "todos" }),
    getCategoriasDespesa(),
    getFornecedores(),
  ]);

  return (
    <ContasPagarClient
      initial={contas}
      fornecedores={fornecedores}
      categorias={categorias}
    />
  );
}
