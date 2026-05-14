"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildAuthEmail } from "@/lib/auth-email";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  profileSchema,
  resetSchema,
  updatePasswordSchema,
} from "@/lib/validations/auth";
import type { FormState } from "@/types/auth";
import type { Json } from "@/lib/supabase/database.types";

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
  } catch (error) {
    console.error("[login] Erro:", error);
    return {
      message:
        "Serviço indisponível no momento. Tente novamente em alguns instantes.",
    };
  }

  redirect("/dashboard");
}

/**
 * Auto-cadastro desabilitado.
 * Usuários são criados exclusivamente pelo administrador em /admin/users.
 */
export async function signup(
  _prevState: FormState,
  _formData: FormData
): Promise<FormState> {
  return {
    message: "O auto-cadastro está desabilitado. Entre em contato com o administrador.",
  };
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

export async function resetPassword(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const rawData = { email: formData.get("email") };
    const validated = resetSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        errors: validated.error.flatten().fieldErrors,
        message: "Verifique o email e tente novamente.",
      };
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email: validated.data.email,
      options: { redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/update-password` },
    });

    if (error || !data.properties?.action_link) {
      return { message: "Erro ao enviar email de recuperação. Tente novamente." };
    }

    const emailContent = buildAuthEmail(
      "recovery",
      data.properties.action_link,
      validated.data.email
    );
    const sent = await sendEmail(validated.data.email, emailContent.subject, emailContent.html);

    if (!sent) {
      return { message: "Erro ao enviar email de recuperação. Tente novamente." };
    }

    return {
      success: true,
      message: "Email de recuperação enviado! Verifique sua caixa de entrada.",
    };
  } catch (error) {
    console.error("[resetPassword] Erro:", error);
    return { message: "Serviço indisponível no momento." };
  }
}

export async function updatePassword(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const rawData = {
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    };

    const validated = updatePasswordSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        errors: validated.error.flatten().fieldErrors,
        message: "Verifique os campos e tente novamente.",
      };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: validated.data.password,
    });

    if (error) {
      return { message: "Erro ao atualizar senha. O link pode ter expirado." };
    }

    revalidatePath("/", "layout");
  } catch (error) {
    console.error("[updatePassword] Erro:", error);
    return { message: "Serviço indisponível no momento." };
  }

  redirect("/auth?message=Senha alterada com sucesso!");
}

export async function updateProfile(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const rawData = {
      name: formData.get("name"),
      phone: String(formData.get("phone") || ""),
      is_whatsapp:
        formData.get("is_whatsapp") === "on" ||
        formData.get("is_whatsapp") === "true",
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

    // Carrega social_media existente para mesclar a flag is_whatsapp
    const { data: prev } = await supabase
      .from("profiles")
      .select("social_media")
      .eq("id", user.id)
      .maybeSingle();
    const socialMedia: Record<string, unknown> = {
      ...((prev?.social_media as Record<string, unknown> | null) || {}),
      is_whatsapp: validated.data.is_whatsapp,
    };

    await supabase
      .from("profiles")
      .update({
        name: validated.data.name,
        phone: validated.data.phone,
        social_media: socialMedia as Json,
        updated_at: new Date().toISOString(),
      })
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
