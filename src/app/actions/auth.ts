"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  profileSchema,
} from "@/lib/validations/auth";
import type { FormState } from "@/types/auth";

export async function login(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const validated = loginSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        errors: validated.error.flatten().fieldErrors,
        message: "Verifique os campos e tente novamente.",
      };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: validated.data.email,
      password: validated.data.password,
    });

    if (error) {
      const messages: Record<string, string> = {
        "Invalid login credentials": "Email ou senha inválidos.",
        "Email not confirmed": "Confirme seu email antes de entrar.",
        "Invalid email or password": "Email ou senha inválidos.",
        "Email not confirmed or invalid login credentials":
          "Confirme seu email antes de entrar.",
      };

      return {
        message:
          messages[error.message] ??
          "Erro ao realizar login. Verifique seus dados e tente novamente.",
      };
    }

    revalidatePath("/", "layout");
  } catch (error) {
    console.error("[login] Erro:", error);
    return {
      message:
        "Serviço indisponível no momento. Tente novamente em alguns instantes.",
    };
  }

  redirect("/dashboard");
}

export async function signup(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    const validated = registerSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        errors: validated.error.flatten().fieldErrors,
        message: "Verifique os campos e tente novamente.",
      };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email: validated.data.email,
      password: validated.data.password,
      options: {
        data: {
          name: validated.data.name,
        },
      },
    });

    if (error) {
      const messages: Record<string, string> = {
        "User already registered": "Este email já está cadastrado.",
      };

      return {
        message:
          messages[error.message] ??
          "Erro ao criar conta. Tente novamente.",
      };
    }

    return {
      success: true,
      message: "Conta criada com sucesso! Verifique seu email para confirmar.",
    };
  } catch (error) {
    console.error("[signup] Erro:", error);
    return {
      message:
        "Serviço indisponível no momento. Tente novamente em alguns instantes.",
    };
  }
}

export async function logout(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
  } catch (error) {
    console.error("[logout] Erro:", error);
  }

  redirect("/auth");
}

export async function updateProfile(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const rawData = {
      name: formData.get("name"),
    };

    const validated = profileSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        errors: validated.error.flatten().fieldErrors,
        message: "Verifique os campos e tente novamente.",
      };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser();

    if (getUserError || !user) {
      return {
        message: "Sessão expirada. Faça login novamente.",
      };
    }

    const { error } = await supabase.auth.updateUser({
      data: { name: validated.data.name },
    });

    if (error) {
      return { message: "Erro ao atualizar perfil. Tente novamente." };
    }

    await supabase
      .from("profiles")
      .update({ name: validated.data.name, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    revalidatePath("/profile");
    revalidatePath("/", "layout");
    return { success: true, message: "Perfil atualizado com sucesso!" };
  } catch (error) {
    console.error("[updateProfile] Erro:", error);
    return {
      message:
        "Serviço indisponível no momento. Tente novamente em alguns instantes.",
    };
  }
}
