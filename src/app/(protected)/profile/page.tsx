import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/forms/profile-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Phone,
  Shield,
  Clock,
  Calendar,
  Activity,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Perfil",
  description: "Gerencie seus dados de perfil no PlanoCerto.",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  user: "Usuário",
  viewer: "Visualizador",
};

export default async function ProfilePage() {
  let userName = "";
  let userEmail = "";
  let userCreatedAt = "";
  let userLastSignIn = "";
  let phone = "";
  let isWhatsapp = false;
  let role = "user";
  let isActive = true;
  let activeTenantName = "";
  let recentActivity: { action: string; created_at: string }[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    userName = user?.user_metadata?.name || "";
    userEmail = user?.email || "";
    userCreatedAt = user?.created_at || "";
    userLastSignIn = user?.last_sign_in_at || "";

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name,phone,social_media,role,is_active,active_tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        if (profile.name) userName = profile.name;
        phone = profile.phone || "";
        const social =
          (profile.social_media as Record<string, unknown> | null) || {};
        isWhatsapp = Boolean(social.is_whatsapp);
        role = profile.role || "user";
        isActive = profile.is_active ?? true;

        if (profile.active_tenant_id) {
          const { data: tenant } = await supabase
            .from("tenants")
            .select("name")
            .eq("id", profile.active_tenant_id)
            .maybeSingle();
          activeTenantName = tenant?.name || "";
        }

        // Últimas atividades em planos (audit log)
        const { data: log } = await supabase
          .from("plan_audit_log")
          .select("action,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        recentActivity = (log || []) as { action: string; created_at: string }[];
      }
    }
  } catch {
    /* fallback */
  }

  const userInitial = (userName[0] || userEmail[0] || "?").toUpperCase();
  const now = new Date();
  const memberSinceMs = userCreatedAt ? new Date(userCreatedAt).getTime() : 0;
  const lastSignInMs = userLastSignIn ? new Date(userLastSignIn).getTime() : 0;
  const nowMs = now.getTime();
  const daysSinceJoin = memberSinceMs
    ? Math.floor((nowMs - memberSinceMs) / 86400000)
    : 0;
  const daysSinceLastLogin = lastSignInMs
    ? Math.floor((nowMs - lastSignInMs) / 86400000)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          <User className="h-6 w-6 text-accent-600" /> Perfil
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Gerencie seus dados pessoais e veja o resumo de atividade.
        </p>
      </div>

      {/* Hero card */}
      <Card>
        <div className="bg-gradient-to-br from-brand-600 to-accent-600 px-6 py-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 ring-2 ring-white/30">
              <AvatarFallback className="bg-white/10 text-2xl font-bold text-white">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-bold text-white">
                {userName || "Sem nome"}
              </h2>
              <p className="truncate text-sm text-white/70">
                {userEmail || "Sem email"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge variant="default" className="bg-white/20 text-white border-white/30">
                  <Shield className="mr-1 h-3 w-3" /> {ROLE_LABEL[role] || role}
                </Badge>
                {isActive ? (
                  <Badge variant="success">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Ativo
                  </Badge>
                ) : (
                  <Badge variant="muted">Inativo</Badge>
                )}
                {activeTenantName && (
                  <Badge variant="muted">{activeTenantName}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mini-stats */}
        <CardContent className="grid grid-cols-2 gap-3 border-t border-zinc-100 p-4 sm:grid-cols-4 dark:border-zinc-800">
          <MiniStat
            icon={<Calendar className="h-4 w-4 text-accent-600" />}
            label="Membro há"
            value={
              daysSinceJoin === 0
                ? "hoje"
                : daysSinceJoin < 30
                ? `${daysSinceJoin}d`
                : daysSinceJoin < 365
                ? `${Math.floor(daysSinceJoin / 30)}m`
                : `${Math.floor(daysSinceJoin / 365)}a`
            }
          />
          <MiniStat
            icon={<Clock className="h-4 w-4 text-accent-600" />}
            label="Último acesso"
            value={
              daysSinceLastLogin === 0
                ? "hoje"
                : daysSinceLastLogin === 1
                ? "ontem"
                : `${daysSinceLastLogin}d atrás`
            }
          />
          <MiniStat
            icon={<Activity className="h-4 w-4 text-accent-600" />}
            label="Ações recentes"
            value={recentActivity.length}
          />
          <MiniStat
            icon={<Phone className="h-4 w-4 text-accent-600" />}
            label="Telefone"
            value={phone ? "Sim" : "Faltando"}
            tone={phone ? "ok" : "warn"}
          />
        </CardContent>
      </Card>

      {/* Form + Info */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informações pessoais</CardTitle>
            <CardDescription>
              Mantenha seus dados atualizados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              name={userName}
              email={userEmail}
              phone={phone}
              isWhatsapp={isWhatsapp}
            />
          </CardContent>
        </Card>

        {/* Atividade recente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-accent-600" /> Atividade recente
            </CardTitle>
            <CardDescription>Últimas 5 ações nos planos.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="py-6 text-center text-xs italic text-zinc-400">
                Sem atividade recente.
              </p>
            ) : (
              <ul className="space-y-2">
                {recentActivity.map((a, i) => {
                  const dt = new Date(a.created_at);
                  return (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-700 dark:text-zinc-300">
                          {humanAction(a.action)}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {dt.toLocaleDateString("pt-BR")} ·{" "}
                          {dt.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone?: "neutral" | "ok" | "warn";
}) {
  const valueColor =
    tone === "warn"
      ? "text-amber-600 dark:text-amber-400"
      : tone === "ok"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-zinc-900 dark:text-zinc-50";
  return (
    <div>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </span>
      </div>
      <p className={`mt-1 text-base font-bold tabular-nums ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}

function humanAction(code: string): string {
  const map: Record<string, string> = {
    CREATE_PLAN: "Criou um plano",
    UPDATE_PLAN: "Atualizou um plano",
    DELETE_PLAN: "Excluiu um plano",
    CREATE_ITEM: "Criou uma ação",
    UPDATE_ITEM: "Atualizou uma ação",
    DELETE_ITEM: "Excluiu uma ação",
  };
  return map[code] || code;
}
