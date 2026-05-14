import { z } from "zod";

export const instituicaoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(200, "Nome deve ter no máximo 200 caracteres."),
  nome_fantasia: z.string().trim().max(200).default(""),
  cnpj: z.string().trim().max(18).default(""),
  tipo: z.enum(["Publica", "Privada", "Filantropica"]).default("Privada"),
  grupo_economico: z.string().trim().max(200).default(""),
  site: z.string().trim().max(500).default(""),
  unit_id: z.string().uuid().nullable().default(null),
  observacoes: z.string().trim().max(500).default(""),
  active: z.boolean().default(true),
});

export const cursoInstituicaoSchema = z.object({
  instituicao_id: z.string().min(1, "Instituição obrigatória."),
  curso_id: z.string().min(1, "Curso obrigatório."),
  tipo_pa_id: z.string().min(1, "Tipo obrigatório."),
  unit_id: z.string().nullable().default(null),
  coordenador_nome: z.string().trim().max(200).default(""),
  coordenador_email: z.string().trim().max(200).default(""),
  coordenador_telefone: z.string().trim().max(50).default(""),
  coordenador_lattes: z.string().trim().max(500).default(""),
  observacoes: z.string().trim().max(500).default(""),
});

export const corpoDocenteSchema = z.object({
  curso_instituicao_id: z.string().min(1, "Curso obrigatório."),
  nome: z
    .string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(200, "Nome deve ter no máximo 200 caracteres."),
  titulacao: z.string().trim().max(100).default(""),
  lattes_url: z.string().trim().max(500).default(""),
  disciplina: z.string().trim().max(200).default(""),
  email: z.string().trim().max(200).default(""),
  regime: z.string().trim().max(50).default(""),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export const mensalidadeSchema = z.object({
  curso_instituicao_id: z.string().min(1, "Curso obrigatório."),
  modalidade_id: z.string().min(1, "Modalidade obrigatória."),
  turno_id: z.string().min(1, "Turno obrigatório."),
  valor: z.coerce.number().positive("Valor deve ser maior que zero."),
  periodo: z.enum(["mensal", "semestral", "anual"]).default("mensal"),
  desconto: z.string().trim().max(200).default(""),
  vigencia_inicio: z.string().min(1, "Data de início obrigatória."),
  vigencia_fim: z.string().nullable().default(null),
  data_coleta: z.string().default(""),
  fonte: z.string().trim().max(300).default(""),
  observacoes: z.string().trim().max(500).default(""),
});
