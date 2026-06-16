"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidUrl } from "@/lib/sanitize";
import { tenantFormSchema } from "@/lib/schemas/tenant-schemas";
import { normalizeWebsite } from "@/lib/format-br";
import { checkPermission } from "@/app/actions/admin";
import { getRequesterScope, tenantsWithSingleOwner } from "@/app/actions/_helpers";
import { PERMISSIONS } from "@/lib/permissions";
import type { TenantFormState } from "@/types/tenant";
import type { Tenant, TenantMemberWithProfile } from "@/types/tenant";

function readTenantForm(formData: FormData) {
  return {
    name: String(formData.get("name") || ""),
    plan: String(formData.get("plan") || "free"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
    max_units: formData.get("max_units"),
    teams_webhook_url: String(formData.get("teams_webhook_url") || ""),
    cnpj: String(formData.get("cnpj") || ""),
    responsavel_nome: String(formData.get("responsavel_nome") || ""),
    email: String(formData.get("email") || ""),
    site: String(formData.get("site") || ""),
    fone: String(formData.get("fone") || ""),
  };
}

/** Converte um nome em slug (a-z, 0-9, hífens), limitado para caber no sufixo. */
function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/**
 * Gera um slug único a partir do nome. Como `tenants.slug` é único globalmente,
 * a checagem usa o admin client (enxerga todos os tenants) e anexa `-2`, `-3`…
 * em caso de colisão — evitando o erro de duplicidade para o usuário.
 */
async function uniqueSlug(
  adminClient: ReturnType<typeof createAdminClient>,
  name: string,
): Promise<string> {
  const root = slugify(name) || "empresa";
  // `.like` (método dedicado) usa `%` como curinga; pega tudo que começa com a
  // raiz (superconjunto seguro — só precisamos conhecer os slugs em colisão).
  const { data } = await adminClient
    .from("tenants")
    .select("slug")
    .like("slug", `${root}%`);
  const taken = new Set((data ?? []).map((t) => t.slug));
  if (!taken.has(root)) return root;
  let i = 2;
  while (taken.has(`${root}-${i}`)) i++;
  return `${root}-${i}`;
}

export async function getUserTenants(): Promise<Tenant[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    // RLS policies handle filtering:
    // - "Members can read own tenants" filters to user's tenant_members
    // - "Admins can read all tenants" via is_admin() SECURITY DEFINER
    const { data: tenants } = await supabase
      .from("tenants")
      .select("*")
      .order("name");

    return (tenants || []) as Tenant[];
  } catch (error) { console.error("[getUserTenants] Error:", error); return []; }
}

export async function getCurrentTenant(): Promise<Tenant | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.active_tenant_id) {
      const [{ data: member }, { data: tenant }] = await Promise.all([
        supabase
          .from("tenant_members")
          .select("tenant_id")
          .eq("tenant_id", profile.active_tenant_id)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("tenants")
          .select("*")
          .eq("id", profile.active_tenant_id)
          .single(),
      ]);

      if (member && tenant) return tenant as Tenant;
    }

    const tenants = await getUserTenants();
    return tenants[0] || null;
  } catch (error) { console.error("[getCurrentTenant] Error:", error); return null; }
}

export async function switchTenant(tenantId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    // super_admin enxerga e opera qualquer empresa (mesma premissa de
    // getUserTenants/getAllTenants). Demais usuários só podem ativar empresas
    // das quais são membros.
    const scope = await getRequesterScope();
    if (!scope.isSuperAdmin) {
      const { data: member } = await supabase
        .from("tenant_members")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!member) return false;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ active_tenant_id: tenantId })
      .eq("id", user.id);
    if (error) return false;

    revalidatePath("/dashboard");
    revalidatePath("/planos");
    revalidatePath("/calendario");
    return true;
  } catch (error) { console.error("[switchTenant] Error:", error); return false; }
}

export async function createTenant(
  _prevState: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.TENANTS_CREATE);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };

    // Apenas super_admin cria empresas (admin tem ALL_PERMISSIONS, então o
    // gate é o escopo, não a permissão).
    const scope = await getRequesterScope();
    if (!scope.isSuperAdmin) {
      return { message: "Apenas super admins podem criar empresas." };
    }

    const validated = tenantFormSchema.safeParse(readTenantForm(formData));
    if (!validated.success) {
      return {
        errors: validated.error.flatten().fieldErrors,
        message: "Verifique os campos e tente novamente.",
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const adminClient = createAdminClient();
    const slug = await uniqueSlug(adminClient, validated.data.name);
    const { data: tenant, error } = await adminClient
      .from("tenants")
      .insert({
        name: validated.data.name,
        slug,
        plan: validated.data.plan,
        active: validated.data.active,
        teams_webhook_url: validated.data.teams_webhook_url,
        cnpj: validated.data.cnpj,
        responsavel_nome: validated.data.responsavel_nome,
        email: validated.data.email,
        site: validated.data.site ? normalizeWebsite(validated.data.site) : "",
        fone: validated.data.fone,
        max_units: validated.data.max_units,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        if (error.message.includes("cnpj"))
          return { message: "Este CNPJ já está cadastrado em outra empresa." };
        return { message: "Este slug já está em uso. Escolha outro." };
      }
      return { message: "Erro ao criar empresa." };
    }

    if (user && tenant) {
      await adminClient.from("tenant_members").insert({
        tenant_id: tenant.id,
        user_id: user.id,
        role: "owner",
      });
    }

    revalidatePath("/admin/tenants");
    revalidatePath("/", "layout");
    return { success: true, message: `Empresa "${tenant.name}" criada com sucesso!` };
  } catch (error) { console.error("[createTenant] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function updateTenant(
  _prevState: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.TENANTS_UPDATE);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };

    // Configurações da empresa (incl. limite de unidades) são exclusivas do super_admin.
    const scope = await getRequesterScope();
    if (!scope.isSuperAdmin) {
      return { message: "Apenas super admins podem editar empresas." };
    }

    const tenantId = formData.get("tenantId") as string;
    if (!tenantId) return { message: "ID da empresa obrigatório." };

    const validated = tenantFormSchema.safeParse(readTenantForm(formData));
    if (!validated.success) {
      return {
        errors: validated.error.flatten().fieldErrors,
        message: "Verifique os campos.",
      };
    }

    const webhookUrl = validated.data.teams_webhook_url;
    if (webhookUrl && !isValidUrl(webhookUrl, ["webhook.office.com", "office.com"])) {
      return { message: "URL de webhook inválida. Deve ser HTTPS e do Microsoft Teams." };
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("tenants")
      .update({
        // slug é imutável após a criação (mantém URLs estáveis).
        name: validated.data.name,
        plan: validated.data.plan,
        active: validated.data.active,
        teams_webhook_url: webhookUrl,
        cnpj: validated.data.cnpj,
        responsavel_nome: validated.data.responsavel_nome,
        email: validated.data.email,
        site: validated.data.site ? normalizeWebsite(validated.data.site) : "",
        fone: validated.data.fone,
        max_units: validated.data.max_units,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantId);

    if (error) {
      if (error.code === "23505" && error.message.includes("cnpj")) {
        return { message: "Este CNPJ já está cadastrado em outra empresa." };
      }
      return { message: "Erro ao atualizar empresa." };
    }

    revalidatePath("/admin/tenants");
    revalidatePath("/", "layout");
    return { success: true, message: "Empresa atualizada!" };
  } catch (error) { console.error("[updateTenant] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function removeTenantMember(
  _prevState: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.TENANTS_MANAGE_MEMBERS);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };

    const memberId = formData.get("memberId") as string;
    if (!memberId) return { message: "ID do membro obrigatório." };

    const adminClient = createAdminClient();

    // Prevent removing the last owner
    const { data: target } = await adminClient.from("tenant_members").select("tenant_id,role").eq("id", memberId).maybeSingle();
    if (target?.role === "owner" && (await tenantsWithSingleOwner([target.tenant_id])).length > 0) {
      return { message: "Não é possível remover o último proprietário da empresa." };
    }

    const { error } = await adminClient
      .from("tenant_members")
      .delete()
      .eq("id", memberId);

    if (error) return { message: "Erro ao remover membro." };

    revalidatePath("/admin/tenants");
    revalidatePath("/", "layout");
    return { success: true, message: "Membro removido!" };
  } catch (error) { console.error("[removeTenantMember] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function updateTenantMemberRole(
  _prevState: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.TENANTS_MANAGE_MEMBERS);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };

    const memberId = formData.get("memberId") as string;
    const role = formData.get("role") as string;

    if (!memberId || !role) {
      return { message: "ID do membro e papel são obrigatórios." };
    }

    if (!["owner", "admin", "member"].includes(role)) {
      return { message: "Papel inválido." };
    }

    const adminClient = createAdminClient();

    // Prevent demoting the last owner
    const { data: target } = await adminClient.from("tenant_members").select("tenant_id,role").eq("id", memberId).maybeSingle();
    if (target?.role === "owner" && role !== "owner" && (await tenantsWithSingleOwner([target.tenant_id])).length > 0) {
      return { message: "Não é possível remover o último proprietário da empresa." };
    }

    const { error } = await adminClient
      .from("tenant_members")
      .update({ role: role as "owner" | "admin" | "member" })
      .eq("id", memberId);

    if (error) return { message: "Erro ao alterar papel." };

    revalidatePath("/admin/tenants");
    revalidatePath("/", "layout");
    return { success: true, message: "Papel atualizado!" };
  } catch (error) { console.error("[updateTenantMemberRole] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function getAllTenants(): Promise<Tenant[]> {
  try {
    const adminClient = createAdminClient();
    // super_admin vê todas; admin vê só as empresas das quais é membro.
    const scope = await getRequesterScope();
    let query = adminClient.from("tenants").select("*").order("name");
    if (!scope.isSuperAdmin) {
      if (scope.tenantIds.length === 0) return [];
      query = query.in("id", scope.tenantIds);
    }
    const { data } = await query;
    return (data || []) as Tenant[];
  } catch (error) { console.error("[getAllTenants] Error:", error); return []; }
}

export async function getUserTenantIds(userId: string): Promise<string[]> {
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", userId);

    if (!data) return [];
    return data.map((m) => m.tenant_id);
  } catch (error) { console.error("[getUserTenantIds] Error:", error); return []; }
}

export interface TenantMembership {
  tenantId: string;
  role: string;
}

// Papel de membership exibido = o próprio valor armazenado (owner/admin/member).
function normalizeTenantRole(role: string | null): string {
  if (role === "owner" || role === "admin") return role;
  return "member";
}

export async function getUserTenantMemberships(userId: string): Promise<TenantMembership[]> {
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("tenant_members")
      .select("tenant_id, role")
      .eq("user_id", userId);
    if (!data) return [];
    return data.map((m) => ({ tenantId: m.tenant_id, role: normalizeTenantRole(m.role) }));
  } catch (error) { console.error("[getUserTenantMemberships] Error:", error); return []; }
}

export async function getBulkUserTenantIds(userIds: string[]): Promise<Map<string, string[]>> {
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("tenant_members")
      .select("user_id, tenant_id")
      .in("user_id", userIds);

    const map = new Map<string, string[]>();
    for (const row of data || []) {
      if (!map.has(row.user_id)) map.set(row.user_id, []);
      map.get(row.user_id)!.push(row.tenant_id);
    }
    for (const uid of userIds) {
      if (!map.has(uid)) map.set(uid, []);
    }
    return map;
  } catch (error) { console.error("[getBulkUserTenantIds] Error:", error); return new Map(); }
}

export async function setUserTenants(
  _prevState: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.USERS_MANAGE_TENANTS);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };

    const userId = formData.get("userId") as string;
    if (!userId) return { message: "ID do usuário obrigatório." };

    const tenantIds = formData.getAll("tenantIds") as string[];

    const adminClient = createAdminClient();

    const { data: existing } = await adminClient
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", userId);

    const existingIds = new Set((existing || []).map((m) => m.tenant_id));
    const newIds = new Set(tenantIds);

    const toRemove = [...existingIds].filter((id) => !newIds.has(id));
    const toAdd = [...newIds].filter((id) => !existingIds.has(id));

    if (toRemove.length > 0) {
      await adminClient.from("tenant_members").delete().eq("user_id", userId).in("tenant_id", toRemove);
    }

    if (toAdd.length > 0) {
      await adminClient.from("tenant_members").insert(
        toAdd.map((tenantId) => ({ user_id: userId, tenant_id: tenantId, role: "member" as const }))
      );
    }

    revalidatePath("/admin/users");
    revalidatePath("/", "layout");
    return { success: true, message: "Empresas associadas com sucesso!" };
  } catch (error) { console.error("[setUserTenants] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function deleteTenant(
  _prevState: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.TENANTS_DELETE);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };
    const tenantId = formData.get("tenantId") as string;
    if (!tenantId) return { message: "ID da empresa obrigatório." };
    const adminClient = createAdminClient();
    const { error } = await adminClient.from("tenants").delete().eq("id", tenantId);
    if (error) return { message: "Erro ao excluir empresa." };
    revalidatePath("/admin/tenants");
    revalidatePath("/", "layout");
    return { success: true, message: "Empresa excluída!" };
  } catch (error) { console.error("[deleteTenant] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function addTenantMember(
  _prevState: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  try {
    const hasPerm = await checkPermission(PERMISSIONS.TENANTS_MANAGE_MEMBERS);
    if (!hasPerm) return { message: "Acesso negado. Permissão insuficiente." };
    const tenantId = formData.get("tenantId") as string;
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    if (!tenantId || !email) return { message: "ID da empresa e email são obrigatórios." };
    const adminClient = createAdminClient();
    const { data: profiles } = await adminClient.from("profiles").select("id, name").eq("email", email);
    if (!profiles?.length) return { message: "Usuário não encontrado." };
    if (profiles.length > 1) return { message: "Múltiplos usuários com este email. Contate o suporte." };
    const userName = profiles[0].name || email;
    const { error } = await adminClient.from("tenant_members").insert({ tenant_id: tenantId, user_id: profiles[0].id, role: "member" });
    if (error) {
      if (error.message.includes("duplicate")) return { message: "Usuário já é membro." };
      return { message: "Erro ao adicionar." };
    }
    revalidatePath("/admin/tenants");
    revalidatePath("/", "layout");
    return { success: true, message: `${userName} adicionado!` };
  } catch (error) { console.error("[addTenantMember] Error:", error); return { message: "Serviço indisponível." }; }
}

export async function getTenantMembers(tenantId: string): Promise<TenantMemberWithProfile[]> {
  try {
    const adminClient = createAdminClient();
    const { data: members } = await adminClient.from("tenant_members").select("id, tenant_id, user_id, role, created_at").eq("tenant_id", tenantId).order("created_at");
    if (!members?.length) return [];
    const userIds = members.map(m => m.user_id);
    const { data: profiles } = await adminClient.from("profiles").select("id, name, email").in("id", userIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    return members.map(m => ({ ...m, profiles: profileMap.get(m.user_id) || null })) as TenantMemberWithProfile[];
  } catch (error) { console.error("[getTenantMembers] Error:", error); return []; }
}
