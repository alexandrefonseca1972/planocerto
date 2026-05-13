import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const ALLOWED_BUILTIN_ROLES = ["super_admin", "admin", "manager", "user", "viewer"] as const;

export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório.")
    .email("Digite um email válido.")
    .trim()
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .max(72, "Senha deve ter no máximo 72 caracteres.")
    .optional()
    .refine((v) => !v || v.length >= 8, "Senha deve ter pelo menos 8 caracteres.")
    .refine((v) => !v || /[a-z]/.test(v), "Senha deve conter pelo menos uma letra minúscula.")
    .refine((v) => !v || /[A-Z]/.test(v), "Senha deve conter pelo menos uma letra maiúscula.")
    .refine((v) => !v || /[0-9]/.test(v), "Senha deve conter pelo menos um número.")
    .refine((v) => !v || /[^a-zA-Z0-9]/.test(v), "Senha deve conter pelo menos um caractere especial."),
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(100, "Nome deve ter no máximo 100 caracteres.")
    .trim(),
  role: z.string().min(1, "Papel é obrigatório.").trim(),
});

export { ALLOWED_BUILTIN_ROLES };

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(100, "Nome deve ter no máximo 100 caracteres.")
    .trim(),
  role: z.string().min(1, "Papel é obrigatório.").trim(),
  permissions: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const parsed = JSON.parse(val);
          return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
        } catch {
          return false;
        }
      },
      { message: "Permissões em formato JSON inválido." }
    ),
  login_start_time: z
    .string()
    .optional()
    .refine((val) => !val || timeRegex.test(val), {
      message: "Horário de início inválido (use HH:MM).",
    })
    .transform((val) => val || null),
  login_end_time: z
    .string()
    .optional()
    .refine((val) => !val || timeRegex.test(val), {
      message: "Horário de fim inválido (use HH:MM).",
    })
    .transform((val) => val || null),
});

export const permissionsSchema = z.record(z.string(), z.boolean());

export function sanitizePermissions(
  raw: Record<string, unknown>,
  allowed: readonly string[]
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const key of allowed) {
    if (key in raw && typeof raw[key] === "boolean") {
      out[key] = raw[key] as boolean;
    }
  }
  return out;
}

export type CreateUserValues = z.infer<typeof createUserSchema>;
export type UpdateUserValues = z.infer<typeof updateUserSchema>;
