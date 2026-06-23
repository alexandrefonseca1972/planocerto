/**
 * Content Security Policy estrita baseada em nonce.
 *
 * O nonce é gerado por requisição no proxy (src/proxy.ts) e propagado ao SSR
 * via header `x-nonce`, que o Next.js usa para assinar seus scripts/estilos.
 *
 * Scripts: `'nonce-...'` libera os scripts inline assinados pelo Next; `'self'`
 * libera os chunks do bundle (mesma origem). Não usamos `'strict-dynamic'`
 * porque o build com Turbopack emite um chunk via `<script async>` sem nonce, e
 * `strict-dynamic` desativaria o `'self'`, bloqueando-o. Com `'self' 'nonce'`
 * ainda bloqueamos scripts inline injetados (XSS) e scripts cross-origin; os
 * uploads do app ficam no Supabase (outra origem), então `'self'` é seguro aqui.
 * Em desenvolvimento o React usa `eval`, por isso `'unsafe-eval'` no dev.
 */
export function buildCsp(nonce: string, isDev: boolean): string {
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""}`,
    // Estilos: 'unsafe-inline' SEM nonce. Combinar nonce + 'unsafe-inline' no
    // mesmo style-src faz o browser IGNORAR o 'unsafe-inline' (regra do CSP),
    // bloqueando os <style> que o Next/Turbopack injeta e os style="" do React
    // e dos transforms do dnd-kit. Estilo inline não é vetor de XSS de script —
    // a proteção real está em script-src (estrito, com nonce) — então liberar
    // 'unsafe-inline' aqui é seguro. style-src-attr fica coberto por fallback.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: https://www.gravatar.com`,
    `font-src 'self'`,
    // REST + Realtime (websocket) do Supabase.
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ];
  return directives.join("; ");
}
