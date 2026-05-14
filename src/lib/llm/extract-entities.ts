import { z } from "zod";
import { sanitizeText, normalizeName, sanitizeCPF, sanitizeCNPJ } from "@/lib/validation/sanitize";
import { env } from "@/lib/env";

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

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status}`);
  }

  const data = await response.json();
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