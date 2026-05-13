import { describe, expect, it } from "vitest";
import { buildOfficialPlanHeader, getPlanFormProgress, normalizePlanFormValue, resolvePlanTitle, validatePlanFormDraft } from "@/components/planos/plan-form-helpers";

describe("normalizePlanFormValue", () => {
  it("returns empty string for nullish values", () => {
    expect(normalizePlanFormValue(undefined)).toBe("");
    expect(normalizePlanFormValue(null)).toBe("");
  });

  it("preserves provided strings", () => {
    expect(normalizePlanFormValue("Plano comercial")).toBe("Plano comercial");
  });
});

describe("validatePlanFormDraft", () => {
  it("rejects draft when unit is too short for the official model", () => {
    const result = validatePlanFormDraft({
      title: "",
      unit: "A",
      director: "",
      goal: "",
    });

    expect(result.titleValid).toBe(false);
    expect(result.unitValid).toBe(false);
    expect(result.canSubmit).toBe(false);
  });

  it("accepts draft when unit has at least 2 chars and title can be derived from it", () => {
    const result = validatePlanFormDraft({
      title: "",
      unit: "Belém",
      director: "",
      goal: "",
    });

    expect(result.titleValid).toBe(true);
    expect(result.unitValid).toBe(true);
    expect(result.canSubmit).toBe(true);
  });

  it("rejects typed unit with less than 2 non-space chars", () => {
    const result = validatePlanFormDraft({
      title: "",
      unit: "A",
      director: "",
      goal: "",
    });

    expect(result.unitValid).toBe(false);
    expect(result.unitError).toContain("Selecione ou digite");
    expect(result.canSubmit).toBe(false);
  });

  it("does not impose artificial minimum length on optional fields", () => {
    const result = validatePlanFormDraft({
      title: "Plano válido",
      unit: "AB",
      director: "B",
      goal: "C",
    });

    expect(result.unitValid).toBe(true);
    expect(result.directorValid).toBe(true);
    expect(result.goalValid).toBe(true);
  });
});

describe("official model helpers", () => {
  it("builds the header preview used by the official spreadsheet model", () => {
    expect(buildOfficialPlanHeader("Belém")).toBe("PLANO DE AÇÃO | Belém");
    expect(buildOfficialPlanHeader("")).toBe("PLANO DE AÇÃO | NOME DA UNIDADE");
  });

  it("resolves the persisted title from custom title or unit fallback", () => {
    expect(resolvePlanTitle("Plano comercial 2026", "Belém")).toBe("Plano comercial 2026");
    expect(resolvePlanTitle(" ", "Belém")).toBe("Belém");
  });
});

describe("getPlanFormProgress", () => {
  it("counts only non-empty trimmed fields", () => {
    const result = getPlanFormProgress({
      title: " Plano ",
      unit: "   ",
      director: "Diretora",
      goal: "",
    });

    expect(result.fieldsFilled).toBe(2);
    expect(result.totalFields).toBe(4);
    expect(result.formProgress).toBe(50);
  });
});
