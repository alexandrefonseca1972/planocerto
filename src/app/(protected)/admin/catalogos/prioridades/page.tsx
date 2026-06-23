import { PrioridadesClient } from "@/components/admin/catalogos/prioridades-client";
import { getPrioridadesAdmin } from "@/app/actions/prioridades";

export const metadata = { title: "Prioridades — Catálogos" };

export default async function PrioridadesPage() {
  const prioridades = await getPrioridadesAdmin();
  return <PrioridadesClient initial={prioridades} />;
}
