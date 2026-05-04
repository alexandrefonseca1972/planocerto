import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/app/(protected)/admin/admin-nav";

async function checkAdminAccess(): Promise<{
  authorized: boolean;
  error: boolean;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { authorized: false, error: false };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    return {
      authorized: profile?.role === "admin",
      error: false,
    };
  } catch {
    return { authorized: false, error: true };
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

      <AdminNav />

      {children}
    </div>
  );
}
