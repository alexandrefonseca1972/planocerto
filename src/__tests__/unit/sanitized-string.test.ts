import { describe, it, expect } from "vitest";
import { sanitizedString } from "@/lib/validation/sanitize";
import { planSchema, itemSchema } from "@/lib/schemas/action-plan-schemas";

describe("sanitizedString (helper zod)", () => {
  it("remove tags HTML antes de retornar", () => {
    expect(sanitizedString({ max: 50 }).parse("<b>texto</b>")).toBe("texto");
  });

  it("remove scripts", () => {
    expect(sanitizedString({ max: 50 }).parse("<script>alert(1)</script>ok")).toBe("ok");
  });

  it("normaliza espaços e faz trim", () => {
    expect(sanitizedString({ max: 50 }).parse("  a   b  ")).toBe("a b");
  });

  it("valida o comprimento sobre o valor JÁ sanitizado (sanitize antes de min)", () => {
    // "<b></b>" tem 7 chars crus, mas sanitiza para "" — deve falhar no min(2).
    const r = sanitizedString({ min: 2, minMsg: "muito curto" }).safeParse("<b></b>");
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe("muito curto");
  });

  it("rejeita acima do max após sanitizar", () => {
    expect(sanitizedString({ max: 3 }).safeParse("abcd").success).toBe(false);
  });
});

describe("schemas: sanitização integrada", () => {
  it("planSchema limpa o título", () => {
    const r = planSchema.parse({ title: "<script>x</script>Plano Comercial" });
    expect(r.title).toBe("Plano Comercial");
  });

  it("itemSchema limpa action e observations", () => {
    const r = itemSchema.parse({
      action: "<b>Fazer diagnóstico</b>",
      number: "1",
      observations: "<img src=x onerror=alert(1)>nota",
    });
    expect(r.action).toBe("Fazer diagnóstico");
    expect(r.observations).toBe("nota");
  });

  it("itemSchema mantém campos de texto opcionais ausentes como undefined", () => {
    const r = itemSchema.parse({ action: "Ação válida", number: "1" });
    expect(r.observations).toBeUndefined();
  });
});
