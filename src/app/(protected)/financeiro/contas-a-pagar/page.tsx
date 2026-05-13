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

  if (
    process.env.NODE_ENV !== "production" &&
    contas.length === 0 &&
    categorias.length === 0 &&
    fornecedores.length === 0
  ) {
    console.warn("[ContasPagarPage] All queries returned empty results - possible database or RLS issue");
  }

  return (
    <ContasPagarClient
      initial={contas}
      fornecedores={fornecedores}
      categorias={categorias}
    />
  );
}
