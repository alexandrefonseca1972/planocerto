import { getLlmSettings } from "@/app/actions/llm-settings";
import { getAllTenants } from "@/app/actions/tenant";
import { IaConfigClient } from "./ia-config-client";

export default async function IaPage() {
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
