export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      action_items: {
        Row: {
          action: string
          actual_end: string | null
          actual_result: string | null
          actual_start: string | null
          area: string
          como: string
          cost: string | null
          created_at: string
          expected_result: string | null
          id: string
          inscritos_esperado: number
          inscritos_real: number
          mat_acad_esperado: number
          mat_acad_real: number
          mat_fin_esperado: number
          mat_fin_real: number
          number: string
          observations: string | null
          parent_id: string | null
          plan_id: string
          planned_end: string | null
          planned_start: string | null
          preco: number
          prioridade: string
          responsible: string | null
          sort_order: number
          status: number
          subacao: string
          tipo_pa: string
          updated_at: string
          where: string | null
          why: string | null
        }
        Insert: {
          action?: string
          actual_end?: string | null
          actual_result?: string | null
          actual_start?: string | null
          area?: string
          como?: string
          cost?: string | null
          created_at?: string
          expected_result?: string | null
          id?: string
          inscritos_esperado?: number
          inscritos_real?: number
          mat_acad_esperado?: number
          mat_acad_real?: number
          mat_fin_esperado?: number
          mat_fin_real?: number
          number: string
          observations?: string | null
          parent_id?: string | null
          plan_id: string
          planned_end?: string | null
          planned_start?: string | null
          preco?: number
          prioridade?: string
          responsible?: string | null
          sort_order?: number
          status?: number
          subacao?: string
          tipo_pa?: string
          updated_at?: string
          where?: string | null
          why?: string | null
        }
        Update: {
          action?: string
          actual_end?: string | null
          actual_result?: string | null
          actual_start?: string | null
          area?: string
          como?: string
          cost?: string | null
          created_at?: string
          expected_result?: string | null
          id?: string
          inscritos_esperado?: number
          inscritos_real?: number
          mat_acad_esperado?: number
          mat_acad_real?: number
          mat_fin_esperado?: number
          mat_fin_real?: number
          number?: string
          observations?: string | null
          parent_id?: string | null
          plan_id?: string
          planned_end?: string | null
          planned_start?: string | null
          preco?: number
          prioridade?: string
          responsible?: string | null
          sort_order?: number
          status?: number
          subacao?: string
          tipo_pa?: string
          updated_at?: string
          where?: string | null
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "action_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plans: {
        Row: {
          budget_limit: number | null
          created_at: string
          director: string | null
          exercicio: number | null
          goal: string | null
          id: string
          status: string
          tenant_id: string
          title: string
          unit: string | null
          unit_id: string | null
          updated_at: string
          user_id: string | null
          visibility: string | null
        }
        Insert: {
          budget_limit?: number | null
          created_at?: string
          director?: string | null
          exercicio?: number | null
          goal?: string | null
          id?: string
          status?: string
          tenant_id: string
          title: string
          unit?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
          visibility?: string | null
        }
        Update: {
          budget_limit?: number | null
          created_at?: string
          director?: string | null
          exercicio?: number | null
          goal?: string | null
          id?: string
          status?: string
          tenant_id?: string
          title?: string
          unit?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          snapshot: Json | null
          target_user_id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          snapshot?: Json | null
          target_user_id: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          snapshot?: Json | null
          target_user_id?: string
        }
        Relationships: []
      }
      areas: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          regional_context: Json | null
          sort_order: number
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          regional_context?: Json | null
          sort_order?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          regional_context?: Json | null
          sort_order?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_despesa: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_despesa_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      companies: {
        Row: {
          academica_real: number | null
          bairro: string | null
          chance_contato: string | null
          cluster: string | null
          cnpj: string | null
          comentarios: string | null
          consultor: string | null
          contato_whatsapp: string | null
          conveniado: boolean
          created_at: string
          data_previsao_retorno: string | null
          data_primeira_visita: string | null
          data_retorno_real: string | null
          email: string | null
          endereco: string | null
          faixa_funcionarios: string | null
          financeira_real: number | null
          id: string
          inscritos_real: number | null
          latitude: number | null
          link_facebook: string | null
          link_instagram: string | null
          longitude: number | null
          municipio: string | null
          nome_fantasia: string
          pais: string
          qtd_oportunidade: number | null
          responsavel_cargo: string | null
          responsavel_nome: string | null
          segmento: string | null
          tenant_id: string
          uf: string | null
          unit_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          academica_real?: number | null
          bairro?: string | null
          chance_contato?: string | null
          cluster?: string | null
          cnpj?: string | null
          comentarios?: string | null
          consultor?: string | null
          contato_whatsapp?: string | null
          conveniado?: boolean
          created_at?: string
          data_previsao_retorno?: string | null
          data_primeira_visita?: string | null
          data_retorno_real?: string | null
          email?: string | null
          endereco?: string | null
          faixa_funcionarios?: string | null
          financeira_real?: number | null
          id?: string
          inscritos_real?: number | null
          latitude?: number | null
          link_facebook?: string | null
          link_instagram?: string | null
          longitude?: number | null
          municipio?: string | null
          nome_fantasia: string
          pais?: string
          qtd_oportunidade?: number | null
          responsavel_cargo?: string | null
          responsavel_nome?: string | null
          segmento?: string | null
          tenant_id: string
          uf?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          academica_real?: number | null
          bairro?: string | null
          chance_contato?: string | null
          cluster?: string | null
          cnpj?: string | null
          comentarios?: string | null
          consultor?: string | null
          contato_whatsapp?: string | null
          conveniado?: boolean
          created_at?: string
          data_previsao_retorno?: string | null
          data_primeira_visita?: string | null
          data_retorno_real?: string | null
          email?: string | null
          endereco?: string | null
          faixa_funcionarios?: string | null
          financeira_real?: number | null
          id?: string
          inscritos_real?: number | null
          latitude?: number | null
          link_facebook?: string | null
          link_instagram?: string | null
          longitude?: number | null
          municipio?: string | null
          nome_fantasia?: string
          pais?: string
          qtd_oportunidade?: number | null
          responsavel_cargo?: string | null
          responsavel_nome?: string | null
          segmento?: string | null
          tenant_id?: string
          uf?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      conta_attachments: {
        Row: {
          conta_id: string
          created_at: string
          filename: string
          id: string
          mime_type: string
          size: number
          storage_path: string
          tipo: string
          uploaded_by: string | null
        }
        Insert: {
          conta_id: string
          created_at?: string
          filename: string
          id?: string
          mime_type: string
          size: number
          storage_path: string
          tipo?: string
          uploaded_by?: string | null
        }
        Update: {
          conta_id?: string
          created_at?: string
          filename?: string
          id?: string
          mime_type?: string
          size?: number
          storage_path?: string
          tipo?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conta_attachments_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar: {
        Row: {
          categoria_id: string | null
          created_at: string
          created_by: string | null
          descricao: string
          documento: string
          emissao: string | null
          fornecedor_id: string | null
          id: string
          item_id: string | null
          observacoes: string
          plan_id: string | null
          status: string
          tenant_id: string
          updated_at: string
          valor_total: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao: string
          documento?: string
          emissao?: string | null
          fornecedor_id?: string | null
          id?: string
          item_id?: string | null
          observacoes?: string
          plan_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          valor_total: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string
          documento?: string
          emissao?: string | null
          fornecedor_id?: string | null
          id?: string
          item_id?: string | null
          observacoes?: string
          plan_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_despesa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "action_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      corpo_docente: {
        Row: {
          created_at: string
          curso_instituicao_id: string
          disciplina: string | null
          email: string | null
          id: string
          lattes_url: string | null
          nome: string
          regime: string | null
          sort_order: number
          titulacao: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          curso_instituicao_id: string
          disciplina?: string | null
          email?: string | null
          id?: string
          lattes_url?: string | null
          nome: string
          regime?: string | null
          sort_order?: number
          titulacao?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          curso_instituicao_id?: string
          disciplina?: string | null
          email?: string | null
          id?: string
          lattes_url?: string | null
          nome?: string
          regime?: string | null
          sort_order?: number
          titulacao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corpo_docente_curso_instituicao_id_fkey"
            columns: ["curso_instituicao_id"]
            isOneToOne: false
            referencedRelation: "cursos_instituicao"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos_instituicao: {
        Row: {
          coordenador_email: string | null
          coordenador_lattes: string | null
          coordenador_nome: string | null
          coordenador_telefone: string | null
          created_at: string
          curso_id: string
          id: string
          instituicao_id: string
          observacoes: string | null
          tipo_pa_id: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          coordenador_email?: string | null
          coordenador_lattes?: string | null
          coordenador_nome?: string | null
          coordenador_telefone?: string | null
          created_at?: string
          curso_id: string
          id?: string
          instituicao_id: string
          observacoes?: string | null
          tipo_pa_id: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          coordenador_email?: string | null
          coordenador_lattes?: string | null
          coordenador_nome?: string | null
          coordenador_telefone?: string | null
          created_at?: string
          curso_id?: string
          id?: string
          instituicao_id?: string
          observacoes?: string | null
          tipo_pa_id?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cursos_instituicao_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos_superiores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_instituicao_instituicao_id_fkey"
            columns: ["instituicao_id"]
            isOneToOne: false
            referencedRelation: "instituicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_instituicao_tipo_pa_id_fkey"
            columns: ["tipo_pa_id"]
            isOneToOne: false
            referencedRelation: "tipos_pa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_instituicao_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos_superiores: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          active: boolean
          categoria: string | null
          cnpj: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string
          id: string
          name: string
          observacoes: string | null
          sort_order: number
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          categoria?: string | null
          cnpj?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          id?: string
          name: string
          observacoes?: string | null
          sort_order?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          categoria?: string | null
          cnpj?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          id?: string
          name?: string
          observacoes?: string | null
          sort_order?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      instituicoes: {
        Row: {
          active: boolean
          cnpj: string | null
          created_at: string
          grupo_economico: string | null
          id: string
          nome: string
          nome_fantasia: string | null
          observacoes: string | null
          site: string | null
          tenant_id: string
          tipo: string
          unit_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          cnpj?: string | null
          created_at?: string
          grupo_economico?: string | null
          id?: string
          nome: string
          nome_fantasia?: string | null
          observacoes?: string | null
          site?: string | null
          tenant_id: string
          tipo?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          cnpj?: string | null
          created_at?: string
          grupo_economico?: string | null
          id?: string
          nome?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          site?: string | null
          tenant_id?: string
          tipo?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instituicoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instituicoes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      item_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          item_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          item_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          item_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "action_items"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          area_id: string | null
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          tenant_id: string
          unit_id: string | null
        }
        Insert: {
          area_id?: string | null
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          tenant_id: string
          unit_id?: string | null
        }
        Update: {
          area_id?: string | null
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          tenant_id?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_settings: {
        Row: {
          api_key: string | null
          base_url: string | null
          created_at: string
          id: string
          model: string
          provider: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          base_url?: string | null
          created_at?: string
          id?: string
          model?: string
          provider?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          base_url?: string | null
          created_at?: string
          id?: string
          model?: string
          provider?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      macro_acoes: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      mensalidades_concorrentes: {
        Row: {
          created_at: string
          curso_instituicao_id: string
          data_coleta: string
          desconto: string | null
          fonte: string
          id: string
          modalidade_id: string
          observacoes: string | null
          periodo: string
          turno_id: string
          updated_at: string
          user_id: string | null
          valor: number
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          created_at?: string
          curso_instituicao_id: string
          data_coleta?: string
          desconto?: string | null
          fonte?: string
          id?: string
          modalidade_id: string
          observacoes?: string | null
          periodo?: string
          turno_id: string
          updated_at?: string
          user_id?: string | null
          valor: number
          vigencia_fim?: string | null
          vigencia_inicio: string
        }
        Update: {
          created_at?: string
          curso_instituicao_id?: string
          data_coleta?: string
          desconto?: string | null
          fonte?: string
          id?: string
          modalidade_id?: string
          observacoes?: string | null
          periodo?: string
          turno_id?: string
          updated_at?: string
          user_id?: string | null
          valor?: number
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensalidades_concorrentes_curso_instituicao_id_fkey"
            columns: ["curso_instituicao_id"]
            isOneToOne: false
            referencedRelation: "cursos_instituicao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensalidades_concorrentes_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensalidades_concorrentes_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      modalidades: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_fixed: boolean
          message: string
          target_id: string | null
          target_type: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_fixed?: boolean
          message?: string
          target_id?: string | null
          target_type?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_fixed?: boolean
          message?: string
          target_id?: string | null
          target_type?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      parcelas_pagar: {
        Row: {
          conta_id: string
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          forma_pagamento: string
          id: string
          numero: number
          observacoes: string
          status: string
          updated_at: string
          valor: number
          valor_pago: number | null
        }
        Insert: {
          conta_id: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          forma_pagamento?: string
          id?: string
          numero: number
          observacoes?: string
          status?: string
          updated_at?: string
          valor: number
          valor_pago?: number | null
        }
        Update: {
          conta_id?: string
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          forma_pagamento?: string
          id?: string
          numero?: number
          observacoes?: string
          status?: string
          updated_at?: string
          valor?: number
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parcelas_pagar_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_attachments: {
        Row: {
          created_at: string
          filename: string
          id: string
          item_id: string
          mime_type: string
          size: number
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          item_id: string
          mime_type: string
          size: number
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          item_id?: string
          mime_type?: string
          size?: number
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_attachments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "action_items"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          item_id: string | null
          plan_id: string
          snapshot: Json
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          item_id?: string | null
          plan_id: string
          snapshot?: Json
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          item_id?: string | null
          plan_id?: string
          snapshot?: Json
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_audit_log_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "action_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_audit_log_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_template_items: {
        Row: {
          action: string
          cost: string | null
          expected_result: string | null
          id: string
          number: string
          parent_id: string | null
          responsible: string | null
          sort_order: number
          template_id: string
          where_field: string | null
          why: string | null
        }
        Insert: {
          action?: string
          cost?: string | null
          expected_result?: string | null
          id?: string
          number: string
          parent_id?: string | null
          responsible?: string | null
          sort_order?: number
          template_id: string
          where_field?: string | null
          why?: string | null
        }
        Update: {
          action?: string
          cost?: string | null
          expected_result?: string | null
          id?: string
          number?: string
          parent_id?: string | null
          responsible?: string | null
          sort_order?: number
          template_id?: string
          where_field?: string | null
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_template_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "plan_template_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "plan_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_templates: {
        Row: {
          created_at: string
          created_by: string | null
          director: string | null
          goal: string | null
          id: string
          is_system: boolean
          name: string
          title: string
          unit: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          director?: string | null
          goal?: string | null
          id?: string
          is_system?: boolean
          name: string
          title?: string
          unit?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          director?: string | null
          goal?: string | null
          id?: string
          is_system?: boolean
          name?: string
          title?: string
          unit?: string | null
        }
        Relationships: []
      }
      prioridades: {
        Row: {
          active: boolean
          color: string
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_tenant_id: string | null
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          login_end_time: string | null
          login_start_time: string | null
          name: string
          permissions: Json | null
          phone: string
          role: string
          social_media: Json
          timezone: string
          updated_at: string
        }
        Insert: {
          active_tenant_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          is_active?: boolean | null
          login_end_time?: string | null
          login_start_time?: string | null
          name?: string
          permissions?: Json | null
          phone?: string
          role?: string
          social_media?: Json
          timezone?: string
          updated_at?: string
        }
        Update: {
          active_tenant_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          login_end_time?: string | null
          login_start_time?: string | null
          name?: string
          permissions?: Json | null
          phone?: string
          role?: string
          social_media?: Json
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_tenant_id_fkey"
            columns: ["active_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      public_links: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          plan_id: string
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          plan_id: string
          token: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          plan_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_links_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          permissions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          permissions?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          permissions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          academica_real: number | null
          bairro: string | null
          base_alunos_3ano: number | null
          base_alunos_em: number | null
          consultor: string | null
          contato_coordenador: string | null
          contato_diretor: string | null
          conveniado: boolean
          coordenador_3ano: string | null
          created_at: string
          diretor: string | null
          endereco: string | null
          financeira_real: number | null
          id: string
          inscritos_real: number | null
          latitude: number | null
          longitude: number | null
          mensalidade_3ano: number | null
          meta_academica: number | null
          meta_financeira: number | null
          meta_inscritos: number | null
          municipio: string | null
          nome: string
          numero_colaboradores: number | null
          pais: string
          prioridade: string
          publico_alvo: string | null
          tenant_id: string
          tipo_escola: string | null
          uf: string | null
          unit_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          academica_real?: number | null
          bairro?: string | null
          base_alunos_3ano?: number | null
          base_alunos_em?: number | null
          consultor?: string | null
          contato_coordenador?: string | null
          contato_diretor?: string | null
          conveniado?: boolean
          coordenador_3ano?: string | null
          created_at?: string
          diretor?: string | null
          endereco?: string | null
          financeira_real?: number | null
          id?: string
          inscritos_real?: number | null
          latitude?: number | null
          longitude?: number | null
          mensalidade_3ano?: number | null
          meta_academica?: number | null
          meta_financeira?: number | null
          meta_inscritos?: number | null
          municipio?: string | null
          nome: string
          numero_colaboradores?: number | null
          pais?: string
          prioridade?: string
          publico_alvo?: string | null
          tenant_id: string
          tipo_escola?: string | null
          uf?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          academica_real?: number | null
          bairro?: string | null
          base_alunos_3ano?: number | null
          base_alunos_em?: number | null
          consultor?: string | null
          contato_coordenador?: string | null
          contato_diretor?: string | null
          conveniado?: boolean
          coordenador_3ano?: string | null
          created_at?: string
          diretor?: string | null
          endereco?: string | null
          financeira_real?: number | null
          id?: string
          inscritos_real?: number | null
          latitude?: number | null
          longitude?: number | null
          mensalidade_3ano?: number | null
          meta_academica?: number | null
          meta_financeira?: number | null
          meta_inscritos?: number | null
          municipio?: string | null
          nome?: string
          numero_colaboradores?: number | null
          pais?: string
          prioridade?: string
          publico_alvo?: string | null
          tenant_id?: string
          tipo_escola?: string | null
          uf?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      simulator_channel_metrics: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          inscritos: number
          mat_academica: number
          mat_financeira: number
          scenario_id: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          inscritos?: number
          mat_academica?: number
          mat_financeira?: number
          scenario_id: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          inscritos?: number
          mat_academica?: number
          mat_financeira?: number
          scenario_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulator_channel_metrics_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulator_channel_metrics_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "simulator_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      simulator_scenarios: {
        Row: {
          created_at: string
          id: string
          is_baseline: boolean
          meta_real_aa: number
          name: string
          notes: string | null
          reference_label: string | null
          tenant_id: string
          unit_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_baseline?: boolean
          meta_real_aa?: number
          name: string
          notes?: string | null
          reference_label?: string | null
          tenant_id: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_baseline?: boolean
          meta_real_aa?: number
          name?: string
          notes?: string | null
          reference_label?: string | null
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulator_scenarios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulator_scenarios_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_member_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_member_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_member_roles_tenant_id_user_id_fkey"
            columns: ["tenant_id", "user_id"]
            isOneToOne: true
            referencedRelation: "tenant_members"
            referencedColumns: ["tenant_id", "user_id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          active: boolean
          cnpj: string
          created_at: string
          email: string
          fone: string
          id: string
          logo_url: string | null
          max_units: number | null
          name: string
          plan: string
          responsavel_nome: string
          site: string
          slug: string
          teams_webhook_url: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          cnpj?: string
          created_at?: string
          email?: string
          fone?: string
          id?: string
          logo_url?: string | null
          max_units?: number | null
          name: string
          plan?: string
          responsavel_nome?: string
          site?: string
          slug: string
          teams_webhook_url?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          cnpj?: string
          created_at?: string
          email?: string
          fone?: string
          id?: string
          logo_url?: string | null
          max_units?: number | null
          name?: string
          plan?: string
          responsavel_nome?: string
          site?: string
          slug?: string
          teams_webhook_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tipos_pa: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      turnos: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          active: boolean
          area_id: string | null
          created_at: string
          email: string
          fone: string
          id: string
          name: string
          regional_context: Json | null
          responsavel: string
          sort_order: number
          tenant_id: string | null
          uf: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          area_id?: string | null
          created_at?: string
          email?: string
          fone?: string
          id?: string
          name: string
          regional_context?: Json | null
          responsavel?: string
          sort_order?: number
          tenant_id?: string | null
          uf?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          area_id?: string | null
          created_at?: string
          email?: string
          fone?: string
          id?: string
          name?: string
          regional_context?: Json | null
          responsavel?: string
          sort_order?: number
          tenant_id?: string | null
          uf?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_areas: {
        Row: {
          area_id: string
          created_at: string
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          area_id: string
          created_at?: string
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          area_id?: string
          created_at?: string
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_areas_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_areas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_units: {
        Row: {
          created_at: string
          tenant_id: string | null
          unit_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          tenant_id?: string | null
          unit_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          tenant_id?: string | null
          unit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_units_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_units_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_area: { Args: { p_area_id: string }; Returns: boolean }
      can_access_unit: { Args: { p_unit_id: string }; Returns: boolean }
      create_conta_with_parcelas: { Args: { payload: Json }; Returns: string }
      effective_role_for_tenant: {
        Args: { p_tenant_id: string; p_user_id: string }
        Returns: string
      }
      has_perm: { Args: { required_perm: string }; Returns: boolean }
      has_perm_for_tenant: {
        Args: { p_tenant_id: string; required_perm: string }
        Returns: boolean
      }
      has_scope: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_admin_for_tenant: { Args: { p_tenant_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_valid_role_name: { Args: { p_role: string }; Returns: boolean }
      match_knowledge: {
        Args: {
          match_count: number
          match_threshold: number
          p_tenant_id: string
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          similarity: number
        }[]
      }
      setup_new_user: {
        Args: {
          p_active_tenant_id: string
          p_area_ids: string[]
          p_name: string
          p_role: string
          p_tenant_members: Json
          p_unit_ids: string[]
          p_user_id: string
        }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_conta_with_parcelas: {
        Args: { conta_id_in: string; payload: Json }
        Returns: string
      }
      user_area_ids: { Args: never; Returns: string[] }
      user_unit_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
