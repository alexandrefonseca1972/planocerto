import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Receipt, Wallet, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { getResumoContas } from "@/app/actions/contas-pagar";
import { formatBRL, formatDateBR } from "@/lib/format-br";

export const metadata = { title: "Financeiro — PlanoCerto" };

export default async function FinanceiroPage() {
  const resumo = await getResumoContas();

  return (
    <div className="space-y-5">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Financeiro</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Wallet className="h-5 w-5 text-accent-600" /> Financeiro
          </h2>
          <p className="text-sm text-zinc-500">
            Acompanhe contas a pagar, vencimentos e pagamentos da empresa ativa.
          </p>
        </div>
        <Link
          href="/financeiro/contas-a-pagar"
          className={buttonVariants({ variant: "default" })}
        >
          <Receipt className="h-4 w-4" /> Abrir contas a pagar
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase text-zinc-500">Em aberto</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {formatBRL(resumo.total_em_aberto)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {resumo.contas_quantidade}{" "}
              {resumo.contas_quantidade === 1 ? "conta ativa" : "contas ativas"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1 text-xs uppercase text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3 w-3" /> Atrasado
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
              {formatBRL(resumo.total_atrasado)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1 text-xs uppercase text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-3 w-3" /> Pago (histórico)
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatBRL(resumo.total_pago_periodo)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="flex items-center gap-1 text-xs uppercase text-zinc-500">
              <Calendar className="h-3 w-3" /> Próximas 7 dias
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {resumo.proximas_7d.length}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {formatBRL(
                resumo.proximas_7d.reduce((s, p) => s + p.valor, 0),
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {resumo.proximas_7d.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
              <h3 className="text-sm font-semibold">
                Vencimentos nos próximos 7 dias
              </h3>
            </div>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {resumo.proximas_7d.map((p) => (
                <li
                  key={p.parcela_id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm"
                >
                  <div>
                    <Link
                      href={`/financeiro/contas-a-pagar/${p.conta_id}`}
                      className="font-medium hover:underline"
                    >
                      {p.descricao}
                    </Link>
                    <p className="text-xs text-zinc-500 tabular-nums">
                      Vence em {formatDateBR(p.vencimento)}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums">
                    {formatBRL(p.valor)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
