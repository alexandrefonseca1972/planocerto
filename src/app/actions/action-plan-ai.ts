"use server";

import { env } from "@/lib/env";
import { sanitizeText } from "@/lib/validation/sanitize";

import { createClient } from "@/lib/supabase/server";

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

export async function suggest5W2H(
  actionDescription: string, 
  planId?: string
): Promise<{ why?: string; how?: string; error?: string }> {
  if (!actionDescription || actionDescription.trim().length < 5) {
    return { error: "A descrição da ação é muito curta para gerar sugestões." };
  }

  let regionalContextPrompt = "";

  // 1. Tentar buscar contexto regional se houver planId
  if (planId) {
    try {
      const supabase = await createClient();
      const { data: plan } = await supabase
        .from("action_plans")
        .select("unit_id, unit, tenant_id")
        .eq("id", planId)
        .single();

      if (plan?.unit_id || plan?.unit) {
        // Buscar metadados da unidade e da área
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

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku-20240307",
        max_tokens: 400,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      console.error("[suggest5W2H] API Error:", response.status);
      return { error: "Falha na comunicação com o serviço de IA." };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) return { error: "A IA não retornou uma sugestão válida." };

    const parsed = JSON.parse(content);
    return {
      why: await sanitizeText(parsed.why || ""),
      how: await sanitizeText(parsed.how || ""),
    };
  } catch (error) {
    console.error("[suggest5W2H] Error:", error);
    return { error: "Erro inesperado ao gerar sugestão." };
  }
}
