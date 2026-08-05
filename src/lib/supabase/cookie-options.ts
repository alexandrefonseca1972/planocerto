import type { CookieOptions } from "@supabase/ssr";

/**
 * Endurece as opções de cookie do Supabase antes de gravá-los:
 *
 * - `httpOnly: true` — o token `sb-*-auth-token` deixa de ser legível por
 *   `document.cookie`, mitigando roubo de sessão via XSS (item da auditoria
 *   2026-06-22). Seguro porque TODO acesso ao Supabase é server-side: o browser
 *   client (`@/lib/supabase/client`) não é importado em lugar nenhum, então
 *   nada no cliente precisa ler o token.
 * - `sameSite: "lax"` — defesa em profundidade contra CSRF, preservando o fluxo
 *   normal de navegação/login.
 * - `secure` em produção — cookie só trafega por HTTPS (em dev/localhost via
 *   HTTP o `secure` é omitido para não quebrar o login local).
 *
 * Remove `expires`/`maxAge` para manter cookies de sessão (encerram ao fechar o
 * navegador), preservando o comportamento já adotado no projeto.
 */
export function hardenCookieOptions(options?: CookieOptions): CookieOptions {
  const { expires, maxAge, ...rest } = options ?? {};
  void expires;
  void maxAge;
  return {
    ...rest,
    httpOnly: true,
    sameSite: rest.sameSite ?? "lax",
    secure: process.env.NODE_ENV === "production",
  };
}
