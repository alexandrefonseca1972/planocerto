// Helpers do RAG (base de conhecimento). NÃO é "use server": exporta funções
// consumidas por server actions. O acesso à knowledge_base é via service role
// (RLS só libera service_role — ver migration 051), sempre filtrado por tenant.
import { env } from "@/lib/env";
import { callEmbeddings, type EmbeddingsConfig } from "@/lib/llm-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/errors";

/** Dimensão da coluna knowledge_base.embedding (VECTOR(1536), migration 045b). */
const EMBEDDING_DIMENSIONS = 1536;

/** RAG só opera quando há chave de embeddings configurada (degrada gracioso). */
export function isRagEnabled(): boolean {
  return Boolean(env.EMBEDDINGS_API_KEY);
}

function embeddingsConfig(): EmbeddingsConfig {
  return {
    apiKey: env.EMBEDDINGS_API_KEY,
    baseUrl: env.EMBEDDINGS_BASE_URL,
    model: env.EMBEDDINGS_MODEL,
  };
}

export async function embedText(text: string): Promise<number[]> {
  const vector = await callEmbeddings(text, embeddingsConfig());
  // Guard de dimensão: a coluna é VECTOR(1536). Um modelo com outra dimensão
  // (ex.: text-embedding-3-large = 3072) faria o insert/RPC falhar com mensagem
  // obscura do pgvector — aqui damos um erro claro e acionável.
  if (vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding com ${vector.length} dimensões; esperado ${EMBEDDING_DIMENSIONS}. ` +
        `Ajuste EMBEDDINGS_MODEL para um modelo de ${EMBEDDING_DIMENSIONS} dims (ex.: text-embedding-3-small).`,
    );
  }
  return vector;
}

export interface KnowledgeMatch {
  id: string;
  content: string;
  similarity: number;
}

/**
 * Busca semântica na base de conhecimento do tenant via match_knowledge (045b).
 * Retorna [] (sem lançar) se o RAG estiver desativado ou em qualquer falha —
 * o chamador continua sem o contexto extra.
 */
export async function retrieveKnowledge(
  tenantId: string,
  query: string,
  opts: { limit?: number; threshold?: number } = {},
): Promise<KnowledgeMatch[]> {
  if (!isRagEnabled() || !tenantId || !query.trim()) return [];
  const { limit = 4, threshold = 0.3 } = opts;
  try {
    const queryEmbedding = await embedText(query);
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.rpc("match_knowledge", {
      // pgvector aceita o literal "[1,2,3]"; os tipos gerados pedem string.
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: threshold,
      match_count: limit,
      p_tenant_id: tenantId,
    });
    if (error) {
      logSupabaseError("retrieveKnowledge", error);
      return [];
    }
    return (data ?? []) as KnowledgeMatch[];
  } catch (error) {
    console.error("[retrieveKnowledge] Error:", error);
    return [];
  }
}

export interface IngestResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Embeda um trecho de conhecimento e insere na knowledge_base do tenant.
 * Segmentável por unidade/área (colunas vieram em 046).
 */
export async function ingestKnowledge(params: {
  tenantId: string;
  content: string;
  unitId?: string | null;
  areaId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<IngestResult> {
  const { tenantId, content, unitId = null, areaId = null, metadata = {} } = params;
  if (!isRagEnabled()) return { success: false, error: "Embeddings não configurados (EMBEDDINGS_API_KEY)." };
  if (!tenantId) return { success: false, error: "Empresa não identificada." };
  if (!content.trim()) return { success: false, error: "Conteúdo vazio." };

  try {
    const embedding = await embedText(content);
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("knowledge_base")
      .insert({
        tenant_id: tenantId,
        content,
        // pgvector aceita o literal "[1,2,3]"; os tipos gerados pedem string.
        embedding: JSON.stringify(embedding),
        unit_id: unitId,
        area_id: areaId,
        metadata: metadata as never,
      })
      .select("id")
      .single();
    if (error) {
      logSupabaseError("ingestKnowledge", error);
      return { success: false, error: "Falha ao salvar na base de conhecimento." };
    }
    return { success: true, id: data?.id as string };
  } catch (error) {
    console.error("[ingestKnowledge] Error:", error);
    return { success: false, error: "Erro inesperado ao gerar embedding." };
  }
}
