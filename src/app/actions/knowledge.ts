"use server";

import { checkPermission } from "@/app/actions/admin";
import { getCurrentTenantId } from "@/app/actions/_helpers";
import { ingestKnowledge, isRagEnabled } from "@/lib/knowledge-base";
import { sanitizeText } from "@/lib/validation/sanitize";
import { PERMISSIONS } from "@/lib/permissions";
import type { FormState } from "@/lib/errors";

/**
 * Adiciona um trecho de conhecimento à base de RAG do tenant ativo.
 * Guarda: SETTINGS_MANAGE. O conteúdo é sanitizado antes de embeddar/armazenar.
 * Segmentável por unidade/área (opcional).
 */
export async function addKnowledge(_prev: FormState, formData: FormData): Promise<FormState> {
  const allowed = await checkPermission(PERMISSIONS.SETTINGS_MANAGE);
  if (!allowed) return { message: "Acesso negado para gerenciar a base de conhecimento." };

  if (!isRagEnabled()) {
    return { message: "IA de conhecimento (RAG) não configurada. Defina EMBEDDINGS_API_KEY." };
  }

  const tenantId = await getCurrentTenantId();
  if (!tenantId) return { message: "Empresa não identificada." };

  const content = sanitizeText(formData.get("content"), 8000);
  if (content.trim().length < 20) {
    return { message: "O conteúdo precisa ter ao menos 20 caracteres." };
  }

  const unitId = (formData.get("unit_id") as string | null)?.trim() || null;
  const areaId = (formData.get("area_id") as string | null)?.trim() || null;

  const result = await ingestKnowledge({ tenantId, content, unitId, areaId });
  if (!result.success) return { message: result.error ?? "Falha ao salvar conhecimento." };

  return { success: true, message: "Conhecimento adicionado à base." };
}
