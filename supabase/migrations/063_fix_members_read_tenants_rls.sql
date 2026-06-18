-- Corrige a policy "Members can read own tenants" da tabela `tenants`.
--
-- BUG (introduzido em 002_tenants.sql): dentro do EXISTS
--   (SELECT 1 FROM tenant_members WHERE tenant_id = id AND user_id = auth.uid())
-- a coluna `id` não-qualificada resolvia para `tenant_members.id` (PK da
-- membership), e não para `tenants.id` (tabela externa da policy). Logo a
-- condição `tenant_id = id` era SEMPRE falsa e o EXISTS nunca retornava linhas.
--
-- Efeito: apenas `is_admin()` (super_admin/admin/manager) conseguia ler
-- empresas. Um membro com papel `user`/`viewer` nunca enxergava a própria
-- empresa via RLS — `getUserTenants()` retornava vazio e o usuário ficava preso
-- na tela "Aguardando aprovação" mesmo possuindo vínculo em `tenant_members`.
--
-- Correção: correlacionar explicitamente com a tabela externa (`tenants.id`) e
-- qualificar as colunas de `tenant_members`.

DROP POLICY IF EXISTS "Members can read own tenants" ON public.tenants;

CREATE POLICY "Members can read own tenants"
  ON public.tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_members.tenant_id = tenants.id
        AND tenant_members.user_id = auth.uid()
    )
  );
