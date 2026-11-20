import { createAdminClient } from "@/lib/supabase/admin";
import type { LlmConfig } from "@/lib/llm-client";
import { decryptLlmKey } from "@/lib/llm-secret";

/**
 * Lê a configuração de IA de uma empresa COM a API key (decifrada).
 * Só para uso no servidor: este arquivo NÃO tem "use server", então a função
 * não vira Server Action e não pode ser chamada pelo navegador.
 */
export async function getActiveLlmConfig(tenantId: string): Promise<LlmConfig | null> {
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("llm_settings")
      .select("provider, model, api_key, base_url")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!data?.api_key) return null;

    return {
      provider: data.provider,
      model: data.model,
      apiKey: decryptLlmKey(data.api_key, tenantId),
      baseUrl: data.base_url ?? null,
    };
  } catch (error) {
    // Falha de decifragem (LLM_KEY_SECRET ausente/trocada) aparece ao usuário como "não configurado".
    console.error("[getActiveLlmConfig] decrypt/leitura falhou:", error instanceof Error ? error.message : error);
    return null;
  }
}
