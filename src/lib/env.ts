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
  RESEND_API_KEY: secret("placeholder-key"),
  AUTH_EMAIL_FROM: z.string().min(1).default("PlanoCerto <acesso@planocerto.app>"),
  AUTH_EMAIL_REPLY_TO: z.string().email().optional().default("suporte@planocerto.app"),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .optional(),
});

const parsed = envSchema.parse(process.env);

// Em runtime de produção (Vercel/Node), rejeita os defaults de schema que
// fariam o app “subir” e falhar de forma opaca nas primeiras requests.
// Compara com os defaults exatos — não com substring "placeholder" — para
// permitir hosts de CI como `ci-build.supabase.co`.
const isProdRuntime =
  process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
if (isProdRuntime) {
  const DEFAULT_URL = "https://placeholder.supabase.co";
  const DEFAULT_KEY = "placeholder-key";
  const bad: string[] = [];
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    parsed.NEXT_PUBLIC_SUPABASE_URL === DEFAULT_URL
  ) {
    bad.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY === DEFAULT_KEY
  ) {
    bad.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  if (
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    parsed.SUPABASE_SERVICE_ROLE_KEY === DEFAULT_KEY
  ) {
    bad.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  if (bad.length > 0) {
    throw new Error(
      `[env] Variáveis obrigatórias ausentes ou com placeholder em produção: ${bad.join(", ")}`
    );
  }
}

export const env: z.infer<typeof envSchema> = parsed;
