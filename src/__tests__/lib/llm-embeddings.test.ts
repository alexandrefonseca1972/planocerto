import { afterEach, describe, expect, it, vi } from "vitest";
import { callEmbeddings } from "@/lib/llm-client";

const CFG = { apiKey: "k", baseUrl: "https://api.openai.com/v1", model: "text-embedding-3-small" };

describe("callEmbeddings", () => {
  afterEach(() => vi.restoreAllMocks());

  it("faz POST em /embeddings e retorna o vetor", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: [0.1, 0.2] }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const out = await callEmbeddings("texto", CFG);
    expect(out).toEqual([0.1, 0.2]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/embeddings");
    expect(JSON.parse(init.body)).toEqual({ model: "text-embedding-3-small", input: "texto" });
    expect(init.headers.Authorization).toBe("Bearer k");
  });

  it("lança em resposta não-ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => "unauthorized" }));
    await expect(callEmbeddings("t", CFG)).rejects.toThrow(/Embeddings API error 401/);
  });

  it("lança quando o payload não traz embedding", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) }));
    await expect(callEmbeddings("t", CFG)).rejects.toThrow(/inesperada/);
  });
});
