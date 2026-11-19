// Leituras de sessão deduplicadas por requisição (React `cache`): layout,
// páginas e actions que pedem o mesmo dado dentro do mesmo request pagam uma
// única ida ao Supabase. Só para dados estáveis durante o request; nada aqui
// deve ser usado para reler dado que a própria action acabou de alterar.
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCustomRolesMap } from "@/lib/permissions";
import { getUserTenants } from "@/app/actions/tenant";

export const getSessionUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

export const getSessionProfile = cache(async () => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role, permissions, active_tenant_id")
    .eq("id", user.id)
    .maybeSingle();
  return data;
});

export const getSessionCustomRoles = cache(async () => {
  const { data } = await createAdminClient().from("roles").select("name, permissions");
  return buildCustomRolesMap((data || []) as { name: string; permissions: Record<string, boolean> }[]);
});

export const getSessionTenants = cache(() => getUserTenants());
