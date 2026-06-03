"use server";

import { checkPermission } from "@/app/actions/admin";
import { PERMISSIONS } from "@/lib/permissions";
import { sanitizeText as sanitizeStrict } from "@/lib/validation/sanitize";

/**
 * Sanitiza texto para inputs de catálogo: remove HTML (DOMPurify, sem tags) e
 * caracteres de controle, normaliza espaços, trim e aplica limite de tamanho.
 */
export async function sanitizeText(value: unknown, maxLen = 200): Promise<string> {
  return sanitizeStrict(value).slice(0, maxLen);
}

/**
 * Converte erros do Postgres em mensagens amigáveis no contexto do catálogo.
 */
export async function mapPgError(
  error: { code?: string; message?: string } | null,
  entityLabel: string,
): Promise<string> {
  if (!error) return `Erro inesperado no catálogo de ${entityLabel}.`;
  switch (error.code) {
    case "23505":
      return `Já existe um(a) ${entityLabel} com esse nome.`;
    case "23503":
      return `Não é possível excluir: existem registros vinculados a este(a) ${entityLabel}.`;
    case "23514":
      return `Valor fora dos padrões aceitos.`;
    case "42501":
      return "Acesso negado pelo banco.";
    case "PGRST116":
      return "Registro não encontrado.";
    default:
      return error.message || `Erro ao processar ${entityLabel}.`;
  }
}

/**
 * Guard para todas as escritas de catálogo. Retorna mensagem se não autorizado.
 */
export async function requireAdmin(): Promise<string | null> {
  const ok = await checkPermission(PERMISSIONS.ADMIN_ACCESS);
  if (!ok) return "Acesso negado. Permissão de administrador necessária.";
  return null;
}
