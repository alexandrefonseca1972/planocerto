import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { getInstituicoes } from "@/app/actions/competitor";
import { InstituicoesClient } from "@/components/benchmarking/instituicoes-client";

export const metadata: Metadata = {
  title: "Benchmarking | PlanoCerto",
  description: "Compare mensalidades de instituições concorrentes.",
};

export default async function BenchmarkingPage() {
  const instituicoes = await getInstituicoes();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          <TrendingUp className="h-6 w-6 text-accent-600" /> Benchmarking
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {instituicoes.length} instituiç{instituicoes.length === 1 ? "ão" : "ões"} cadastrada{instituicoes.length === 1 ? "" : "s"}
        </p>
      </div>

      <InstituicoesClient initial={instituicoes} />
    </div>
  );
}
