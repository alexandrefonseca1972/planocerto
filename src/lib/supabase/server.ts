import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
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

export { createClient, createServerClient };
