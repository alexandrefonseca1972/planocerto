import { describe, expect, it } from "vitest";
import {
  buildDuplicatedRows,
  collectSubtree,
  collectSubtreeIds,
  nextSiblingNumber,
  remapCopiedNumber,
  withCopySuffix,
  type DuplicableItem,
} from "@/components/planos/duplicate-item-helpers";

function item(partial: Partial<DuplicableItem> & { id: string }): DuplicableItem {
  return {
    plan_id: "plan-1",
    parent_id: null,
    number: "1",
    sort_order: 1,
    tipo_pa: "",
    area: "",
    prioridade: "",
    subacao: "",
    como: "",
    action: "Ação",
    why: "",
    where: "",
    responsible: "",
    planned_start: null,
    planned_end: null,
    cost: "",
    expected_result: "",
    observations: "",
    preco: 0,
    inscritos_esperado: 0,
    mat_fin_esperado: 0,
    mat_acad_esperado: 0,
    ...partial,
  };
}

describe("withCopySuffix", () => {
  it("appends (cópia) once", () => {
    expect(withCopySuffix("Campanha")).toBe("Campanha (cópia)");
    expect(withCopySuffix("Campanha (cópia)")).toBe("Campanha (cópia)");
  });

  it("respeita o limite de 500 caracteres", () => {
    const long = "x".repeat(498);
    expect(withCopySuffix(long).length).toBeLessThanOrEqual(500);
    expect(withCopySuffix(long).endsWith("(cópia)")).toBe(true);
  });
});

describe("nextSiblingNumber", () => {
  it("incrementa irmãos de topo", () => {
    expect(nextSiblingNumber(["1", "2", "3"], "2")).toBe("4");
  });

  it("incrementa o último segmento hierárquico", () => {
    expect(nextSiblingNumber(["1.1", "1.2"], "1.2")).toBe("1.3");
  });

  it("ignora números de outro prefixo", () => {
    expect(nextSiblingNumber(["1.1", "2.9"], "1.1")).toBe("1.2");
  });

  it("gera 1 quando a origem não tem número", () => {
    expect(nextSiblingNumber([], "")).toBe("1");
  });
});

describe("remapCopiedNumber", () => {
  it("troca o prefixo da subárvore", () => {
    expect(remapCopiedNumber("1.2", "1.2", "1.4")).toBe("1.4");
    expect(remapCopiedNumber("1.2.1", "1.2", "1.4")).toBe("1.4.1");
  });

  it("nunca colide com o original quando o número não segue o prefixo esperado (drift)", () => {
    expect(remapCopiedNumber("9.9", "1.2", "1.4")).toBe("1.4.9.9");
  });
});

describe("collectSubtree", () => {
  it("inclui o nó e os descendentes", () => {
    const items = [
      { id: "g", parent_id: null },
      { id: "c1", parent_id: "g" },
      { id: "c2", parent_id: "g" },
      { id: "other", parent_id: null },
    ];
    expect(collectSubtree(items, "g").map((i) => i.id)).toEqual(["g", "c1", "c2"]);
  });

  it("collectSubtreeIds devolve folhas antes da raiz", () => {
    const items = [
      { id: "g", parent_id: null },
      { id: "c1", parent_id: "g" },
      { id: "c1a", parent_id: "c1" },
    ];
    expect(collectSubtreeIds(items, "g")).toEqual(["c1a", "c1", "g"]);
  });
});

describe("buildDuplicatedRows", () => {
  it("duplica uma folha no mesmo grupo com número seguinte", () => {
    const plan = [
      item({ id: "g", number: "1", sort_order: 1, action: "Trade" }),
      item({ id: "c1", parent_id: "g", number: "1.1", sort_order: 2, action: "Campanha", tipo_pa: "Vestibular" }),
      item({ id: "c2", parent_id: "g", number: "1.2", sort_order: 3, action: "Prova" }),
    ];
    const rows = buildDuplicatedRows("c1", plan, () => "new-1");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "new-1",
      parent_id: "g",
      number: "1.3",
      action: "Campanha (cópia)",
      tipo_pa: "Vestibular",
      status: 1,
      actual_start: null,
      actual_result: "",
    });
  });

  it("duplica um grupo e remapeia os filhos", () => {
    let n = 0;
    const plan = [
      item({ id: "g", number: "1", sort_order: 1, action: "Trade" }),
      item({ id: "c1", parent_id: "g", number: "1.1", sort_order: 2, action: "Campanha" }),
      item({ id: "g2", number: "2", sort_order: 3, action: "Eventos" }),
    ];
    const rows = buildDuplicatedRows("g", plan, () => `id-${++n}`);
    expect(rows.map((r) => ({ id: r.id, parent_id: r.parent_id, number: r.number, action: r.action }))).toEqual([
      { id: "id-1", parent_id: null, number: "3", action: "Trade (cópia)" },
      { id: "id-2", parent_id: "id-1", number: "3.1", action: "Campanha" },
    ]);
  });

  it("retorna vazio se a origem não existe", () => {
    expect(buildDuplicatedRows("missing", [item({ id: "a" })])).toEqual([]);
  });
});
