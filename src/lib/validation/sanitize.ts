import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";

export function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";

  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * String zod para texto livre do usuário: sanitiza (DOMPurify, sem tags +
 * remove controles + colapsa espaços + trim) ANTES de validar comprimento, de
 * forma que min/max valham sobre o valor que será de fato armazenado.
 *
 * Usado nos schemas compartilhados (cliente↔servidor) — o safeParse no servidor
 * é a autoridade. Substitui o padrão antigo `z.string().trim().min().max()` em
 * campos de texto livre. Para campos de formato controlado (e-mail, slug, CNPJ,
 * datas, URLs) continue usando os validadores específicos.
 */
export function sanitizedString(
  opts: { min?: number; max?: number; minMsg?: string; maxMsg?: string } = {},
) {
  let inner = z.string();
  if (opts.min != null) inner = inner.min(opts.min, opts.minMsg);
  if (opts.max != null) inner = inner.max(opts.max, opts.maxMsg);
  return z.string().transform(sanitizeText).pipe(inner);
}

export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeCNPJ(cnpj: string): string | null {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return null;
  return digits;
}

export function sanitizeCPF(cpf: string): string | null {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return null;
  return digits;
}