import { describe, expect, it } from "vitest";
import {
  formatCNPJ,
  isValidCNPJ,
  formatPhone,
  isValidPhone,
  isValidEmail,
  isValidWebsite,
  normalizeWebsite,
  stripFormat,
  formatBRL,
  formatDateBR,
} from "@/lib/format-br";

describe("formatCNPJ", () => {
  it("aplica máscara progressiva", () => {
    expect(formatCNPJ("11")).toBe("11");
    expect(formatCNPJ("112")).toBe("11.2");
    expect(formatCNPJ("11222")).toBe("11.222");
    expect(formatCNPJ("11222333")).toBe("11.222.333");
    expect(formatCNPJ("112223330001")).toBe("11.222.333/0001");
    expect(formatCNPJ("11222333000181")).toBe("11.222.333/0001-81");
  });
  it("ignora não-dígitos e limita a 14 dígitos", () => {
    expect(formatCNPJ("11.222.333/0001-81xx")).toBe("11.222.333/0001-81");
    expect(formatCNPJ("1122233300018199")).toBe("11.222.333/0001-81");
  });
});

describe("isValidCNPJ", () => {
  it("aceita CNPJ com dígito verificador correto", () => {
    expect(isValidCNPJ("11.222.333/0001-81")).toBe(true);
    expect(isValidCNPJ("11222333000181")).toBe(true);
  });
  it("rejeita tamanho errado, repetidos e DV inválido", () => {
    expect(isValidCNPJ("123")).toBe(false);
    expect(isValidCNPJ("11111111111111")).toBe(false);
    expect(isValidCNPJ("11222333000180")).toBe(false);
  });
});

describe("formatPhone", () => {
  it("mascara fixo e celular", () => {
    expect(formatPhone("")).toBe("");
    expect(formatPhone("11")).toBe("(11");
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
    expect(formatPhone("11999998888")).toBe("(11) 99999-8888");
  });
  it("limita a 11 dígitos", () => {
    expect(formatPhone("119999988889999")).toBe("(11) 99999-8888");
  });
});

describe("isValidPhone", () => {
  it("aceita fixo (10) e celular (11) com DDD válido", () => {
    expect(isValidPhone("(11) 3333-4444")).toBe(true);
    expect(isValidPhone("11999998888")).toBe(true);
  });
  it("rejeita DDD inválido, tamanho errado e celular sem 9", () => {
    expect(isValidPhone("(10) 3333-4444")).toBe(false);
    expect(isValidPhone("123")).toBe(false);
    expect(isValidPhone("11888887777")).toBe(false); // 11 dígitos mas 3º != 9
  });
});

describe("isValidEmail", () => {
  it("valida formato simples", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
    expect(isValidEmail("  a@b.com  ")).toBe(true);
    expect(isValidEmail("invalido")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
  });
});

describe("isValidWebsite / normalizeWebsite", () => {
  it("aceita com e sem protocolo e exige ponto no host", () => {
    expect(isValidWebsite("exemplo.com")).toBe(true);
    expect(isValidWebsite("https://exemplo.com")).toBe(true);
    expect(isValidWebsite("semponto")).toBe(false);
    expect(isValidWebsite("")).toBe(false);
  });
  it("normalizeWebsite prepende https quando falta", () => {
    expect(normalizeWebsite("exemplo.com")).toBe("https://exemplo.com");
    expect(normalizeWebsite("http://x.com")).toBe("http://x.com");
    expect(normalizeWebsite("  ")).toBe("");
  });
});

describe("stripFormat / formatBRL / formatDateBR", () => {
  it("stripFormat devolve só dígitos", () => {
    expect(stripFormat("11.222.333/0001-81")).toBe("11222333000181");
  });
  it("formatBRL formata moeda e trata inválidos como 0", () => {
    expect(formatBRL(1234.56)).toContain("1.234,56");
    expect(formatBRL(null)).toContain("0,00");
    expect(formatBRL(undefined)).toContain("0,00");
    expect(formatBRL(NaN)).toContain("0,00");
  });
  it("formatDateBR converte ISO para dd/mm/aaaa", () => {
    expect(formatDateBR("2026-06-23")).toBe("23/06/2026");
    expect(formatDateBR("2026-06-23T10:00:00Z")).toBe("23/06/2026");
    expect(formatDateBR("")).toBe("");
    expect(formatDateBR(null)).toBe("");
  });
});
