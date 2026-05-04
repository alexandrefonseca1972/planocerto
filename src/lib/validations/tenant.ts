import { z } from "zod";

export const createTenantSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(100, "Nome deve ter no máximo 100 caracteres.")
    .trim(),
  slug: z
    .string()
    .min(2, "Slug deve ter pelo menos 2 caracteres.")
    .max(50, "Slug deve ter no máximo 50 caracteres.")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug deve conter apenas letras minúsculas, números e hífens."
    )
    .trim()
    .transform((v) => v.toLowerCase()),
  plan: z.enum(["free", "pro", "enterprise"], {
    message: "Selecione um plano válido.",
  }),
});

export type CreateTenantValues = z.infer<typeof createTenantSchema>;
