export interface Company {
  id: string;
  tenant_id: string;
  unit_id: string | null;
  conveniado: boolean;
  cluster: string;
  segmento: string;
  cnpj: string;
  nome_fantasia: string;
  chance_contato: "" | "Alta" | "Media" | "Baixa";
  faixa_funcionarios: string;
  endereco: string;
  bairro: string;
  municipio: string;
  uf: string;
  pais: string;
  responsavel_nome: string;
  responsavel_cargo: string;
  contato_whatsapp: string;
  email: string;
  link_facebook: string;
  link_instagram: string;
  consultor: string;
  data_primeira_visita: string | null;
  data_previsao_retorno: string | null;
  data_retorno_real: string | null;
  qtd_oportunidade: number;
  inscritos_real: number;
  financeira_real: number;
  academica_real: number;
  comentarios: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyFormState {
  message?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
}
