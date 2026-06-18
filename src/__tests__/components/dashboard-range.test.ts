import { describe, expect, it } from "vitest";
import { isWithinRange } from "@/components/dashboard/dashboard-range";

describe("isWithinRange", () => {
  it("sem intervalo ativo (from/to vazios) não restringe", () => {
    expect(isWithinRange("2026-02-01", null, null)).toBe(true);
    expect(isWithinRange(null, null, null)).toBe(true);
    expect(isWithinRange("2026-02-01", "2026-01-01", null)).toBe(true);
    expect(isWithinRange("2026-02-01", null, "2026-03-01")).toBe(true);
  });

  it("inclui prazos dentro do intervalo (limites inclusivos)", () => {
    expect(isWithinRange("2026-01-01", "2026-01-01", "2026-03-01")).toBe(true);
    expect(isWithinRange("2026-02-15", "2026-01-01", "2026-03-01")).toBe(true);
    expect(isWithinRange("2026-03-01", "2026-01-01", "2026-03-01")).toBe(true);
  });

  it("exclui prazos fora do intervalo", () => {
    expect(isWithinRange("2025-12-31", "2026-01-01", "2026-03-01")).toBe(false);
    expect(isWithinRange("2026-03-02", "2026-01-01", "2026-03-01")).toBe(false);
  });

  it("exclui ações sem prazo quando há intervalo ativo", () => {
    expect(isWithinRange(null, "2026-01-01", "2026-03-01")).toBe(false);
  });
});
