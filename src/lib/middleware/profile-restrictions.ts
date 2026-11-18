import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

const log = logger.child({ component: "middleware:profile" });

interface ProfileCheckResult {
  redirected: NextResponse | null;
}

/**
 * Verifica restrições de acesso: conta ativa e janela de horário permitido.
 * A regra fica em SQL (account_access_status, migration 078), a mesma que o
 * PostgREST aplica em cada requisição. Falha ou perfil ausente bloqueia.
 *
 * `kind`: "page" redireciona para /auth com a mensagem; "api" (rotas /api e
 * Server Actions) responde 403 JSON.
 */
export async function checkProfileRestrictions(
  request: NextRequest,
  userId: string,
  kind: "page" | "api" = "page",
): Promise<ProfileCheckResult> {
  let message: string | null;
  try {
    message = await blockedMessage(userId);
  } catch (error) {
    log.error({ error }, "Erro ao verificar restrições de perfil — bloqueando acesso por segurança");
    message = "Erro ao verificar perfil. Tente novamente.";
  }
  if (!message) return { redirected: null };

  if (kind === "api") {
    return { redirected: NextResponse.json({ error: message }, { status: 403 }) };
  }
  const url = new URL("/auth", request.url);
  url.searchParams.set("error", message);
  return { redirected: NextResponse.redirect(url) };
}

async function blockedMessage(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: status, error } = await admin.rpc("account_access_status", { p_user_id: userId });
  if (error) throw error;

  switch (status) {
    case "ok":
      return null;
    case "inactive":
      return "Sua conta está desativada. Entre em contato com o administrador.";
    case "outside_hours": {
      const { data: p } = await admin
        .from("profiles")
        .select("login_start_time, login_end_time")
        .eq("id", userId)
        .maybeSingle();
      const start = p?.login_start_time?.slice(0, 5);
      const end = p?.login_end_time?.slice(0, 5);
      return start && end
        ? `Seu horário de acesso é das ${start} às ${end}.`
        : "Fora do seu horário de acesso.";
    }
    default:
      return "Perfil não encontrado. Entre em contato com o administrador.";
  }
}
