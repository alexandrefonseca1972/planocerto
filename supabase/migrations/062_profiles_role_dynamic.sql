-- profiles.role precisa aceitar tanto os papéis builtin quanto papéis
-- customizados cadastrados em public.roles. Um CHECK não pode referenciar outra
-- tabela, então trocamos o CHECK estático por uma trigger de validação.
-- Sem isto, criar/editar um usuário com papel customizado violava
-- profiles_role_check e o cadastro era revertido com erro genérico.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

CREATE OR REPLACE FUNCTION public.validate_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS NULL THEN
    RAISE EXCEPTION 'O papel (role) do perfil não pode ser nulo.';
  END IF;
  -- Papéis builtin sempre válidos.
  IF NEW.role IN ('super_admin', 'admin', 'manager', 'user', 'viewer') THEN
    RETURN NEW;
  END IF;
  -- Papéis customizados precisam existir em public.roles.
  IF EXISTS (SELECT 1 FROM public.roles WHERE name = NEW.role) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Papel inválido: %', NEW.role;
END;
$$;

DROP TRIGGER IF EXISTS validate_profile_role_trg ON public.profiles;
CREATE TRIGGER validate_profile_role_trg
  BEFORE INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_role();
