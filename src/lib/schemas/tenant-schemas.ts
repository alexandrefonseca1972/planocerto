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
  // slug é gerado automaticamente no servidor a partir do nome (único).
  plan: z.enum(["free", "pro", "enterprise"]),
  active: z.boolean().default(true),
  // Limite de unidades. Vazio = ilimitado (null).
  max_units: z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? null : v),
      z.coerce
        .number({ message: "Limite inválido." })
        .int("Use um número inteiro.")
        .min(1, "Mínimo 1 unidade.")
        .max(100000, "Limite muito alto.")
        .nullable(),
    )
    .default(null),
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
