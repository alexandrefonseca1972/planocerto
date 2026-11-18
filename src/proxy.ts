import { type NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/middleware/auth-check";
import { isProtectedPath, isAuthPage, isApiRoute } from "@/lib/middleware/route-guards";
import { checkProfileRestrictions } from "@/lib/middleware/profile-restrictions";
import { logger } from "@/lib/logger";

const log = logger.child({ component: "proxy" });

export async function proxy(request: NextRequest) {
  try {
    const { user, response: supabaseResponse } = await checkAuth(request);

    const { pathname, searchParams } = request.nextUrl;

    const isAuth = isAuthPage(pathname);
    const isProtected = isProtectedPath(pathname);
    const isApi = isApiRoute(pathname);

    const hasAuthMessage = searchParams.has("message") || searchParams.has("error");

    // Redireciona usuário autenticado fora de páginas de auth
    if (user && !isApi && isAuth && !hasAuthMessage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Verifica restrições de perfil (conta ativa, horário de login).
    // Server Actions podem ser postadas em QUALQUER rota (o ID da action é
    // global), então o header next-action é checado fora das rotas protegidas.
    // Exceção: páginas de auth, para o bloqueado conseguir sair/trocar de
    // conta; ali valem os gates de checkPermission/getRequesterScope e o
    // pre-request do PostgREST (migration 078).
    const isAction = request.headers.has("next-action") && !isAuth;
    if (user && (isApi || isAction)) {
      const { redirected } = await checkProfileRestrictions(request, user.id, "api");
      if (redirected) return redirected;
    } else if (user && isProtected) {
      const { redirected } = await checkProfileRestrictions(request, user.id);
      if (redirected) return redirected;
    }

    // Redireciona usuário não-autenticado para /auth
    if (!user && isProtected) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }

    return supabaseResponse;
  } catch (error) {
    log.error({ error }, "Erro crítico no middleware");

    const { pathname } = request.nextUrl;

    // Fail-closed: em caso de falha crítica, bloqueia rotas protegidas
    if (isProtectedPath(pathname) && !isApiRoute(pathname)) {
      const url = new URL("/auth", request.url);
      url.searchParams.set("error", "Serviço temporariamente indisponível. Tente novamente em instantes.");
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
