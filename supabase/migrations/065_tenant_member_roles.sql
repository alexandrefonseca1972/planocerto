-- Papel de PERMISSÕES por empresa (tenant), separado da governança de
-- membership (tenant_members.role: owner/admin/member).
--
-- Até aqui o papel efetivo do usuário (builtin ou customizado, tabela
-- `roles`) era 100% global via profiles.role — o mesmo papel valia em
-- qualquer empresa. Esta migration cria tenant_member_roles para permitir
-- que um usuário tenha papéis DIFERENTES em empresas diferentes.
--
-- Fallback: ausência de linha em tenant_member_roles para um
-- (tenant_id, user_id) = usa profiles.role (comportamento atual,
-- preservado sem qualquer backfill). Ver effective_role_for_tenant()
-- na migration 066.

-- Extrai a validação de "builtin ou existe em public.roles" (hoje só em
-- validate_profile_role, 062_profiles_role_dynamic.sql) para uma função
-- compartilhada, reusada pela nova trigger de tenant_member_roles.
CREATE OR REPLACE FUNCTION public.is_valid_role_name(p_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_role IN ('super_admin', 'admin', 'manager', 'user', 'viewer')
      OR EXISTS (SELECT 1 FROM public.roles WHERE name = p_role);
$$;

-- validate_profile_role passa a delegar em is_valid_role_name (mesmo
-- comportamento de antes, só elimina a duplicação da lista de builtins).
CREATE OR REPLACE FUNCTION public.validate_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS NULL THEN
    RAISE EXCEPTION 'O papel (role) do perfil não pode ser nulo.';
  END IF;
  IF public.is_valid_role_name(NEW.role) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Papel inválido: %', NEW.role;
END;
$$;

CREATE TABLE IF NOT EXISTS public.tenant_member_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id),
  -- Só permite atribuir papel de permissão a quem já é membro do tenant.
  FOREIGN KEY (tenant_id, user_id) REFERENCES public.tenant_members(tenant_id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tenant_member_roles_user   ON public.tenant_member_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_member_roles_tenant ON public.tenant_member_roles(tenant_id);

CREATE OR REPLACE FUNCTION public.validate_tenant_member_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS NULL THEN
    RAISE EXCEPTION 'O papel (role) não pode ser nulo.';
  END IF;
  IF public.is_valid_role_name(NEW.role) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Papel inválido: %', NEW.role;
END;
$$;

DROP TRIGGER IF EXISTS validate_tenant_member_role_trg ON public.tenant_member_roles;
CREATE TRIGGER validate_tenant_member_role_trg
  BEFORE INSERT OR UPDATE OF role ON public.tenant_member_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_member_role();

ALTER TABLE public.tenant_member_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_member_roles read self or admin" ON public.tenant_member_roles;
CREATE POLICY "tenant_member_roles read self or admin" ON public.tenant_member_roles FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

-- Gestão restrita a quem já gerencia vínculos de empresa (mesma permissão
-- usada em admin.ts para editar tenant_members de um usuário).
DROP POLICY IF EXISTS "tenant_member_roles manage" ON public.tenant_member_roles;
CREATE POLICY "tenant_member_roles manage" ON public.tenant_member_roles FOR ALL
  USING (public.is_admin() OR public.has_perm('users.manage_tenants'))
  WITH CHECK (public.is_admin() OR public.has_perm('users.manage_tenants'));

COMMENT ON TABLE public.tenant_member_roles IS
  'Papel de PERMISSÕES do usuário numa empresa específica (builtin ou nome de public.roles). '
  'Sem linha aqui = usa profiles.role (fallback global). Distinto de tenant_members.role '
  '(owner/admin/member), que é só governança de membership.';
