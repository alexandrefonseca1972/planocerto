"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  createUserSchema,
  updateUserSchema,
} from "@/lib/validations/admin";
import type { FormState } from "@/types/auth";

export interface AdminFormState extends FormState {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    role?: string[];
  };
}

export async function checkIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return false;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) return false;

    return profile.role === "admin";
  } catch (error) {
    console.error("[checkIsAdmin] Erro:", error);
    return false;
  }
}

export async function createUser(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return {
        message: "Acesso negado. Permissão de administrador necessária.",
      };
    }

    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
      name: formData.get("name"),
      role: formData.get("role"),
    };

    const tenantIds = formData.getAll("tenantIds") as string[];

    const validated = createUserSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        errors: validated.error.flatten().fieldErrors,
        message: "Verifique os campos e tente novamente.",
      };
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient.auth.admin.createUser({
      email: validated.data.email,
      password: validated.data.password,
      email_confirm: true,
      user_metadata: { name: validated.data.name },
    });

    if (error) {
      const messages: Record<string, string> = {
        "User already registered": "Este email já está cadastrado.",
      };

      return {
        message:
          messages[error.message] ?? "Erro ao criar usuário. Tente novamente.",
      };
    }

    if (data.user) {
      const { error: profileError } = await adminClient
        .from("profiles")
        .update({
          name: validated.data.name,
          role: validated.data.role,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.user.id);

      if (profileError) {
        console.error(
          "[createUser] Erro ao atualizar perfil:",
          profileError.message
        );
      }

      for (const tenantId of tenantIds) {
        await adminClient.from("tenant_members").insert({
          user_id: data.user.id,
          tenant_id: tenantId,
          role: "member",
        }).select();
      }
    }

    revalidatePath("/admin/users");
    revalidatePath("/", "layout");
    return { success: true, message: "Usuário criado com sucesso!" };
  } catch (error) {
    console.error("[createUser] Erro:", error);
    return {
      message:
        "Serviço indisponível no momento. Tente novamente em alguns instantes.",
    };
  }
}

export async function updateUser(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return {
        message: "Acesso negado. Permissão de administrador necessária.",
      };
    }

    const userId = formData.get("userId") as string;

    if (!userId) {
      return { message: "ID do usuário é obrigatório." };
    }

    const rawData = {
      name: formData.get("name"),
      role: formData.get("role"),
    };

    const permissions = formData.get("permissions") as string;
    const loginStart = formData.get("login_start_time") as string;
    const loginEnd = formData.get("login_end_time") as string;
    const isActive = formData.get("is_active") === "true";

    const tenantIds = formData.getAll("tenantIds") as string[];
    const validated = updateUserSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        errors: validated.error.flatten().fieldErrors,
        message: "Verifique os campos e tente novamente.",
      };
    }

    const adminClient = createAdminClient();

    const { error: authError } = await adminClient.auth.admin.updateUserById(
      userId,
      {
        user_metadata: { name: validated.data.name },
      }
    );

    if (authError) {
      return { message: "Erro ao atualizar dados de autenticação do usuário." };
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        name: validated.data.name,
        role: validated.data.role,
        permissions: permissions ? JSON.parse(permissions) : undefined,
        login_start_time: loginStart || null,
        login_end_time: loginEnd || null,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      return { message: "Erro ao atualizar perfil do usuário." };
    }

    if (tenantIds.length > 0) {
      const { data: existing } = await adminClient
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", userId);

      const existingIds = new Set((existing || []).map((m) => m.tenant_id));
      const newIds = new Set(tenantIds);

      const toRemove = [...existingIds].filter((id) => !newIds.has(id));
      const toAdd = [...newIds].filter((id) => !existingIds.has(id));

      for (const tenantId of toRemove) {
        await adminClient
          .from("tenant_members")
          .delete()
          .eq("user_id", userId)
          .eq("tenant_id", tenantId);
      }

      for (const tenantId of toAdd) {
        await adminClient.from("tenant_members").insert({
          user_id: userId,
          tenant_id: tenantId,
          role: "member",
        });
      }
    }

    revalidatePath("/admin/users");
    revalidatePath("/", "layout");
    return { success: true, message: "Usuário atualizado com sucesso!" };
  } catch (error) {
    console.error("[updateUser] Erro:", error);
    return {
      message:
        "Serviço indisponível no momento. Tente novamente em alguns instantes.",
    };
  }
}

export async function deleteUser(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return { message: "Acesso negado." };
    }

    const userId = formData.get("userId") as string;
    if (!userId) return { message: "ID do usuário obrigatório." };

    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (currentUser?.id === userId) {
      return { message: "Você não pode excluir seu próprio usuário." };
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.deleteUser(userId);

    if (error) {
      console.error("[deleteUser] Erro Supabase:", error.message);
      if (error.message.includes("not found")) return { message: "Usuário não encontrado." };
      if (error.message.includes("permission")) return { message: "Permissão insuficiente. Verifique a chave de serviço." };
      return { message: "Erro ao excluir usuário. Verifique as permissões." };
    }

    revalidatePath("/admin/users");
    revalidatePath("/", "layout");
    return { success: true, message: "Usuário excluído com sucesso!" };
  } catch (error) {
    console.error("[deleteUser] Erro:", error);
    return {
      message:
        "Serviço indisponível no momento. Tente novamente em alguns instantes.",
    };
  }
}
