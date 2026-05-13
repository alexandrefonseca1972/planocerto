import { describe, it, expect } from "vitest";
import { contaPagarSchema, pagamentoSchema } from "@/lib/schemas/financeiro-schemas";

const baseConta = {
  fornecedor_id: "550e8400-e29b-41d4-a716-446655440000",
  categoria_id: "660e8400-e29b-41d4-a716-446655440001",
  plan_id: null,
  item_id: null,
  descricao: "Office supplies",
  valor_total: 100.00,
  parcelas: [
    { numero: 1, data_vencimento: "2026-06-09", valor: 50.00 },
    { numero: 2, data_vencimento: "2026-07-09", valor: 50.00 },
  ],
};

describe("contaPagarSchema", () => {
  it("accepts valid payload with matching sum", () => {
    const result = contaPagarSchema.safeParse(baseConta);
    expect(result.success).toBe(true);
  });

  it("rejects when parcela sum differs significantly", () => {
    const data = {
      ...baseConta,
      parcelas: [
        { numero: 1, data_vencimento: "2026-06-09", valor: 40.00 },
        { numero: 2, data_vencimento: "2026-07-09", valor: 50.00 },
      ],
    };
    const result = contaPagarSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts small rounding differences (tolerance 0.01)", () => {
    const data = {
      ...baseConta,
      parcelas: [
        { numero: 1, data_vencimento: "2026-06-09", valor: 50.001 },
        { numero: 2, data_vencimento: "2026-07-09", valor: 50.001 },
      ],
    };
    const result = contaPagarSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects duplicate parcela numbers", () => {
    const data = {
      ...baseConta,
      parcelas: [
        { numero: 1, data_vencimento: "2026-06-09", valor: 50.00 },
        { numero: 1, data_vencimento: "2026-07-09", valor: 50.00 },
      ],
    };
    const result = contaPagarSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects valor_total <= 0", () => {
    const data = { ...baseConta, valor_total: 0, parcelas: [] };
    const result = contaPagarSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts null fornecedor_id", () => {
    const data = {
      ...baseConta,
      fornecedor_id: null,
      parcelas: [
        { numero: 1, data_vencimento: "2026-06-09", valor: 100.00 },
      ],
    };
    const result = contaPagarSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects fornecedor_id that is not UUID", () => {
    const data = { ...baseConta, fornecedor_id: "not-a-uuid" };
    const result = contaPagarSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects descricao with < 2 chars", () => {
    const data = { ...baseConta, descricao: "A" };
    const result = contaPagarSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe("pagamentoSchema", () => {
  const basePagamento = {
    parcela_id: "550e8400-e29b-41d4-a716-446655440000",
    data_pagamento: "2026-06-09",
    valor_pago: 50.00,
    forma_pagamento: "dinheiro" as const,
  };

  it("accepts valid payload", () => {
    const result = pagamentoSchema.safeParse(basePagamento);
    expect(result.success).toBe(true);
  });

  it("rejects parcela_id that is not UUID", () => {
    const data = { ...basePagamento, parcela_id: "not-a-uuid" };
    const result = pagamentoSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const data = { ...basePagamento, data_pagamento: "09/06/2026" };
    const result = pagamentoSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects valor_pago <= 0", () => {
    const data = { ...basePagamento, valor_pago: 0 };
    const result = pagamentoSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects forma_pagamento outside enum", () => {
    const data = { ...basePagamento, forma_pagamento: "Cryptocurrency" };
    const result = pagamentoSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
