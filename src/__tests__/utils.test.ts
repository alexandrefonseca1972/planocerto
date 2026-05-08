import { describe, it, expect } from "vitest";
import { cn, formatDate } from "@/lib/utils";

describe("cn()", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("formatDate()", () => {
  it("formats a valid date", () => {
    const result = formatDate("2026-01-15T10:30:00Z");
    expect(result).toMatch(/15\/01\/2026/);
  });

  it("returns fallback for null", () => {
    expect(formatDate(null)).toBe("Não disponível");
  });

  it("returns fallback for undefined", () => {
    expect(formatDate(undefined)).toBe("Não disponível");
  });

  it("returns fallback for invalid date", () => {
    expect(formatDate("invalid")).toBe("Data inválida");
  });
});
