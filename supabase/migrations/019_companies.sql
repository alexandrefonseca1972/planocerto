-- Carteira de Empresas (modelo Excel EMPRESA: 29 colunas).

CREATE TABLE IF NOT EXISTS public.companies (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  unit_id                  UUID REFERENCES public.units(id) ON DELETE SET NULL,
  conveniado               BOOLEAN NOT NULL DEFAULT false,
  cluster                  TEXT DEFAULT '',
  segmento                 TEXT DEFAULT '',
  cnpj                     TEXT DEFAULT '',
  nome_fantasia            TEXT NOT NULL,
  chance_contato           TEXT DEFAULT '' CHECK (chance_contato IN ('','Alta','Media','Baixa')),
  faixa_funcionarios       TEXT DEFAULT '',
  endereco                 TEXT DEFAULT '',
  bairro                   TEXT DEFAULT '',
  municipio                TEXT DEFAULT '',
  uf                       TEXT DEFAULT '',
  pais                     TEXT NOT NULL DEFAULT 'Brasil',
  responsavel_nome         TEXT DEFAULT '',
  responsavel_cargo        TEXT DEFAULT '',
  contato_whatsapp         TEXT DEFAULT '',
  email                    TEXT DEFAULT '',
  link_facebook            TEXT DEFAULT '',
  link_instagram           TEXT DEFAULT '',
  consultor                TEXT DEFAULT '',
  data_primeira_visita     DATE,
  data_previsao_retorno    DATE,
  data_retorno_real        DATE,
  qtd_oportunidade         INT DEFAULT 0,
  inscritos_real           INT DEFAULT 0,
  financeira_real          INT DEFAULT 0,
  academica_real           INT DEFAULT 0,
  comentarios              TEXT DEFAULT '',
  user_id                  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_tenant ON public.companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_companies_unit   ON public.companies(unit_id);
CREATE INDEX IF NOT EXISTS idx_companies_nome   ON public.companies(LOWER(nome_fantasia));
CREATE INDEX IF NOT EXISTS idx_companies_cnpj   ON public.companies(cnpj);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies read"   ON public.companies FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = companies.tenant_id AND user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "companies insert" ON public.companies FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = companies.tenant_id AND user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "companies update" ON public.companies FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = companies.tenant_id AND user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "companies delete" ON public.companies FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = companies.tenant_id AND user_id = auth.uid() AND role IN ('owner','admin')) OR public.is_admin());
