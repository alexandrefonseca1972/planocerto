export type ProviderKey = "openrouter" | "openai" | "anthropic" | "deepseek" | "minimax" | "kimi" | "qwen";

export interface ProviderConfig {
  label: string;
  baseUrl: string;
  format: "openai" | "anthropic";
}

export const PROVIDERS: Record<ProviderKey, ProviderConfig> = {
  openrouter: { label: "OpenRouter",  baseUrl: "https://openrouter.ai/api/v1",                          format: "openai"    },
  openai:     { label: "OpenAI",      baseUrl: "https://api.openai.com/v1",                              format: "openai"    },
  anthropic:  { label: "Anthropic",   baseUrl: "https://api.anthropic.com",                              format: "anthropic" },
  deepseek:   { label: "DeepSeek",    baseUrl: "https://api.deepseek.com/v1",                            format: "openai"    },
  minimax:    { label: "MiniMax",     baseUrl: "https://api.minimax.chat/v1",                            format: "openai"    },
  kimi:       { label: "Kimi (Moonshot)", baseUrl: "https://api.moonshot.cn/v1",                         format: "openai"    },
  qwen:       { label: "Qwen",        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",      format: "openai"    },
};

export const PROVIDER_MODELS: Record<ProviderKey, string[]> = {
  openrouter: [
    // Anthropic
    "anthropic/claude-3.5-haiku",
    "anthropic/claude-3.5-sonnet",
    // OpenAI
    "openai/gpt-4o-mini",
    "openai/gpt-4o",
    // Google
    "google/gemini-flash-1.5",
    "google/gemini-2.0-flash-001",
    // DeepSeek
    "deepseek/deepseek-chat",
    "deepseek/deepseek-r1",
    // Kimi (Moonshot)
    "moonshot/moonshot-v1-8k",
    "moonshot/moonshot-v1-32k",
    // Qwen
    "qwen/qwen-2.5-72b-instruct",
    "qwen/qwen-turbo",
    // Meta (free)
    "meta-llama/llama-3.1-8b-instruct:free",
  ],
  openai:    ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
  anthropic: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6", "claude-3-5-haiku-20241022"],
  deepseek:  ["deepseek-chat", "deepseek-reasoner"],
  minimax:   ["MiniMax-Text-01", "abab6.5s-chat"],
  kimi:      ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
  qwen:      ["qwen-turbo", "qwen-plus", "qwen-max"],
};

export interface LlmConfig {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl?: string | null;
}

export interface LlmMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface EmbeddingsConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

/**
 * Gera o embedding de um texto via endpoint OpenAI-compatível (`/embeddings`).
 * Usado pelo RAG da base de conhecimento. O modelo default (text-embedding-3-small)
 * produz 1536 dimensões, casando com a coluna VECTOR(1536) da knowledge_base.
 * Lança em erro de API — o chamador decide se degrada graciosamente.
 */
export async function callEmbeddings(text: string, config: EmbeddingsConfig): Promise<number[]> {
  const res = await fetch(`${config.baseUrl}/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({ model: config.model, input: text }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Embeddings API error ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  const embedding = data?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) throw new Error("Resposta de embeddings inesperada.");
  return embedding as number[];
}

export async function callLlm(
  messages: LlmMessage[],
  config: LlmConfig,
  opts: { maxTokens?: number; temperature?: number; jsonMode?: boolean } = {},
): Promise<string> {
  const providerCfg = PROVIDERS[config.provider as ProviderKey];
  const format = providerCfg?.format ?? "openai";
  const baseUrl = config.baseUrl || providerCfg?.baseUrl;

  if (!baseUrl) throw new Error(`Provedor desconhecido: ${config.provider}`);

  const { maxTokens = 400, temperature = 0.3, jsonMode = false } = opts;

  if (format === "anthropic") {
    return callAnthropic(messages, config.apiKey, baseUrl, config.model, { maxTokens, temperature });
  }

  return callOpenAiCompat(messages, config.apiKey, baseUrl, config.model, { maxTokens, temperature, jsonMode });
}

async function callOpenAiCompat(
  messages: LlmMessage[],
  apiKey: string,
  baseUrl: string,
  model: string,
  opts: { maxTokens: number; temperature: number; jsonMode: boolean },
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: opts.maxTokens,
    temperature: opts.temperature,
  };
  if (opts.jsonMode) body.response_format = { type: "json_object" };

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`LLM API error ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Resposta inesperada da API.");
  return content;
}

async function callAnthropic(
  messages: LlmMessage[],
  apiKey: string,
  baseUrl: string,
  model: string,
  opts: { maxTokens: number; temperature: number },
): Promise<string> {
  // Anthropic tem formato diferente: system message separada, endpoint /v1/messages
  const system = messages.find((m) => m.role === "system")?.content;
  const userMessages = messages.filter((m) => m.role !== "system");

  const body: Record<string, unknown> = {
    model,
    max_tokens: opts.maxTokens,
    temperature: opts.temperature,
    messages: userMessages.map((m) => ({ role: m.role, content: m.content })),
  };
  if (system) body.system = system;

  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.content?.[0]?.text;
  if (typeof content !== "string") throw new Error("Resposta inesperada da API Anthropic.");
  return content;
}
