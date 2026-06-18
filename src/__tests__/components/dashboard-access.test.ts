import { describe, expect, it } from "vitest";
import {
  filterUnitsByScope,
  filterAreasByScope,
  isScoped,
} from "@/components/dashboard/dashboard-access";

const units = [
  { id: "u1", area_id: "a1" },
  { id: "u2", area_id: "a1" },
  { id: "u3", area_id: "a2" },
  { id: "u4", area_id: null },
];

const areas = [{ id: "a1" }, { id: "a2" }, { id: "a3" }];

describe("isScoped", () => {
  it("false quando não há áreas nem unidades", () => {
    expect(isScoped({ areaIds: [], unitIds: [] })).toBe(false);
  });
  it("true quando há ao menos uma restrição", () => {
    expect(isScoped({ areaIds: ["a1"], unitIds: [] })).toBe(true);
    expect(isScoped({ areaIds: [], unitIds: ["u1"] })).toBe(true);
  });
});

describe("filterUnitsByScope", () => {
  it("escopo vazio retorna todas as unidades", () => {
    expect(filterUnitsByScope(units, { areaIds: [], unitIds: [] })).toEqual(units);
  });

  it("filtra por unidades liberadas", () => {
    expect(
      filterUnitsByScope(units, { areaIds: [], unitIds: ["u2", "u3"] }),
    ).toEqual([{ id: "u2", area_id: "a1" }, { id: "u3", area_id: "a2" }]);
  });

  it("libera todas as unidades de uma área liberada", () => {
    expect(
      filterUnitsByScope(units, { areaIds: ["a1"], unitIds: [] }),
    ).toEqual([{ id: "u1", area_id: "a1" }, { id: "u2", area_id: "a1" }]);
  });

  it("combina escopo de área e de unidade por união", () => {
    expect(
      filterUnitsByScope(units, { areaIds: ["a2"], unitIds: ["u1"] }),
    ).toEqual([
      { id: "u1", area_id: "a1" },
      { id: "u3", area_id: "a2" },
    ]);
  });

  it("nunca inclui unidade sem área via escopo de área", () => {
    expect(
      filterUnitsByScope(units, { areaIds: ["a1"], unitIds: [] }).some((u) => u.id === "u4"),
    ).toBe(false);
  });
});

describe("filterAreasByScope", () => {
  it("escopo vazio retorna todas as áreas", () => {
    expect(filterAreasByScope(areas, units, { areaIds: [], unitIds: [] })).toEqual(areas);
  });

  it("mantém apenas áreas com unidades visíveis", () => {
    const visible = filterUnitsByScope(units, { areaIds: [], unitIds: ["u3"] });
    expect(filterAreasByScope(areas, visible, { areaIds: [], unitIds: ["u3"] })).toEqual([
      { id: "a2" },
    ]);
  });
});
