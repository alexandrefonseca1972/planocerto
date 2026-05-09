import { z } from "zod";
import { isValidCNPJ, isValidPhone, isValidEmail } from "@/lib/format-br";

/**
 * Schemas zod compartilhados entre server actions e client components.
 *
 * Por que aqui e não junto da action: arquivos `"use server"` no Next.js 16
 * só podem exportar async functions. Schemas (objetos) precisam morar em
 * outro lugar.
 */

const ALLOWED_PRIORIDADE_COLORS = ["red", "amber", "emerald", "blue", "zinc"] as const;

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO", "",
] as const;

export const tipoPaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(80, "Nome deve ter no máximo 80 caracteres."),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
});

export const macroAcaoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(100, "Nome deve ter no máximo 100 caracteres."),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
});

export const areaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(80, "Nome deve ter no máximo 80 caracteres."),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
});

export const prioridadeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(40, "Nome deve ter no máximo 40 caracteres."),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
  color: z.enum(ALLOWED_PRIORIDADE_COLORS).default("zinc"),
});

export const unitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(100, "Nome deve ter no máximo 100 caracteres."),
  area_id: z.string().uuid().nullable(),
  uf: z.enum(UFS).default(""),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
});

export const fornecedorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(120, "Nome deve ter no máximo 120 caracteres."),
  cnpj: z
    .string()
    .trim()
    .max(20)
    .optional()
    .default("")
    .refine((v) => !v || isValidCNPJ(v), "CNPJ inválido."),
  categoria: z.string().trim().max(80).optional().default(""),
  contato_nome: z
    .string()
    .trim()
    .max(120)
    .optional()
    .default("")
    .refine(
      (v) => !v || v.length >= 2,
      "Nome do contato deve ter pelo menos 2 caracteres.",
    ),
  contato_email: z
    .string()
    .trim()
    .max(160)
    .optional()
    .default("")
    .refine((v) => !v || isValidEmail(v), "E-mail inválido."),
  contato_telefone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .default("")
    .refine((v) => !v || isValidPhone(v), "Telefone inválido (use DDD + 8 ou 9 dígitos)."),
  observacoes: z.string().trim().max(2000).optional().default(""),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
});
