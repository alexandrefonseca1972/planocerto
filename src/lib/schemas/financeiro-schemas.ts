import { z } from "zod";
import { FORMAS_PAGAMENTO } from "@/types/financeiro";
import { sanitizedString } from "@/lib/validation/sanitize";

/**
 * Schemas zod do módulo financeiro. Importados pelas server actions e pelos
 * client components (useLiveValidation). Não podem viver dentro do arquivo
 * de actions ("use server" só permite exportar funções).
 */

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const categoriaDespesaSchema = z.object({
  name: sanitizedString({
    min: 2,
    max: 80,
    minMsg: "Nome deve ter pelo menos 2 caracteres.",
    maxMsg: "Nome deve ter no máximo 80 caracteres.",
  }),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  active: z.boolean().default(true),
});

export const parcelaInputSchema = z.object({
  numero: z.coerce.number().int().min(1).max(120),
  data_vencimento: z
    .string()
    .regex(dateRegex, "Data de vencimento inválida (use AAAA-MM-DD)."),
  valor: z.coerce.number().positive("Valor deve ser maior que zero."),
});

export const contaPagarSchema = z
  .object({
    fornecedor_id: z.string().uuid().nullable(),
    categoria_id: z.string().uuid().nullable(),
    plan_id: z.string().uuid().nullable(),
    item_id: z.string().uuid().nullable(),
    descricao: sanitizedString({
      min: 2,
      max: 200,
      minMsg: "Descrição deve ter pelo menos 2 caracteres.",
      maxMsg: "Descrição deve ter no máximo 200 caracteres.",
    }),
    documento: sanitizedString({ max: 60 }).optional().default(""),
    emissao: z
      .string()
      .regex(dateRegex)
      .nullable()
      .optional()
      .or(z.literal("")),
    valor_total: z.coerce
      .number()
      .positive("Valor total deve ser maior que zero."),
    observacoes: sanitizedString({ max: 2000 }).optional().default(""),
    parcelas: z
      .array(parcelaInputSchema)
      .min(1, "Pelo menos uma parcela.")
      .max(120, "Máximo de 120 parcelas."),
  })
  .refine(
    (d) => {
      const soma = d.parcelas.reduce((s, p) => s + p.valor, 0);
      return Math.abs(soma - d.valor_total) < 0.01;
    },
    {
      message: "Soma das parcelas difere do valor total.",
      path: ["parcelas"],
    },
  )
  .refine(
    (d) => {
      const numeros = d.parcelas.map((p) => p.numero);
      return new Set(numeros).size === numeros.length;
    },
    {
      message: "Números de parcela não podem se repetir.",
      path: ["parcelas"],
    },
  );

export const pagamentoSchema = z.object({
  parcela_id: z.string().uuid(),
  data_pagamento: z
    .string()
    .regex(dateRegex, "Data de pagamento inválida (use AAAA-MM-DD)."),
  valor_pago: z.coerce.number().positive("Valor pago deve ser maior que zero."),
  forma_pagamento: z.enum(FORMAS_PAGAMENTO),
  observacoes: sanitizedString({ max: 500 }).optional().default(""),
});

export type ContaPagarFormValues = z.infer<typeof contaPagarSchema>;
export type ParcelaInputValues = z.infer<typeof parcelaInputSchema>;
export type PagamentoFormValues = z.infer<typeof pagamentoSchema>;
export type CategoriaDespesaFormValues = z.infer<typeof categoriaDespesaSchema>;
