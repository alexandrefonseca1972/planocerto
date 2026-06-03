import { describe, expect, it } from "vitest";
import type { Area, Unit } from "@/types/catalog";
import { buildUnitPreview, findAreaByName, findUnitByName, resolveInitialItemArea } from "@/components/planos/plan-item-form-helpers";

const areas: Area[] = [
  { id: "area-1", tenant_id: null, name: "PARÁ-AMAPÁ", sort_order: 0, active: true, created_at: "", updated_at: "" },
  { id: "area-2", tenant_id: null, name: "MARANHÃO", sort_order: 1, active: true, created_at: "", updated_at: "" },
];

const units: Unit[] = [
  { id: "unit-1", tenant_id: null, area_id: "area-1", name: "Belém", uf: "PA", responsavel: "", email: "", fone: "", sort_order: 0, active: true, created_at: "", updated_at: "" },
  { id: "unit-2", tenant_id: null, area_id: "area-1", name: "Macapá", uf: "AP", responsavel: "", email: "", fone: "", sort_order: 1, active: true, created_at: "", updated_at: "" },
  { id: "unit-3", tenant_id: null, area_id: "area-2", name: "São Luís", uf: "MA", responsavel: "", email: "", fone: "", sort_order: 2, active: true, created_at: "", updated_at: "" },
];

describe("findAreaByName", () => {
  it("matches area names ignoring case and surrounding whitespace", () => {
    expect(findAreaByName(areas, "  pará-amapá ")).toMatchObject({ id: "area-1" });
  });

  it("returns null when the area is unknown", () => {
    expect(findAreaByName(areas, "Ceará")).toBeNull();
  });
});

describe("findUnitByName", () => {
  it("matches unit names ignoring case and surrounding whitespace", () => {
    expect(findUnitByName(units, "  macapá ")).toMatchObject({ id: "unit-2" });
  });

  it("returns null when the unit is unknown", () => {
    expect(findUnitByName(units, "Fortaleza")).toBeNull();
  });
});

describe("resolveInitialItemArea", () => {
  it("prefers the item area when already stored", () => {
    expect(resolveInitialItemArea({
      itemArea: "MARANHÃO",
      planUnit: "Belém",
      catalogAreas: areas,
      catalogUnits: units,
    })).toBe("MARANHÃO");
  });

  it("derives the area from the plan unit when the item area is empty", () => {
    expect(resolveInitialItemArea({
      itemArea: "",
      planUnit: "Macapá",
      catalogAreas: areas,
      catalogUnits: units,
    })).toBe("PARÁ-AMAPÁ");
  });
});

describe("buildUnitPreview", () => {
  it("returns the filtered units for the selected area", () => {
    const preview = buildUnitPreview({
      selectedArea: "PARÁ-AMAPÁ",
      planUnit: "Belém",
      catalogAreas: areas,
      catalogUnits: units,
    });

    expect(preview.filteredUnitsForArea.map((unit) => unit.name)).toEqual(["Belém", "Macapá"]);
    expect(preview.isPlanUnitInsideSelectedArea).toBe(true);
    expect(preview.tone).toBe("default");
  });

  it("warns when the selected area does not contain the plan unit", () => {
    const preview = buildUnitPreview({
      selectedArea: "MARANHÃO",
      planUnit: "Belém",
      catalogAreas: areas,
      catalogUnits: units,
    });

    expect(preview.filteredUnitsForArea.map((unit) => unit.name)).toEqual(["São Luís"]);
    expect(preview.isPlanUnitInsideSelectedArea).toBe(false);
    expect(preview.tone).toBe("warning");
    expect(preview.message).toContain("não contém a unidade do plano");
  });

  it("falls back to all accessible units when no area is selected", () => {
    const preview = buildUnitPreview({
      selectedArea: "",
      planUnit: "Belém",
      catalogAreas: areas,
      catalogUnits: units,
    });

    expect(preview.filteredUnitsForArea).toHaveLength(3);
    expect(preview.message).toContain("Selecione uma área");
  });
});
