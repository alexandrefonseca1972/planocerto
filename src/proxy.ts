import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getEnvVar } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export async function proxy(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient<Database>(
      getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
      getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;
    const isProtectedPath =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/planos") ||
      pathname.startsWith("/calendario") ||
      pathname.startsWith("/pendente");

    if (userError && isProtectedPath) {
      console.error("[proxy] Erro ao obter usuário:", userError.message);
    }

    const isAuthPage =
      pathname.startsWith("/auth") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register");
    const isProtectedPage =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/admin");

    if (user && !userError && isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Check login time restrictions
    if (user && isProtectedPage) {
      try {
        const { data: profile } = await supabase.from("profiles").select("login_start_time, login_end_time, is_active").eq("id", user.id).maybeSingle();
        if (profile && !profile.is_active) {
          const url = new URL("/auth", request.url);
          url.searchParams.set("message", "Sua conta está desativada. Entre em contato com o administrador.");
          return NextResponse.redirect(url);
        }
        if (profile?.login_start_time && profile?.login_end_time) {
          const now = new Date();
          const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
          if (currentTime < profile.login_start_time || currentTime > profile.login_end_time) {
            const url = new URL("/auth", request.url);
            url.searchParams.set("message", `Seu horário de acesso é das ${profile.login_start_time.slice(0, 5)} às ${profile.login_end_time.slice(0, 5)}.`);
            return NextResponse.redirect(url);
          }
        }
      } catch { /* non-critical */ }
    }

    if (!user && isProtectedPage) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }

    return supabaseResponse;
  } catch (error) {
    console.error("[proxy] Erro crítico no middleware:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
