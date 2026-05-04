import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Shield, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PendentePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/auth");
  
  const userName = user.user_metadata?.name || user.email || "Usuário";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Aguardando aprovação
        </h1>
        <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          Olá <strong>{userName}</strong>, sua conta foi criada mas ainda não possui acesso às empresas.
        </p>
        <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          Um administrador precisa associar seu usuário a uma ou mais empresas para liberar o acesso.
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
          <Shield className="h-4 w-4 text-zinc-400" />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Entre em contato com o administrador do sistema.
          </span>
        </div>
        <form action={logout} className="mt-6">
          <Button type="submit" size="lg">
            <LogOut className="h-4 w-4 mr-2" /> Sair da conta
          </Button>
        </form>
      </div>
    </div>
  );
}
