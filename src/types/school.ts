import type { Prioridade } from "./catalog";

export interface School {
  id: string;
  tenant_id: string;
  unit_id: string | null;
  conveniado: boolean;
  prioridade: Prioridade;
  nome: string;
  tipo_escola: string;
  publico_alvo: string;
  endereco: string;
  bairro: string;
  municipio: string;
  uf: string;
  pais: string;
  diretor: string;
  contato_diretor: string;
  coordenador_3ano: string;
  contato_coordenador: string;
  base_alunos_em: number;
  base_alunos_3ano: number;
  mensalidade_3ano: number;
  numero_colaboradores: number;
  consultor: string;
  meta_inscritos: number;
  inscritos_real: number;
  meta_financeira: number;
  financeira_real: number;
  meta_academica: number;
  academica_real: number;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchoolFormState {
  message?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
}
