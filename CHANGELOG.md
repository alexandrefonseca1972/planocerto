# Changelog

Todas as mudanças notáveis do PlanoCerto documentadas aqui.

## [2.0.0] — 2026-05-04

### Adicionado
- Gráfico de Gantt SVG (visualização temporal com zoom mês/trimestre/ano)
- Notificações por email via Resend (item criado/concluído)
- Upload de anexos em itens de ação (imagens, PDF, Excel, CSV)
- Templates de plano 5W2H (Comercial, Operacional, Expansão)
- Dashboard público via link compartilhável (/s/[token])
- Cópia de plano entre tenants
- Comentários por item de ação
- Exportação PDF (HTML formatado para impressão)
- Integração com calendário externo (infraestrutura)

### Modificado
- Drag-and-drop Kanban com @dnd-kit/core
- Bulk status update (dropdown "Lote")
- Reset de senha com email de recuperação
- Confirmação de email real (Supabase)
- ESLint strict (no-explicit-any: error)
- TypeScript strict mode

### Corrigido
- Migração 004_pdca.sql conflitante removida
- Redirect loop no proxy quando usuário tem restrição de horário
- Proteção de rotas unificada (/planos, /calendario, /pendente)
- Dados stale após mutations (router.refresh)
- Coluna teams_webhook_url ausente nas migrations
- KPIs do dashboard com categorias mutuamente exclusivas
- Progresso calculado corretamente (completed/total)
- Zod valida após .trim() — sem bypass
- Audit log: delete agora registra DELETE_PLAN
- Email duplicado no addTenantMember tratado
- JSON.parse seguro para permissões
- Campo expected_result duplicado removido

### Segurança
- Criação/promoção de admin bloqueada via web form
- Último owner não pode ser removido/demovido
- Admin precisa ser membro para trocar de tenant
- Timeout 5s no webhook Teams
- Validação de URL HTTPS + domínios MS Teams
- SSRF mitigado com validação de domínio
- Sanitização de inputs em todos os forms

### Performance
- Planos page refatorada (830 → 756 linhas)
- flattenItems memoizado via useMemo
- getUnreadCount otimizado (COUNT query)
- Notificações com polling 30s
- Componentes extraídos: plan-utils, plan-kanban, copy-plan-button, share-link-button, attachment-section, plan-gantt

### Testes
- 100 testes unitários em 9 arquivos
- Cobertura: utils, validations (auth, admin, tenant), sanitize, errors, dashboard KPIs, teams/webhook, plan-utils

## [1.0.0] — Versão inicial

- Autenticação email/senha com Supabase
- CRUD de planos 5W2H e itens de ação
- Dashboard executivo com KPIs e gráficos
- Kanban board e tabela de ações
- Calendário de prazos
- Admin panel (usuários, tenants, notificações)
- Notificações Microsoft Teams
- Exportação Excel
- Login time restrictions
- Dark/Light theme
- RBAC com RLS no Supabase
- Multi-tenancy
