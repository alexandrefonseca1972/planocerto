-- Catálogo de FORNECEDORES (cadastro operacional administrado).
-- Modela um diretório de fornecedores com dados de contato, escopado por
-- tenant. Mantém o mesmo padrão de áreas/unidades: leitura por membros do
-- tenant ou registros globais (tenant_id NULL), escrita restrita a admin.

CREATE TABLE IF NOT EXISTS public.fornecedores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  cnpj              TEXT,
  categoria         TEXT,
  contato_nome      TEXT,
  contato_email     TEXT,
  contato_telefone  TEXT,
  observacoes       TEXT,
  sort_order        INT NOT NULL DEFAULT 0,
  active            BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fornecedores_name_tenant_unique UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_fornecedores_tenant ON public.fornecedores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_active ON public.fornecedores(active) WHERE active = true;

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fornecedores read tenant" ON public.fornecedores FOR SELECT
  USING (
    tenant_id IS NULL
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = fornecedores.tenant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "fornecedores write admin" ON public.fornecedores FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
