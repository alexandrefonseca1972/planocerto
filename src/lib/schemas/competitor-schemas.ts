import { z } from "zod";
import { sanitizedString } from "@/lib/validation/sanitize";

export const instituicaoSchema = z.object({
  nome: sanitizedString({
    min: 2,
    max: 200,
    minMsg: "Nome deve ter pelo menos 2 caracteres.",
    maxMsg: "Nome deve ter no máximo 200 caracteres.",
  }),
  nome_fantasia: sanitizedString({ max: 200 }).default(""),
  cnpj: z.string().trim().max(18).default(""),
  tipo: z.enum(["Publica", "Privada", "Filantropica"]).default("Privada"),
  grupo_economico: sanitizedString({ max: 200 }).default(""),
  site: z.string().trim().max(500).default(""),
  unit_id: z.string().uuid().nullable().default(null),
  observacoes: sanitizedString({ max: 500 }).default(""),
  active: z.boolean().default(true),
});

export const cursoInstituicaoSchema = z.object({
  instituicao_id: z.string().min(1, "Instituição obrigatória."),
  curso_id: z.string().min(1, "Curso obrigatório."),
  tipo_pa_id: z.string().min(1, "Tipo obrigatório."),
  unit_id: z.string().nullable().default(null),
  coordenador_nome: sanitizedString({ max: 200 }).default(""),
  coordenador_email: z.string().trim().max(200).default(""),
  coordenador_telefone: z.string().trim().max(50).default(""),
  coordenador_lattes: z.string().trim().max(500).default(""),
  observacoes: sanitizedString({ max: 500 }).default(""),
});

export const corpoDocenteSchema = z.object({
  curso_instituicao_id: z.string().min(1, "Curso obrigatório."),
  nome: sanitizedString({
    min: 2,
    max: 200,
    minMsg: "Nome deve ter pelo menos 2 caracteres.",
    maxMsg: "Nome deve ter no máximo 200 caracteres.",
  }),
  titulacao: sanitizedString({ max: 100 }).default(""),
  lattes_url: z.string().trim().max(500).default(""),
  disciplina: sanitizedString({ max: 200 }).default(""),
  email: z.string().trim().max(200).default(""),
  regime: sanitizedString({ max: 50 }).default(""),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export const mensalidadeSchema = z.object({
  curso_instituicao_id: z.string().min(1, "Curso obrigatório."),
  modalidade_id: z.string().min(1, "Modalidade obrigatória."),
  turno_id: z.string().min(1, "Turno obrigatório."),
  valor: z.coerce.number().positive("Valor deve ser maior que zero."),
  periodo: z.enum(["mensal", "semestral", "anual"]).default("mensal"),
  desconto: sanitizedString({ max: 200 }).default(""),
  vigencia_inicio: z.string().min(1, "Data de início obrigatória."),
  vigencia_fim: z.string().nullable().default(null),
  data_coleta: z.string().default(""),
  fonte: sanitizedString({ max: 300 }).default(""),
  observacoes: sanitizedString({ max: 500 }).default(""),
});
