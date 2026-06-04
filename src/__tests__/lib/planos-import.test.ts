import { describe, it, expect } from "vitest";
import {
  parsePlanRows,
  validatePlanoHeaders,
  parseStatus,
  parsePreco,
  parseDate,
  parseNum,
  findPlanoSheet,
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

describe("parseStatus", () => {
  it("mapeia o vocabulário do modelo padrão", () => {
    expect(parseStatus("NÃO INICIADA")).toBe(1);
    expect(parseStatus("PENDENTE")).toBe(2);
    expect(parseStatus("EM ANDAMENTO (ATRASO)")).toBe(3);
    expect(parseStatus("EM ANDAMENTO")).toBe(4);
    expect(parseStatus("CONCLUÍDO")).toBe(5);
  });

  it("mapeia os 7 valores da fórmula do FAROL do MODELO.xlsb", () => {
    expect(parseStatus("NÃO PROGRAMADO")).toBe(1);
    expect(parseStatus("A INICIAR")).toBe(1);
    expect(parseStatus("ATRASADO")).toBe(3);
    expect(parseStatus("INICIADO COM ATRASO")).toBe(3);
    expect(parseStatus("EM ANDAMENTO")).toBe(4);
    expect(parseStatus("CONCLUÍDO NO PRAZO")).toBe(5);
    expect(parseStatus("CONCLUÍDO COM ATRASO")).toBe(5);
    expect(parseStatus("CONCLUIDO COM ATRASO")).toBe(5);
  });

  it("mapeia o vocabulário alternativo das planilhas de clientes", () => {
    expect(parseStatus("A INICIAR")).toBe(1);
    expect(parseStatus("ATRASADO")).toBe(3);
    expect(parseStatus("CONCLUÍDO NO PRAZO")).toBe(5);
    expect(parseStatus("CONCLUIDO NO PRAZO")).toBe(5);
  });

  it("é case-insensitive, tolera espaços e cai em Não Iniciada para desconhecidos", () => {
    expect(parseStatus("  atrasado  ")).toBe(3);
    expect(parseStatus("QUALQUER COISA")).toBe(1);
    expect(parseStatus("")).toBe(1);
  });
});

describe("parseDate", () => {
  it("converte serial do Excel e formatos DD/MM/AAAA e ISO", () => {
    expect(parseDate(45762)).toBe("2025-04-15");
    expect(parseDate("20/04/2026")).toBe("2026-04-20");
    expect(parseDate("2026-04-20")).toBe("2026-04-20");
  });

  it("rejeita serial absurdo sem lançar exceção", () => {
    expect(parseDate(1e15)).toBeNull();
    expect(parseDate(-5)).toBeNull();
    expect(parseDate(NaN)).toBeNull();
  });

  it("rejeita datas de calendário inválidas (31/02 etc.)", () => {
    expect(parseDate("31/02/2026")).toBeNull();
    expect(parseDate("2026-02-31")).toBeNull();
    expect(parseDate("00/13/2026")).toBeNull();
    expect(parseDate("texto")).toBeNull();
  });
});

describe("parseNum", () => {
  it("converte, arredonda e descarta inválidos", () => {
    expect(parseNum("42")).toBe(42);
    expect(parseNum(3.7)).toBe(4);
    expect(parseNum("abc")).toBe(0);
    expect(parseNum(-10)).toBe(0);
  });

  it("aplica teto para não estourar int4 no banco", () => {
    expect(parseNum(1e15)).toBe(999999999);
  });
});

describe("findPlanoSheet", () => {
  it("com múltiplas abas, seleciona SEMPRE a aba 'PLANO DE AÇÃO' (nunca a primeira)", () => {
    // Ordem das abas do MODELO.xlsb: a do plano não é a primeira
    expect(findPlanoSheet(["APOIO", "SIMULADOR", "PLANO DE AÇÃO", "ESCOLA", "EMPRESA"])).toBe("PLANO DE AÇÃO");
  });

  it("é tolerante a acentos, caixa e espaços no nome da aba", () => {
    expect(findPlanoSheet(["Apoio", "plano de acao"])).toBe("plano de acao");
    expect(findPlanoSheet(["APOIO", "  Plano de Ação 2026  "])).toBe("  Plano de Ação 2026  ");
  });

  it("com múltiplas abas e nenhuma correspondente, retorna null (não cai na primeira)", () => {
    expect(findPlanoSheet(["APOIO", "SIMULADOR", "ESCOLA"])).toBeNull();
  });

  it("aceita arquivo de aba única (a validação de estrutura decide)", () => {
    expect(findPlanoSheet(["Planilha1"])).toBe("Planilha1");
    expect(findPlanoSheet([])).toBeNull();
  });
});

describe("parsePreco", () => {
  it("aceita número puro do Excel", () => {
    expect(parsePreco(8000)).toBe(8000);
    expect(parsePreco(1234.567)).toBe(1234.57);
  });

  it("converte formato pt-BR com R$, milhar e vírgula decimal", () => {
    expect(parsePreco("R$ 1.000,50")).toBe(1000.5);
    expect(parsePreco("1.000")).toBe(1000); // pontos em grupos de 3 → milhar
    expect(parsePreco("1,5")).toBe(1.5);
  });

  it("aceita formato com ponto decimal", () => {
    expect(parsePreco("1000.50")).toBe(1000.5);
    expect(parsePreco("1,000.50")).toBe(1000.5); // milhar com vírgula (en-US)
  });

  it("vazio, inválido ou negativo → 0", () => {
    expect(parsePreco("")).toBe(0);
    expect(parsePreco(null)).toBe(0);
    expect(parsePreco("abc")).toBe(0);
    expect(parsePreco(-50)).toBe(0);
  });

  it("aplica teto para não estourar NUMERIC(12,2) no banco", () => {
    expect(parsePreco(1e15)).toBe(9999999999.99);
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
