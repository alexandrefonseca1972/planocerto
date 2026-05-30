// Utilitários server-side compartilhados pelas server actions.
// NÃO leva "use server": exporta helpers síncronos (extractFormFields) e é
// consumido apenas por outros módulos de servidor — não é superfície de action.
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

const log = logger.child({ component: "actions:helpers" });

/**
 * Obtém o ID do tenant ativo do usuário autenticado.
 * Retorna null se o usuário não estiver autenticado ou não tiver tenant ativo.
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
    return (profile?.active_tenant_id as string | null) ?? null;
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
