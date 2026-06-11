-- Tabela singleton: uma linha = configuração ativa de LLM para o app.
-- A api_key só é lida via service role (createAdminClient) — nunca exposta via RLS.
CREATE TABLE IF NOT EXISTS public.llm_settings (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider   text        NOT NULL DEFAULT 'openrouter',
  model      text        NOT NULL DEFAULT 'anthropic/claude-3-haiku-20240307',
  api_key    text,
  base_url   text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.llm_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin pode gerenciar llm_settings"
  ON public.llm_settings
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Linha default (sem api_key → fallback para env var OPENROUTER_API_KEY)
INSERT INTO public.llm_settings (provider, model)
VALUES ('openrouter', 'anthropic/claude-3-haiku-20240307')
ON CONFLICT DO NOTHING;
