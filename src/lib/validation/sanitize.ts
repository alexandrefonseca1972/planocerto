import { z } from "zod";

// Elementos cujo CONTEÚDO também deve ser descartado (texto cru/perigoso),
// equivalente ao comportamento do DOMPurify com ALLOWED_TAGS: [].
const RAW_CONTENT_ELEMENTS =
  /<(script|style|noscript|template|iframe|object|embed|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

/**
 * Reduz qualquer entrada a texto puro: remove elementos perigosos com seu
 * conteúdo, descarta comentários e demais tags (preservando o texto), tira
 * caracteres de controle, colapsa espaços e faz trim.
 *
 * Substitui o `isomorphic-dompurify` (que arrastava o jsdom para o bundle do
 * servidor — os `require` dinâmicos de deps opcionais do jsdom quebram em
 * função serverless sob Turbopack, derrubando toda server action com
 * "Failed to load external module"). Como destino final é texto puro e o React
 * reescapa na renderização, um strip puro-JS é suficiente como defesa em
 * profundidade — sem dependência de DOM em cliente ou servidor.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";

  return input
    .replace(RAW_CONTENT_ELEMENTS, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
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