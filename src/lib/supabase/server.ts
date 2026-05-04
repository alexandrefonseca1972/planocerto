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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            console.error(
              "[supabase/server] Erro ao definir cookies:",
              error
            );
          }
        },
      },
    }
  );
}
