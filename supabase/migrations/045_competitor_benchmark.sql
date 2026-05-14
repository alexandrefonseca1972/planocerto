-- Módulo: Benchmarking de Concorrentes.
--
-- Introduz sete tabelas para coleta e comparacao de valores de mensalidades
-- de instituicoes de ensino superior concorrentes:
--
--   Catálogos globais (admin write, all auth read):
--     modalidades, cursos_superiores, turnos
--
--   Tabelas tenant-scoped:
--     instituicoes (concorrente)
--     cursos_instituicao (oferecimento: coordenador + FK curso/tipo/campus)
--     corpo_docente (professor, titulacao, Lattes, disciplina)
--     mensalidades_concorrentes (preco por modalidade/turno)
--
-- Heranca RLS:
--   instituicoes → RLS direta (tenant_members)
--   cursos_instituicao → RLS via JOIN instituicoes.tenant_id
--   corpo_docente → RLS via JOIN cursos_instituicao → instituicoes
--   mensalidades_concorrentes → RLS via JOIN cursos_instituicao → instituicoes

-- =========================================================================
-- 1. CATALOGO: modalidades
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.modalidades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.modalidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modalidades read" ON public.modalidades FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "modalidades admin write" ON public.modalidades FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.modalidades (name, sort_order) VALUES
  ('Presencial', 1),
  ('EAD', 2),
  ('Semipresencial', 3)
ON CONFLICT (name) DO NOTHING;

-- =========================================================================
-- 2. CATALOGO: cursos_superiores
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.cursos_superiores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cursos_superiores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cursos_superiores read" ON public.cursos_superiores FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "cursos_superiores admin write" ON public.cursos_superiores FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.cursos_superiores (name, sort_order) VALUES
  ('Direito', 1),
  ('Administração', 2),
  ('Medicina', 3),
  ('Enfermagem', 4),
  ('Psicologia', 5),
  ('Engenharia Civil', 6),
  ('Engenharia de Produção', 7),
  ('Ciências Contábeis', 8),
  ('Pedagogia', 9),
  ('Fisioterapia', 10),
  ('Odontologia', 11),
  ('Farmácia', 12),
  ('Nutrição', 13),
  ('Sistemas de Informação', 14),
  ('Arquitetura e Urbanismo', 15)
ON CONFLICT (name) DO NOTHING;

-- =========================================================================
-- 3. CATALOGO: turnos
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.turnos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "turnos read" ON public.turnos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "turnos admin write" ON public.turnos FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.turnos (name, sort_order) VALUES
  ('Matutino', 1),
  ('Vespertino', 2),
  ('Noturno', 3),
  ('Integral', 4)
ON CONFLICT (name) DO NOTHING;

-- =========================================================================
-- 4. INSTITUICOES (tenant-scoped)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.instituicoes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome             TEXT NOT NULL,
  nome_fantasia    TEXT DEFAULT '',
  cnpj             TEXT DEFAULT '',
  tipo             TEXT NOT NULL DEFAULT 'Privada'
                   CHECK (tipo IN ('Publica','Privada','Filantropica')),
  grupo_economico  TEXT DEFAULT '',
  site             TEXT DEFAULT '',
  unit_id          UUID REFERENCES public.units(id) ON DELETE SET NULL,
  observacoes      TEXT DEFAULT '',
  active           BOOLEAN NOT NULL DEFAULT true,
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT instituicoes_name_tenant_unique UNIQUE (tenant_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_instituicoes_tenant
  ON public.instituicoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_instituicoes_unit
  ON public.instituicoes(unit_id);
CREATE INDEX IF NOT EXISTS idx_instituicoes_nome
  ON public.instituicoes(LOWER(nome));
CREATE INDEX IF NOT EXISTS idx_instituicoes_active
  ON public.instituicoes(active) WHERE active = true;

ALTER TABLE public.instituicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instituicoes read" ON public.instituicoes FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = instituicoes.tenant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "instituicoes insert" ON public.instituicoes FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = instituicoes.tenant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "instituicoes update" ON public.instituicoes FOR UPDATE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = instituicoes.tenant_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = instituicoes.tenant_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "instituicoes delete" ON public.instituicoes FOR DELETE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = instituicoes.tenant_id
        AND user_id = auth.uid()
        AND role IN ('owner','admin')
    )
  );

-- =========================================================================
-- 5. CURSOS_INSTITUICAO (oferecimento, child of instituicoes)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.cursos_instituicao (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id       UUID NOT NULL REFERENCES public.instituicoes(id) ON DELETE CASCADE,
  curso_id             UUID NOT NULL REFERENCES public.cursos_superiores(id) ON DELETE RESTRICT,
  tipo_pa_id           UUID NOT NULL REFERENCES public.tipos_pa(id) ON DELETE RESTRICT,
  unit_id              UUID REFERENCES public.units(id) ON DELETE SET NULL,

  coordenador_nome     TEXT DEFAULT '',
  coordenador_email    TEXT DEFAULT '',
  coordenador_telefone TEXT DEFAULT '',
  coordenador_lattes   TEXT DEFAULT '',

  observacoes          TEXT DEFAULT '',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cursos_instituicao_inst
  ON public.cursos_instituicao(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_cursos_instituicao_curso
  ON public.cursos_instituicao(curso_id);
CREATE INDEX IF NOT EXISTS idx_cursos_instituicao_tipo_pa
  ON public.cursos_instituicao(tipo_pa_id);
CREATE INDEX IF NOT EXISTS idx_cursos_instituicao_unit
  ON public.cursos_instituicao(unit_id);

ALTER TABLE public.cursos_instituicao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cursos_instituicao read" ON public.cursos_instituicao FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.instituicoes i
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE i.id = cursos_instituicao.instituicao_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "cursos_instituicao insert" ON public.cursos_instituicao FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.instituicoes i
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE i.id = cursos_instituicao.instituicao_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "cursos_instituicao update" ON public.cursos_instituicao FOR UPDATE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.instituicoes i
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE i.id = cursos_instituicao.instituicao_id AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.instituicoes i
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE i.id = cursos_instituicao.instituicao_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "cursos_instituicao delete" ON public.cursos_instituicao FOR DELETE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.instituicoes i
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE i.id = cursos_instituicao.instituicao_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner','admin')
    )
  );

-- =========================================================================
-- 6. CORPO_DOCENTE (child of cursos_instituicao)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.corpo_docente (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_instituicao_id  UUID NOT NULL REFERENCES public.cursos_instituicao(id) ON DELETE CASCADE,
  nome                  TEXT NOT NULL,
  titulacao             TEXT DEFAULT '',
  lattes_url            TEXT DEFAULT '',
  disciplina            TEXT DEFAULT '',
  email                 TEXT DEFAULT '',
  regime                TEXT DEFAULT '',
  sort_order            INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corpo_docente_curso
  ON public.corpo_docente(curso_instituicao_id);
CREATE INDEX IF NOT EXISTS idx_corpo_docente_nome
  ON public.corpo_docente(LOWER(nome));

ALTER TABLE public.corpo_docente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "corpo_docente read" ON public.corpo_docente FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = corpo_docente.curso_instituicao_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "corpo_docente insert" ON public.corpo_docente FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = corpo_docente.curso_instituicao_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "corpo_docente update" ON public.corpo_docente FOR UPDATE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = corpo_docente.curso_instituicao_id AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = corpo_docente.curso_instituicao_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "corpo_docente delete" ON public.corpo_docente FOR DELETE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = corpo_docente.curso_instituicao_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner','admin')
    )
  );

-- =========================================================================
-- 7. MENSALIDADES_CONCORRENTES (child of cursos_instituicao)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.mensalidades_concorrentes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_instituicao_id  UUID NOT NULL REFERENCES public.cursos_instituicao(id) ON DELETE CASCADE,
  modalidade_id         UUID NOT NULL REFERENCES public.modalidades(id) ON DELETE RESTRICT,
  turno_id              UUID NOT NULL REFERENCES public.turnos(id) ON DELETE RESTRICT,
  valor                 NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  periodo               TEXT NOT NULL DEFAULT 'mensal'
                        CHECK (periodo IN ('mensal','semestral','anual')),
  desconto              TEXT DEFAULT '',
  vigencia_inicio       DATE NOT NULL,
  vigencia_fim          DATE,
  data_coleta           DATE NOT NULL DEFAULT CURRENT_DATE,
  fonte                 TEXT NOT NULL DEFAULT '',
  observacoes           TEXT DEFAULT '',
  user_id               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mensalidades_concorrentes_curso
  ON public.mensalidades_concorrentes(curso_instituicao_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_concorrentes_modalidade
  ON public.mensalidades_concorrentes(modalidade_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_concorrentes_turno
  ON public.mensalidades_concorrentes(turno_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_concorrentes_lookup
  ON public.mensalidades_concorrentes(curso_instituicao_id, modalidade_id, turno_id, vigencia_inicio);

ALTER TABLE public.mensalidades_concorrentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mensalidades_concorrentes read" ON public.mensalidades_concorrentes FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = mensalidades_concorrentes.curso_instituicao_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "mensalidades_concorrentes insert" ON public.mensalidades_concorrentes FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = mensalidades_concorrentes.curso_instituicao_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "mensalidades_concorrentes update" ON public.mensalidades_concorrentes FOR UPDATE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = mensalidades_concorrentes.curso_instituicao_id AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = mensalidades_concorrentes.curso_instituicao_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "mensalidades_concorrentes delete" ON public.mensalidades_concorrentes FOR DELETE
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.cursos_instituicao ci
      JOIN public.instituicoes i ON i.id = ci.instituicao_id
      JOIN public.tenant_members tm ON tm.tenant_id = i.tenant_id
      WHERE ci.id = mensalidades_concorrentes.curso_instituicao_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner','admin')
    )
  );
