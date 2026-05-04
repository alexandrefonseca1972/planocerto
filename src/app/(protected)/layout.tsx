import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Navbar } from "@/components/layout/navbar";
import { TenantAwareWrapper } from "@/components/layout/tenant-aware-wrapper";
import { ToastProvider } from "@/components/ui/toast";
import { getUserTenants } from "@/app/actions/tenant";
import type { User } from "@supabase/supabase-js";
import type { Tenant } from "@/types/tenant";

async function getSessionData(): Promise<{
  user: User | null;
  isAdmin: boolean;
  currentTenant: Tenant | null;
  tenants: Tenant[];
  error: boolean;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        user: null,
        isAdmin: false,
        currentTenant: null,
        tenants: [],
        error: false,
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active_tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = profile?.role === "admin";

    const tenants = await getUserTenants();

    const currentTenant =
      tenants.find((t) => t.id === profile?.active_tenant_id) ||
      tenants[0] ||
      null;

    return { user, isAdmin, currentTenant, tenants, error: false };
  } catch {
    return {
      user: null,
      isAdmin: false,
      currentTenant: null,
      tenants: [],
      error: true,
    };
  }
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionData();

  if (session.error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-md border border-zinc-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Serviço indisponível
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Não foi possível verificar sua sessão. Tente novamente em alguns
              instantes.
            </p>
            <a
              href="/auth"
              className="mt-4 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-50"
            >
              Voltar para o login
            </a>
          </div>
        </main>
      </div>
    );
  }

    if (!session.user) {
    redirect("/auth");
  }

  // Users with no tenants → pending approval page (avoid redirect loop)
  if (session.tenants.length === 0) {
    const headersList = await headers();
    const pathname = headersList.get("x-invoke-path") || "";
    if (!pathname.startsWith("/pendente")) {
      redirect("/pendente");
    }
  }

  return (
    <ToastProvider>
      <TenantAwareWrapper
        currentTenant={session.currentTenant}
        tenants={session.tenants}
      >
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
          <Navbar user={session.user} isAdmin={session.isAdmin} />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </TenantAwareWrapper>
    </ToastProvider>
  );
}
