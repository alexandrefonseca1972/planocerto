import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEnvVar } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Strip expiry — session cookies cleared on browser close
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { expires, maxAge, ...rest } = options || {};
              cookieStore.set(name, value, rest);
            });
          } catch (error) {
            console.error("[supabase/server] Erro ao definir cookies:", error);
          }
        },
      },
    }
  );
}
