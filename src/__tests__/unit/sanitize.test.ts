import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeCNPJ, sanitizeCPF } from "@/lib/validation/sanitize";

describe("sanitizeText", () => {
  it("remove tags HTML", () => {
    expect(sanitizeText("<b>texto</b>")).toBe("texto");
  });

  it("remove scripts", () => {
    expect(sanitizeText("<script>alert(1)</script>texto")).toBe("texto");
  });

  it("normaliza espaços múltiplos", () => {
    expect(sanitizeText("texto   com    espaços")).toBe("texto com espaços");
  });

  it("retorna string vazia para input não-string", () => {
    expect(sanitizeText(null)).toBe("");
    expect(sanitizeText(undefined)).toBe("");
    expect(sanitizeText(123)).toBe("");
  });
});

describe("sanitizeCNPJ", () => {
  it("aceita CNPJ com formatação", () => {
    expect(sanitizeCNPJ("12.345.678/0001-90")).toBe("12345678000190");
  });

  it("rejeita CNPJ com dígitos insuficientes", () => {
    expect(sanitizeCNPJ("123")).toBeNull();
  });
});

describe("sanitizeCPF", () => {
  it("aceita CPF com formatação", () => {
    expect(sanitizeCPF("000.000.000-00")).toBe("00000000000");
  });

  it("rejeita CPF com dígitos insuficientes", () => {
    expect(sanitizeCPF("123")).toBeNull();
  });
});