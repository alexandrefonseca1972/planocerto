import { z } from "zod";
import { sanitizedString } from "@/lib/validation/sanitize";

export const planSchema = z.object({
  title: sanitizedString({
    min: 2,
    max: 200,
    minMsg: "Título obrigatório e mínimo 2 caracteres.",
    maxMsg: "Máximo 200 caracteres.",
  }),
  unit_id: z.preprocess((value) => (value === "" ? undefined : value), z.string().uuid().optional()),
  unit: sanitizedString({ max: 200 }).optional(),
  director: sanitizedString({ max: 200 }).optional(),
  goal: sanitizedString({ max: 1000 }).optional(),
  status: z.enum(["active", "archived"]).default("active"),
  exercicio: z.preprocess((v) => (!v ? undefined : v), z.coerce.number().int().min(2000).max(2100).optional()),
  budget_limit: z.preprocess((v) => (!v ? undefined : v), z.coerce.number().min(0).optional()),
  visibility: z.enum(["public", "restricted"]).default("public"),
});

export const itemSchema = z.object({
  action: sanitizedString({ min: 3, max: 500, minMsg: "Mínimo 3 caracteres." }),
  number: z.string().trim().min(1).max(20),
  parent_id: z.string().optional(),
  sort_order: z.coerce.number().int().default(0),
  // Classificação
  tipo_pa: sanitizedString({ max: 100 }).optional(),
  area: sanitizedString({ max: 100 }).optional(),
  prioridade: sanitizedString({ max: 100 }).optional(),
  subacao: sanitizedString({ max: 500 }).optional(),
  como: sanitizedString({ max: 1000 }).optional(),
  // 5W2H
  why: sanitizedString({ max: 1000 }).optional(),
  where: sanitizedString({ max: 500 }).optional(),
  responsible: sanitizedString({ max: 200 }).optional(),
  planned_start: z.string().optional(),
  planned_end: z.string().optional(),
  actual_start: z.string().optional(),
  actual_end: z.string().optional(),
  cost: sanitizedString({ max: 100 }).optional(),
  expected_result: sanitizedString({ max: 1000 }).optional(),
  actual_result: sanitizedString({ max: 1000 }).optional(),
  status: z.coerce.number().int().min(1).max(5).default(1),
  observations: sanitizedString({ max: 2000 }).optional(),
  // Métricas
  preco: z.coerce.number().min(0).optional(),
  inscritos_esperado: z.coerce.number().int().min(0).optional(),
  inscritos_real: z.coerce.number().int().min(0).optional(),
  mat_fin_esperado: z.coerce.number().int().min(0).optional(),
  mat_fin_real: z.coerce.number().int().min(0).optional(),
  mat_acad_esperado: z.coerce.number().int().min(0).optional(),
  mat_acad_real: z.coerce.number().int().min(0).optional(),
});
