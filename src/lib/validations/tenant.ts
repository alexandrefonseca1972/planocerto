import { z } from "zod";
import { sanitizedString } from "@/lib/validation/sanitize";

export const createTenantSchema = z.object({
  name: sanitizedString({
    min: 2,
    max: 100,
    minMsg: "Nome deve ter pelo menos 2 caracteres.",
    maxMsg: "Nome deve ter no máximo 100 caracteres.",
  }),
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
