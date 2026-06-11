"use server";

import { sanitizeText } from "@/lib/validation/sanitize";
import { createClient } from "@/lib/supabase/server";
import { callLlm } from "@/lib/llm-client";
import { getActiveLlmConfig } from "@/app/actions/llm-settings";

type RegionalContext = {
  perfil_persona?: string;
  regionalidade?: string;
  eventos_locais?: string;
  concorrentes?: string;
};

type UnitRegionalData = {
  name: string;
  regional_context: RegionalContext | null;
  area: { name: string; regional_context: RegionalContext | null } | null;
};

export async function getAiModelsForPlan(
  planId: string,
): Promise<{ provider: string; models: string[]; currentModel: string } | null> {
  try {
    const supabase = await createClient();
    const { data: plan } = await supabase
      .from("action_plans")
      .select("tenant_id")
      .eq("id", planId)
      .single();

    if (!plan?.tenant_id) return null;

    const adminClient = (await import("@/lib/supabase/admin")).createAdminClient();
    const { data } = await adminClient
      .from("llm_settings")
      .select("provider, model")
      .eq("tenant_id", plan.tenant_id)
      .maybeSingle();

    if (!data) return null;

    const { PROVIDER_MODELS } = await import("@/lib/llm-client");
    const models = PROVIDER_MODELS[data.provider as keyof typeof PROVIDER_MODELS] ?? [data.model];

    return { provider: data.provider, models, currentModel: data.model };
  } catch (e) {
    console.error("[getAiModelsForPlan]", e);
    return null;
  }
}

export async function suggest5W2H(
  actionDescription: string,
  planId?: string,
  modelOverride?: string,
): Promise<{ why?: string; how?: string; error?: string }> {
  if (!actionDescription || actionDescription.trim().length < 20) {
    return { error: "A descrição da ação precisa ter ao menos 20 caracteres para gerar sugestões." };
  }

  if (!planId) {
    return { error: "Plano não identificado para uso da IA." };
  }

  // Busca o plano para obter tenant_id + unidade (contexto regional)
  const supabase = await createClient();
  const { data: plan } = await supabase
    .from("action_plans")
    .select("unit_id, unit, tenant_id")
    .eq("id", planId)
    .single();

  if (!plan?.tenant_id) {
    return { error: "Não foi possível identificar a empresa do plano." };
  }

  const config = await getActiveLlmConfig(plan.tenant_id);
  if (!config) {
    return { error: "Serviço de IA não configurado para esta empresa. Acesse Administração → IA / Modelos." };
  }

  let regionalContextPrompt = "";

  if (plan.unit_id || plan.unit) {
    try {
      let unitData: UnitRegionalData | null = null;

      if (plan.unit_id) {
        const { data } = await supabase
          .from("units")
          .select("name, regional_context, area:areas(name, regional_context)")
          .eq("id", plan.unit_id)
          .eq("tenant_id", plan.tenant_id)
          .maybeSingle();
        unitData = data as UnitRegionalData | null;
      } else if (plan.unit) {
        const { data } = await supabase
          .from("units")
          .select("name, regional_context, area:areas(name, regional_context)")
          .eq("name", plan.unit)
          .eq("tenant_id", plan.tenant_id)
          .maybeSingle();
        unitData = data as UnitRegionalData | null;
      }

      if (unitData) {
        const uCtx = unitData.regional_context || {};
        const aCtx = unitData.area?.regional_context || {};
        regionalContextPrompt = `
CONTEXTO REGIONAL DA UNIDADE (${unitData.name}):
- Perfil: ${uCtx.perfil_persona || "não especificado"}
- Regionalidade/Cultura: ${uCtx.regionalidade || aCtx.regionalidade || "não especificada"}
- Eventos/Calendário Local: ${uCtx.eventos_locais || "nenhum evento crítico mapeado"}
- Concorrência/Mercado: ${uCtx.concorrentes || aCtx.concorrentes || "mercado padrão"}
`.trim();
      }
    } catch (e) {
      console.error("[suggest5W2H] Regional Context Error:", e);
    }
  }

  const prompt = `
Você é um consultor especialista em gestão estratégica e metodologia 5W2H.
Sua tarefa é sugerir o preenchimento dos campos "POR QUÊ" e "COMO" para uma ação.

AÇÃO: "${actionDescription}"

${regionalContextPrompt}

INSTRUÇÕES:
1. POR QUÊ? (Justificativa): Explique a importância estratégica, focando em resultados e no contexto regional se fornecido.
2. COMO? (Método): Descreva passos práticos, ferramentas e táticas aderentes à regionalidade.

Responda APENAS no formato JSON:
{
  "why": "texto da justificativa",
  "how": "texto do método"
}
`.trim();

  const effectiveConfig = modelOverride ? { ...config, model: modelOverride } : config;

  try {
    const content = await callLlm(
      [{ role: "user", content: prompt }],
      effectiveConfig,
      { maxTokens: 400, temperature: 0.3, jsonMode: true },
    );

    const parsed = JSON.parse(content);
    return {
      why: sanitizeText(parsed.why || ""),
      how: sanitizeText(parsed.how || ""),
    };
  } catch (error) {
    console.error("[suggest5W2H] Error:", error);
    return { error: "Erro inesperado ao gerar sugestão." };
  }
}
