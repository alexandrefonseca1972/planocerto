import { describe, expect, it } from "vitest";
import { deriveActionItemStatus } from "@/lib/action-item-status";

// Data de referência fixa para controlar o que é "passado".
const REF = new Date("2026-06-23T12:00:00");
const PAST = "2026-06-01";
const FUTURE = "2026-12-31";

describe("deriveActionItemStatus", () => {
  it("vazio → 1 (não iniciada)", () => {
    expect(deriveActionItemStatus({}, REF)).toBe(1);
  });

  it("apenas planejamento → 2", () => {
    expect(deriveActionItemStatus({ action: "Visitar escola" }, REF)).toBe(2);
    expect(deriveActionItemStatus({ planned_end: FUTURE }, REF)).toBe(2);
  });

  it("sinais de execução sem prazo vencido → 4 (em andamento)", () => {
    expect(deriveActionItemStatus({ action: "X", actual_start: PAST, planned_end: FUTURE }, REF)).toBe(4);
    expect(deriveActionItemStatus({ inscritos_real: 10 }, REF)).toBe(4);
  });

  it("prazo vencido sem execução → 2; com execução → 3 (atrasada)", () => {
    expect(deriveActionItemStatus({ action: "X", planned_end: PAST }, REF)).toBe(2);
    expect(deriveActionItemStatus({ planned_end: PAST, observations: "andou um pouco" }, REF)).toBe(3);
  });

  it("concluída → 5 por actual_end ou pelos três reais positivos", () => {
    expect(deriveActionItemStatus({ actual_end: PAST, planned_end: PAST }, REF)).toBe(5);
    expect(
      deriveActionItemStatus({ inscritos_real: 5, mat_fin_real: 3, mat_acad_real: 2, planned_end: PAST }, REF),
    ).toBe(5);
  });

  it("reais parciais não concluem (apenas em andamento)", () => {
    expect(deriveActionItemStatus({ inscritos_real: 5, mat_fin_real: 0, planned_end: FUTURE }, REF)).toBe(4);
  });

  it("números não-positivos ou inválidos não contam como execução", () => {
    expect(deriveActionItemStatus({ inscritos_real: 0, mat_fin_real: -1 }, REF)).toBe(1);
  });
});
