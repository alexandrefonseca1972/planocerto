import { describe, it, expect, vi } from "vitest";
import { extractEntities } from "@/lib/llm/extract-entities";

vi.mock("@/lib/env", () => ({
  env: { OPENROUTER_API_KEY: "test-key" },
}));

global.fetch = vi.fn();

describe("extractEntities", () => {
  it("retorna lista vazia se LLM retornar JSON malformado", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: "isso não é json" } }],
        }),
    } as Response);

    const result = await extractEntities("texto qualquer");
    expect(result).toEqual([]);
  });

  it("filtra entidades com nome muito curto", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  entities: [
                    {
                      type: "person",
                      raw_name: "A",
                      document: null,
                      context_snippet: "x",
                      confidence: 0.9,
                    },
                  ],
                }),
              },
            },
          ],
        }),
    } as Response);

    const result = await extractEntities("texto");
    expect(result).toEqual([]);
  });

  it("sanitiza nomes com HTML injetado", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  entities: [
                    {
                      type: "person",
                      raw_name: "<script>alert(1)</script>João Silva",
                      document: null,
                      context_snippet: "nomeado para cargo",
                      confidence: 0.95,
                    },
                  ],
                }),
              },
            },
          ],
        }),
    } as Response);

    const result = await extractEntities("texto");
    expect(result[0]?.raw_name).not.toContain("<script>");
    expect(result[0]?.raw_name).toBe("João Silva");
  });
});