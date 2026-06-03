import { describe, it, expect } from "vitest";
import {
  parsePlanRows,
  validatePlanoHeaders,
  COL,
  REQUIRED_HEADERS,
} from "@/lib/planos-import";

/** Constrói uma linha de dados posicionando macro/ação (e opcionais) por índice. */
function mkRow(opts: { macro?: string; acao?: string; farol?: string }): unknown[] {
  const row: unknown[] = new Array(23).fill("");
  row[COL.MACRO] = opts.macro ?? "";
  row[COL.ACAO] = opts.acao ?? "";
  if (opts.farol) row[COL.FAROL] = opts.farol;
  return row;
}

describe("parsePlanRows", () => {
  it("numera grupos 1..N, filhos g.c e itens sem grupo após os grupos", () => {
    const rows = [
      mkRow({ macro: "G1", acao: "A1" }),
      mkRow({ macro: "G1", acao: "A2" }),
      mkRow({ macro: "G2", acao: "A3" }),
      mkRow({ acao: "Solta" }), // sem grupo
      mkRow({}), // linha vazia — ignorada
    ];
    const { groups, items } = parsePlanRows(rows);

    expect(groups).toEqual([
      { name: "G1", number: "1", sortOrder: 1 },
      { name: "G2", number: "2", sortOrder: 4 },
    ]);

    expect(items.map((i) => ({ macroAcao: i.macroAcao, number: i.number, sortOrder: i.sortOrder }))).toEqual([
      { macroAcao: "G1", number: "1.1", sortOrder: 2 },
      { macroAcao: "G1", number: "1.2", sortOrder: 3 },
      { macroAcao: "G2", number: "2.1", sortOrder: 5 },
      { macroAcao: "", number: "3", sortOrder: 6 }, // sem grupo: continua após os 2 grupos
    ]);
  });

  it("preserva o nome CRU do grupo (vínculo pai↔filho não depende de sanitização)", () => {
    // Nome com espaço duplo: o parser não normaliza — a rota usa esse mesmo
    // valor cru como chave do groupMap, garantindo o vínculo.
    const rows = [
      mkRow({ macro: "MACRO  COM  ESPAÇOS", acao: "X" }),
      mkRow({ macro: "MACRO  COM  ESPAÇOS", acao: "Y" }),
    ];
    const { groups, items } = parsePlanRows(rows);
    expect(groups[0].name).toBe("MACRO  COM  ESPAÇOS");
    expect(items.every((i) => i.macroAcao === "MACRO  COM  ESPAÇOS")).toBe(true);
    expect(items.map((i) => i.number)).toEqual(["1.1", "1.2"]);
  });

  it("ignora linhas sem AÇÃO ao numerar", () => {
    const rows = [
      mkRow({ macro: "G", acao: "" }), // sem ação — não cria grupo nem item
      mkRow({ macro: "G", acao: "Real" }),
    ];
    const { groups, items } = parsePlanRows(rows);
    expect(groups).toHaveLength(1);
    expect(items).toHaveLength(1);
    expect(items[0].number).toBe("1.1");
  });
});

describe("validatePlanoHeaders", () => {
  function headerRowFromModel(): unknown[] {
    const h = new Array(23).fill("");
    for (const [idx, label] of Object.entries(REQUIRED_HEADERS)) h[Number(idx)] = label;
    // demais colunas do modelo (não obrigatórias) podem estar presentes
    return h;
  }

  it("aceita o layout do modelo padrão (header na linha 3)", () => {
    const rows = [
      ["PLANO DE AÇÃO |", "NOME DA UNIDADE"],
      ["[selecionar]", "[preencher]"],
      headerRowFromModel(),
      mkRow({ macro: "G", acao: "A" }),
    ];
    const { headerRow, errors } = validatePlanoHeaders(rows);
    expect(headerRow).toBe(2);
    expect(errors).toEqual([]);
  });

  it("reporta coluna divergente do modelo", () => {
    const h = headerRowFromModel();
    h[5] = "TAREFA"; // deveria ser "AÇÃO"
    const rows = [[], [], h];
    const { errors } = validatePlanoHeaders(rows);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes("AÇÃO"))).toBe(true);
  });
});
