
-- ========== 008_add_teams_webhook.sql ==========

-- Migration: Add teams_webhook_url column to tenants table
-- Required by: src/app/actions/action-plan.ts:161, src/app/actions/tenant.ts:198

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS teams_webhook_url TEXT DEFAULT '';


-- ========== 009_item_comments.sql ==========

-- Migration: Item comments
CREATE TABLE IF NOT EXISTS public.item_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.action_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.item_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read comments on their tenant items" ON public.item_comments;
CREATE POLICY "Members can read comments on their tenant items"
  ON public.item_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.action_items ai
      JOIN public.action_plans ap ON ap.id = ai.plan_id
      JOIN public.tenant_members tm ON tm.tenant_id = ap.tenant_id AND tm.user_id = auth.uid()
      WHERE ai.id = item_comments.item_id
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Members can insert comments" ON public.item_comments;
CREATE POLICY "Members can insert comments"
  ON public.item_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND
    EXISTS (
      SELECT 1 FROM public.action_items ai
      JOIN public.action_plans ap ON ap.id = ai.plan_id
      JOIN public.tenant_members tm ON tm.tenant_id = ap.tenant_id AND tm.user_id = auth.uid()
      WHERE ai.id = item_comments.item_id
    )
  );

DROP POLICY IF EXISTS "Users can update own comments" ON public.item_comments;
CREATE POLICY "Users can update own comments"
  ON public.item_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.item_comments;
CREATE POLICY "Users can delete own comments"
  ON public.item_comments FOR DELETE
  USING (auth.uid() = user_id);


-- ========== 010_public_links.sql ==========

-- Migration: Public share links for dashboards
CREATE TABLE IF NOT EXISTS public.public_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.public_links ENABLE ROW LEVEL SECURITY;

-- Only plan owners/admins can create links
DROP POLICY IF EXISTS "Plan members can manage links" ON public.public_links;
CREATE POLICY "Plan members can manage links"
  ON public.public_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.action_plans ap
      JOIN public.tenant_members tm ON tm.tenant_id = ap.tenant_id AND tm.user_id = auth.uid()
      WHERE ap.id = public_links.plan_id AND tm.role IN ('owner', 'admin')
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Anyone can read by token (public access)
DROP POLICY IF EXISTS "Anyone can read by token" ON public.public_links;
CREATE POLICY "Anyone can read by token"
  ON public.public_links FOR SELECT
  USING (true);


-- ========== 011_plan_attachments.sql ==========

-- Migration: Plan attachments (file uploads for action items)
CREATE TABLE IF NOT EXISTS public.plan_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.action_items(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read attachments on their tenant items" ON public.plan_attachments;
CREATE POLICY "Members can read attachments on their tenant items"
  ON public.plan_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.action_items ai
      JOIN public.action_plans ap ON ap.id = ai.plan_id
      JOIN public.tenant_members tm ON tm.tenant_id = ap.tenant_id AND tm.user_id = auth.uid()
      WHERE ai.id = plan_attachments.item_id
    )
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Members can insert attachments" ON public.plan_attachments;
CREATE POLICY "Members can insert attachments"
  ON public.plan_attachments FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND
    EXISTS (
      SELECT 1 FROM public.action_items ai
      JOIN public.action_plans ap ON ap.id = ai.plan_id
      JOIN public.tenant_members tm ON tm.tenant_id = ap.tenant_id AND tm.user_id = auth.uid()
      WHERE ai.id = plan_attachments.item_id
    )
  );

DROP POLICY IF EXISTS "Members can delete own attachments" ON public.plan_attachments;
CREATE POLICY "Members can delete own attachments"
  ON public.plan_attachments FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ========== 012_plan_templates.sql ==========

-- Migration: Plan templates for 5W2H action plans
CREATE TABLE IF NOT EXISTS public.plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  unit TEXT DEFAULT '',
  director TEXT DEFAULT '',
  goal TEXT DEFAULT '',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.plan_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.plan_templates(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES public.plan_template_items(id) ON DELETE SET NULL,
  action TEXT NOT NULL DEFAULT '',
  why TEXT DEFAULT '',
  where_field TEXT DEFAULT '',
  responsible TEXT DEFAULT '',
  cost TEXT DEFAULT '',
  expected_result TEXT DEFAULT ''
);

ALTER TABLE public.plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_template_items ENABLE ROW LEVEL SECURITY;

-- Templates visible to all authenticated users
DROP POLICY IF EXISTS "Authenticated users can read templates" ON public.plan_templates;
CREATE POLICY "Authenticated users can read templates"
  ON public.plan_templates FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can read template items" ON public.plan_template_items;
CREATE POLICY "Authenticated users can read template items"
  ON public.plan_template_items FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can manage templates
DROP POLICY IF EXISTS "Admins can manage templates" ON public.plan_templates;
CREATE POLICY "Admins can manage templates"
  ON public.plan_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can manage template items" ON public.plan_template_items;
CREATE POLICY "Admins can manage template items"
  ON public.plan_template_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- ========== 013_calendar_sync.sql ==========

-- Migration: Calendar sync state tracking
CREATE TABLE IF NOT EXISTS public.calendar_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.action_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook')),
  calendar_event_id TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_sync ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own calendar syncs" ON public.calendar_sync;
CREATE POLICY "Users can manage own calendar syncs"
  ON public.calendar_sync FOR ALL
  USING (auth.uid() = user_id);


-- ========== SEED TEMPLATES ==========

-- Seed: Default plan templates
INSERT INTO public.plan_templates (id, name, title, unit, director, goal, is_system) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Plano de Ação Comercial', 'Plano de Ação Comercial', 'Comercial', 'Diretor Comercial', 'Aumentar vendas e expandir carteira de clientes', true),
  ('00000000-0000-0000-0000-000000000002', 'Plano de Melhoria Operacional', 'Plano de Melhoria Operacional', 'Operações', 'Diretor de Operações', 'Otimizar processos e reduzir custos operacionais', true),
  ('00000000-0000-0000-0000-000000000003', 'Plano de Expansão', 'Plano de Expansão', 'Expansão', 'Diretor de Expansão', 'Expandir para novas regiões e mercados', true)
ON CONFLICT DO NOTHING;

-- Template 1: Comercial
INSERT INTO public.plan_template_items (template_id, number, sort_order, action, why, where_field, responsible, cost, expected_result) VALUES
  ('00000000-0000-0000-0000-000000000001', '1', 1, 'Realizar diagnóstico de mercado', 'Identificar oportunidades e ameaças', 'Sede', 'Analista Comercial', 'R$ 0', 'Relatório de mercado concluído'),
  ('00000000-0000-0000-0000-000000000001', '2', 2, 'Definir metas de vendas por região', 'Estabelecer objetivos mensuráveis', 'Sede', 'Gerente Comercial', 'R$ 0', 'Metas definidas e aprovadas'),
  ('00000000-0000-0000-0000-000000000001', '3', 3, 'Contratar e treinar equipe de vendas', 'Aumentar capacidade de atendimento', 'RH', 'Gerente de RH', 'R$ 15.000', 'Equipe contratada e treinada'),
  ('00000000-0000-0000-0000-000000000001', '4', 4, 'Implementar CRM', 'Centralizar gestão de clientes', 'TI', 'Coordenador de TI', 'R$ 5.000', 'CRM operacional'),
  ('00000000-0000-0000-0000-000000000001', '5', 5, 'Criar campanha de prospecção', 'Gerar leads qualificados', 'Marketing', 'Coordenador de Marketing', 'R$ 8.000', 'Leads gerados'),
  ('00000000-0000-0000-0000-000000000001', '6', 6, 'Definir política de preços e descontos', 'Padronizar negociações', 'Financeiro', 'Analista Financeiro', 'R$ 0', 'Política documentada'),
  ('00000000-0000-0000-0000-000000000001', '7', 7, 'Estabelecer metas de pós-venda', 'Fidelizar clientes', 'Comercial', 'Supervisor de Vendas', 'R$ 2.000', 'Programa de fidelização ativo'),
  ('00000000-0000-0000-0000-000000000001', '8', 8, 'Monitorar KPIs de vendas', 'Acompanhar desempenho', 'Comercial', 'Analista Comercial', 'R$ 0', 'Dashboard de KPIs'),
  ('00000000-0000-0000-0000-000000000001', '9', 9, 'Revisar carteira de clientes', 'Identificar clientes inativos', 'Comercial', 'Vendedor Sênior', 'R$ 0', 'Carteira revisada'),
  ('00000000-0000-0000-0000-000000000001', '10', 10, 'Realizar treinamento de vendas trimestral', 'Atualizar técnicas de vendas', 'Sede', 'Gerente Comercial', 'R$ 3.000', 'Treinamento realizado'),
  ('00000000-0000-0000-0000-000000000001', '11', 11, 'Criar programa de indicação de clientes', 'Aumentar base via referrals', 'Marketing', 'Coordenador de Marketing', 'R$ 1.000', 'Programa ativo'),
  ('00000000-0000-0000-0000-000000000001', '12', 12, 'Analisar concorrência trimestralmente', 'Manter competitividade', 'Comercial', 'Analista de Mercado', 'R$ 0', 'Relatório trimestral')
ON CONFLICT DO NOTHING;

-- Template 2: Operacional  
INSERT INTO public.plan_template_items (template_id, number, sort_order, action, why, where_field, responsible, cost, expected_result) VALUES
  ('00000000-0000-0000-0000-000000000002', '1', 1, 'Mapear processos atuais', 'Identificar gargalos operacionais', 'Operações', 'Analista de Processos', 'R$ 0', 'Mapa de processos documentado'),
  ('00000000-0000-0000-0000-000000000002', '2', 2, 'Identificar desperdícios e retrabalho', 'Reduzir custos operacionais', 'Operações', 'Supervisor de Produção', 'R$ 0', 'Relatório de desperdícios'),
  ('00000000-0000-0000-0000-000000000002', '3', 3, 'Implementar metodologia 5S', 'Organizar ambiente de trabalho', 'Fábrica', 'Coordenador de Qualidade', 'R$ 2.000', '5S implementado'),
  ('00000000-0000-0000-0000-000000000002', '4', 4, 'Automatizar relatórios operacionais', 'Reduzir tempo de compilação de dados', 'TI', 'Analista de TI', 'R$ 4.000', 'Relatórios automatizados'),
  ('00000000-0000-0000-0000-000000000002', '5', 5, 'Revisar procedimentos de segurança', 'Prevenir acidentes de trabalho', 'Fábrica', 'Técnico de Segurança', 'R$ 1.500', 'Procedimentos atualizados'),
  ('00000000-0000-0000-0000-000000000002', '6', 6, 'Implementar manutenção preventiva', 'Reduzir paradas não programadas', 'Manutenção', 'Supervisor de Manutenção', 'R$ 10.000', 'Plano de manutenção ativo'),
  ('00000000-0000-0000-0000-000000000002', '7', 7, 'Otimizar layout do estoque', 'Melhorar fluxo de materiais', 'Almoxarifado', 'Encarregado de Estoque', 'R$ 3.000', 'Layout otimizado'),
  ('00000000-0000-0000-0000-000000000002', '8', 8, 'Treinar equipe em lean manufacturing', 'Capacitar para melhoria contínua', 'Sede', 'Consultor Lean', 'R$ 8.000', 'Equipe certificada'),
  ('00000000-0000-0000-0000-000000000002', '9', 9, 'Estabelecer indicadores de eficiência', 'Medir OEE e produtividade', 'Operações', 'Analista de Dados', 'R$ 0', 'Dashboard de OEE'),
  ('00000000-0000-0000-0000-000000000002', '10', 10, 'Criar plano de contingência operacional', 'Mitigar riscos de interrupção', 'Operações', 'Gerente de Operações', 'R$ 0', 'Plano documentado')
ON CONFLICT DO NOTHING;

-- Template 3: Expansão
INSERT INTO public.plan_template_items (template_id, number, sort_order, action, why, where_field, responsible, cost, expected_result) VALUES
  ('00000000-0000-0000-0000-000000000003', '1', 1, 'Realizar estudo de viabilidade', 'Avaliar mercado e retorno esperado', 'Sede', 'Analista de Negócios', 'R$ 5.000', 'Estudo de viabilidade concluído'),
  ('00000000-0000-0000-0000-000000000003', '2', 2, 'Selecionar localização estratégica', 'Maximizar alcance do público-alvo', 'Nova Unidade', 'Diretor de Expansão', 'R$ 2.000', 'Local definido'),
  ('00000000-0000-0000-0000-000000000003', '3', 3, 'Elaborar projeto arquitetônico', 'Dimensionar espaço físico', 'Nova Unidade', 'Arquiteto', 'R$ 15.000', 'Projeto aprovado'),
  ('00000000-0000-0000-0000-000000000003', '4', 4, 'Obter licenças e alvarás', 'Regularizar operação', 'Prefeitura', 'Consultor Jurídico', 'R$ 3.000', 'Documentação obtida'),
  ('00000000-0000-0000-0000-000000000003', '5', 5, 'Definir orçamento de abertura', 'Controlar investimento inicial', 'Financeiro', 'Analista Financeiro', 'R$ 0', 'Orçamento aprovado'),
  ('00000000-0000-0000-0000-000000000003', '6', 6, 'Contratar equipe inicial', 'Formar time para operação', 'RH', 'Gerente de RH', 'R$ 5.000', 'Equipe contratada'),
  ('00000000-0000-0000-0000-000000000003', '7', 7, 'Adquirir equipamentos e mobiliário', 'Estruturar unidade', 'Compras', 'Comprador', 'R$ 50.000', 'Equipamentos instalados'),
  ('00000000-0000-0000-0000-000000000003', '8', 8, 'Implementar sistemas e infraestrutura', 'Garantir operação de TI', 'TI', 'Coordenador de TI', 'R$ 8.000', 'Sistemas operacionais')
ON CONFLICT DO NOTHING;
