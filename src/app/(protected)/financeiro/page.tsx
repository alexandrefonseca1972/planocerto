import { getResumoContas } from "@/app/actions/contas-pagar";
import { getFornecedores } from "@/app/actions/fornecedores";
import { FinanceiroClient } from "./financeiro-client";

function rangeDoMes(mes: number, ano: number) {
  const from = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const lastDay = new Date(ano, mes, 0).getDate();
  const to = `${ano}-${String(mes).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export default async function FinanceiroPage() {
  const hoje = new Date();
  const mes = hoje.getMonth() + 1;
  const ano = hoje.getFullYear();

  const [initialResumo, initialFornecedores] = await Promise.all([
    getResumoContas({ range: rangeDoMes(mes, ano), fornecedor_id: null, ano }).catch(() => null),
    getFornecedores().catch(() => []),
  ]);

  return (
    <FinanceiroClient
      initialResumo={initialResumo}
      initialFornecedores={initialFornecedores}
    />
  );
}
