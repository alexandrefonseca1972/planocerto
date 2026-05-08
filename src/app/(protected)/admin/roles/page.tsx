import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPermissionsMap, buildCustomRolesMap, PERMISSIONS } from "@/lib/permissions";
import { RolesTable } from "./roles-table";
import { getRoles } from "@/app/actions/admin";

export const metadata: Metadata = {
  title: "Papéis | PlanoCerto",
  description: "Gerenciamento de papéis e permissões.",
};

export default async function RolesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

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

  if (!userPermissions[PERMISSIONS.ROLES_MANAGE]) redirect("/dashboard");

  const allRoles = await getRoles();

  return (
    <div className="space-y-4">
      <RolesTable roles={allRoles} />
    </div>
  );
}
