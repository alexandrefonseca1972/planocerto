import { getLlmSettings } from "@/app/actions/llm-settings";
import { getAllTenants } from "@/app/actions/tenant";
import { redirect } from "next/navigation";
import { getRequesterScope } from "@/app/actions/_helpers";
import { IaConfigClient } from "./ia-config-client";

export default async function IaPage() {
  // Configuração de IA é só do super admin (o menu já esconde o link para os demais).
  const scope = await getRequesterScope();
  if (!scope.isSuperAdmin) redirect("/admin/painel");
  const tenants = await getAllTenants();
  const firstTenantId = tenants[0]?.id ?? null;
  const initialSettings = firstTenantId ? await getLlmSettings(firstTenantId) : null;

  return (
    <IaConfigClient
      tenants={tenants}
      initialTenantId={firstTenantId}
      initialSettings={initialSettings}
    />
  );
}
