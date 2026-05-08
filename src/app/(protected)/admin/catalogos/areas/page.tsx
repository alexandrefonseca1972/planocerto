import { AreasClient } from "@/components/admin/catalogos/areas-client";
import { getAreasAdmin } from "@/app/actions/areas";

export const metadata = { title: "Áreas — Catálogos — PlanoCerto" };

export default async function AreasAdminPage() {
  const areas = await getAreasAdmin();
  return <AreasClient initial={areas} />;
}
