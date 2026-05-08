-- Tabela de papéis customizados.
-- Permite que administradores criem papéis com conjuntos específicos de permissões.

CREATE TABLE IF NOT EXISTS public.roles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  description     TEXT DEFAULT '',
  permissions     JSONB NOT NULL DEFAULT '{}',
  is_system       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all roles"
  ON public.roles FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert roles"
  ON public.roles FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update roles"
  ON public.roles FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete roles"
  ON public.roles FOR DELETE
  USING (is_admin());

-- Remove CHECK constraint on profiles.role para permitir nomes de papéis customizados
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
