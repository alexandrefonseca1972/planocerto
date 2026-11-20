import { z } from "zod";

// Segredos vão direto para headers HTTP (Authorization: Bearer <key>, etc.).
// Valores colados em painéis de deploy ou arquivos de ambiente costumam
// carregar \n ou espaços nas pontas, e qualquer whitespace torna o header
// inválido — o construtor do Resend, por exemplo, lança "Headers.append ... invalid header value" já na
// avaliação do módulo, derrubando o build. Removemos todo whitespace na
// fonte para que nenhum consumidor precise sanitizar de novo.
const secret = (fallback: string) =>
  z
    .string()
    .min(1)
    .default(fallback)
    .transform((value) => value.replace(/\s+/g, ""));

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("https://placeholder.invalid"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default("placeholder-key"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  SUPABASE_SERVICE_ROLE_KEY: secret("placeholder-key"),
  OPENROUTER_API_KEY: z.string().optional().default(""),
  // Segredo para cifrar a API key do provedor de IA em llm_settings (src/lib/llm-secret.ts).
  LLM_KEY_SECRET: z.union([z.literal(""), z.string().min(32, "LLM_KEY_SECRET precisa de 32+ caracteres (openssl rand -base64 32).")]).optional().default(""),
  RESEND_API_KEY: secret("placeholder-key"),
  AUTH_EMAIL_FROM: z.string().min(1).default("PlanoCerto <acesso@planocerto.app>"),
  AUTH_EMAIL_REPLY_TO: z.string().email().optional().default("suporte@planocerto.app"),
  // Cloudflare R2 (anexos). Vazio = anexos indisponíveis (r2.ts lança).
  R2_ACCOUNT_ID: z.string().optional().default(""),
  R2_ACCESS_KEY_ID: z.string().optional().default("").transform((v) => v.replace(/\s+/g, "")),
  R2_SECRET_ACCESS_KEY: z.string().optional().default("").transform((v) => v.replace(/\s+/g, "")),
  R2_BUCKET: z.string().optional().default(""),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .optional(),
});

export const env: z.infer<typeof envSchema> = envSchema.parse(process.env);
