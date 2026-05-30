import { z } from "zod";
import pRetry, { AbortError } from "p-retry";
import { sanitizeText, normalizeName, sanitizeCPF, sanitizeCNPJ } from "@/lib/validation/sanitize";
import { env } from "@/lib/env";
import { logger as baseLogger } from "@/lib/logger";

const logger = baseLogger.child({ component: "llm:extract-entities" });

// Preço aproximado do Claude Haiku 4.5 via OpenRouter (USD por 1M tokens).
// Usado apenas para observabilidade de custo nos logs, não para cobrança.
const COST_PER_M_INPUT = 1.0;
const COST_PER_M_OUTPUT = 5.0;

const EntitySchema = z.object({
  type: z.enum(["person", "company", "process"]),
  raw_name: z.string().min(2).max(300),
  document: z.string().optional().nullable(),
  context_snippet: z.string().max(500),
  confidence: z.number().min(0).max(1),
});

const ExtractResponseSchema = z.object({
  entities: z.array(EntitySchema).max(50),
});

export type ExtractedEntity = z.infer<typeof EntitySchema>;

const SYSTEM_PROMPT = `
Você é um extrator de entidades de documentos do Diário Oficial brasileiro.
Extraia APENAS entidades presentes explicitamente no texto.
Não infira ou invente entidades.
Responda APENAS com JSON válido, sem markdown, sem explicações.
Formato: { "entities": [ { "type": "person"|"company"|"process", "raw_name": "...", "document": "CPF ou CNPJ se presente, null caso contrário", "context_snippet": "trecho de até 100 chars onde aparece", "confidence": 0.0 a 1.0 } ] }
`.trim();

export async function extractEntities(content: string): Promise<ExtractedEntity[]> {
  const truncated = content.slice(0, 4000);

  // Retry com backoff em falhas transitórias (5xx / 429 / rede). Erros 4xx
  // (exceto 429) são definitivos e abortam sem retry para não desperdiçar custo.
  const response = await pRetry(
    async () => {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "anthropic/claude-haiku-4-5",
          max_tokens: 1000,
          temperature: 0,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: truncated },
          ],
        }),
      });

      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        throw new AbortError(`LLM client error ${res.status}`);
      }
      if (!res.ok) {
        throw new Error(`LLM request failed: ${res.status}`);
      }
      return res;
    },
    { retries: 3, minTimeout: 1000, maxTimeout: 8000 },
  );

  const data = await response.json();

  // Observabilidade de custo: registra tokens usados e custo estimado por chamada.
  const usage = data.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined;
  if (usage) {
    const inTok = usage.prompt_tokens ?? 0;
    const outTok = usage.completion_tokens ?? 0;
    const estCostUsd =
      (inTok / 1_000_000) * COST_PER_M_INPUT + (outTok / 1_000_000) * COST_PER_M_OUTPUT;
    logger.info(
      { inputTokens: inTok, outputTokens: outTok, estCostUsd: Number(estCostUsd.toFixed(6)) },
      "Chamada LLM de extração concluída",
    );
  }

  const text = data.choices?.[0]?.message?.content ?? "";

  let parsed: unknown;
  try {
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    return [];
  }

  const validated = ExtractResponseSchema.safeParse(parsed);
  if (!validated.success) return [];

  return validated.data.entities
    .map((e) => ({
      ...e,
      raw_name: sanitizeText(e.raw_name),
      normalized_name: normalizeName(e.raw_name),
      document: e.document
        ? (sanitizeCPF(e.document) ?? sanitizeCNPJ(e.document) ?? null)
        : null,
      context_snippet: sanitizeText(e.context_snippet),
    }))
    .filter((e) => e.raw_name.length >= 2);
}