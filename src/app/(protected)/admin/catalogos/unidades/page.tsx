import { UnidadesClient } from "@/components/admin/catalogos/unidades-client";
import { getUnitsAdmin, getUnitsQuota } from "@/app/actions/unidades";
import { getAreasAdmin } from "@/app/actions/areas";

export const metadata = { title: "Unidades — Catálogos — PlanoCerto" };

export default async function UnidadesPage() {
  const [units, areas, quota] = await Promise.all([
    getUnitsAdmin(),
    getAreasAdmin(),
    getUnitsQuota(),
  ]);
  return <UnidadesClient initial={units} areas={areas} maxUnits={quota.max} />;
}
