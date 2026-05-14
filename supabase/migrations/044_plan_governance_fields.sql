-- FASE 2: Governança e Estrutura de Dados

ALTER TABLE public.action_plans 
  ADD COLUMN IF NOT EXISTS exercicio INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  ADD COLUMN IF NOT EXISTS budget_limit NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'restricted'));

-- Comentário para documentar os novos campos
COMMENT ON COLUMN public.action_plans.exercicio IS 'Ano de exercício do plano de ação para fins de agrupamento e histórico.';
COMMENT ON COLUMN public.action_plans.budget_limit IS 'Teto orçamentário definido para a execução de todas as ações deste plano.';
COMMENT ON COLUMN public.action_plans.visibility IS 'Controle de visibilidade: public (todos da empresa) ou restricted (apenas quem tem acesso explícito).';
