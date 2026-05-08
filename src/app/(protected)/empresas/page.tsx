import { CompaniesClient } from "@/components/empresas/companies-client";
import { getUnits } from "@/app/actions/catalog";

export const metadata = { title: "Carteira de Empresas — PlanoCerto" };

export default async function EmpresasPage() {
  const units = await getUnits();
  return <CompaniesClient units={units} />;
}
