export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

export function requireUuid(v: unknown, label = "ID"): string {
  if (!isValidUuid(v)) throw new Error(`${label} inválido.`);
  return v;
}
