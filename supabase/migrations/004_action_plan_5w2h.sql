DROP TABLE IF EXISTS public.action_plans CASCADE;

-- Cabeçalho do plano
CREATE TABLE public.action_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  unit        TEXT DEFAULT '',
  director    TEXT DEFAULT '',
  goal        TEXT DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Itens do plano (linhas da planilha 5W2H)
CREATE TABLE public.action_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES public.action_items(id) ON DELETE SET NULL,
  number          TEXT NOT NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  -- 5W2H
  action          TEXT DEFAULT '' NOT NULL,
  why             TEXT DEFAULT '',
  "where"         TEXT DEFAULT '',
  responsible     TEXT DEFAULT '',
  planned_start   DATE,
  planned_end     DATE,
  actual_start    DATE,
  actual_end      DATE,
  cost            TEXT DEFAULT '',
  expected_result TEXT DEFAULT '',
  actual_result   TEXT DEFAULT '',
  -- Farol: 1=Não Iniciada, 2=Pendente, 3=Em andamento com atraso, 4=Em andamento, 5=Concluído
  status          INT NOT NULL DEFAULT 1 CHECK (status BETWEEN 1 AND 5),
  observations    TEXT DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- Plans RLS
CREATE POLICY "Members can read plans" ON public.action_plans FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = action_plans.tenant_id AND user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "Members can insert plans" ON public.action_plans FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = action_plans.tenant_id AND user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "Members can update plans" ON public.action_plans FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = action_plans.tenant_id AND user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "Tenant admins can delete plans" ON public.action_plans FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = action_plans.tenant_id AND user_id = auth.uid() AND role IN ('owner','admin')) OR public.is_admin());

-- Items RLS (same rules as parent plan)
CREATE POLICY "Members can read items" ON public.action_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.action_plans p JOIN public.tenant_members tm ON tm.tenant_id = p.tenant_id WHERE p.id = action_items.plan_id AND tm.user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "Members can insert items" ON public.action_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.action_plans p JOIN public.tenant_members tm ON tm.tenant_id = p.tenant_id WHERE p.id = action_items.plan_id AND tm.user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "Members can update items" ON public.action_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.action_plans p JOIN public.tenant_members tm ON tm.tenant_id = p.tenant_id WHERE p.id = action_items.plan_id AND tm.user_id = auth.uid()) OR public.is_admin());

CREATE POLICY "Tenant admins can delete items" ON public.action_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.action_plans p JOIN public.tenant_members tm ON tm.tenant_id = p.tenant_id WHERE p.id = action_items.plan_id AND tm.user_id = auth.uid() AND tm.role IN ('owner','admin')) OR public.is_admin());
