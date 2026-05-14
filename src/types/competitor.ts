export interface Instituicao {
  id: string;
  tenant_id: string;
  nome: string;
  nome_fantasia: string;
  cnpj: string;
  tipo: "Publica" | "Privada" | "Filantropica";
  grupo_economico: string;
  site: string;
  unit_id: string | null;
  observacoes: string;
  active: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstituicaoFormState {
  message?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
}

export interface CursoInstituicao {
  id: string;
  instituicao_id: string;
  curso_id: string;
  tipo_pa_id: string;
  unit_id: string | null;
  coordenador_nome: string;
  coordenador_email: string;
  coordenador_telefone: string;
  coordenador_lattes: string;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface CursoInstituicaoFormState {
  message?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
}

export interface CorpoDocente {
  id: string;
  curso_instituicao_id: string;
  nome: string;
  titulacao: string;
  lattes_url: string;
  disciplina: string;
  email: string;
  regime: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CorpoDocenteFormState {
  message?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
}

export interface MensalidadeConcorrente {
  id: string;
  curso_instituicao_id: string;
  modalidade_id: string;
  turno_id: string;
  valor: number;
  periodo: "mensal" | "semestral" | "anual";
  desconto: string;
  vigencia_inicio: string;
  vigencia_fim: string | null;
  data_coleta: string;
  fonte: string;
  observacoes: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MensalidadeConcorrenteFormState {
  message?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
}

export interface Modalidade {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CursoSuperior {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Turno {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TipoPa {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}
