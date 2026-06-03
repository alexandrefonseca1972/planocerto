import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminNav } from "@/app/(protected)/admin/admin-nav";
import { hasPermission, getPermissionsMap, buildCustomRolesMap, PERMISSIONS } from "@/lib/permissions";

async function checkAdminAccess(): Promise<{
  authorized: boolean;
  userPermissions: Record<string, boolean>;
  role: string;
  error: boolean;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { authorized: false, userPermissions: {}, role: "user", error: false };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, permissions")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role ?? "user";
    const permissions = (profile?.permissions ?? null) as Record<string, boolean> | null;

    const adminClient = createAdminClient();
    const { data: roles } = await adminClient.from("roles").select("name, permissions");
    const customRolesMap = buildCustomRolesMap((roles || []) as { name: string; permissions: Record<string, boolean> }[]);
    const userPermissions = getPermissionsMap(role, permissions, customRolesMap);

    return {
      authorized: hasPermission(permissions, role, PERMISSIONS.ADMIN_ACCESS, customRolesMap),
      userPermissions,
      role,
      error: false,
    };
  } catch {
    return { authorized: false, userPermissions: {}, role: "user", error: true };
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await checkAdminAccess();

  if (access.error) {
    return (
      <div className="rounded-md border border-zinc-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Serviço indisponível
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Não foi possível verificar suas permissões. Tente novamente.
        </p>
        <a
          href="/dashboard"
          className="mt-4 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-50"
        >
          Voltar ao dashboard
        </a>
      </div>
    );
  }

  if (!access.authorized) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Administração
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Gerencie usuários e empresas do sistema.
        </p>
      </div>

      <AdminNav userPermissions={access.userPermissions} isSuperAdmin={access.role === "super_admin"} />

      {children}
    </div>
  );
}
