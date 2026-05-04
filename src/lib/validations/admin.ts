import { z } from "zod";

export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório.")
    .email("Digite um email válido.")
    .trim()
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres.")
    .max(72, "Senha deve ter no máximo 72 caracteres.")
    .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula.")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula.")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número.")
    .regex(
      /[^a-zA-Z0-9]/,
      "Senha deve conter pelo menos um caractere especial."
    ),
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(100, "Nome deve ter no máximo 100 caracteres.")
    .trim(),
  role: z.enum(["user", "admin"], { message: "Selecione um papel válido." }),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(100, "Nome deve ter no máximo 100 caracteres.")
    .trim(),
  role: z.enum(["user", "admin"], { message: "Selecione um papel válido." }),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;
export type UpdateUserValues = z.infer<typeof updateUserSchema>;
