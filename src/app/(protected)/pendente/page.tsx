import { createClient } from "@/lib/supabase/server";
import { Shield, Clock } from "lucide-react";

export default async function PendentePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userName = user?.user_metadata?.name || user?.email || "Usuário";

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
        <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Aguardando aprovação
      </h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        Olá <strong>{userName}</strong>, sua conta foi criada mas ainda não está associada a nenhuma empresa.
      </p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Um administrador precisa vincular seu usuário a uma empresa para que você possa acessar os planos de ação.
      </p>
      <div className="mt-8 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
        <Shield className="h-4 w-4 text-zinc-400" />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Entre em contato com o administrador do sistema para solicitar acesso.
        </span>
      </div>
    </div>
  );
}
