import { describe, expect, it } from "vitest";
import { isValidActionText, resolveSelectedPlanId } from "@/components/planos/planos-page-helpers";

describe("resolveSelectedPlanId", () => {
  const plans = [
    { id: "plan-1" },
    { id: "plan-2" },
  ];

  it("uses requested plan when it exists in the loaded list", () => {
    expect(resolveSelectedPlanId(plans, "plan-2")).toBe("plan-2");
  });

  it("falls back to the first plan when the requested id is missing", () => {
    expect(resolveSelectedPlanId(plans, "missing-plan")).toBe("plan-1");
  });

  it("returns null when there are no plans", () => {
    expect(resolveSelectedPlanId([], "plan-2")).toBeNull();
  });
});

describe("isValidActionText", () => {
  it("accepts action text with at least 3 non-space chars", () => {
    expect(isValidActionText("ABC")).toBe(true);
    expect(isValidActionText("  ABC  ")).toBe(true);
  });

  it("rejects empty, whitespace-only, or too-short values", () => {
    expect(isValidActionText("")).toBe(false);
    expect(isValidActionText("  ")).toBe(false);
    expect(isValidActionText("AB")).toBe(false);
  });
});

