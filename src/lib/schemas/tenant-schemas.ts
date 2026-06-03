import { z } from "zod";
import {
  isValidCNPJ,
  isValidEmail,
  isValidPhone,
  isValidWebsite,
} from "@/lib/format-br";
import { sanitizedString } from "@/lib/validation/sanitize";

/**
 * Schema completo do formulário admin de Empresas (tenants).
 * Server action usa um subset (createTenantSchema/validations/tenant.ts);
 * este aqui é o schema "wide" do form, incluindo campos opcionais.
 */
export const tenantFormSchema = z.object({
  name: sanitizedString({
    min: 2,
    max: 100,
    minMsg: "Nome deve ter pelo menos 2 caracteres.",
    maxMsg: "Nome deve ter no máximo 100 caracteres.",
  }),
  slug: z
    .string()
    .trim()
    .min(2, "Slug deve ter pelo menos 2 caracteres.")
    .max(50, "Slug deve ter no máximo 50 caracteres.")
    .regex(
      /^[a-z0-9-]+$/,
      "Use apenas letras minúsculas, números e hífens.",
    ),
  plan: z.enum(["free", "pro", "enterprise"]),
  active: z.boolean().default(true),
  teams_webhook_url: z
    .string()
    .trim()
    .max(500, "URL muito longa.")
    .refine(
      (v) => v === "" || /^https:\/\/[\w.-]+\.webhook\.office\.com\//.test(v),
      "Webhook inválido. Deve ser uma URL https do Microsoft Teams.",
    )
    .default(""),

  // Novos campos de cadastro (todos opcionais).
  cnpj: z
    .string()
    .trim()
    .max(20, "CNPJ muito longo.")
    .refine((v) => v === "" || isValidCNPJ(v), "CNPJ inválido.")
    .default(""),
  responsavel_nome: sanitizedString({ max: 120, maxMsg: "Nome muito longo." }).default(""),
  email: z
    .string()
    .trim()
    .max(120, "E-mail muito longo.")
    .refine((v) => v === "" || isValidEmail(v), "E-mail inválido.")
    .default(""),
  site: z
    .string()
    .trim()
    .max(200, "URL muito longa.")
    .refine((v) => v === "" || isValidWebsite(v), "URL inválida.")
    .default(""),
  fone: z
    .string()
    .trim()
    .max(20, "Telefone muito longo.")
    .refine((v) => v === "" || isValidPhone(v), "Telefone inválido.")
    .default(""),
});

export type TenantFormValues = z.infer<typeof tenantFormSchema>;
