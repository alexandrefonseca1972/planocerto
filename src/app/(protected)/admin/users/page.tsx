import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { UsersTable } from "@/app/(protected)/admin/users/users-table";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Usuários | PlanoCerto",
  description: "Gerencie os usuários do PlanoCerto.",
};

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface PageResult {
  success: boolean;
  users?: Profile[];
  errorMessage?: string;
}

async function fetchUsers(): Promise<PageResult> {
  try {
    const adminClient = createAdminClient();
    const { data: profiles, error } = await adminClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, errorMessage: `Erro ao carregar: ${error.message}` };
    }

    return { success: true, users: (profiles || []) as Profile[] };
  } catch {
    return {
      success: false,
      errorMessage: "Serviço indisponível. Tente novamente em alguns instantes.",
    };
  }
}

export default async function AdminUsersPage() {
  const result = await fetchUsers();

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

  return <UsersTable users={result.users!} />;
}
