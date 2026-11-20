import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { LLM_KEY_SECRET: "segredo-de-teste-com-mais-de-32-caracteres" } }));

const T = "tenant-a";

import { decryptLlmKey, encryptLlmKey } from "@/lib/llm-secret";

describe("llm-secret", () => {
  it("cifra e decifra a API key", () => {
    const enc = encryptLlmKey("sk-abc123", T);
    expect(enc.startsWith("enc:v1:")).toBe(true);
    expect(enc).not.toContain("sk-abc123");
    expect(decryptLlmKey(enc, T)).toBe("sk-abc123");
  });

  it("cada cifragem é diferente (IV aleatório)", () => {
    expect(encryptLlmKey("x", T)).not.toBe(encryptLlmKey("x", T));
  });

  it("valor legado em texto puro continua legível", () => {
    expect(decryptLlmKey("sk-legado", T)).toBe("sk-legado");
  });

  it("valor adulterado é rejeitado", () => {
    const enc = encryptLlmKey("sk-abc123", T);
    const tampered = enc.slice(0, -4) + (enc.endsWith("AAAA") ? "BBBB" : "AAAA");
    expect(() => decryptLlmKey(tampered, T)).toThrow();
  });

  it("valor cifrado de uma empresa não decifra em outra (AAD)", () => {
    expect(() => decryptLlmKey(encryptLlmKey("sk-abc123", T), "tenant-b")).toThrow();
  });

  it("tag truncada ou valor curto é rejeitado", () => {
    expect(() => decryptLlmKey("enc:v1:" + Buffer.alloc(20).toString("base64"), T)).toThrow("Valor cifrado inválido.");
  });
});
