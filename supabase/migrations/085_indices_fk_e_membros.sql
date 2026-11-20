-- 085: índices para filtros e chaves estrangeiras sem índice.
-- tenant_members é consultada por user_id em todas as políticas RLS (o índice existente
-- começa por tenant_id). As FKs item_id evitam seq scan ao excluir itens (checagem/cascata)
-- e ao buscar histórico/comentários/anexos de um item.

CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON public.tenant_members (user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_plan_audit_log_item ON public.plan_audit_log (item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_item_comments_item ON public.item_comments (item_id, created_at);
CREATE INDEX IF NOT EXISTS idx_plan_attachments_item ON public.plan_attachments (item_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON public.notification_reads (user_id);
