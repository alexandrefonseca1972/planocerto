-- Complemento do achado #2: policies que ainda usavam is_admin() global
-- (profiles.role = 'admin') davam a qualquer admin acesso a TODAS as empresas.
-- Regra adotada, a mesma do app (assertCanManageUser, setTenantMembers):
--   - super_admin: plataforma inteira;
--   - admin/manager: apenas empresas onde é membro (is_admin_for_tenant).
-- O painel admin grava via service_role (createAdminClient), que não passa
-- por RLS; a sessão do usuário só lê. Por isso escrita global vira super_admin.

-- ===========================================================================
-- 1) Troca mecânica is_admin() -> is_super_admin()
--    Catálogos globais (sem tenant_id), linhas globais (tenant_id IS NULL) de
--    catálogos por empresa, cadastro de empresas, papéis e auditoria admin.
-- ===========================================================================
DO $$
DECLARE
  pol record;
  roles_sql text;
  using_sql text;
  check_sql text;
BEGIN
  FOR pol IN
    SELECT p.* FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND (p.tablename, p.policyname) IN (
        ('admin_audit_log', 'Admins can insert audit logs'),
        ('admin_audit_log', 'Admins can read audit logs'),
        ('areas', 'areas write admin'),
        ('areas', 'areas read tenant'),
        ('categorias_despesa', 'categorias_despesa write admin'),
        ('categorias_despesa', 'categorias_despesa read tenant'),
        ('fornecedores', 'fornecedores write admin'),
        ('fornecedores', 'fornecedores read tenant'),
        ('units', 'units write admin'),
        ('units', 'units read tenant'),
        ('channels', 'chan admin write'),
        ('cursos_superiores', 'cursos_superiores admin write'),
        ('macro_acoes', 'macro admin write'),
        ('modalidades', 'modalidades admin write'),
        ('prioridades', 'prioridades admin write'),
        ('tipos_pa', 'tipos_pa admin write'),
        ('turnos', 'turnos admin write'),
        ('roles', 'Admins can insert roles'),
        ('roles', 'Admins can update roles'),
        ('roles', 'Admins can delete roles'),
        ('roles', 'Admins can read all roles'),
        ('tenants', 'Admins can create tenants'),
        ('tenants', 'Admins can update tenants'),
        ('tenants', 'Admins can delete tenants'),
        ('tenants', 'Admins can read all tenants'),
        ('profiles', 'Admins can update all profiles'),
        ('profiles', 'Admins can delete profiles')
      )
  LOOP
    roles_sql := (SELECT string_agg(quote_ident(r), ', ') FROM unnest(pol.roles) r);
    using_sql := CASE WHEN pol.qual IS NOT NULL
      THEN format(' USING (%s)', replace(pol.qual, 'is_admin()', 'is_super_admin()')) ELSE '' END;
    check_sql := CASE WHEN pol.with_check IS NOT NULL
      THEN format(' WITH CHECK (%s)', replace(pol.with_check, 'is_admin()', 'is_super_admin()')) ELSE '' END;
    EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
    EXECUTE format('CREATE POLICY %I ON public.%I AS %s FOR %s TO %s%s%s',
      pol.policyname, pol.tablename, pol.permissive, pol.cmd, roles_sql, using_sql, check_sql);
  END LOOP;
END $$;

-- ===========================================================================
-- 2) Admin passa a ver só o que é das suas empresas
-- ===========================================================================

-- O usuário alvo é membro de alguma empresa que o solicitante administra?
CREATE OR REPLACE FUNCTION public.is_admin_of_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.tenant_members tm
    WHERE tm.user_id = p_user_id AND public.is_admin_for_tenant(tm.tenant_id)
  );
$$;

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT
  USING (public.is_admin_of_user(id));

DROP POLICY IF EXISTS "Admins can read all memberships" ON public.tenant_members;
CREATE POLICY "Admins can read all memberships" ON public.tenant_members FOR SELECT
  USING (public.is_admin_for_tenant(tenant_id));

DROP POLICY IF EXISTS "tenant_member_roles read self or admin" ON public.tenant_member_roles;
CREATE POLICY "tenant_member_roles read self or admin" ON public.tenant_member_roles FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR public.is_admin_for_tenant(tenant_id));

DROP POLICY IF EXISTS "user_areas admin all" ON public.user_areas;
CREATE POLICY "user_areas admin all" ON public.user_areas FOR ALL
  USING (public.is_super_admin() OR (tenant_id IS NOT NULL AND public.is_admin_for_tenant(tenant_id)))
  WITH CHECK (public.is_super_admin() OR (tenant_id IS NOT NULL AND public.is_admin_for_tenant(tenant_id)));
DROP POLICY IF EXISTS "user_areas read self" ON public.user_areas;
CREATE POLICY "user_areas read self" ON public.user_areas FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR public.is_super_admin()
         OR (tenant_id IS NOT NULL AND public.is_admin_for_tenant(tenant_id)));

DROP POLICY IF EXISTS "user_units admin all" ON public.user_units;
CREATE POLICY "user_units admin all" ON public.user_units FOR ALL
  USING (public.is_super_admin() OR (tenant_id IS NOT NULL AND public.is_admin_for_tenant(tenant_id)))
  WITH CHECK (public.is_super_admin() OR (tenant_id IS NOT NULL AND public.is_admin_for_tenant(tenant_id)));
DROP POLICY IF EXISTS "user_units read self" ON public.user_units;
CREATE POLICY "user_units read self" ON public.user_units FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR public.is_super_admin()
         OR (tenant_id IS NOT NULL AND public.is_admin_for_tenant(tenant_id)));

DROP POLICY IF EXISTS "Members can read audit logs" ON public.plan_audit_log;
CREATE POLICY "Members can read audit logs" ON public.plan_audit_log FOR SELECT
  USING (
    plan_id IN (
      SELECT p.id FROM public.action_plans p
      WHERE public.is_admin_for_tenant(p.tenant_id)
         OR EXISTS (SELECT 1 FROM public.tenant_members tm
                    WHERE tm.tenant_id = p.tenant_id AND tm.user_id = (SELECT auth.uid()))
    )
  );
DROP POLICY IF EXISTS "Members can insert audit logs" ON public.plan_audit_log;
CREATE POLICY "Members can insert audit logs" ON public.plan_audit_log FOR INSERT
  WITH CHECK (
    plan_id IN (
      SELECT p.id FROM public.action_plans p
      WHERE public.is_admin_for_tenant(p.tenant_id)
         OR EXISTS (SELECT 1 FROM public.tenant_members tm
                    WHERE tm.tenant_id = p.tenant_id AND tm.user_id = (SELECT auth.uid()))
    )
  );

-- Notificações: "all" é da plataforma (super_admin); "tenant" e "user" ficam
-- com o admin da empresa alvo / de uma empresa do usuário alvo.
CREATE OR REPLACE FUNCTION public.can_manage_notification(p_target_type text, p_target_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
      OR (p_target_type = 'tenant' AND p_target_id IS NOT NULL AND public.is_admin_for_tenant(p_target_id))
      OR (p_target_type = 'user' AND p_target_id IS NOT NULL AND public.is_admin_of_user(p_target_id));
$$;

DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT
  WITH CHECK (public.can_manage_notification(target_type, target_id));
DROP POLICY IF EXISTS "Admins can update notifications" ON public.notifications;
CREATE POLICY "Admins can update notifications" ON public.notifications FOR UPDATE
  USING (public.can_manage_notification(target_type, target_id))
  WITH CHECK (public.can_manage_notification(target_type, target_id));
DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;
CREATE POLICY "Admins can delete notifications" ON public.notifications FOR DELETE
  USING (public.can_manage_notification(target_type, target_id));
DROP POLICY IF EXISTS "Users can read targeted notifications" ON public.notifications;
CREATE POLICY "Users can read targeted notifications" ON public.notifications FOR SELECT
  USING (
    target_type = 'all'
    OR (target_type = 'user' AND target_id = (SELECT auth.uid()))
    OR (target_type = 'tenant' AND target_id IN (
          SELECT tm.tenant_id FROM public.tenant_members tm WHERE tm.user_id = (SELECT auth.uid())))
    OR public.can_manage_notification(target_type, target_id)
  );
