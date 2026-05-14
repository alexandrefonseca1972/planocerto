import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { getUnitsAdmin } from "@/app/actions/unidades";
import { InstituicaoForm } from "@/components/benchmarking/instituicao-form";

export const metadata: Metadata = {
  title: "Nova Instituição | Benchmarking",
};

export default async function NovaInstituicaoPage() {
  let units: { id: string; name: string }[] = [];
  try {
    units = await getUnitsAdmin();
  } catch {
    // fallback
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        <Building2 className="h-6 w-6 text-accent-600" /> Nova Instituição
      </h1>
      <InstituicaoForm units={units} />
    </div>
  );
}
