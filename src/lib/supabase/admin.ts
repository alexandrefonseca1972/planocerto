import { createClient } from "@supabase/supabase-js";
import { getOptionalEnvVar } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

let cached: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = getOptionalEnvVar("SUPABASE_SERVICE_ROLE_KEY");

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada.");
  }

  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY é necessária para operações de administração. Configure-a no arquivo .env.local."
    );
  }

  cached = createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cached;
}
