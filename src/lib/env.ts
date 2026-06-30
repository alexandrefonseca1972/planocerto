import { z } from "zod";

// Segredos vão direto para headers HTTP (Authorization: Bearer <key>, etc.).
// Valores colados no painel do Vercel costumam carregar \n ou espaços nas
// pontas, e qualquer whitespace torna o header inválido — o construtor do
// Resend, por exemplo, lança "Headers.append ... invalid header value" já na
// avaliação do módulo, derrubando o build. Removemos todo whitespace na
// fonte para que nenhum consumidor precise sanitizar de novo.
const secret = (fallback: string) =>
  z
    .string()
    .min(1)
    .default(fallback)
    .transform((value) => value.replace(/\s+/g, ""));

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("https://placeholder.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default("placeholder-key"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  SUPABASE_SERVICE_ROLE_KEY: secret("placeholder-key"),
  OPENROUTER_API_KEY: z.string().optional().default(""),
  // Embeddings da base de conhecimento (RAG). Devem ser consistentes em todo o
  // app: o vetor da consulta e os armazenados precisam vir do MESMO modelo para
  // o match_knowledge funcionar. Por isso é config única (env), não por-tenant.
  // Sem EMBEDDINGS_API_KEY o RAG é desativado graciosamente (cai no contexto
  // regional). text-embedding-3-small produz 1536 dims = coluna VECTOR(1536).
  EMBEDDINGS_API_KEY: z.string().optional().default(""),
  EMBEDDINGS_BASE_URL: z.string().url().optional().default("https://api.openai.com/v1"),
  EMBEDDINGS_MODEL: z.string().optional().default("text-embedding-3-small"),
  RESEND_API_KEY: secret("placeholder-key"),
  AUTH_EMAIL_FROM: z.string().min(1).default("PlanoCerto <acesso@planocerto.app>"),
  AUTH_EMAIL_REPLY_TO: z.string().email().optional().default("suporte@planocerto.app"),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .optional(),
});

export const env: z.infer<typeof envSchema> = envSchema.parse(process.env);
