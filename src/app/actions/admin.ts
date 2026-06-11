"use server";

import { revalidatePath } from "next/cache";
import { buildAuthEmail } from "@/lib/auth-email";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  createUserSchema,
  updateUserSchema,
  permissionsSchema,
  sanitizePermissions,
} from "@/lib/validations/admin";
import { PERMISSIONS, ALL_PERMISSIONS, hasPermission, getPermissionsMap, type Permission } from "@/lib/permissions";
import { getRequesterScope, manageableUserIds, type RequesterScope } from "@/app/actions/_helpers";
import { sanitizeText } from "@/lib/validation/sanitize";
import { generateSecurePassword } from "@/lib/security/password";
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

const BUILTIN_ROLES = new Set(["super_admin", "admin", "manager", "user", "viewer"]);

/**
 * Garante que o solicitante pode gerenciar o usuário alvo.
 * - super_admin: sempre pode.
 * - admin: o alvo precisa ser membro de uma das empresas do admin e NÃO pode
 *   ser super_admin (admins não veem nem gerenciam super_admins).
 * Retorna { denied, scope } — `denied` é o erro a devolver, ou null se ok.
 */
async function assertCanManageUser(
  targetUserId: string,
): Promise<{ denied: AdminFormState | null; scope: RequesterScope; targetRole: string | null }> {
  const scope = await getRequesterScope();
  if (scope.isSuperAdmin) return { denied: null, scope, targetRole: null };

  const adminClient = createAdminClient();
  const { data: target } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", targetUserId)
    .maybeSingle();
  if (!target) return { denied: { message: "Usuário não encontrado." }, scope, targetRole: null };
  const targetRole = target.role as string;
  if (targetRole === "super_admin") {
    return { denied: { message: "Acesso negado. Você não pode gerenciar um super admin." }, scope, targetRole };
  }
  const ids = await manageableUserIds(scope.tenantIds);
  if (!ids.has(targetUserId)) {
    return { denied: { message: "Acesso negado. Usuário fora das suas empresas." }, scope, targetRole };
  }
  return { denied: null, scope, targetRole };
}

/** Papéis que um não-super-admin pode ATRIBUIR a usuários (criar/editar). */
const ADMIN_ASSIGNABLE_ROLES = new Set(["manager", "user", "viewer"]);

/** Limita os tenantIds solicitados ao escopo do admin (super_admin: todos). */
function scopeTenantIds(requested: string[], scope: RequesterScope): string[] {
  if (scope.isSuperAdmin) return requested;
  const allowed = new Set(scope.tenantIds);
  return requested.filter((id) => allowed.has(id));
}

async function getValidRoleNames(): Promise<Set<string>> {
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient.from("roles").select("name");
    const names = new Set(BUILTIN_ROLES);
    for (const r of data || []) names.add(r.name);
    return names;
  } catch {
    return new Set(BUILTIN_ROLES);
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

type TenantRole = "owner" | "admin" | "member" | "manager" | "user" | "viewer";
const VALID_TENANT_ROLES = new Set<string>(["owner", "admin", "member", "manager", "user", "viewer"]);

function resolveTenantRole(raw: FormDataEntryValue | null): TenantRole {
  const str = typeof raw === "string" ? raw : "";
  return (VALID_TENANT_ROLES.has(str) ? str : "user") as TenantRole;
}

export async function createUser(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  try {
    const adminCheck = await requirePermission(PERMISSIONS.USERS_CREATE);
    if (!adminCheck.authorized) return adminCheck.error!;

    const passwordRaw = formData.get("password");
    const rawData = {
      email: formData.get("email"),
      name: formData.get("name"),
      role: formData.get("role"),
      password:
        typeof passwordRaw === "string" && passwordRaw.length > 0
          ? passwordRaw
          : undefined,
    };

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const tenantIds = (formData.getAll("tenantIds") as string[]).filter((id) => UUID_RE.test(id));

    const validated = createUserSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        errors: validated.error.flatten().fieldErrors,
        message: "Verifique os campos e tente novamente.",
      };
    }

    const validRoles = await getValidRoleNames();
    if (!validRoles.has(validated.data.role)) {
      return {
        errors: { role: ["Papel inválido."] },
        message: "Verifique o papel selecionado.",
      };
    }

    const scope = await getRequesterScope();
    // Não-super só atribui papéis subordinados (manager/user/viewer). Admin,
    // super_admin e papéis customizados (que podem ter qualquer permissão) são
    // restritos a super_admins.
    if (!scope.isSuperAdmin && !ADMIN_ASSIGNABLE_ROLES.has(validated.data.role)) {
      return {
        errors: { role: ["Você só pode atribuir os papéis Gerente, Usuário ou Visualizador."] },
        message: "Papéis Admin, Super Admin e customizados são restritos a super admins.",
      };
    }
    // Admin só associa o novo usuário às empresas das quais ele é membro.
    const scopedTenantIds = scopeTenantIds(tenantIds, scope);

    // Admin que pertence a pelo menos uma empresa deve sempre associar o novo
    // usuário a ao menos uma delas — caso contrário o usuário nasce órfão.
    if (!scope.isSuperAdmin && scope.tenantIds.length > 0 && scopedTenantIds.length === 0) {
      return {
        message: "Selecione ao menos uma empresa para associar ao novo usuário.",
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
      // Profile + tenant_members + user_areas + user_units num único transaction
      // PostgreSQL. Se qualquer passo falhar, tudo é revertido pelo banco.
      const newAreaIds = (formData.getAll("areaIds") as string[]).filter((id) => UUID_RE.test(id));
      const newUnitIds = (formData.getAll("unitIds") as string[]).filter((id) => UUID_RE.test(id));

      const { error: setupErr } = await adminClient.rpc("setup_new_user", {
        p_user_id: data.user.id,
        p_name: validated.data.name,
        p_role: validated.data.role,
        p_active_tenant_id: scopedTenantIds[0] ?? null,
        p_tenant_members: scopedTenantIds.map((tenantId) => ({
          tenant_id: tenantId,
          role: resolveTenantRole(formData.get(`tenantRole-${tenantId}`)),
        })),
        p_area_ids: newAreaIds,
        p_unit_ids: newUnitIds,
      });

      if (setupErr) {
        console.error("[createUser] Erro no setup atômico:", setupErr.message);
        const { error: delErr } = await adminClient.auth.admin.deleteUser(data.user.id);
        if (delErr) console.error("[createUser] Falha ao remover auth user no rollback:", delErr.message);
        return { message: "Erro ao configurar o usuário. O cadastro foi cancelado. Tente novamente." };
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
      ? "Usuário criado. Senha temporária exibida acima — copie e envie por canal seguro."
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

    // Admin só gerencia usuários das suas empresas e nunca super_admins.
    const { denied, scope, targetRole } = await assertCanManageUser(userId);
    if (denied) return denied;

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

    const validRoles = await getValidRoleNames();
    if (!validRoles.has(validated.data.role)) {
      return {
        errors: { role: ["Papel inválido."] },
        message: "Verifique o papel selecionado.",
      };
    }

    if (adminCheck.currentUserId === userId && validated.data.role !== adminCheck.profile?.role) {
      return { message: "Você não pode alterar seu próprio papel." };
    }

    // Não-super só atribui manager/user/viewer; pode MANTER o papel atual do
    // alvo (não força rebaixar um admin já existente), mas não promove a
    // admin/super_admin/customizado.
    if (
      !scope.isSuperAdmin &&
      !ADMIN_ASSIGNABLE_ROLES.has(validated.data.role) &&
      validated.data.role !== targetRole
    ) {
      return {
        errors: { role: ["Você só pode atribuir os papéis Gerente, Usuário ou Visualizador."] },
        message: "Papéis Admin, Super Admin e customizados são restritos a super admins.",
      };
    }

    const isActive = formData.get("is_active") === "true";
    const UUID_RE_UPD = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const tenantIdsRaw = formData.getAll("tenantIds") as string[];
    const tenantIds = Array.from(new Set(tenantIdsRaw.filter((id) => UUID_RE_UPD.test(id))));
    const tenantsTouched = formData.has("tenantIds") || formData.has("tenantsTouched");

    let parsedPermissions: Record<string, boolean> | null = null;
    if (rawData.permissions) {
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawData.permissions);
      } catch {
        return { message: "Estrutura de permissões inválida." };
      }
      const permsResult = permissionsSchema.safeParse(parsedJson);
      if (!permsResult.success) {
        return { message: "Estrutura de permissões inválida." };
      }
      parsedPermissions = sanitizePermissions(permsResult.data, ALL_PERMISSIONS);
    }

    // Validação cruzada: ambos ou nenhum
    const hasStart = Boolean(validated.data.login_start_time);
    const hasEnd   = Boolean(validated.data.login_end_time);
    if (hasStart !== hasEnd) {
      return { message: "Defina os dois horários de acesso ou deixe ambos em branco." };
    }
    if (hasStart && hasEnd && validated.data.login_start_time! >= validated.data.login_end_time!) {
      return {
        errors: { login_end_time: ["Horário de fim deve ser posterior ao horário de início."] },
        message: "Verifique os horários de acesso.",
      };
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

    if (tenantsTouched) {
      const { data: existing } = await adminClient
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", userId);

      const existingIds = new Set((existing || []).map((m) => m.tenant_id));
      // Admin só reconcilia empresas do próprio escopo; vínculos fora do
      // escopo (ex.: outras empresas onde o usuário é membro) são preservados.
      const inScope = (id: string) => scope.isSuperAdmin || scope.tenantIds.includes(id);
      const newIds = new Set(scopeTenantIds(tenantIds, scope));
      const existingInScope = [...existingIds].filter(inScope);

      const toRemove = existingInScope.filter((id) => !newIds.has(id));
      const toAdd = [...newIds].filter((id) => !existingIds.has(id));
      const toKeep = existingInScope.filter((id) => newIds.has(id));

      if (toRemove.length > 0) {
        await adminClient.from("tenant_members").delete()
          .eq("user_id", userId)
          .in("tenant_id", toRemove);
      }

      // toKeep (atualizar papel) + toAdd (inserir) resolvidos em um único upsert.
      const toUpsert = [...toKeep, ...toAdd].map((tenantId) => ({
        user_id: userId,
        tenant_id: tenantId,
        role: resolveTenantRole(formData.get(`tenantRole-${tenantId}`)),
      }));
      if (toUpsert.length > 0) {
        const { error: upsertErr } = await adminClient.from("tenant_members").upsert(toUpsert, { onConflict: "user_id,tenant_id" });
        if (upsertErr) {
          console.error("[updateUser] Erro ao atualizar memberships:", upsertErr.message);
          return { message: "Erro ao atualizar empresas do usuário. Tente novamente." };
        }
      }
    }

    // Áreas (escopo por usuário) — substitui o conjunto inteiro só se a seção foi renderizada
    if (formData.has("areasTouched") || formData.has("areaIds")) {
      const areaIds = Array.from(
        new Set((formData.getAll("areaIds") as string[]).filter(Boolean))
      );
      const { error: delAreaErr } = await adminClient.from("user_areas").delete().eq("user_id", userId);
      if (delAreaErr) {
        console.error("[updateUser] Erro ao remover áreas:", delAreaErr.message);
        return { message: "Erro ao atualizar áreas do usuário. Tente novamente." };
      }
      if (areaIds.length > 0) {
        const { error: insAreaErr } = await adminClient.from("user_areas").insert(
          areaIds.map((areaId) => ({ user_id: userId, area_id: areaId }))
        );
        if (insAreaErr) {
          console.error("[updateUser] Erro ao inserir áreas:", insAreaErr.message);
          return { message: "Erro ao atualizar áreas do usuário. Tente novamente." };
        }
      }
    }

    // Unidades (escopo por usuário) — substitui o conjunto inteiro só se a seção foi renderizada
    if (formData.has("unitsTouched") || formData.has("unitIds")) {
      const unitIds = Array.from(
        new Set((formData.getAll("unitIds") as string[]).filter(Boolean))
      );
      const { error: delUnitErr } = await adminClient.from("user_units").delete().eq("user_id", userId);
      if (delUnitErr) {
        console.error("[updateUser] Erro ao remover unidades:", delUnitErr.message);
        return { message: "Erro ao atualizar unidades do usuário. Tente novamente." };
      }
      if (unitIds.length > 0) {
        const { error: insUnitErr } = await adminClient.from("user_units").insert(
          unitIds.map((unitId) => ({ user_id: userId, unit_id: unitId }))
        );
        if (insUnitErr) {
          console.error("[updateUser] Erro ao inserir unidades:", insUnitErr.message);
          return { message: "Erro ao atualizar unidades do usuário. Tente novamente." };
        }
      }
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

    const { denied } = await assertCanManageUser(userId);
    if (denied) return denied;

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

    const { error } = await adminClient.auth.admin.deleteUser(userId);

    if (error) {
      return { message: mapError(error.message) };
    }

    // Audit log escrito APÓS confirmação do delete
    await auditLog(adminCheck.currentUserId!, userId, "delete_user", {});

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

    const { denied } = await assertCanManageUser(userId);
    if (denied) return denied;

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
            // apikey + Authorization cobre tanto a service_role legada (JWT)
            // quanto a nova secret key (sb_secret_*), que o gateway valida
            // pelo header apikey.
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
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

    const { denied } = await assertCanManageUser(userId);
    if (denied) return denied;

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

    // Admin só reenvia para usuários das suas empresas (e nunca super_admins).
    const scope = await getRequesterScope();
    if (!scope.isSuperAdmin) {
      const lookupClient = createAdminClient();
      const { data: target } = await lookupClient
        .from("profiles")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();
      if (!target) return { message: "Usuário não encontrado." };
      const { denied } = await assertCanManageUser(target.id as string);
      if (denied) return denied;
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      },
    });

    if (error || !data.properties?.action_link) {
      return { message: mapError(error?.message ?? "Falha ao gerar link de acesso.") };
    }

    const emailContent = buildAuthEmail("magic_link", data.properties.action_link, email);
    const sent = await sendEmail(email, emailContent.subject, emailContent.html);

    if (!sent) {
      return { message: "Erro ao enviar email de acesso. Tente novamente." };
    }

    return { success: true, message: "Link de acesso enviado para o email do usuário." };
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

    // Admin só pode excluir em lote usuários das suas empresas (nunca super_admins).
    const scope = await getRequesterScope();
    if (!scope.isSuperAdmin) {
      const lookupClient = createAdminClient();
      const { data: targets } = await lookupClient
        .from("profiles")
        .select("id, role")
        .in("id", userIds);
      const manageable = await manageableUserIds(scope.tenantIds);
      const blocked = userIds.filter((id) => {
        const t = (targets ?? []).find((x) => x.id === id);
        return !t || (t.role as string) === "super_admin" || !manageable.has(id);
      });
      if (blocked.length > 0) {
        return {
          message: "Acesso negado. Alguns usuários estão fora das suas empresas ou são super admins.",
        };
      }
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

    const blockedIds = userIds.filter(
      (id) => usersWithMemberships.has(id) || usersWithPlans.has(id)
    );
    const deletableIds = userIds.filter((id) => !blockedIds.includes(id));

    if (deletableIds.length === 0) {
      return {
        message: `Nenhum usuário pode ser excluído: todos possuem vínculos ativos (empresas ou planos). Remova os vínculos antes de excluir.`,
      };
    }

    const errors: string[] = [];

    // Deleta em paralelo os usuários sem vínculos
    await Promise.all(
      deletableIds.map(async (userId) => {
        const { error } = await adminClient.auth.admin.deleteUser(userId);
        if (error) {
          errors.push(userId);
        } else {
          await auditLog(adminCheck.currentUserId!, userId, "bulk_delete_user", {});
        }
      })
    );

    revalidatePath("/admin/users");
    revalidatePath("/", "layout");

    const deleted = deletableIds.length - errors.length;
    const parts: string[] = [];
    if (deleted > 0) parts.push(`${deleted} usuário${deleted !== 1 ? "s" : ""} excluído${deleted !== 1 ? "s" : ""}`);
    if (errors.length > 0) parts.push(`${errors.length} falha${errors.length !== 1 ? "s" : ""}`);
    if (blockedIds.length > 0) parts.push(`${blockedIds.length} ignorado${blockedIds.length !== 1 ? "s" : ""} (com vínculos)`);

    return { success: true, message: parts.join(" · ") + "." };
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

    // Papéis customizados podem carregar qualquer permissão; gerenciá-los é
    // restrito a super_admins (senão um admin escaparia do escopo via papel).
    const roleScope = await getRequesterScope();
    if (!roleScope.isSuperAdmin) {
      return { message: "Apenas super admins podem gerenciar papéis." };
    }

    const name = sanitizeText(formData.get("name")).slice(0, 50);
    const description = sanitizeText(formData.get("description")).slice(0, 500);
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

    // Papéis customizados podem carregar qualquer permissão; gerenciá-los é
    // restrito a super_admins (senão um admin escaparia do escopo via papel).
    const roleScope = await getRequesterScope();
    if (!roleScope.isSuperAdmin) {
      return { message: "Apenas super admins podem gerenciar papéis." };
    }

    const roleId = formData.get("roleId") as string;
    if (!roleId) return { message: "ID do papel obrigatório." };

    const name = sanitizeText(formData.get("name")).slice(0, 50);
    const description = sanitizeText(formData.get("description")).slice(0, 500);
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
      .order("name")
      .limit(500);
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
      .order("name")
      .limit(500);
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

    // Papéis customizados podem carregar qualquer permissão; gerenciá-los é
    // restrito a super_admins (senão um admin escaparia do escopo via papel).
    const roleScope = await getRequesterScope();
    if (!roleScope.isSuperAdmin) {
      return { message: "Apenas super admins podem gerenciar papéis." };
    }

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

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_name: string | undefined;
  admin_email: string | undefined;
  target_user_id: string;
  action: string;
  snapshot: Record<string, unknown> | null;
  created_at: string;
}

export async function getUserAuditLog(userId: string): Promise<AuditLogEntry[]> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.USERS_READ);
    if (!hasPerm) return [];

    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("admin_audit_log")
      .select("id, admin_id, target_user_id, action, snapshot, created_at")
      .eq("target_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!data) return [];

    const adminIds = [...new Set(data.map((e) => e.admin_id))];
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, name, email")
      .in("id", adminIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    return data.map((entry) => ({
      ...entry,
      snapshot: entry.snapshot as Record<string, unknown> | null,
      admin_name: profileMap.get(entry.admin_id)?.name,
      admin_email: profileMap.get(entry.admin_id)?.email,
    })) as AuditLogEntry[];
  } catch {
    return [];
  }
}
