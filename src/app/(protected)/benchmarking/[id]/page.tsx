import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInstituicao, getInstituicaoFullDetail } from "@/app/actions/competitor";
import { getUnitsAdmin } from "@/app/actions/unidades";
import { InstituicaoDetailClient } from "@/components/benchmarking/instituicao-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const inst = await getInstituicao(id);
  return { title: inst ? `${inst.nome} | Benchmarking` : "Instituição | Benchmarking" };
}

export default async function InstituicaoDetailPage({ params }: Props) {
  const { id } = await params;
  const [instituicao, detail, units] = await Promise.all([
    getInstituicao(id),
    getInstituicaoFullDetail(id),
    getUnitsAdmin(),
  ]);

  if (!instituicao) notFound();

  return (
    <InstituicaoDetailClient
      instituicao={instituicao}
      detail={detail}
      units={units}
    />
  );
}
