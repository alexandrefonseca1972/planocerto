export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; name: string; email: string; role: string;
          avatar_url: string | null; active_tenant_id: string | null;
          phone: string; social_media: Json;
          permissions: Json; login_start_time: string | null; login_end_time: string | null; is_active: boolean;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; name?: string; email?: string; role?: string;
          avatar_url?: string | null; active_tenant_id?: string | null;
          phone?: string; social_media?: Json;
          permissions?: Json; login_start_time?: string | null; login_end_time?: string | null; is_active?: boolean;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; name?: string; email?: string; role?: string;
          avatar_url?: string | null; active_tenant_id?: string | null;
          phone?: string; social_media?: Json;
          permissions?: Json; login_start_time?: string | null; login_end_time?: string | null; is_active?: boolean;
          created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          id: string; name: string; description: string;
          permissions: Json; is_system: boolean;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; name: string; description?: string;
          permissions?: Json; is_system?: boolean;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; name?: string; description?: string;
          permissions?: Json; is_system?: boolean;
          created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      tenants: {
        Row: {
          id: string; name: string; slug: string;
          plan: "free" | "pro" | "enterprise"; active: boolean;
          logo_url: string | null; teams_webhook_url: string;
          cnpj: string; responsavel_nome: string;
          email: string; site: string; fone: string;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; name: string; slug: string;
          plan?: "free" | "pro" | "enterprise"; active?: boolean;
          logo_url?: string | null; teams_webhook_url?: string;
          cnpj?: string; responsavel_nome?: string;
          email?: string; site?: string; fone?: string;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; name?: string; slug?: string;
          plan?: "free" | "pro" | "enterprise"; active?: boolean;
          logo_url?: string | null; teams_webhook_url?: string;
          cnpj?: string; responsavel_nome?: string;
          email?: string; site?: string; fone?: string;
          created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      tenant_members: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
        Relationships: [];
      };
      action_plans: {
        Row: {
          id: string; tenant_id: string; title: string;
          unit: string; director: string; goal: string;
          status: string; user_id: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; tenant_id: string; title: string;
          unit?: string; director?: string; goal?: string;
          status?: string; user_id?: string; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; tenant_id?: string; title?: string;
          unit?: string; director?: string; goal?: string;
          status?: string; user_id?: string; created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      action_items: {
        Row: {
          id: string; plan_id: string; parent_id: string | null; number: string; sort_order: number;
          action: string; why: string; where: string; responsible: string;
          planned_start: string | null; planned_end: string | null; actual_start: string | null; actual_end: string | null;
          cost: string; expected_result: string; actual_result: string; status: number; observations: string;
          preco: number;
          inscritos_esperado: number; inscritos_real: number;
          mat_fin_esperado: number; mat_fin_real: number;
          mat_acad_esperado: number; mat_acad_real: number;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; plan_id: string; parent_id?: string | null; number: string; sort_order?: number;
          action: string; why?: string; where?: string; responsible?: string;
          planned_start?: string | null; planned_end?: string | null; actual_start?: string | null; actual_end?: string | null;
          cost?: string; expected_result?: string; actual_result?: string; status?: number; observations?: string;
          preco?: number;
          inscritos_esperado?: number; inscritos_real?: number;
          mat_fin_esperado?: number; mat_fin_real?: number;
          mat_acad_esperado?: number; mat_acad_real?: number;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; plan_id?: string; parent_id?: string | null; number?: string; sort_order?: number;
          action?: string; why?: string; where?: string; responsible?: string;
          planned_start?: string | null; planned_end?: string | null; actual_start?: string | null; actual_end?: string | null;
          cost?: string; expected_result?: string; actual_result?: string; status?: number; observations?: string;
          preco?: number;
          inscritos_esperado?: number; inscritos_real?: number;
          mat_fin_esperado?: number; mat_fin_real?: number;
          mat_acad_esperado?: number; mat_acad_real?: number;
          created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      plan_audit_log: {
        Row: { id: string; plan_id: string; item_id: string | null; action: string; snapshot: Json; user_id: string | null; user_name: string; created_at: string; };
        Insert: { id?: string; plan_id: string; item_id?: string | null; action: string; snapshot?: Json; user_id?: string | null; user_name?: string; created_at?: string; };
        Update: { id?: string; plan_id?: string; item_id?: string | null; action?: string; snapshot?: Json; user_id?: string | null; user_name?: string; created_at?: string; };
        Relationships: [];
      };
      notifications: {
        Row: { id: string; title: string; message: string; type: string; target_type: string; target_id: string | null; is_fixed: boolean; expires_at: string | null; created_by: string | null; created_at: string; updated_at: string; };
        Insert: { id?: string; title: string; message?: string; type?: string; target_type?: string; target_id?: string | null; is_fixed?: boolean; expires_at?: string | null; created_by?: string | null; created_at?: string; updated_at?: string; };
        Update: { id?: string; title?: string; message?: string; type?: string; target_type?: string; target_id?: string | null; is_fixed?: boolean; expires_at?: string | null; created_by?: string | null; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      notification_reads: {
        Row: { id: string; notification_id: string; user_id: string; read_at: string; };
        Insert: { id?: string; notification_id: string; user_id: string; read_at?: string; };
        Update: { id?: string; notification_id?: string; user_id?: string; read_at?: string; };
        Relationships: [];
      };
      item_comments: {
        Row: { id: string; item_id: string; user_id: string; content: string; created_at: string; updated_at: string; };
        Insert: { id?: string; item_id: string; user_id: string; content: string; created_at?: string; updated_at?: string; };
        Update: { id?: string; item_id?: string; user_id?: string; content?: string; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      public_links: {
        Row: { id: string; plan_id: string; token: string; expires_at: string | null; created_by: string | null; created_at: string; };
        Insert: { id?: string; plan_id: string; token: string; expires_at?: string | null; created_by?: string | null; created_at?: string; };
        Update: { id?: string; plan_id?: string; token?: string; expires_at?: string | null; created_by?: string | null; created_at?: string; };
        Relationships: [];
      };
      plan_attachments: {
        Row: { id: string; item_id: string; filename: string; storage_path: string; size: number; mime_type: string; uploaded_by: string | null; created_at: string; };
        Insert: { id?: string; item_id: string; filename: string; storage_path: string; size: number; mime_type: string; uploaded_by?: string | null; created_at?: string; };
        Update: { id?: string; item_id?: string; filename?: string; storage_path?: string; size?: number; mime_type?: string; uploaded_by?: string | null; created_at?: string; };
        Relationships: [];
      };
      plan_templates: {
        Row: { id: string; name: string; title: string; unit: string; director: string; goal: string; is_system: boolean; created_by: string | null; created_at: string; };
        Insert: { id?: string; name: string; title?: string; unit?: string; director?: string; goal?: string; is_system?: boolean; created_by?: string | null; created_at?: string; };
        Update: { id?: string; name?: string; title?: string; unit?: string; director?: string; goal?: string; is_system?: boolean; created_by?: string | null; created_at?: string; };
        Relationships: [];
      };
      plan_template_items: {
        Row: { id: string; template_id: string; number: string; sort_order: number; parent_id: string | null; action: string; why: string; where_field: string; responsible: string; cost: string; expected_result: string; };
        Insert: { id?: string; template_id: string; number: string; sort_order?: number; parent_id?: string | null; action?: string; why?: string; where_field?: string; responsible?: string; cost?: string; expected_result?: string; };
        Update: { id?: string; template_id?: string; number?: string; sort_order?: number; parent_id?: string | null; action?: string; why?: string; where_field?: string; responsible?: string; cost?: string; expected_result?: string; };
        Relationships: [];
      };
      calendar_tokens: {
        Row: { id: string; user_id: string; provider: string; access_token: string; refresh_token: string | null; token_expires_at: string | null; created_at: string; updated_at: string; };
        Insert: { id?: string; user_id: string; provider: string; access_token: string; refresh_token?: string | null; token_expires_at?: string | null; created_at?: string; updated_at?: string; };
        Update: { id?: string; user_id?: string; provider?: string; access_token?: string; refresh_token?: string | null; token_expires_at?: string | null; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      calendar_sync: {
        Row: { id: string; item_id: string; user_id: string; provider: string; calendar_event_id: string; last_synced_at: string; created_at: string; };
        Insert: { id?: string; item_id: string; user_id: string; provider: string; calendar_event_id: string; last_synced_at?: string; created_at?: string; };
        Update: { id?: string; item_id?: string; user_id?: string; provider?: string; calendar_event_id?: string; last_synced_at?: string; created_at?: string; };
        Relationships: [];
      };
      admin_audit_log: {
        Row: { id: string; admin_id: string; target_user_id: string; action: string; snapshot: Json | null; created_at: string; };
        Insert: { id?: string; admin_id: string; target_user_id: string; action: string; snapshot?: Json | null; created_at?: string; };
        Update: { id?: string; admin_id?: string; target_user_id?: string; action?: string; snapshot?: Json | null; created_at?: string; };
        Relationships: [];
      };
      areas: {
        Row: { id: string; tenant_id: string | null; name: string; sort_order: number; active: boolean; created_at: string; updated_at: string; };
        Insert: { id?: string; tenant_id?: string | null; name: string; sort_order?: number; active?: boolean; created_at?: string; updated_at?: string; };
        Update: { id?: string; tenant_id?: string | null; name?: string; sort_order?: number; active?: boolean; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      units: {
        Row: { id: string; tenant_id: string | null; area_id: string | null; name: string; uf: string; sort_order: number; active: boolean; created_at: string; updated_at: string; };
        Insert: { id?: string; tenant_id?: string | null; area_id?: string | null; name: string; uf?: string; sort_order?: number; active?: boolean; created_at?: string; updated_at?: string; };
        Update: { id?: string; tenant_id?: string | null; area_id?: string | null; name?: string; uf?: string; sort_order?: number; active?: boolean; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      macro_acoes: {
        Row: { id: string; name: string; sort_order: number; active: boolean; created_at: string; updated_at: string; };
        Insert: { id?: string; name: string; sort_order?: number; active?: boolean; created_at?: string; updated_at?: string; };
        Update: { id?: string; name?: string; sort_order?: number; active?: boolean; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      channels: {
        Row: { id: string; name: string; sort_order: number; created_at: string; };
        Insert: { id?: string; name: string; sort_order?: number; created_at?: string; };
        Update: { id?: string; name?: string; sort_order?: number; created_at?: string; };
        Relationships: [];
      };
      tipos_pa: {
        Row: { id: string; name: string; sort_order: number; active: boolean; created_at: string; updated_at: string; };
        Insert: { id?: string; name: string; sort_order?: number; active?: boolean; created_at?: string; updated_at?: string; };
        Update: { id?: string; name?: string; sort_order?: number; active?: boolean; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      prioridades: {
        Row: { id: string; name: string; sort_order: number; active: boolean; color: string; created_at: string; updated_at: string; };
        Insert: { id?: string; name: string; sort_order?: number; active?: boolean; color?: string; created_at?: string; updated_at?: string; };
        Update: { id?: string; name?: string; sort_order?: number; active?: boolean; color?: string; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      fornecedores: {
        Row: {
          id: string; tenant_id: string | null; name: string; cnpj: string;
          categoria: string; contato_nome: string; contato_email: string;
          contato_telefone: string; observacoes: string;
          sort_order: number; active: boolean; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; tenant_id?: string | null; name: string; cnpj?: string;
          categoria?: string; contato_nome?: string; contato_email?: string;
          contato_telefone?: string; observacoes?: string;
          sort_order?: number; active?: boolean; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; tenant_id?: string | null; name?: string; cnpj?: string;
          categoria?: string; contato_nome?: string; contato_email?: string;
          contato_telefone?: string; observacoes?: string;
          sort_order?: number; active?: boolean; created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      schools: {
        Row: {
          id: string; tenant_id: string; unit_id: string | null;
          conveniado: boolean; prioridade: "Alta" | "Media" | "Baixa";
          nome: string; tipo_escola: string; publico_alvo: string;
          endereco: string; bairro: string; municipio: string; uf: string; pais: string;
          diretor: string; contato_diretor: string;
          coordenador_3ano: string; contato_coordenador: string;
          base_alunos_em: number; base_alunos_3ano: number;
          mensalidade_3ano: number; numero_colaboradores: number; consultor: string;
          meta_inscritos: number; inscritos_real: number;
          meta_financeira: number; financeira_real: number;
          meta_academica: number; academica_real: number;
          user_id: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; tenant_id: string; unit_id?: string | null;
          conveniado?: boolean; prioridade?: "Alta" | "Media" | "Baixa";
          nome: string; tipo_escola?: string; publico_alvo?: string;
          endereco?: string; bairro?: string; municipio?: string; uf?: string; pais?: string;
          diretor?: string; contato_diretor?: string;
          coordenador_3ano?: string; contato_coordenador?: string;
          base_alunos_em?: number; base_alunos_3ano?: number;
          mensalidade_3ano?: number; numero_colaboradores?: number; consultor?: string;
          meta_inscritos?: number; inscritos_real?: number;
          meta_financeira?: number; financeira_real?: number;
          meta_academica?: number; academica_real?: number;
          user_id?: string | null; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; tenant_id?: string; unit_id?: string | null;
          conveniado?: boolean; prioridade?: "Alta" | "Media" | "Baixa";
          nome?: string; tipo_escola?: string; publico_alvo?: string;
          endereco?: string; bairro?: string; municipio?: string; uf?: string; pais?: string;
          diretor?: string; contato_diretor?: string;
          coordenador_3ano?: string; contato_coordenador?: string;
          base_alunos_em?: number; base_alunos_3ano?: number;
          mensalidade_3ano?: number; numero_colaboradores?: number; consultor?: string;
          meta_inscritos?: number; inscritos_real?: number;
          meta_financeira?: number; financeira_real?: number;
          meta_academica?: number; academica_real?: number;
          user_id?: string | null; created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          id: string; tenant_id: string; unit_id: string | null;
          conveniado: boolean; cluster: string; segmento: string; cnpj: string;
          nome_fantasia: string; chance_contato: "" | "Alta" | "Media" | "Baixa";
          faixa_funcionarios: string;
          endereco: string; bairro: string; municipio: string; uf: string; pais: string;
          responsavel_nome: string; responsavel_cargo: string;
          contato_whatsapp: string; email: string;
          link_facebook: string; link_instagram: string;
          consultor: string;
          data_primeira_visita: string | null;
          data_previsao_retorno: string | null;
          data_retorno_real: string | null;
          qtd_oportunidade: number; inscritos_real: number;
          financeira_real: number; academica_real: number;
          comentarios: string;
          user_id: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; tenant_id: string; unit_id?: string | null;
          conveniado?: boolean; cluster?: string; segmento?: string; cnpj?: string;
          nome_fantasia: string; chance_contato?: "" | "Alta" | "Media" | "Baixa";
          faixa_funcionarios?: string;
          endereco?: string; bairro?: string; municipio?: string; uf?: string; pais?: string;
          responsavel_nome?: string; responsavel_cargo?: string;
          contato_whatsapp?: string; email?: string;
          link_facebook?: string; link_instagram?: string;
          consultor?: string;
          data_primeira_visita?: string | null;
          data_previsao_retorno?: string | null;
          data_retorno_real?: string | null;
          qtd_oportunidade?: number; inscritos_real?: number;
          financeira_real?: number; academica_real?: number;
          comentarios?: string;
          user_id?: string | null; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; tenant_id?: string; unit_id?: string | null;
          conveniado?: boolean; cluster?: string; segmento?: string; cnpj?: string;
          nome_fantasia?: string; chance_contato?: "" | "Alta" | "Media" | "Baixa";
          faixa_funcionarios?: string;
          endereco?: string; bairro?: string; municipio?: string; uf?: string; pais?: string;
          responsavel_nome?: string; responsavel_cargo?: string;
          contato_whatsapp?: string; email?: string;
          link_facebook?: string; link_instagram?: string;
          consultor?: string;
          data_primeira_visita?: string | null;
          data_previsao_retorno?: string | null;
          data_retorno_real?: string | null;
          qtd_oportunidade?: number; inscritos_real?: number;
          financeira_real?: number; academica_real?: number;
          comentarios?: string;
          user_id?: string | null; created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      simulator_scenarios: {
        Row: {
          id: string; tenant_id: string; unit_id: string | null;
          name: string; reference_label: string; meta_real_aa: number;
          is_baseline: boolean; notes: string;
          user_id: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; tenant_id: string; unit_id?: string | null;
          name: string; reference_label?: string; meta_real_aa?: number;
          is_baseline?: boolean; notes?: string;
          user_id?: string | null; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; tenant_id?: string; unit_id?: string | null;
          name?: string; reference_label?: string; meta_real_aa?: number;
          is_baseline?: boolean; notes?: string;
          user_id?: string | null; created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      user_areas: {
        Row: { user_id: string; area_id: string; tenant_id: string | null; created_at: string; };
        Insert: { user_id: string; area_id: string; tenant_id?: string | null; created_at?: string; };
        Update: { user_id?: string; area_id?: string; tenant_id?: string | null; created_at?: string; };
        Relationships: [];
      };
      user_units: {
        Row: { user_id: string; unit_id: string; tenant_id: string | null; created_at: string; };
        Insert: { user_id: string; unit_id: string; tenant_id?: string | null; created_at?: string; };
        Update: { user_id?: string; unit_id?: string; tenant_id?: string | null; created_at?: string; };
        Relationships: [];
      };
      simulator_channel_metrics: {
        Row: {
          id: string; scenario_id: string; channel_id: string;
          inscritos: number; mat_financeira: number; mat_academica: number;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; scenario_id: string; channel_id: string;
          inscritos?: number; mat_financeira?: number; mat_academica?: number;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; scenario_id?: string; channel_id?: string;
          inscritos?: number; mat_financeira?: number; mat_academica?: number;
          created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      categorias_despesa: {
        Row: {
          id: string; tenant_id: string | null; name: string;
          sort_order: number; active: boolean;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; tenant_id?: string | null; name: string;
          sort_order?: number; active?: boolean;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; tenant_id?: string | null; name?: string;
          sort_order?: number; active?: boolean;
          created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      contas_pagar: {
        Row: {
          id: string; tenant_id: string;
          plan_id: string | null; item_id: string | null;
          fornecedor_id: string | null; categoria_id: string | null;
          descricao: string; documento: string;
          emissao: string | null;
          valor_total: number;
          status: "pendente" | "parcial" | "quitado" | "cancelado";
          observacoes: string;
          created_by: string | null;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; tenant_id: string;
          plan_id?: string | null; item_id?: string | null;
          fornecedor_id?: string | null; categoria_id?: string | null;
          descricao: string; documento?: string;
          emissao?: string | null;
          valor_total: number;
          status?: "pendente" | "parcial" | "quitado" | "cancelado";
          observacoes?: string;
          created_by?: string | null;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; tenant_id?: string;
          plan_id?: string | null; item_id?: string | null;
          fornecedor_id?: string | null; categoria_id?: string | null;
          descricao?: string; documento?: string;
          emissao?: string | null;
          valor_total?: number;
          status?: "pendente" | "parcial" | "quitado" | "cancelado";
          observacoes?: string;
          created_by?: string | null;
          created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      parcelas_pagar: {
        Row: {
          id: string; conta_id: string; numero: number;
          data_vencimento: string; valor: number;
          data_pagamento: string | null; valor_pago: number | null;
          forma_pagamento: string;
          status: "pendente" | "pago" | "cancelado";
          observacoes: string;
          created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; conta_id: string; numero: number;
          data_vencimento: string; valor: number;
          data_pagamento?: string | null; valor_pago?: number | null;
          forma_pagamento?: string;
          status?: "pendente" | "pago" | "cancelado";
          observacoes?: string;
          created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; conta_id?: string; numero?: number;
          data_vencimento?: string; valor?: number;
          data_pagamento?: string | null; valor_pago?: number | null;
          forma_pagamento?: string;
          status?: "pendente" | "pago" | "cancelado";
          observacoes?: string;
          created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      conta_attachments: {
        Row: {
          id: string; conta_id: string;
          filename: string; storage_path: string;
          size: number; mime_type: string;
          tipo: "nf" | "recibo" | "contrato" | "boleto" | "comprovante" | "outro";
          uploaded_by: string | null; created_at: string;
        };
        Insert: {
          id?: string; conta_id: string;
          filename: string; storage_path: string;
          size: number; mime_type: string;
          tipo?: "nf" | "recibo" | "contrato" | "boleto" | "comprovante" | "outro";
          uploaded_by?: string | null; created_at?: string;
        };
        Update: {
          id?: string; conta_id?: string;
          filename?: string; storage_path?: string;
          size?: number; mime_type?: string;
          tipo?: "nf" | "recibo" | "contrato" | "boleto" | "comprovante" | "outro";
          uploaded_by?: string | null; created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_conta_with_parcelas: {
        Args: { payload: Record<string, unknown> };
        Returns: string;
      };
      update_conta_with_parcelas: {
        Args: { conta_id_in: string; payload: Record<string, unknown> };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
