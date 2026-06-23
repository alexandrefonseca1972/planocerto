import { type NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/middleware/auth-check";
import { isProtectedPath, isAuthPage, isApiRoute } from "@/lib/middleware/route-guards";
import { checkProfileRestrictions } from "@/lib/middleware/profile-restrictions";
import { buildCsp } from "@/lib/security/csp";
import { logger } from "@/lib/logger";

const log = logger.child({ component: "proxy" });

export async function proxy(request: NextRequest) {
  // Nonce único por requisição para a CSP estrita (script-src 'nonce-...').
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");

  try {
    const { user, response: supabaseResponse } = await checkAuth(request, {
      "x-nonce": nonce,
      "content-security-policy": csp,
    });

    // Garante a CSP em todas as respostas (incl. redirects abaixo herdam via header).
    supabaseResponse.headers.set("content-security-policy", csp);

    const { pathname, searchParams } = request.nextUrl;

    const isAuth = isAuthPage(pathname);
    const isProtected = isProtectedPath(pathname);
    const isApi = isApiRoute(pathname);

    const hasAuthMessage = searchParams.has("message") || searchParams.has("error");

    // Redireciona usuário autenticado fora de páginas de auth
    if (user && !isApi && isAuth && !hasAuthMessage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Verifica restrições de perfil (conta ativa, horário de login)
    if (user && isProtected && !isApi) {
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
