import { notFound } from "next/navigation";
import { ContaDetalheClient } from "@/components/financeiro/conta-detalhe-client";
import { getContaById } from "@/app/actions/contas-pagar";
import { getCategoriasDespesa } from "@/app/actions/contas-pagar-categorias";
import { getFornecedores } from "@/app/actions/fornecedores";

export const metadata = { title: "Conta a pagar — PlanoCerto" };

export default async function ContaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [conta, categorias, fornecedores] = await Promise.all([
    getContaById(id),
    getCategoriasDespesa(),
    getFornecedores(),
  ]);

  if (!conta) notFound();

  return (
    <ContaDetalheClient
      initial={conta}
      fornecedores={fornecedores}
      categorias={categorias}
    />
  );
}
