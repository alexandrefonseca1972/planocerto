"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidUrl } from "@/lib/sanitize";
import { createTenantSchema } from "@/lib/validations/tenant";
import { checkIsAdmin } from "@/app/actions/admin";
import type { TenantFormState } from "@/types/tenant";
import type { Tenant, TenantMemberWithProfile } from "@/types/tenant";

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

    const { data: member } = await supabase
      .from("tenant_members")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member) return false;

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
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { message: "Acesso negado." };

    const rawData = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      plan: formData.get("plan"),
    };

    const validated = createTenantSchema.safeParse(rawData);
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
    const { data: tenant, error } = await adminClient
      .from("tenants")
      .insert({
        name: validated.data.name,
        slug: validated.data.slug,
        plan: validated.data.plan,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes("duplicate")) {
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
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { message: "Acesso negado." };

    const tenantId = formData.get("tenantId") as string;
    if (!tenantId) return { message: "ID da empresa obrigatório." };

    const rawData = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      plan: formData.get("plan"),
    };

    const validated = createTenantSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        errors: validated.error.flatten().fieldErrors,
        message: "Verifique os campos.",
      };
    }

    const webhookUrl = (formData.get("teams_webhook_url") as string)?.trim() || "";
    if (webhookUrl && !isValidUrl(webhookUrl, ["webhook.office.com", "office.com"])) {
      return { message: "URL de webhook inválida. Deve ser HTTPS e do Microsoft Teams." };
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("tenants")
      .update({
        name: validated.data.name,
        slug: validated.data.slug,
        plan: validated.data.plan,
        teams_webhook_url: webhookUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantId);

    if (error) return { message: "Erro ao atualizar empresa." };

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
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { message: "Acesso negado." };

    const memberId = formData.get("memberId") as string;
    if (!memberId) return { message: "ID do membro obrigatório." };

    const adminClient = createAdminClient();

    // Prevent removing the last owner
    const { data: target } = await adminClient.from("tenant_members").select("tenant_id,role").eq("id", memberId).maybeSingle();
    if (target?.role === "owner") {
      const { data: owners } = await adminClient.from("tenant_members").select("id").eq("tenant_id", target.tenant_id).eq("role", "owner");
      if ((owners || []).length <= 1) {
        return { message: "Não é possível remover o último proprietário da empresa." };
      }
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
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { message: "Acesso negado." };

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
    if (target?.role === "owner" && role !== "owner") {
      const { data: owners } = await adminClient.from("tenant_members").select("id").eq("tenant_id", target.tenant_id).eq("role", "owner");
      if ((owners || []).length <= 1) {
        return { message: "Não é possível remover o último proprietário da empresa." };
      }
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
    const { data } = await adminClient
      .from("tenants")
      .select("*")
      .order("name");
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

export async function setUserTenants(
  _prevState: TenantFormState,
  formData: FormData
): Promise<TenantFormState> {
  try {
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { message: "Acesso negado." };

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
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { message: "Acesso negado." };
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
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) return { message: "Acesso negado." };
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
