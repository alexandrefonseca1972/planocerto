import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

export function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";

  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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