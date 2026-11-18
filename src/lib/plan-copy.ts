import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

// Cópia de itens entre planos (copyPlan, createPlanFromTemplate,
// clonePlanWithDateShift). Achado #7: os itens eram inseridos sem conferir
// erro e a hierarquia ia num segundo passo (upsert sem plan_id/number,
// que falhava calado). Agora: IDs novos gerados antes, parent_id já no
// mesmo INSERT (FK checada no fim do statement) e, se falhar, o plano novo
// é apagado — sem cópia vazia ou sem hierarquia reportada como sucesso.

/** Mapeia IDs antigos para novos, inclusive de pais que vêm depois do filho. */
export function remapItemIds(items: { id: string }[]) {
  const map = new Map(items.map((i) => [i.id, crypto.randomUUID()]));
  return {
    id: (oldId: string) => map.get(oldId)!,
    parent: (oldParentId: string | null | undefined) =>
      oldParentId ? (map.get(oldParentId) ?? null) : null,
  };
}

/** Insere os itens; em falha apaga o plano recém-criado e devolve o erro. */
export async function insertCopiedItems(
  supabase: SupabaseClient,
  newPlanId: string,
  rows: Record<string, unknown>[],
): Promise<string | null> {
  const { error } = await supabase.from("action_items").insert(rows);
  if (!error) return null;
  // service_role: quem só tem plans.create não apaga plano pela RLS (077).
  const { error: cleanupError } = await createAdminClient()
    .from("action_plans")
    .delete()
    .eq("id", newPlanId);
  if (cleanupError) {
    console.error("[insertCopiedItems] Falha ao desfazer plano", newPlanId, cleanupError.message);
  }
  return error.message;
}
