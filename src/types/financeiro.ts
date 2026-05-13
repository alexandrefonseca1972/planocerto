export type ContaStatus = "pendente" | "parcial" | "quitado" | "cancelado";

export type ParcelaStatus = "pendente" | "pago" | "cancelado";

export const FORMAS_PAGAMENTO = [
  "pix",
  "boleto",
  "dinheiro",
  "cartao",
  "transferencia",
  "outro",
] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  pix: "PIX",
  boleto: "Boleto",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  transferencia: "Transferência",
  outro: "Outro",
};

export const CONTA_STATUS_LABELS: Record<ContaStatus, string> = {
  pendente: "Pendente",
  parcial: "Parcialmente paga",
  quitado: "Quitada",
  cancelado: "Cancelada",
};

export const ANEXO_TIPOS = [
  "nf",
  "recibo",
  "contrato",
  "boleto",
  "comprovante",
  "outro",
] as const;
export type AnexoTipo = (typeof ANEXO_TIPOS)[number];

export const ANEXO_TIPO_LABELS: Record<AnexoTipo, string> = {
  nf: "Nota fiscal",
  recibo: "Recibo",
  contrato: "Contrato",
  boleto: "Boleto",
  comprovante: "Comprovante",
  outro: "Outro",
};

export const PARCELA_STATUS_LABELS: Record<ParcelaStatus, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
};

export interface CategoriaDespesa {
  id: string;
  tenant_id: string | null;
  name: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContaPagar {
  id: string;
  tenant_id: string;
  plan_id: string | null;
  item_id: string | null;
  fornecedor_id: string | null;
  categoria_id: string | null;
  descricao: string;
  documento: string;
  emissao: string | null;
  valor_total: number;
  status: ContaStatus;
  observacoes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParcelaPagar {
  id: string;
  conta_id: string;
  numero: number;
  data_vencimento: string;
  valor: number;
  data_pagamento: string | null;
  valor_pago: number | null;
  forma_pagamento: FormaPagamento | "";
  status: ParcelaStatus;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface ContaAttachment {
  id: string;
  conta_id: string;
  filename: string;
  storage_path: string;
  size: number;
  mime_type: string;
  tipo: AnexoTipo;
  uploaded_by: string | null;
  created_at: string;
}

export interface ContaComParcelas extends ContaPagar {
  parcelas: ParcelaPagar[];
  fornecedor_nome?: string | null;
  categoria_nome?: string | null;
  plan_title?: string | null;
  item_action?: string | null;
  attachments_count?: number;
  total_pago?: number;
  total_pendente?: number;
  proxima_vencimento?: string | null;
  tem_atrasada?: boolean;
}

export interface ResumoFinanceiro {
  total_em_aberto: number;
  total_atrasado: number;
  total_pago_periodo: number;
  contas_quantidade: number;
  proximas_7d: {
    parcela_id: string;
    conta_id: string;
    descricao: string;
    vencimento: string;
    valor: number;
  }[];
  // Vencimentos do mês selecionado (todas as parcelas pendentes no range)
  vencimentos_mes: {
    parcela_id: string;
    conta_id: string;
    descricao: string;
    vencimento: string;
    valor: number;
    atrasada: boolean;
  }[];
  // Por fornecedor (range de pagamento)
  por_fornecedor: {
    fornecedor_id: string | null;
    fornecedor_nome: string;
    total_pago: number;
    total_aberto: number;
  }[];
  // Por status (contagem de contas)
  por_status: {
    status: string;
    quantidade: number;
    valor_total: number;
  }[];
  // Por mês — para visão anual (12 entradas)
  por_mes: {
    mes: string; // "YYYY-MM"
    total_pago: number;
    total_aberto: number;
  }[];
}

export interface FinanceFormState {
  message?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
  contaId?: string;
}

export interface ContaListFilters {
  status?: ContaStatus | "atrasado" | "todos";
  fornecedor_id?: string | null;
  categoria_id?: string | null;
  plan_id?: string | null;
  item_id?: string | null;
  search?: string;
  vencimento_from?: string;
  vencimento_to?: string;
  emissao_from?: string;
  emissao_to?: string;
}
