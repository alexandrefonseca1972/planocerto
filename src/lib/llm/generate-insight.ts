import { env } from "@/lib/env";

interface InsightInput {
  entityName: string;
  socialSignal: {
    signal_type: string;
    mentions_count: number;
    sentiment_score: number;
    platform: string;
    detected_at: string;
  };
  doPublication: {
    title: string | null;
    actType: string | null;
    organ: string | null;
    date: string;
    snippet: string;
  };
}

export async function generateInsight(input: InsightInput): Promise<string> {
  const prompt = `
Analise a correlação entre:

SINAL SOCIAL (${input.socialSignal.platform}):
- Tipo: ${input.socialSignal.signal_type}
- Menções: ${input.socialSignal.mentions_count}
- Sentimento: ${input.socialSignal.sentiment_score.toFixed(2)} (-1 negativo, +1 positivo)
- Detectado em: ${input.socialSignal.detected_at}

PUBLICAÇÃO NO DIÁRIO OFICIAL:
- Data: ${input.doPublication.date}
- Órgão: ${input.doPublication.organ ?? "não informado"}
- Tipo de ato: ${input.doPublication.actType ?? "não identificado"}
- Título: ${input.doPublication.title ?? "sem título"}
- Trecho: "${input.doPublication.snippet}"

ENTIDADE MONITORADA: ${input.entityName}

Gere um insight objetivo em português brasileiro (máximo 150 palavras) explicando
a possível relação entre o comportamento nas redes sociais e o ato oficial publicado.
Seja factual. Não especule além do que os dados mostram.
`.trim();

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "anthropic/claude-haiku-4-5",
      max_tokens: 300,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM insight failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "";

  if (!text || text.length < 20) {
    throw new Error("Insight gerado inválido ou muito curto");
  }

  return text.trim();
}