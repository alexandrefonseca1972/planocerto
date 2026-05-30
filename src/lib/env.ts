import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("https://placeholder.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default("placeholder-key"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default("placeholder-key"),
  OPENROUTER_API_KEY: z.string().min(1).default("placeholder-key"),
  APIFY_API_KEY: z.string().min(1).default("placeholder-key"),
  RESEND_API_KEY: z.string().min(1).default("placeholder-key"),
  AUTH_EMAIL_FROM: z.string().min(1).default("PlanoCerto <acesso@planocerto.app>"),
  AUTH_EMAIL_REPLY_TO: z.string().email().optional().default("suporte@planocerto.app"),
  ZAPI_INSTANCE_ID: z.string().min(1).default("placeholder"),
  ZAPI_TOKEN: z.string().min(1).default("placeholder"),
  ZAPI_CLIENT_TOKEN: z.string().min(1).default("placeholder"),
  INLABS_USERNAME: z.string().min(1).default("placeholder"),
  INLABS_PASSWORD: z.string().min(1).default("placeholder"),
  WEBHOOK_SECRET: z.string().min(32).default("placeholder-secret-that-is-32-chars!"),
  CRON_SECRET: z.string().min(32).default("placeholder-secret-that-is-32-chars!"),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .optional(),
});

export const env: z.infer<typeof envSchema> = envSchema.parse(process.env);
