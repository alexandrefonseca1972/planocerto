-- Encontrado nos testes de produção após 075–078 (complementa o achado #2).
--
-- 1) tenant_members INSERT/UPDATE/DELETE (002_tenants.sql): a subconsulta
--    comparava `tenant_id = tenant_id` sem qualificar a tabela, ou seja, a
--    coluna consigo mesma. Qualquer owner/admin de UMA empresa podia se
--    vincular a QUALQUER outra pela API e ler tudo dela; com o `OR is_admin()`,
--    todo admin global também. O app grava vínculos só via service_role
--    (admin.ts, tenant.ts) e reserva admin/owner ao super_admin, então pela
--    API apenas super_admin escreve.
-- 2) tenant_member_roles: mesmo caso; `has_perm('users.manage_tenants')`
--    global deixava atribuir papel em qualquer empresa.
-- 3) plan_attachments SELECT/DELETE: o ramo `profiles.role = 'admin'` dava a
--    admin global acesso a anexos de empresas sem vínculo. Passa a ser admin
--    DA empresa do item (is_admin_for_tenant).

DROP POLICY IF EXISTS "Tenant admins can insert members" ON public.tenant_members;
DROP POLICY IF EXISTS "Tenant admins can update members" ON public.tenant_members;
DROP POLICY IF EXISTS "Tenant admins can delete members" ON public.tenant_members;

CREATE POLICY "Super admins can insert members" ON public.tenant_members FOR INSERT
  WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins can update members" ON public.tenant_members FOR UPDATE
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins can delete members" ON public.tenant_members FOR DELETE
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "tenant_member_roles manage" ON public.tenant_member_roles;
CREATE POLICY "tenant_member_roles manage" ON public.tenant_member_roles FOR ALL
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Members can read attachments on their tenant items" ON public.plan_attachments;
CREATE POLICY "Members can read attachments on their tenant items" ON public.plan_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.action_items ai
      JOIN public.action_plans ap ON ap.id = ai.plan_id
      WHERE ai.id = plan_attachments.item_id
        AND (
          public.is_admin_for_tenant(ap.tenant_id)
          OR EXISTS (SELECT 1 FROM public.tenant_members tm
                     WHERE tm.tenant_id = ap.tenant_id AND tm.user_id = (SELECT auth.uid()))
        )
    )
  );

DROP POLICY IF EXISTS "Members can delete own attachments" ON public.plan_attachments;
CREATE POLICY "Members can delete own attachments" ON public.plan_attachments FOR DELETE
  USING (
    uploaded_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.action_items ai
      JOIN public.action_plans ap ON ap.id = ai.plan_id
      WHERE ai.id = plan_attachments.item_id AND public.is_admin_for_tenant(ap.tenant_id)
    )
  );
