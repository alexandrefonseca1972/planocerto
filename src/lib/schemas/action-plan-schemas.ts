import { z } from "zod";

export const planSchema = z.object({
  title: z.string().trim().min(2, "Título obrigatório e mínimo 2 caracteres.").max(200, "Máximo 200 caracteres."),
  unit: z.string().max(200).trim().optional(),
  director: z.string().max(200).trim().optional(),
  goal: z.string().max(1000).trim().optional(),
});

export const itemSchema = z.object({
  action: z.string().trim().min(3, "Mínimo 3 caracteres.").max(500),
  number: z.string().trim().min(1).max(20),
  parent_id: z.string().optional(),
  sort_order: z.coerce.number().int().default(0),
  // Classificação
  tipo_pa: z.string().max(100).trim().optional(),
  area: z.string().max(100).trim().optional(),
  prioridade: z.string().max(100).trim().optional(),
  subacao: z.string().max(500).trim().optional(),
  como: z.string().max(1000).trim().optional(),
  // 5W2H
  why: z.string().max(1000).trim().optional(),
  where: z.string().max(500).trim().optional(),
  responsible: z.string().max(200).trim().optional(),
  planned_start: z.string().optional(),
  planned_end: z.string().optional(),
  actual_start: z.string().optional(),
  actual_end: z.string().optional(),
  cost: z.string().max(100).trim().optional(),
  expected_result: z.string().max(1000).trim().optional(),
  actual_result: z.string().max(1000).trim().optional(),
  status: z.coerce.number().int().min(1).max(5).default(1),
  observations: z.string().max(2000).trim().optional(),
  // Métricas
  preco: z.coerce.number().min(0).optional(),
  inscritos_esperado: z.coerce.number().int().min(0).optional(),
  inscritos_real: z.coerce.number().int().min(0).optional(),
  mat_fin_esperado: z.coerce.number().int().min(0).optional(),
  mat_fin_real: z.coerce.number().int().min(0).optional(),
  mat_acad_esperado: z.coerce.number().int().min(0).optional(),
  mat_acad_real: z.coerce.number().int().min(0).optional(),
});
