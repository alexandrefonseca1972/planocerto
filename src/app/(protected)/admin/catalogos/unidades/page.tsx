import { UnidadesClient } from "@/components/admin/catalogos/unidades-client";
import { getUnitsAdmin } from "@/app/actions/unidades";
import { getAreasAdmin } from "@/app/actions/areas";

export const metadata = { title: "Unidades — Catálogos — PlanoCerto" };

export default async function UnidadesPage() {
  const [units, areas] = await Promise.all([getUnitsAdmin(), getAreasAdmin()]);
  return <UnidadesClient initial={units} areas={areas} />;
}
