-- Achado #2 (ACHADOS-AUDITORIA.md): effective_role_for_tenant() caía no papel
-- global (profiles.role) sem exigir vínculo com a empresa, então um
-- admin/manager global passava em is_admin_for_tenant() de QUALQUER empresa.
--
-- Correção: papel por empresa só existe para quem é membro (tenant_members).
-- Não-membro: NULL, exceto super_admin, que segue com acesso global.
-- has_perm_for_tenant(): o override individual (profiles.permissions) também
-- passa a exigir vínculo.
--
-- Antes de aplicar em produção, liste quem perde acesso:
--   SELECT p.id, p.email, p.role, t.id AS tenant_id, t.name
--   FROM public.profiles p CROSS JOIN public.tenants t
--   WHERE p.role IN ('admin', 'manager')
--     AND NOT EXISTS (SELECT 1 FROM public.tenant_members tm
--                     WHERE tm.user_id = p.id AND tm.tenant_id = t.id);

CREATE OR REPLACE FUNCTION public.effective_role_for_tenant(p_user_id uuid, p_tenant_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE user_id = p_user_id AND tenant_id = p_tenant_id
    ) THEN COALESCE(
      (SELECT role FROM public.tenant_member_roles WHERE user_id = p_user_id AND tenant_id = p_tenant_id),
      (SELECT role FROM public.profiles WHERE id = p_user_id)
    )
    WHEN (SELECT role FROM public.profiles WHERE id = p_user_id) = 'super_admin' THEN 'super_admin'
  END;
$$;

-- Papel NULL (não-membro) deixaria o IN como NULL; força boolean.
CREATE OR REPLACE FUNCTION public.is_admin_for_tenant(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
      OR COALESCE(public.effective_role_for_tenant(auth.uid(), p_tenant_id) IN ('admin', 'manager'), false);
$$;

CREATE OR REPLACE FUNCTION public.has_perm_for_tenant(required_perm text, p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.effective_role_for_tenant(auth.uid(), p_tenant_id) IN ('super_admin', 'admin', 'manager')
    OR EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.name = public.effective_role_for_tenant(auth.uid(), p_tenant_id)
        AND (r.permissions ? required_perm)
        AND (r.permissions ->> required_perm)::boolean IS TRUE
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.tenant_members tm ON tm.user_id = p.id AND tm.tenant_id = p_tenant_id
      WHERE p.id = auth.uid()
        AND (p.permissions ? required_perm)
        AND (p.permissions ->> required_perm)::boolean IS TRUE
    ),
    false
  );
$$;

COMMENT ON FUNCTION public.effective_role_for_tenant(uuid, uuid) IS
  'Papel efetivo numa empresa: exige vínculo em tenant_members (tenant_member_roles, senão profiles.role). Não-membro: NULL, exceto super_admin.';
