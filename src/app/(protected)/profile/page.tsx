import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/forms/profile-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Perfil | PlanoCerto",
  description: "Gerencie seus dados de perfil no PlanoCerto.",
};

export default async function ProfilePage() {
  let userName = "";
  let userEmail = "";
  let userId = "";
  let userCreatedAt = "";
  let userLastSignIn = "";

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    userName = user?.user_metadata?.name || "";
    userEmail = user?.email || "";
    userId = user?.id || "";
    userCreatedAt = user?.created_at || "";
    userLastSignIn = user?.last_sign_in_at || "";
  } catch {
    userName = "";
    userEmail = "";
  }

  const userInitial = (userName[0] || userEmail[0] || "?").toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Perfil
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Gerencie seus dados pessoais.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{userName || "Sem nome"}</CardTitle>
              <CardDescription>{userEmail || "Sem email"}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm name={userName} email={userEmail} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações da conta</CardTitle>
          <CardDescription>Detalhes da sua conta no PlanoCerto.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-zinc-200 dark:divide-zinc-700">
            <div className="flex justify-between py-3">
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                ID do usuário
              </dt>
              <dd className="text-sm font-mono text-zinc-900 dark:text-zinc-50">
                {userId ? `${userId.slice(0, 16)}...` : "-"}
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                Membro desde
              </dt>
              <dd className="text-sm text-zinc-900 dark:text-zinc-50">
                {userCreatedAt
                  ? formatDate(userCreatedAt)
                  : "Não disponível"}
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                Último acesso
              </dt>
              <dd className="text-sm text-zinc-900 dark:text-zinc-50">
                {userLastSignIn
                  ? formatDate(userLastSignIn)
                  : "Não disponível"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
