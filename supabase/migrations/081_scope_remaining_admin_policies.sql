-- Restos do padrão "admin global" (profiles.role = 'admin') após a 080, e a
-- policy de public_links que a 057 removia mas segue ativa em produção.

-- public_links: leitura `true` expunha todos os tokens pela API (qualquer um
-- listaria os links e abriria os dashboards). /s/[token] lê via service_role
-- e valida o token em código; a listagem do plano usa a policy de gestão.
DROP POLICY IF EXISTS "Anyone can read by token" ON public.public_links;

DROP POLICY IF EXISTS "Plan members can manage links" ON public.public_links;
CREATE POLICY "Plan members can manage links" ON public.public_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.action_plans ap
      WHERE ap.id = public_links.plan_id
        AND (
          public.is_admin_for_tenant(ap.tenant_id)
          OR EXISTS (SELECT 1 FROM public.tenant_members tm
                     WHERE tm.tenant_id = ap.tenant_id AND tm.user_id = (SELECT auth.uid())
                       AND tm.role IN ('owner', 'admin'))
        )
    )
  );

-- item_comments: admin só lê comentários das suas empresas.
DROP POLICY IF EXISTS "Members can read comments on their tenant items" ON public.item_comments;
CREATE POLICY "Members can read comments on their tenant items" ON public.item_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.action_items ai
      JOIN public.action_plans ap ON ap.id = ai.plan_id
      WHERE ai.id = item_comments.item_id
        AND (
          public.is_admin_for_tenant(ap.tenant_id)
          OR EXISTS (SELECT 1 FROM public.tenant_members tm
                     WHERE tm.tenant_id = ap.tenant_id AND tm.user_id = (SELECT auth.uid()))
        )
    )
  );

-- Templates são globais (sem tenant_id): só super_admin altera.
DROP POLICY IF EXISTS "Admins can manage templates" ON public.plan_templates;
CREATE POLICY "Admins can manage templates" ON public.plan_templates FOR ALL
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Admins can manage template items" ON public.plan_template_items;
CREATE POLICY "Admins can manage template items" ON public.plan_template_items FOR ALL
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
