import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnv, callEmbeddingsMock, rpcMock, insertSingleMock } = vi.hoisted(() => ({
  mockEnv: {
    EMBEDDINGS_API_KEY: "test-emb-key",
    EMBEDDINGS_BASE_URL: "https://api.openai.com/v1",
    EMBEDDINGS_MODEL: "text-embedding-3-small",
    SUPABASE_SERVICE_ROLE_KEY: "svc",
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  },
  callEmbeddingsMock: vi.fn(),
  rpcMock: vi.fn(),
  insertSingleMock: vi.fn(),
}));

vi.mock("@/lib/env", () => ({ env: mockEnv }));
vi.mock("@/lib/llm-client", () => ({ callEmbeddings: callEmbeddingsMock }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: rpcMock,
    from: () => ({
      insert: () => ({ select: () => ({ single: insertSingleMock }) }),
    }),
  }),
}));

import { isRagEnabled, retrieveKnowledge, ingestKnowledge } from "@/lib/knowledge-base";

describe("knowledge-base RAG", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.EMBEDDINGS_API_KEY = "test-emb-key";
    callEmbeddingsMock.mockResolvedValue([0.1, 0.2, 0.3]);
  });
  afterEach(() => vi.restoreAllMocks());

  it("isRagEnabled reflete a presença da chave", () => {
    expect(isRagEnabled()).toBe(true);
    mockEnv.EMBEDDINGS_API_KEY = "";
    expect(isRagEnabled()).toBe(false);
  });

  it("retrieveKnowledge retorna [] e não embeda quando RAG desativado", async () => {
    mockEnv.EMBEDDINGS_API_KEY = "";
    const out = await retrieveKnowledge("t1", "alguma consulta");
    expect(out).toEqual([]);
    expect(callEmbeddingsMock).not.toHaveBeenCalled();
  });

  it("retrieveKnowledge retorna [] para consulta vazia", async () => {
    expect(await retrieveKnowledge("t1", "   ")).toEqual([]);
    expect(callEmbeddingsMock).not.toHaveBeenCalled();
  });

  it("retrieveKnowledge chama match_knowledge com embedding serializado e retorna matches", async () => {
    rpcMock.mockResolvedValue({ data: [{ id: "k1", content: "trecho", similarity: 0.9 }], error: null });
    const out = await retrieveKnowledge("t1", "consulta", { limit: 3, threshold: 0.4 });
    expect(out).toEqual([{ id: "k1", content: "trecho", similarity: 0.9 }]);
    expect(rpcMock).toHaveBeenCalledWith("match_knowledge", {
      query_embedding: "[0.1,0.2,0.3]",
      match_threshold: 0.4,
      match_count: 3,
      p_tenant_id: "t1",
    });
  });

  it("retrieveKnowledge retorna [] em erro de RPC (fail-safe)", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await retrieveKnowledge("t1", "consulta")).toEqual([]);
  });

  it("retrieveKnowledge retorna [] se o embedding lançar (fail-safe)", async () => {
    callEmbeddingsMock.mockRejectedValue(new Error("API down"));
    expect(await retrieveKnowledge("t1", "consulta")).toEqual([]);
  });

  it("ingestKnowledge insere com embedding serializado e retorna id", async () => {
    insertSingleMock.mockResolvedValue({ data: { id: "new1" }, error: null });
    const res = await ingestKnowledge({ tenantId: "t1", content: "conteúdo de teste para a base" });
    expect(res).toEqual({ success: true, id: "new1" });
  });

  it("ingestKnowledge falha quando RAG desativado ou conteúdo vazio", async () => {
    mockEnv.EMBEDDINGS_API_KEY = "";
    expect((await ingestKnowledge({ tenantId: "t1", content: "x" })).success).toBe(false);
    mockEnv.EMBEDDINGS_API_KEY = "test-emb-key";
    expect((await ingestKnowledge({ tenantId: "t1", content: "" })).success).toBe(false);
  });
});
