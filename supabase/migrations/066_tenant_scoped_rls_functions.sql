-- Funções RLS "tenant-scoped": variantes de is_admin()/has_perm() que
-- consideram o papel efetivo do usuário NA EMPRESA informada (via
-- tenant_member_roles, com fallback para profiles.role).
--
-- is_admin()/has_perm()/is_super_admin() (aridade zero) permanecem
-- intocadas de propósito — evita quebrar as policies existentes e
-- ambiguidade de overload. As novas funções têm nome distinto e são
-- adotadas tabela por tabela nas próximas migrations (067+).

CREATE OR REPLACE FUNCTION public.effective_role_for_tenant(p_user_id uuid, p_tenant_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.tenant_member_roles WHERE user_id = p_user_id AND tenant_id = p_tenant_id),
    (SELECT role FROM public.profiles WHERE id = p_user_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_for_tenant(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
      OR public.effective_role_for_tenant(auth.uid(), p_tenant_id) IN ('admin', 'manager');
$$;

-- Espelha a semântica atual de has_perm(): admin-like (super_admin/admin/
-- manager) sempre tem a permissão; papel customizado atribuído NESSE tenant
-- concede se marcado em roles.permissions; override individual (global,
-- profiles.permissions) também conta. Não expande granularidade além do
-- que has_perm() já cobre hoje (user/viewer não têm checagem própria aqui,
-- igual ao comportamento atual).
CREATE OR REPLACE FUNCTION public.has_perm_for_tenant(required_perm text, p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.effective_role_for_tenant(auth.uid(), p_tenant_id) IN ('super_admin', 'admin', 'manager')
      OR EXISTS (
        SELECT 1 FROM public.roles r
        WHERE r.name = public.effective_role_for_tenant(auth.uid(), p_tenant_id)
          AND (r.permissions ? required_perm)
          AND (r.permissions ->> required_perm)::boolean IS TRUE
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND (p.permissions ? required_perm)
          AND (p.permissions ->> required_perm)::boolean IS TRUE
      );
$$;

COMMENT ON FUNCTION public.effective_role_for_tenant(uuid, uuid) IS
  'Papel efetivo de um usuário numa empresa: tenant_member_roles se existir, senão profiles.role (fallback global).';
COMMENT ON FUNCTION public.is_admin_for_tenant(uuid) IS
  'Equivalente a is_admin(), mas considerando o papel efetivo do usuário corrente NA EMPRESA informada.';
COMMENT ON FUNCTION public.has_perm_for_tenant(text, uuid) IS
  'Equivalente a has_perm(), mas considerando o papel efetivo do usuário corrente NA EMPRESA informada.';
