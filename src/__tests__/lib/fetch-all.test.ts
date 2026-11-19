import { describe, it, expect } from "vitest";
import { chunk, fetchAllRows } from "@/lib/supabase/fetch-all";

// Simula o PostgREST com teto de linhas (db-max-rows) menor que a página pedida.
function server(total: number, cap: number) {
  const rows = Array.from({ length: total }, (_, i) => i);
  const calls: [number, number][] = [];
  const page = (from: number, to: number) => {
    calls.push([from, to]);
    return Promise.resolve({ data: rows.slice(from, Math.min(to + 1, from + cap)), error: null });
  };
  return { page, calls };
}

describe("fetchAllRows", () => {
  it("lê tudo mesmo quando o servidor devolve menos que o pedido", async () => {
    const { page } = server(2500, 700);
    const out = await fetchAllRows(page);
    expect(out).toHaveLength(2500);
    expect(out[0]).toBe(0);
    expect(out.at(-1)).toBe(2499);
    expect(new Set(out).size).toBe(2500); // sem pular nem repetir linhas
  });

  it("resultado vazio termina na primeira chamada", async () => {
    const { page, calls } = server(0, 1000);
    expect(await fetchAllRows(page)).toEqual([]);
    expect(calls).toHaveLength(1);
  });

  it("propaga erro do banco", async () => {
    await expect(fetchAllRows(() => Promise.resolve({ data: null, error: new Error("x") }))).rejects.toThrow("x");
  });
});

describe("chunk", () => {
  it("divide em lotes", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});
