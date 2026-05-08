import { TiposPaClient } from "@/components/admin/catalogos/tipos-pa-client";
import { getTiposPA } from "@/app/actions/tipos-pa";

export const metadata = { title: "Tipos PA — Catálogos — PlanoCerto" };

export default async function TiposPaPage() {
  const tipos = await getTiposPA();
  return <TiposPaClient initial={tipos} />;
}
