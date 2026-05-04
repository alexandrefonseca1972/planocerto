import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório.")
    .email("Digite um email válido.")
    .trim()
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Senha é obrigatória."),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres.")
      .max(100, "Nome deve ter no máximo 100 caracteres.")
      .trim(),
    email: z
      .string()
      .min(1, "Email é obrigatório.")
      .email("Digite um email válido.")
      .trim()
      .transform((v) => v.toLowerCase()),
    password: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres.")
      .max(72, "Senha deve ter no máximo 72 caracteres.")
      .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula.")
      .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula.")
      .regex(/[0-9]/, "Senha deve conter pelo menos um número.")
      .regex(
        /[^a-zA-Z0-9]/,
        "Senha deve conter pelo menos um caractere especial."
      ),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(100, "Nome deve ter no máximo 100 caracteres.")
    .trim(),
});

export const resetSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório.")
    .email("Digite um email válido.")
    .trim()
    .transform((v) => v.toLowerCase()),
});

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres.")
      .max(72, "Senha deve ter no máximo 72 caracteres.")
      .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula.")
      .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula.")
      .regex(/[0-9]/, "Senha deve conter pelo menos um número.")
      .regex(/[^a-zA-Z0-9]/, "Senha deve conter pelo menos um caractere especial."),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
export type ResetFormValues = z.infer<typeof resetSchema>;
export type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;
