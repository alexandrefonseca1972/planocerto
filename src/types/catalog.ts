export interface Area {
  id: string;
  tenant_id: string | null;
  name: string;
  regional_context?: {
    perfil_persona?: string;
    regionalidade?: string;
    eventos_locais?: string;
    concorrentes?: string;
  };
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  tenant_id: string | null;
  area_id: string | null;
  name: string;
  uf: string;
  regional_context?: {
    perfil_persona?: string;
    regionalidade?: string;
    eventos_locais?: string;
    concorrentes?: string;
  };
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MacroAcao {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  name: string;
  sort_order: number;
}

export interface TipoPA {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Fornecedor {
  id: string;
  tenant_id: string | null;
  name: string;
  cnpj: string;
  categoria: string;
  contato_nome: string;
  contato_email: string;
  contato_telefone: string;
  observacoes: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CatalogFormState {
  message?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
}

export const PRIORIDADES = ["Alta", "Media", "Baixa"] as const;
export type Prioridade = (typeof PRIORIDADES)[number];

export interface PrioridadeRow {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

export const PRIORIDADE_COLORS = ["red", "amber", "emerald", "blue", "zinc"] as const;
export type PrioridadeColor = (typeof PRIORIDADE_COLORS)[number];

export const CHANCE_CONTATO = ["Alta", "Media", "Baixa"] as const;
export type ChanceContato = (typeof CHANCE_CONTATO)[number];
