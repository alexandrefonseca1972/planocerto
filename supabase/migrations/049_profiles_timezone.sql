-- 049_profiles_timezone.sql
-- Timezone por perfil para a restrição de janela de horário de login.
-- Antes, o timezone era "inferido" do cabeçalho Accept-Language (spoofável e, na
-- prática, sempre America/Sao_Paulo). Agora é um campo do perfil, server-side.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Sao_Paulo';

COMMENT ON COLUMN public.profiles.timezone IS
  'IANA timezone usado para avaliar a janela de horário de login (login_start_time/login_end_time).';
