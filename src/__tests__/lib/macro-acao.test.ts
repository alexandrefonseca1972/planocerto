import { describe, it, expect } from "vitest";
import { MACRO_ACAO_MAX, macroAcaoError, macroAcaoKey, normalizeMacroAcao } from "@/lib/macro-acao";
import { parsePlanRows, COL } from "@/lib/planos-import";

describe("macro ação", () => {
  it("normaliza para caixa alta e espaços simples", () => {
    expect(normalizeMacroAcao("  Empresa   -  ação ")).toBe("EMPRESA - AÇÃO");
  });

  it("trata grafias diferentes como a mesma macro", () => {
    const k = macroAcaoKey("EMPRESA - AÇÃO");
    expect(macroAcaoKey("Empresa - Ação")).toBe(k);
    expect(macroAcaoKey("EMPRESA-AÇÃO")).toBe(k);
    expect(macroAcaoKey("empresa acao")).toBe(k);
    expect(macroAcaoKey("EMPRESA - VISITA")).not.toBe(k);
  });

  it("limita o tamanho", () => {
    expect(macroAcaoError("A".repeat(MACRO_ACAO_MAX))).toBeNull();
    expect(macroAcaoError("A".repeat(MACRO_ACAO_MAX + 1))).toMatch(/no máximo/);
  });

  it("import junta grafias diferentes no mesmo grupo, com nome em caixa alta", () => {
    const row = (macro: string, acao: string) => {
      const r: unknown[] = [];
      r[COL.MACRO] = macro;
      r[COL.ACAO] = acao;
      return r;
    };
    const { groups, items } = parsePlanRows([row("Empresa - Ação", "a1"), row("EMPRESA-AÇÃO", "a2")]);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("EMPRESA - AÇÃO");
    expect(items.map((i) => i.number)).toEqual(["1.1", "1.2"]);
  });
});
