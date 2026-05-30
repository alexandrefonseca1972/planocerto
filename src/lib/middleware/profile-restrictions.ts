import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";
import { logger } from "@/lib/logger";

const log = logger.child({ component: "middleware:profile" });

interface ProfileCheckResult {
  redirected: NextResponse | null;
}

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

/**
 * Verifica restrições de login: conta ativa e janela de horário permitido.
 * O timezone vem do perfil (profiles.timezone), avaliado server-side — não é
 * mais inferido de cabeçalhos do cliente (que eram spoofáveis). Default: Brasília.
 */
export async function checkProfileRestrictions(
  request: NextRequest,
  userId: string,
): Promise<ProfileCheckResult> {
  try {
    const supabase = createServerClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("login_start_time, login_end_time, is_active, timezone")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      return { redirected: null };
    }

    if (!profile.is_active) {
      const url = new URL("/auth", request.url);
      url.searchParams.set(
        "error",
        "Sua conta está desativada. Entre em contato com o administrador."
      );
      return { redirected: NextResponse.redirect(url) };
    }

    if (profile.login_start_time && profile.login_end_time) {
      const tz = profile.timezone || DEFAULT_TIMEZONE;
      const now = getTimeInTimezone(tz);
      const currentMinutes = now.hours * 60 + now.minutes;

      const startMinutes = timeToMinutes(profile.login_start_time);
      const endMinutes = timeToMinutes(profile.login_end_time);

      if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        const startDisplay = profile.login_start_time.slice(0, 5);
        const endDisplay = profile.login_end_time.slice(0, 5);
        const url = new URL("/auth", request.url);
        url.searchParams.set(
          "error",
          `Seu horário de acesso é das ${startDisplay} às ${endDisplay}.`
        );
        return { redirected: NextResponse.redirect(url) };
      }
    }

    return { redirected: null };
  } catch (error) {
    log.error({ error }, "Erro ao verificar restrições de perfil — bloqueando acesso por segurança");
    const url = new URL("/auth", request.url);
    url.searchParams.set("error", "Erro ao verificar perfil. Tente novamente.");
    return { redirected: NextResponse.redirect(url) };
  }
}

function getTimeInTimezone(tz: string): { hours: number; minutes: number } {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const [hours, minutes] = formatter.format(now).split(":").map(Number);
    return { hours, minutes };
  } catch {
    const now = new Date();
    return { hours: now.getHours(), minutes: now.getMinutes() };
  }
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}
