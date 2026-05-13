import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { UsersTable } from "@/app/(protected)/admin/users/users-table";
import type { RoleRow } from "@/app/actions/admin";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Profile } from "@/types/auth";

export const metadata: Metadata = {
  title: "Usuários | PlanoCerto",
  description: "Gerencie os usuários do PlanoCerto.",
};

const PER_PAGE = 20;

type PageResult =
  | { success: true; users: Profile[]; total: number; customRoles: RoleRow[] }
  | { success: false; errorMessage: string };

async function fetchUsers(
  page: number,
  search: string,
  status: "all" | "active" | "inactive",
  role: string,
): Promise<PageResult> {
  try {
    const adminClient = createAdminClient();
    const from = (page - 1) * PER_PAGE;
    const to = from + PER_PAGE - 1;

    let countQuery = adminClient.from("profiles").select("*", { count: "exact", head: true });
    let listQuery = adminClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search) {
      // Escapa wildcards LIKE e chars especiais do PostgREST: %, _, ,, ", (, ), \
      const escaped = search.replace(/[%_,"()\\]/g, " ").trim();
      if (escaped) {
        const pattern = `%${escaped}%`;
        const orFilter = `name.ilike.${pattern},email.ilike.${pattern},role.ilike.${pattern}`;
        countQuery = countQuery.or(orFilter);
        listQuery = listQuery.or(orFilter);
      }
    }

    if (status === "active") {
      countQuery = countQuery.eq("is_active", true);
      listQuery = listQuery.eq("is_active", true);
    } else if (status === "inactive") {
      countQuery = countQuery.eq("is_active", false);
      listQuery = listQuery.eq("is_active", false);
    }

    if (role) {
      countQuery = countQuery.eq("role", role);
      listQuery = listQuery.eq("role", role);
    }

    const [countResult, profilesResult, rolesResult] = await Promise.all([
      countQuery,
      listQuery,
      adminClient.from("roles").select("*").order("name"),
    ]);

    if (countResult.error) {
      return { success: false, errorMessage: `Erro ao carregar: ${countResult.error.message}` };
    }

    if (profilesResult.error) {
      return { success: false, errorMessage: `Erro ao carregar: ${profilesResult.error.message}` };
    }

    return {
      success: true,
      users: (profilesResult.data || []) as Profile[],
      total: countResult.count ?? 0,
      customRoles: (rolesResult.data || []) as RoleRow[],
    };
  } catch (e) {
    console.error("[fetchUsers]", e);
    return {
      success: false,
      errorMessage: "Serviço indisponível. Tente novamente em alguns instantes.",
    };
  }
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string; role?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const search = (params.q || "").slice(0, 100);
  const role = (params.role || "").slice(0, 50);
  const status: "all" | "active" | "inactive" =
    params.status === "active" || params.status === "inactive" ? params.status : "all";
  const [result, supabase] = await Promise.all([
    fetchUsers(page, search, status, role),
    createClient(),
  ]);

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const currentUserEmail = currentUser?.email ?? "";

  if (!result.success) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-6 text-center dark:border-red-700 dark:bg-red-950/50">
        <p className="text-red-800 dark:text-red-300">{result.errorMessage}</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao dashboard
        </Link>
      </div>
    );
  }

  return (
    <UsersTable
      users={result.users}
      total={result.total}
      currentPage={page}
      perPage={PER_PAGE}
      customRoles={result.customRoles}
      initialSearch={search}
      currentUserEmail={currentUserEmail}
      initialStatus={status}
      initialRole={role}
    />
  );
}
