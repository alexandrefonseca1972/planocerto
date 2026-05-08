-- Catálogo de PRIORIDADE (modelo Excel APOIO coluna C).

CREATE TABLE IF NOT EXISTS public.prioridades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  color       TEXT NOT NULL DEFAULT 'zinc',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prioridades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prioridades read"        ON public.prioridades FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "prioridades admin write" ON public.prioridades FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.prioridades (name, sort_order, color) VALUES
  ('Alta',  1, 'red'),
  ('Média', 2, 'amber'),
  ('Baixa', 3, 'zinc')
ON CONFLICT (name) DO NOTHING;
