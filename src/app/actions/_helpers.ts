// Utilitários server-side compartilhados pelas server actions.
// NÃO leva "use server": exporta helpers síncronos (extractFormFields) e é
// consumido apenas por outros módulos de servidor — não é superfície de action.
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

const log = logger.child({ component: "actions:helpers" });

export interface RequesterScope {
  userId: string;
  /** super_admin enxerga e gerencia tudo. */
  isSuperAdmin: boolean;
  /** Empresas (tenant_members) do solicitante — escopo de um admin. */
  tenantIds: string[];
}

/**
 * Escopo do solicitante autenticado para gestão de usuários/empresas:
 * id, se é super_admin e as empresas a que pertence (tenant_members).
 */
export async function getRequesterScope(): Promise<RequesterScope> {
  const empty: RequesterScope = { userId: "", isSuperAdmin: false, tenantIds: [] };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return empty;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const adminClient = createAdminClient();
    const { data: mems } = await adminClient
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", user.id);
    return {
      userId: user.id,
      isSuperAdmin: (profile?.role as string | undefined) === "super_admin",
      tenantIds: Array.from(new Set((mems ?? []).map((m) => m.tenant_id as string))),
    };
  } catch (error) {
    log.error({ error }, "Erro ao obter escopo do solicitante");
    return empty;
  }
}

/**
 * Conjunto de user_ids que um admin pode gerenciar: os membros das empresas
 * informadas (tenant_members). Vazio se não houver empresas no escopo.
 */
export async function manageableUserIds(tenantIds: string[]): Promise<Set<string>> {
  if (tenantIds.length === 0) return new Set();
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("tenant_members")
      .select("user_id")
      .in("tenant_id", tenantIds);
    return new Set((data ?? []).map((m) => m.user_id as string));
  } catch {
    return new Set();
  }
}

/**
 * Garante que profiles.active_tenant_id do usuário aponta para uma empresa da
 * qual ele é membro. Se estiver nulo ou órfão (empresa não é mais membership),
 * repointa para a primeira membership (ou nulo, se não houver nenhuma).
 */
export async function repointActiveTenant(userId: string): Promise<void> {
  try {
    const adminClient = createAdminClient();
    const { data: prof } = await adminClient
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", userId)
      .maybeSingle();
    const activeId = (prof?.active_tenant_id as string | null) ?? null;
    const { data: mems } = await adminClient
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", userId);
    const memberIds = (mems ?? []).map((m) => m.tenant_id as string);
    if (!activeId || !memberIds.includes(activeId)) {
      await adminClient
        .from("profiles")
        .update({ active_tenant_id: memberIds[0] ?? null })
        .eq("id", userId);
    }
  } catch (error) {
    log.error({ error }, "Erro ao repontar active_tenant_id");
  }
}

/**
 * Dentre os tenantIds informados, retorna aqueles que têm no máximo 1
 * proprietário (owner). Usado para impedir a remoção/rebaixamento do último
 * owner de uma empresa. Em caso de erro, é conservador e retorna todos
 * (bloqueia a operação).
 */
export async function tenantsWithSingleOwner(tenantIds: string[]): Promise<string[]> {
  if (tenantIds.length === 0) return [];
  try {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("tenant_members")
      .select("tenant_id")
      .in("tenant_id", tenantIds)
      .eq("role", "owner");
    const count = new Map<string, number>();
    for (const o of data ?? []) {
      const tid = o.tenant_id as string;
      count.set(tid, (count.get(tid) ?? 0) + 1);
    }
    return tenantIds.filter((t) => (count.get(t) ?? 0) <= 1);
  } catch (error) {
    log.error({ error }, "Erro ao contar owners");
    return tenantIds;
  }
}

/**
 * Papel efetivo de um usuário — global (profiles.role) ou, se `tenantId`
 * informado, o papel específico atribuído para aquela empresa em
 * tenant_member_roles (fallback para o global se não houver linha).
 * `permissions` (overrides) continua sempre global, fora do escopo do
 * papel por-empresa.
 */
export async function getEffectiveRole(
  userId: string,
  tenantId: string | null,
): Promise<{ role: string; permissions: Record<string, boolean> | null }> {
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, permissions")
    .eq("id", userId)
    .maybeSingle();

  // Sem perfil (conta apagada/race de signup), nega por padrão: "" não bate
  // com nenhum builtin nem papel customizado, então hasPermission() resolve
  // para nenhuma permissão — mesmo comportamento fail-closed do caminho sem
  // tenantId em checkPermission (que retorna false quando !profile).
  const globalRole = (profile?.role as string | undefined) ?? "";
  const permissions = (profile?.permissions as Record<string, boolean> | null) ?? null;

  if (!tenantId) return { role: globalRole, permissions };

  const { data: tenantRole } = await adminClient
    .from("tenant_member_roles")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();

  return { role: (tenantRole?.role as string | undefined) ?? globalRole, permissions };
}

/**
 * Obtém o ID do tenant ativo do usuário autenticado.
 * Quando `active_tenant_id` não está definido no profile, cai no primeiro
 * tenant visível ao usuário (mesma lógica do layout/getCurrentTenant), para
 * que as actions operem sobre a mesma empresa exibida na UI.
 * Retorna null se o usuário não estiver autenticado ou não tiver tenant.
 */
export async function getCurrentTenantId(): Promise<string | null> {
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
    if (profile?.active_tenant_id) return profile.active_tenant_id as string;
    // Fallback: primeiro tenant que o usuário enxerga (RLS filtra), na mesma
    // ordem usada pelo seletor de empresas da UI.
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .order("name")
      .limit(1)
      .maybeSingle();
    return (tenant?.id as string | undefined) ?? null;
  } catch (error) {
    log.error({ error }, "Erro ao obter tenantId");
    return null;
  }
}

/**
 * Extrai campos de um FormData em um Record com base em definições de campo.
 * Todas as definições compartilham a mesma estrutura de leitura.
 */
export function extractFormFields<T extends string>(
  formData: FormData,
  definitions: Record<T, { type: "string" | "number" | "boolean" | "date"; default?: unknown; nullable?: boolean }>,
): Record<T, unknown> {
  const result = {} as Record<T, unknown>;

  for (const [key, def] of Object.entries(definitions) as [T, typeof definitions[T]][]) {
    const raw = formData.get(key as string);

    if (def.nullable && (raw === null || raw === "" || raw === undefined)) {
      result[key] = null;
      continue;
    }

    switch (def.type) {
      case "boolean":
        result[key] = raw === "on" || raw === "true";
        break;
      case "number":
        result[key] = Number(raw ?? def.default ?? 0);
        break;
      case "date":
        result[key] = raw || def.default || null;
        break;
      default:
        result[key] = raw ?? def.default ?? "";
    }
  }

  return result;
}
