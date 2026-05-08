import { SchoolsClient } from "@/components/escolas/schools-client";
import { getUnits } from "@/app/actions/catalog";

export const metadata = { title: "Carteira de Escolas — PlanoCerto" };

export default async function EscolasPage() {
  const units = await getUnits();
  return <SchoolsClient units={units} />;
}
