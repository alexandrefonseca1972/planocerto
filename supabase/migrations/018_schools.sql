-- Carteira de Escolas (modelo Excel ESCOLA: 27 colunas).

CREATE TABLE IF NOT EXISTS public.schools (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  unit_id                  UUID REFERENCES public.units(id) ON DELETE SET NULL,
  conveniado               BOOLEAN NOT NULL DEFAULT false,
  prioridade               TEXT NOT NULL DEFAULT 'Media' CHECK (prioridade IN ('Alta','Media','Baixa')),
  nome                     TEXT NOT NULL,
  tipo_escola              TEXT DEFAULT '',
  publico_alvo             TEXT DEFAULT '',
  endereco                 TEXT DEFAULT '',
  bairro                   TEXT DEFAULT '',
  municipio                TEXT DEFAULT '',
  uf                       TEXT DEFAULT '',
  pais                     TEXT NOT NULL DEFAULT 'Brasil',
  diretor                  TEXT DEFAULT '',
  contato_diretor          TEXT DEFAULT '',
  coordenador_3ano         TEXT DEFAULT '',
  contato_coordenador      TEXT DEFAULT '',
  base_alunos_em           INT  DEFAULT 0,
  base_alunos_3ano         INT  DEFAULT 0,
  mensalidade_3ano         NUMERIC(12,2) DEFAULT 0,
  numero_colaboradores     INT  DEFAULT 0,
  consultor                TEXT DEFAULT '',
  meta_inscritos           INT  DEFAULT 0,
  inscritos_real           INT  DEFAULT 0,
  meta_financeira          INT  DEFAULT 0,
  financeira_real          INT  DEFAULT 0,
  meta_academica           INT  DEFAULT 0,
  academica_real           INT  DEFAULT 0,
  user_id                  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schools_tenant ON public.schools(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schools_unit   ON public.schools(unit_id);
CREATE INDEX IF NOT EXISTS idx_schools_nome   ON public.schools(LOWER(nome));

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schools read"   ON public.schools FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = schools.tenant_id AND user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "schools insert" ON public.schools FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = schools.tenant_id AND user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "schools update" ON public.schools FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = schools.tenant_id AND user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "schools delete" ON public.schools FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = schools.tenant_id AND user_id = auth.uid() AND role IN ('owner','admin')) OR public.is_admin());
