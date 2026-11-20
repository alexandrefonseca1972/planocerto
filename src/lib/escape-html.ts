/** Escapa texto do usuário antes de interpolar em HTML (rotas que devolvem text/html). */
export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
