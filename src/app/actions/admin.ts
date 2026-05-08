"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  createUserSchema,
  updateUserSchema,
  permissionsSchema,
} from "@/lib/validations/admin";
import { PERMISSIONS, hasPermission, getPermissionsMap, type Permission } from "@/lib/permissions";
import type { FormState } from "@/types/auth";

export interface AdminFormState extends FormState {
  data?: {
    password?: string;
  };
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    role?: string[];
    login_start_time?: string[];
    login_end_time?: string[];
    permissions?: string[];
  };
}

function generateSecurePassword(length = 16): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;

  let password = "";
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  const array = new Uint32Array(length - 4);
  crypto.getRandomValues(array);
  for (let i = 0; i < array.length; i++) {
    password += all[array[i] % all.length];
  }

  const chars = password.split("");
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor((crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000) * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

const supabaseErrorMap: Record<string, string> = {
  "User already registered": "Este email já está cadastrado.",
  "Email not found": "Email não encontrado.",
  "Invalid login credentials": "Credenciais inválidas.",
};

function mapError(message: string): string {
  for (const [key, translation] of Object.entries(supabaseErrorMap)) {
    if (message.includes(key)) return translation;
  }
  if (message.includes("not found")) return "Usuário não encontrado.";
  if (message.includes("permission")) return "Permissão insuficiente.";
  return "Erro ao processar a solicitação. Tente novamente.";
}

async function auditLog(
  userId: string,
  targetUserId: string,
  action: string,
  snapshot?: Record<string, unknown>
) {
  try {
    const adminClient = createAdminClient();
    await adminClient.from("admin_audit_log").insert({
      admin_id: userId,
      target_user_id: targetUserId,
      action,
      snapshot: snapshot ? (snapshot as Record<string, string | number | boolean | null>) : null,
    });
  } catch {
    // non-critical: silently ignore audit failures
  }
}

interface UserProfile {
  id: string;
  role: string;
  permissions: Record<string, boolean> | null;
}

export async function checkIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    return profile?.role === "admin";
  } catch (error) {
    console.error("[checkIsAdmin] Erro:", error);
    return false;
  }
}

export async function checkPermission(requiredPermission: Permission): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, permissions")
      .eq("id", user.id)
      .maybeSingle() as { data: UserProfile | null; error: unknown };

    if (!profile) return false;

    return hasPermission(profile.permissions, profile.role, requiredPermission);
  } catch (error) {
    console.error("[checkPermission] Erro:", error);
    return false;
  }
}

async function requirePermission(
  requiredPermission: Permission
): Promise<{ authorized: boolean; currentUserId?: string; profile?: UserProfile; error?: AdminFormState }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      authorized: false,
      error: { message: "Acesso negado. Faça login novamente." },
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, permissions")
    .eq("id", user.id)
    .maybeSingle() as { data: UserProfile | null; error: unknown };

  if (!profile) {
    return { authorized: false, error: { message: "Perfil não encontrado." } };
  }

  const authorized = hasPermission(profile.permissions, profile.role, requiredPermission);

  if (!authorized) {
    return {
      authorized: false,
      error: { message: "Acesso negado. Permissão insuficiente." },
    };
  }

  return { authorized: true, currentUserId: user.id, profile };
}

export async function createUser(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  try {
    const adminCheck = await requirePermission(PERMISSIONS.USERS_CREATE);
    if (!adminCheck.authorized) return adminCheck.error!;

    const rawData = {
      email: formData.get("email"),
      name: formData.get("name"),
      role: formData.get("role"),
      password: formData.get("password") as string || undefined,
    };

    const tenantIds = formData.getAll("tenantIds") as string[];

    const validated = createUserSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        errors: validated.error.flatten().fieldErrors,
        message: "Verifique os campos e tente novamente.",
      };
    }

    const generatedPassword = validated.data.password || generateSecurePassword();
    const isGenerated = !validated.data.password;

    const adminClient = createAdminClient();

    const { data, error } = await adminClient.auth.admin.createUser({
      email: validated.data.email,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: { name: validated.data.name },
    });

    if (error) {
      return {
        message: mapError(error.message),
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
        console.error("[createUser] Erro ao atualizar perfil:", profileError.message);
        await adminClient.auth.admin.deleteUser(data.user.id);
        return { message: "Erro ao configurar perfil. O usuário foi removido. Tente novamente." };
      }

      if (tenantIds.length > 0) {
        await adminClient.from("tenant_members").insert(
          tenantIds.map((tenantId) => ({
            user_id: data.user!.id,
            tenant_id: tenantId,
            role: "member" as const,
          }))
        );
      }

      const newAreaIds = formData.getAll("areaIds") as string[];
      if (newAreaIds.length > 0) {
        await adminClient.from("user_areas").insert(
          newAreaIds.map((areaId) => ({ user_id: data.user!.id, area_id: areaId }))
        );
      }

      const newUnitIds = formData.getAll("unitIds") as string[];
      if (newUnitIds.length > 0) {
        await adminClient.from("user_units").insert(
          newUnitIds.map((unitId) => ({ user_id: data.user!.id, unit_id: unitId }))
        );
      }

      await auditLog(adminCheck.currentUserId!, data.user.id, "create_user", {
        name: validated.data.name,
        email: validated.data.email,
        role: validated.data.role,
      });
    }

    revalidatePath("/admin/users");
    revalidatePath("/", "layout");

    const message = isGenerated
      ? `Usuário criado com sucesso! A senha gerada é: ${generatedPassword}`
      : "Usuário criado com sucesso!";

    return { success: true, message, data: isGenerated ? { password: generatedPassword } : undefined };
  } catch (error) {
    console.error("[createUser] Erro:", error);
    return { message: "Serviço indisponível no momento. Tente novamente em alguns instantes." };
  }
}

export async function updateUser(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  try {
    const adminCheck = await requirePermission(PERMISSIONS.USERS_UPDATE);
    if (!adminCheck.authorized) return adminCheck.error!;

    const userId = formData.get("userId") as string;

    if (!userId) {
      return { message: "ID do usuário é obrigatório." };
    }

    const rawData = {
      name: formData.get("name"),
      role: formData.get("role"),
      permissions: formData.get("permissions") as string || undefined,
      login_start_time: formData.get("login_start_time") as string || undefined,
      login_end_time: formData.get("login_end_time") as string || undefined,
    };

    const validated = updateUserSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        errors: validated.error.flatten().fieldErrors,
        message: "Verifique os campos e tente novamente.",
      };
    }

    const isActive = formData.get("is_active") === "true";
    const tenantIds = formData.getAll("tenantIds") as string[];

    let parsedPermissions: Record<string, boolean> | null = null;
    if (rawData.permissions) {
      const permsResult = permissionsSchema.safeParse(JSON.parse(rawData.permissions));
      if (!permsResult.success) {
        return { message: "Estrutura de permissões inválida." };
      }
      parsedPermissions = permsResult.data;
    }

    if (validated.data.login_start_time && validated.data.login_end_time) {
      if (validated.data.login_start_time >= validated.data.login_end_time) {
        return {
          errors: {
            login_end_time: ["Horário de fim deve ser posterior ao horário de início."],
          },
          message: "Verifique os horários de acesso.",
        };
      }
    }

    const adminClient = createAdminClient();

    const { error: authError } = await adminClient.auth.admin.updateUserById(
      userId,
      { user_metadata: { name: validated.data.name } }
    );

    if (authError) {
      return { message: mapError(authError.message) };
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        name: validated.data.name,
        role: validated.data.role,
        permissions: parsedPermissions ?? undefined,
        login_start_time: validated.data.login_start_time ?? null,
        login_end_time: validated.data.login_end_time ?? null,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      return { message: mapError(profileError.message) };
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

      if (toRemove.length > 0) {
        await adminClient.from("tenant_members").delete()
          .eq("user_id", userId)
          .in("tenant_id", toRemove);
      }

      if (toAdd.length > 0) {
        await adminClient.from("tenant_members").insert(
          toAdd.map((tenantId) => ({
            user_id: userId,
            tenant_id: tenantId,
            role: "member" as const,
          }))
        );
      }
    }

    // Áreas (escopo por usuário) — substitui o conjunto inteiro
    const areaIds = formData.getAll("areaIds") as string[];
    await adminClient.from("user_areas").delete().eq("user_id", userId);
    if (areaIds.length > 0) {
      await adminClient.from("user_areas").insert(
        areaIds.map((areaId) => ({ user_id: userId, area_id: areaId }))
      );
    }

    // Unidades (escopo por usuário) — substitui o conjunto inteiro
    const unitIds = formData.getAll("unitIds") as string[];
    await adminClient.from("user_units").delete().eq("user_id", userId);
    if (unitIds.length > 0) {
      await adminClient.from("user_units").insert(
        unitIds.map((unitId) => ({ user_id: userId, unit_id: unitId }))
      );
    }

    await auditLog(adminCheck.currentUserId!, userId, "update_user", {
      name: validated.data.name,
      role: validated.data.role,
      is_active: isActive,
    });

    revalidatePath("/admin/users");
    revalidatePath("/", "layout");
    return { success: true, message: "Usuário atualizado com sucesso!" };
  } catch (error) {
    console.error("[updateUser] Erro:", error);
    return { message: "Serviço indisponível no momento. Tente novamente em alguns instantes." };
  }
}

export async function deleteUser(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  try {
    const adminCheck = await requirePermission(PERMISSIONS.USERS_DELETE);
    if (!adminCheck.authorized) return adminCheck.error!;

    const userId = formData.get("userId") as string;
    if (!userId) return { message: "ID do usuário obrigatório." };

    if (adminCheck.currentUserId === userId) {
      return { message: "Você não pode excluir seu próprio usuário." };
    }

    const adminClient = createAdminClient();

    const memResult = await adminClient
      .from("tenant_members")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const planResult = await adminClient
      .from("action_plans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const membershipCount = (memResult as unknown as { count: number | null }).count ?? 0;
    const planCount = (planResult as unknown as { count: number | null }).count ?? 0;

    const impactWarnings: string[] = [];
    if (membershipCount > 0) {
      impactWarnings.push(`${membershipCount} empresa(s)`);
    }
    if (planCount > 0) {
      impactWarnings.push(`${planCount} plano(s) de ação`);
    }

    if (impactWarnings.length > 0) {
      return {
        message: `Este usuário está vinculado a ${impactWarnings.join(" e ")}. Remova os vínculos antes de excluir.`,
      };
    }

    await auditLog(adminCheck.currentUserId!, userId, "delete_user", {});

    const { error } = await adminClient.auth.admin.deleteUser(userId);

    if (error) {
      return { message: mapError(error.message) };
    }

    revalidatePath("/admin/users");
    revalidatePath("/", "layout");
    return { success: true, message: "Usuário excluído com sucesso!" };
  } catch (error) {
    console.error("[deleteUser] Erro:", error);
    return { message: "Serviço indisponível no momento. Tente novamente em alguns instantes." };
  }
}

export async function deactivateUser(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  try {
    const adminCheck = await requirePermission(PERMISSIONS.USERS_UPDATE);
    if (!adminCheck.authorized) return adminCheck.error!;

    const userId = formData.get("userId") as string;
    if (!userId) return { message: "ID do usuário obrigatório." };

    if (adminCheck.currentUserId === userId) {
      return { message: "Você não pode desativar seu próprio usuário." };
    }

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from("profiles")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      return { message: mapError(error.message) };
    }

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}/sessions`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch {
      // Non-critical: session invalidation failed but is_active is set; middleware catches it
    }

    await auditLog(adminCheck.currentUserId!, userId, "deactivate_user", {});

    revalidatePath("/admin/users");
    revalidatePath("/", "layout");
    return { success: true, message: "Usuário desativado com sucesso." };
  } catch (error) {
    console.error("[deactivateUser] Erro:", error);
    return { message: "Serviço indisponível no momento." };
  }
}

export async function activateUser(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  try {
    const adminCheck = await requirePermission(PERMISSIONS.USERS_UPDATE);
    if (!adminCheck.authorized) return adminCheck.error!;

    const userId = formData.get("userId") as string;
    if (!userId) return { message: "ID do usuário obrigatório." };

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from("profiles")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      return { message: mapError(error.message) };
    }

    await auditLog(adminCheck.currentUserId!, userId, "activate_user", {});

    revalidatePath("/admin/users");
    revalidatePath("/", "layout");
    return { success: true, message: "Usuário ativado com sucesso." };
  } catch (error) {
    console.error("[activateUser] Erro:", error);
    return { message: "Serviço indisponível no momento." };
  }
}

export async function resendConfirmation(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  try {
    const adminCheck = await requirePermission(PERMISSIONS.USERS_UPDATE);
    if (!adminCheck.authorized) return adminCheck.error!;

    const email = formData.get("email") as string;
    if (!email) return { message: "Email é obrigatório." };

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    });

    if (error) {
      return { message: mapError(error.message) };
    }

    return { success: true, message: "Email de confirmação reenviado com sucesso." };
  } catch (error) {
    console.error("[resendConfirmation] Erro:", error);
    return { message: "Serviço indisponível no momento." };
  }
}

export async function bulkDeleteUsers(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  try {
    const adminCheck = await requirePermission(PERMISSIONS.USERS_DELETE);
    if (!adminCheck.authorized) return adminCheck.error!;

    const userIds = formData.getAll("userIds") as string[];
    if (userIds.length === 0) return { message: "Nenhum usuário selecionado." };

    if (userIds.includes(adminCheck.currentUserId!)) {
      return { message: "Você não pode excluir seu próprio usuário." };
    }

    const adminClient = createAdminClient();

    const { data: memberships } = await adminClient
      .from("tenant_members")
      .select("user_id")
      .in("user_id", userIds);

    const { data: plans } = await adminClient
      .from("action_plans")
      .select("user_id")
      .in("user_id", userIds);

    const usersWithMemberships = new Set((memberships || []).map((m) => m.user_id));
    const usersWithPlans = new Set((plans || []).map((p) => p.user_id));

    const blockedUsers = userIds.filter(
      (id) => usersWithMemberships.has(id) || usersWithPlans.has(id)
    );

    if (blockedUsers.length > 0) {
      return {
        message: `${blockedUsers.length} usuário(s) possuem vínculos ativos (empresas ou planos). Remova os vínculos antes de excluir.`,
      };
    }

    const errors: string[] = [];

    for (const userId of userIds) {
      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) {
        errors.push(userId);
      } else {
        await auditLog(adminCheck.currentUserId!, userId, "bulk_delete_user", {});
      }
    }

    revalidatePath("/admin/users");
    revalidatePath("/", "layout");

    if (errors.length > 0) {
      return { success: true, message: `${userIds.length - errors.length} usuários excluídos. ${errors.length} falhas.` };
    }

    return { success: true, message: `${userIds.length} usuários excluídos com sucesso.` };
  } catch (error) {
    console.error("[bulkDeleteUsers] Erro:", error);
    return { message: "Serviço indisponível no momento." };
  }
}

export async function getUserImpact(userId: string) {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.USERS_READ);
    if (!hasPerm) return { tenantMemberships: 0, actionPlans: 0 };

    const adminClient = createAdminClient();

    const memResult = await adminClient
      .from("tenant_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const planResult = await adminClient
      .from("action_plans")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    return {
      tenantMemberships: (memResult as unknown as { count: number | null }).count ?? 0,
      actionPlans: (planResult as unknown as { count: number | null }).count ?? 0,
    };
  } catch {
    return { tenantMemberships: 0, actionPlans: 0 };
  }
}

export async function getCurrentUserPermissions(): Promise<{
  role: string;
  permissions: Record<string, boolean> | null;
  effectivePermissions: Record<string, boolean>;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { role: "user", permissions: null, effectivePermissions: {} };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, permissions")
      .eq("id", user.id)
      .maybeSingle() as { data: UserProfile | null; error: unknown };

    const role = profile?.role ?? "user";
    const perms = (profile?.permissions ?? null) as Record<string, boolean> | null;
    const effectivePermissions = getPermissionsMap(role, perms);

    return { role, permissions: perms, effectivePermissions };
  } catch {
    return { role: "user", permissions: null, effectivePermissions: {} };
  }
}

// --- Papéis Customizados (Roles) ---

export interface RoleRow {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, boolean>;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleFormState {
  message?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
}

export async function getRoles(): Promise<RoleRow[]> {
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("roles")
      .select("*")
      .order("name");
    return (data || []) as RoleRow[];
  } catch (error) { console.error("[getRoles] Error:", error); return []; }
}

export async function createRole(
  _prev: RoleFormState,
  formData: FormData
): Promise<RoleFormState> {
  try {
    const adminCheck = await requirePermission(PERMISSIONS.ROLES_MANAGE);
    if (!adminCheck.authorized) return adminCheck.error!;

    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || "";
    const permissionsJson = (formData.get("permissions") as string) || "{}";

    if (!name || name.length < 2 || name.length > 50) {
      return { message: "Nome deve ter entre 2 e 50 caracteres." };
    }

    let permissions: Record<string, boolean>;
    try {
      permissions = JSON.parse(permissionsJson);
      if (typeof permissions !== "object" || Array.isArray(permissions) || !permissions) {
        return { message: "Permissões inválidas." };
      }
    } catch {
      return { message: "Formato de permissões inválido." };
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient.from("roles").insert({
      name,
      description,
      permissions: permissions as unknown as Record<string, string | number | boolean>,
      is_system: false,
    });

    if (error) {
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        return { message: "Já existe um papel com este nome." };
      }
      return { message: "Erro ao criar papel." };
    }

    revalidatePath("/admin/roles");
    return { success: true, message: `Papel "${name}" criado!` };
  } catch (error) { console.error("[createRole] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function updateRole(
  _prev: RoleFormState,
  formData: FormData
): Promise<RoleFormState> {
  try {
    const adminCheck = await requirePermission(PERMISSIONS.ROLES_MANAGE);
    if (!adminCheck.authorized) return adminCheck.error!;

    const roleId = formData.get("roleId") as string;
    if (!roleId) return { message: "ID do papel obrigatório." };

    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || "";
    const permissionsJson = (formData.get("permissions") as string) || "{}";

    if (!name || name.length < 2 || name.length > 50) {
      return { message: "Nome deve ter entre 2 e 50 caracteres." };
    }

    let permissions: Record<string, boolean>;
    try {
      permissions = JSON.parse(permissionsJson);
      if (typeof permissions !== "object" || Array.isArray(permissions) || !permissions) {
        return { message: "Permissões inválidas." };
      }
    } catch {
      return { message: "Formato de permissões inválido." };
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient.from("roles").update({
      name,
      description,
      permissions: permissions as unknown as Record<string, string | number | boolean>,
      updated_at: new Date().toISOString(),
    }).eq("id", roleId);

    if (error) {
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        return { message: "Já existe um papel com este nome." };
      }
      return { message: "Erro ao atualizar papel." };
    }

    revalidatePath("/admin/roles");
    return { success: true, message: `Papel "${name}" atualizado!` };
  } catch (error) { console.error("[updateRole] Error:", error); return { message: "Serviço indisponível." }; }
}

// --- Áreas e Unidades por usuário ---

export interface AreaOption {
  id: string;
  name: string;
  tenant_id: string | null;
}

export interface UnitOption {
  id: string;
  name: string;
  uf: string;
  area_id: string | null;
  tenant_id: string | null;
}

export async function getAllAreas(): Promise<AreaOption[]> {
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("areas")
      .select("id, name, tenant_id, active")
      .eq("active", true)
      .order("name");
    return (data || []).map((a) => ({
      id: a.id,
      name: a.name,
      tenant_id: a.tenant_id,
    }));
  } catch {
    return [];
  }
}

export async function getAllUnits(): Promise<UnitOption[]> {
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("units")
      .select("id, name, uf, area_id, tenant_id, active")
      .eq("active", true)
      .order("name");
    return (data || []).map((u) => ({
      id: u.id,
      name: u.name,
      uf: u.uf,
      area_id: u.area_id,
      tenant_id: u.tenant_id,
    }));
  } catch {
    return [];
  }
}

export async function getUserAreaIds(userId: string): Promise<string[]> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.USERS_READ);
    if (!hasPerm) return [];
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("user_areas")
      .select("area_id")
      .eq("user_id", userId);
    return (data || []).map((r) => r.area_id);
  } catch {
    return [];
  }
}

export async function getUserUnitIds(userId: string): Promise<string[]> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.USERS_READ);
    if (!hasPerm) return [];
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("user_units")
      .select("unit_id")
      .eq("user_id", userId);
    return (data || []).map((r) => r.unit_id);
  } catch {
    return [];
  }
}

export async function deleteRole(
  _prev: RoleFormState,
  formData: FormData
): Promise<RoleFormState> {
  try {
    const adminCheck = await requirePermission(PERMISSIONS.ROLES_MANAGE);
    if (!adminCheck.authorized) return adminCheck.error!;

    const roleId = formData.get("roleId") as string;
    if (!roleId) return { message: "ID do papel obrigatório." };

    const adminClient = createAdminClient();

    const { data: role } = await adminClient.from("roles").select("name, is_system").eq("id", roleId).single();
    if (!role) return { message: "Papel não encontrado." };
    if (role.is_system) return { message: "Papéis do sistema não podem ser excluídos." };

    const { error } = await adminClient.from("roles").delete().eq("id", roleId);
    if (error) return { message: "Erro ao excluir papel." };

    revalidatePath("/admin/roles");
    return { success: true, message: `Papel "${role.name}" excluído!` };
  } catch (error) { console.error("[deleteRole] Error:", error); return { message: "Serviço indisponível." }; }
}
