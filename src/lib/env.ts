import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("https://placeholder.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default("placeholder-key"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default("placeholder-key"),
  OPENROUTER_API_KEY: z.string().min(1).default("placeholder-key"),
  APIFY_API_KEY: z.string().min(1).default("placeholder-key"),
  RESEND_API_KEY: z.string().min(1).default("placeholder-key"),
  ZAPI_INSTANCE_ID: z.string().min(1).default("placeholder"),
  ZAPI_TOKEN: z.string().min(1).default("placeholder"),
  ZAPI_CLIENT_TOKEN: z.string().min(1).default("placeholder"),
  INLABS_USERNAME: z.string().min(1).default("placeholder"),
  INLABS_PASSWORD: z.string().min(1).default("placeholder"),
  WEBHOOK_SECRET: z.string().min(32).default("placeholder-secret-that-is-32-chars!"),
  CRON_SECRET: z.string().min(32).default("placeholder-secret-that-is-32-chars!"),
});

export const env: z.infer<typeof envSchema> = envSchema.parse(process.env);
