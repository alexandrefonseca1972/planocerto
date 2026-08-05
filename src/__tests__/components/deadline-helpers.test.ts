import { describe, expect, it } from "vitest";
import { groupDeadlines } from "@/components/dashboard/deadline-helpers";

const mk = (id: string, title: string, deadline: string, unitName: string) => ({
  id,
  title,
  deadline,
  unitName,
});

describe("groupDeadlines", () => {
  it("agrupa itens idênticos (título+data+unidade) com count", () => {
    const items = [
      mk("1", "Visita escolas", "2026-06-10", "Castanhal"),
      mk("2", "Visita escolas", "2026-06-10", "Castanhal"),
      mk("3", "Visita escolas", "2026-06-10", "Castanhal"),
    ];
    const out = groupDeadlines(items);
    expect(out).toHaveLength(1);
    expect(out[0].count).toBe(3);
    expect(out[0].id).toBe("1"); // representante = primeiro
  });

  it("não agrupa quando difere título, data ou unidade", () => {
    const items = [
      mk("1", "Visita escolas", "2026-06-10", "Castanhal"),
      mk("2", "Visita escolas", "2026-06-11", "Castanhal"), // data diferente
      mk("3", "Visita escolas", "2026-06-10", "Belém"), // unidade diferente
      mk("4", "Outra ação", "2026-06-10", "Castanhal"), // título diferente
    ];
    const out = groupDeadlines(items);
    expect(out).toHaveLength(4);
    expect(out.every((g) => g.count === 1)).toBe(true);
  });

  it("preserva a ordem de primeira ocorrência", () => {
    const items = [
      mk("a", "B", "2026-06-02", "U"),
      mk("b", "A", "2026-06-01", "U"),
      mk("c", "B", "2026-06-02", "U"),
    ];
    const out = groupDeadlines(items);
    expect(out.map((g) => g.title)).toEqual(["B", "A"]);
    expect(out[0].count).toBe(2);
  });

  it("retorna [] para lista vazia", () => {
    expect(groupDeadlines([])).toEqual([]);
  });
});
