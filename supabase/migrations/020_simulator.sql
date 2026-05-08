-- Simulador de metas por canal (modelo Excel SIMULADOR).
-- Cada cenário (ex: "26.3") tem um conjunto de canais com IN/MF/MA esperados e reais.

CREATE TABLE IF NOT EXISTS public.simulator_scenarios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  unit_id         UUID REFERENCES public.units(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,                         -- ex: "26.3 Simulação"
  reference_label TEXT DEFAULT '',                       -- ex: "vs 25.3"
  meta_real_aa    NUMERIC(6,4) NOT NULL DEFAULT 0.15,    -- Previsão em % vs Real AA
  is_baseline     BOOLEAN NOT NULL DEFAULT false,
  notes           TEXT DEFAULT '',
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_simulator_scenarios_tenant ON public.simulator_scenarios(tenant_id);

CREATE TABLE IF NOT EXISTS public.simulator_channel_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id     UUID NOT NULL REFERENCES public.simulator_scenarios(id) ON DELETE CASCADE,
  channel_id      UUID NOT NULL REFERENCES public.channels(id) ON DELETE RESTRICT,
  -- Funil: IN (Inscritos), MF (Matrícula Financeira), MA (Matrícula Acadêmica)
  inscritos       INT NOT NULL DEFAULT 0,
  mat_financeira  INT NOT NULL DEFAULT 0,
  mat_academica   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(scenario_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_sim_metrics_scenario ON public.simulator_channel_metrics(scenario_id);

ALTER TABLE public.simulator_scenarios       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulator_channel_metrics ENABLE ROW LEVEL SECURITY;

-- Scenarios RLS por tenant
CREATE POLICY "sim scenarios read"   ON public.simulator_scenarios FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = simulator_scenarios.tenant_id AND user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "sim scenarios insert" ON public.simulator_scenarios FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = simulator_scenarios.tenant_id AND user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "sim scenarios update" ON public.simulator_scenarios FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = simulator_scenarios.tenant_id AND user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "sim scenarios delete" ON public.simulator_scenarios FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = simulator_scenarios.tenant_id AND user_id = auth.uid() AND role IN ('owner','admin')) OR public.is_admin());

-- Metrics RLS herda do scenario
CREATE POLICY "sim metrics read"   ON public.simulator_channel_metrics FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.simulator_scenarios s JOIN public.tenant_members tm ON tm.tenant_id = s.tenant_id WHERE s.id = simulator_channel_metrics.scenario_id AND tm.user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "sim metrics insert" ON public.simulator_channel_metrics FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.simulator_scenarios s JOIN public.tenant_members tm ON tm.tenant_id = s.tenant_id WHERE s.id = simulator_channel_metrics.scenario_id AND tm.user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "sim metrics update" ON public.simulator_channel_metrics FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.simulator_scenarios s JOIN public.tenant_members tm ON tm.tenant_id = s.tenant_id WHERE s.id = simulator_channel_metrics.scenario_id AND tm.user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "sim metrics delete" ON public.simulator_channel_metrics FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.simulator_scenarios s JOIN public.tenant_members tm ON tm.tenant_id = s.tenant_id WHERE s.id = simulator_channel_metrics.scenario_id AND tm.user_id = auth.uid()) OR public.is_admin());
