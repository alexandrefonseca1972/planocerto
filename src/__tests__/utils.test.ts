import { describe, it, expect } from "vitest";
import { cn, sanitizeInput, formatDate, getErrorMessage } from "@/lib/utils";

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

describe("sanitizeInput()", () => {
  it("removes angle brackets", () => {
    expect(sanitizeInput("<script>alert('xss')</script>")).toBe("scriptalert('xss')/script");
  });

  it("preserves valid text", () => {
    expect(sanitizeInput("Hello World! @#$%")).toBe("Hello World! @#$%");
  });

  it("returns empty string for non-string input", () => {
    expect(sanitizeInput(undefined as unknown as string)).toBe("");
    expect(sanitizeInput(null as unknown as string)).toBe("");
  });

  it("handles empty string", () => {
    expect(sanitizeInput("")).toBe("");
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

describe("getErrorMessage()", () => {
  it("extracts message from Error", () => {
    expect(getErrorMessage(new Error("test error"))).toBe("test error");
  });

  it("returns string directly", () => {
    expect(getErrorMessage("plain error")).toBe("plain error");
  });

  it("returns fallback for unknown types", () => {
    expect(getErrorMessage({})).toBe("Ocorreu um erro inesperado. Tente novamente.");
  });
});
