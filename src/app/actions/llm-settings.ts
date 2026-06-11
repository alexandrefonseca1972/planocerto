"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequesterScope } from "@/app/actions/_helpers";
import { callLlm, PROVIDERS, type LlmConfig, type ProviderKey } from "@/lib/llm-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LlmSettingsPublic {
  provider: string;
  model: string;
  base_url: string | null;
  hasApiKey: boolean;
}

export interface LlmFormState {
  success?: boolean;
  message?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireSuperAdmin(): Promise<string | null> {
  try {
    const scope = await getRequesterScope();
    if (!scope.isSuperAdmin) return "Acesso negado. Permissão de super administrador necessária.";
    return null;
  } catch {
    return "Não foi possível verificar as permissões.";
  }
}

// ─── Read config for a tenant (UI — sem api_key) ─────────────────────────────

export async function getLlmSettings(tenantId: string): Promise<LlmSettingsPublic | null> {
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("llm_settings")
      .select("provider, model, base_url, api_key")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!data) return null;
    return {
      provider: data.provider,
      model: data.model,
      base_url: data.base_url ?? null,
      hasApiKey: Boolean(data.api_key),
    };
  } catch (error) {
    console.error("[getLlmSettings]", error);
    return null;
  }
}

// ─── Save (super_admin only) ──────────────────────────────────────────────────

export async function saveLlmSettings(
  _prev: LlmFormState,
  formData: FormData,
): Promise<LlmFormState> {
  const guard = await requireSuperAdmin();
  if (guard) return { message: guard };

  const tenantId = (formData.get("tenant_id") as string | null)?.trim() || "";
  const provider = (formData.get("provider") as string | null)?.trim() || "";
  const model    = (formData.get("model")    as string | null)?.trim() || "";
  const apiKey   = (formData.get("api_key")  as string | null)?.trim() || "";
  const baseUrl  = (formData.get("base_url") as string | null)?.trim() || null;

  if (!tenantId) return { message: "Empresa não selecionada." };
  if (!provider) return { message: "Selecione um provedor." };
  if (!model)    return { message: "Informe o modelo." };

  try {
    const adminClient = createAdminClient();

    const { data: existing } = await adminClient
      .from("llm_settings")
      .select("id, api_key")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    const finalApiKey = apiKey || existing?.api_key || null;

    if (existing?.id) {
      await adminClient
        .from("llm_settings")
        .update({ provider, model, api_key: finalApiKey, base_url: baseUrl, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await adminClient
        .from("llm_settings")
        .insert({ tenant_id: tenantId, provider, model, api_key: finalApiKey, base_url: baseUrl });
    }

    revalidatePath("/admin/ia");
    return { success: true, message: "Configuração salva!" };
  } catch (error) {
    console.error("[saveLlmSettings]", error);
    return { message: "Erro ao salvar configuração." };
  }
}

// ─── Test connection ──────────────────────────────────────────────────────────

export async function testLlmConnection(
  provider: string,
  model: string,
  apiKey: string,
  baseUrl?: string,
): Promise<{ ok: boolean; message: string }> {
  const guard = await requireSuperAdmin();
  if (guard) return { ok: false, message: guard };

  if (!apiKey) return { ok: false, message: "Informe a API Key antes de testar." };

  try {
    const config: LlmConfig = { provider, model, apiKey, baseUrl: baseUrl || null };
    const result = await callLlm(
      [{ role: "user", content: 'Responda apenas: {"ok":true}' }],
      config,
      { maxTokens: 20, temperature: 0 },
    );
    const ok = result.includes("ok") || result.includes("true");
    return {
      ok,
      message: ok
        ? `Conectado com sucesso usando ${PROVIDERS[provider as ProviderKey]?.label ?? provider}.`
        : `Resposta inesperada: ${result.slice(0, 100)}`,
    };
  } catch (error) {
    console.error("[testLlmConnection]", error);
    return { ok: false, message: String(error instanceof Error ? error.message : error).slice(0, 200) };
  }
}

// ─── Internal read with api_key (usado por action-plan-ai.ts) ────────────────

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
      model:    data.model,
      apiKey:   data.api_key,
      baseUrl:  data.base_url ?? null,
    };
  } catch (error) {
    console.error("[getActiveLlmConfig]", error);
    return null;
  }
}
