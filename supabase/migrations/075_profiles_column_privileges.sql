-- Achado #1 (ACHADOS-AUDITORIA.md): o usuário podia alterar via PostgREST
-- campos administrativos do próprio perfil (permissions, is_active,
-- login_start_time/login_end_time, timezone). A policy "Users can update own
-- profile" só travava `role`, e RLS filtra linhas, não colunas.
--
-- Correção: privilégio de UPDATE por coluna. `authenticated` só atualiza os
-- campos pessoais que a aplicação grava com a sessão do usuário:
--   - name, phone, social_media, updated_at  (updateProfile, auth.ts)
--   - avatar_url                              (campo pessoal)
--   - active_tenant_id                        (troca de empresa, tenant.ts)
-- Campos administrativos ficam só para service_role (createAdminClient) e
-- funções SECURITY DEFINER (setup_new_user), que não dependem deste GRANT.
-- `timezone` fica de fora de propósito: define a janela de horário de acesso.

REVOKE UPDATE ON public.profiles FROM PUBLIC, anon, authenticated;

GRANT UPDATE (name, avatar_url, phone, social_media, active_tenant_id, updated_at)
  ON public.profiles TO authenticated;

-- Com `role` fora do GRANT, o `role = 'user'` do WITH CHECK virou redundante
-- e ainda bloqueava manager/viewer/papéis customizados de editar o próprio
-- nome (o erro era ignorado em updateProfile).
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
