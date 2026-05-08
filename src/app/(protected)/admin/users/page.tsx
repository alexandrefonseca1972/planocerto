import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
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

interface PageResult {
  success: boolean;
  users?: Profile[];
  total?: number;
  customRoles?: RoleRow[];
  errorMessage?: string;
}

async function fetchUsers(page: number): Promise<PageResult> {
  try {
    const adminClient = createAdminClient();

    const [countResult, profilesResult, rolesResult] = await Promise.all([
      adminClient.from("profiles").select("*", { count: "exact", head: true }),
      adminClient.from("profiles").select("*").order("created_at", { ascending: false }).range((page - 1) * PER_PAGE, (page - 1) * PER_PAGE + PER_PAGE - 1),
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
  } catch {
    return {
      success: false,
      errorMessage: "Serviço indisponível. Tente novamente em alguns instantes.",
    };
  }
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const result = await fetchUsers(page);

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
      users={result.users!}
      total={result.total!}
      currentPage={page}
      perPage={PER_PAGE}
      customRoles={result.customRoles || []}
    />
  );
}
