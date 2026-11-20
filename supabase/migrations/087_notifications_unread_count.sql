-- Contagem de notificações não lidas em uma única consulta (usada por
-- GET /api/notifications/unread). Mesma semântica de getUnreadCount():
-- target 'all' / usuário / tenant atual, não expiradas, sem leitura do usuário.
-- SECURITY INVOKER: a RLS de notifications/notification_reads continua valendo.
-- p_tenant null => tenant atual (profiles.active_tenant_id, senão primeiro
-- tenant visível por nome), igual a getCurrentTenantId().
create or replace function public.unread_notifications_count(p_tenant uuid default null)
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  with t as (
    select coalesce(
      p_tenant,
      (select active_tenant_id from public.profiles where id = (select auth.uid())),
      (select id from public.tenants order by name limit 1)
    ) as id
  )
  select count(*)::integer
  from public.notifications n, t
  where (n.target_type = 'all'
         or n.target_id = (select auth.uid())
         or n.target_id = t.id)
    and (n.expires_at is null or n.expires_at > now())
    and not exists (
      select 1 from public.notification_reads r
      where r.notification_id = n.id and r.user_id = (select auth.uid())
    );
$$;

grant execute on function public.unread_notifications_count(uuid) to authenticated;
