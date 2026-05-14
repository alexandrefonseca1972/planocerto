import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { getInstituicao } from "@/app/actions/competitor";
import { getUnitsAdmin } from "@/app/actions/unidades";
import { InstituicaoForm } from "@/components/benchmarking/instituicao-form";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const inst = await getInstituicao(id);
  return { title: inst ? `Editar ${inst.nome} | Benchmarking` : "Editar | Benchmarking" };
}

export default async function EditarInstituicaoPage({ params }: Props) {
  const { id } = await params;
  const [instituicao, units] = await Promise.all([
    getInstituicao(id),
    getUnitsAdmin(),
  ]);

  if (!instituicao) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        <Pencil className="h-6 w-6 text-accent-600" /> Editar Instituição
      </h1>
      <InstituicaoForm units={units} instituicao={instituicao} />
    </div>
  );
}
