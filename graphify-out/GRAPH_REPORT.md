# Graph Report - planocerto  (2026-11-20)

## Corpus Check
- 648 files · ~367,995 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 1, .xlsb 1, .ico 1)

## Summary
- 2882 nodes · 8445 edges · 178 communities (122 shown, 56 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 99 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c6104907`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Input
- dashboard-client.tsx
- prioridades-client.tsx
- alert-dialog.tsx
- actions/auth.ts
- Dashboard e Calendário
- Importação de Planos
- Monitoramento e Testes
- Dependências do Projeto
- Button
- Catálogos Administrativos
- use-planos-data.ts
- Administração Supabase
- Financeiro e Anexos
- plan-form-dialog.tsx
- Gestão de Usuários
- server.ts
- getCurrentTenantId
- Testes de Planos
- Formulário de Ações
- contas-pagar-client.tsx
- proxy.ts
- Navegação e Tenant
- types/catalog.ts
- Papéis e Permissões
- item-form-dialog.tsx
- Cliente Supabase
- sanitizeText
- CompaniesClient
- Configuração de IA
- Tabela de Planos
- Templates de Email
- Arquitetura Supabase
- Ações de Benchmarking
- Usuários e Empresas
- Modelo de Dados
- Migrations e Rollbacks
- _fixture_financeiro_planos.sql
- attachments.ts
- Benchmarking no Banco
- Label
- Guia do Desenvolvedor
- Gestão de Empresas
- codex advisor artifact
- login-form.tsx
- CRUD de Catálogos
- Consultas Financeiras
- public.profiles
- Escopos de Usuários
- API e Autenticação
- Documentos Legais
- Contexto de Tenant
- Diário Oficial
- calendar-grid.tsx
- Catálogo de Prioridades
- Segurança e RLS
- Catálogos no Banco
- Debug Financeiro
- schools.ts
- distribution-card.tsx
- Ações de Catálogo
- Formulários de Instituições
- Macro Ações
- Badge
- Seleção de Período
- Validação e Sanitização
- Benchmarking de Concorrentes
- 077_write_policies.test.sql
- Ações Rápidas
- Gráficos do Dashboard
- vitest
- macro-acoes.ts
- Pendências e correções concluídas do PlanoCerto
- Modal de Ajuda
- Membros de Tenants
- Revisão Financeira
- notifications.ts
- validation/sanitize.ts
- Termos de Uso
- codex advisor artifact
- CardHeader
- Detalhes de Benchmarking
- public.profiles
- _catalog-crud-factory.ts
- validation/sanitize.ts
- Correções e IA
- validations/auth.ts
- plan-form-dialog.tsx
- Configuração de Build
- Filtros de Planos
- Auditoria e Templates
- (protected)/layout.tsx
- Documentação no Frontend
- 030_super_admin_and_user_scopes.sql
- dashboard/page.tsx
- Configuração ESLint
- 075_076_privileges.test.sql
- Empresas no Banco
- next.config.ts
- users/page.tsx
- public.tenants
- Fornecedores no Banco
- Regras para Agentes
- Ícone de Globo
- deriveActionItemStatus
- Configuração PostCSS
- Ícone da Aplicação
- Layout de Benchmarking
- pg_temp.count_as
- AreaUnitFilter
- Setup e Migrations
- Deploy de Documentação
- Privacidade e Segurança
- Cookies e Rastreamento
- Retenção de Dados
- Uso Aceitável
- Configuração PostCSS
- Ícone da Aplicação
- Migration de Prioridades
- Execuções de Ingestão
- Configurações de LLM
- Logo de Email
- Ícone de Arquivo
- detail-table.tsx
- Rollback da 084_macro_acao_normalizacao
- 078_account_access.test.sql
- 082_concorrencia.test.sh
- help-modal.tsx
- email.ts
- actions/action-plan.ts
- eslint.config.mjs
- getUnits
- deploy.sh
- plan-item-form-helpers.ts
- plan-filters.tsx
- create-plan-duplicate.test.ts
- errors.ts
- unread/route.ts
- LogoLoader
- getResumoContas

## God Nodes (most connected - your core abstractions)
1. `cn()` - 201 edges
2. `createClient()` - 177 edges
3. `Button` - 129 edges
4. `lucide-react` - 105 edges
5. `react` - 104 edges
6. `Input` - 102 edges
7. `Card` - 98 edges
8. `CardContent` - 96 edges
9. `next` - 95 edges
10. `createAdminClient()` - 70 edges

## Surprising Connections (you probably didn't know these)
- `Para desfazer` --references--> `getPlans()`  [INFERRED]
  .omc/artifacts/ask/codex-revis-o-de-c-digo-das-mudan-as-n-o-commitadas-git-diff-arqui-2026-11-19T23-16-50-981Z.md → src/app/actions/action-plan.ts
- `Para desfazer` --references--> `getPlans()`  [INFERRED]
  .omc/artifacts/ask/codex-verifica-o-das-corre-es-dos-7-achados-da-revis-o-anterior-re-2026-11-19T23-24-22-314Z.md → src/app/actions/action-plan.ts
- `Trecho recente da conversa (texto, redigido)` --references--> `main()`  [INFERRED]
  .omc/handoffs/latest.md → scripts/import-all-plans.ts
- `Para desfazer` --references--> `getItems()`  [INFERRED]
  .omc/artifacts/ask/codex-revis-o-de-c-digo-das-mudan-as-n-o-commitadas-git-diff-arqui-2026-11-19T23-16-50-981Z.md → src/app/actions/action-plan.ts
- `Para desfazer` --references--> `getItems()`  [INFERRED]
  .omc/artifacts/ask/codex-verifica-o-das-corre-es-dos-7-achados-da-revis-o-anterior-re-2026-11-19T23-24-22-314Z.md → src/app/actions/action-plan.ts

## Import Cycles
- 2-file cycle: `src/app/actions/tenant.ts -> src/lib/supabase/session.ts -> src/app/actions/tenant.ts`
- 3-file cycle: `src/app/actions/admin.ts -> src/lib/supabase/session.ts -> src/app/actions/tenant.ts -> src/app/actions/admin.ts`
- 3-file cycle: `src/app/actions/_helpers.ts -> src/lib/supabase/session.ts -> src/app/actions/tenant.ts -> src/app/actions/_helpers.ts`
- 4-file cycle: `src/app/actions/_helpers.ts -> src/lib/supabase/session.ts -> src/app/actions/tenant.ts -> src/app/actions/admin.ts -> src/app/actions/_helpers.ts`

## Hyperedges (group relationships)
- **Stack self-hosted de deployment de produção do PlanoCerto** — readme_vps_deployment, readme_nextjs_16, readme_self_hosted_backend, readme_caddy, readme_systemd, readme_cloudflare [EXTRACTED 1.00]
- **Self-hosted Auth Email Template Suite** — supabase_templates_magic_link_entity, supabase_templates_recovery_entity, supabase_templates_confirmation_entity, supabase_templates_invite_entity, supabase_templates_email_change_entity, supabase_templates_reauthentication_entity, supabase_templates_password_changed_notification_entity [EXTRACTED 1.00]
- **** — docs_arquitetura_frontend_entity, docs_arquitetura_auth_entity, docs_arquitetura_rls_entity, docs_arquitetura_postgresql_entity [EXTRACTED 1.00]
- **** — docs_benchmarking_concorrentes_instituicoes_table_entity, docs_benchmarking_concorrentes_cursos_instituicao_table_entity, docs_benchmarking_concorrentes_corpo_docente_table_entity, docs_benchmarking_concorrentes_mensalidades_table_entity, docs_benchmarking_concorrentes_inherited_rls_entity [EXTRACTED 1.00]
- **** — docs_implementation_plan_ciclo_qualidade_entity, docs_implementation_plan_contratos_qualidade_entity, docs_implementation_plan_vitest_entity, docs_implementation_plan_husky_entity, docs_implementation_plan_testing_strategy_entity [EXTRACTED 1.00]
- **** — docs_implementation_plan_inlabs_client_entity, docs_implementation_plan_sanitizacao_entity, docs_implementation_plan_ingest_worker_entity, docs_implementation_plan_do_publications_entity, docs_implementation_plan_ingest_runs_entity [EXTRACTED 1.00]
- **** — docs_implementation_plan_social_webhook_entity, docs_implementation_plan_social_signal_schema_entity, docs_implementation_plan_correlation_engine_entity, docs_implementation_plan_generate_insight_entity, docs_implementation_plan_entity_correlations_entity, docs_implementation_plan_alert_worker_entity [EXTRACTED 1.00]
- **** — docs_plano_correcao_ai_pipeline_entity, docs_plano_correcao_idempotency_entity, docs_plano_correcao_llm_cost_entity, docs_plano_correcao_frontend_tests_entity [EXTRACTED 1.00]
- **** — docs_plano_implementacao_phase1_entity, docs_plano_implementacao_phase2_entity, docs_plano_implementacao_phase3_entity, docs_plano_implementacao_phase4_entity, docs_plano_implementacao_phase5_entity, docs_plano_implementacao_phase_review_entity [EXTRACTED 1.00]

## Communities (178 total, 56 thin omitted)

### Community 0 - "Input"
Cohesion: 0.09
Nodes (52): react, lookupCnpj(), initialState, PLAN_LABEL, TenantFormDialog(), AreaForm(), FormValues, init (+44 more)

### Community 1 - "dashboard-client.tsx"
Cohesion: 0.09
Nodes (25): AreaInfo, BarSeg(), BUCKET_DOT, DashboardActionRow, DashboardClientProps, DeadlineItem, DeadlineKind, DeadlineRow() (+17 more)

### Community 2 - "prioridades-client.tsx"
Cohesion: 0.08
Nodes (63): toggleAreaActive, toggleMacroAcaoActive, getPrioridadesAdmin, togglePrioridadeActive, getTenantMembers(), toggleTipoPAActive, CatalogCard, CatalogosPage() (+55 more)

### Community 3 - "alert-dialog.tsx"
Cohesion: 0.10
Nodes (16): BaseCatalogRow, CatalogHeader(), CatalogHeaderProps, CatalogModalProps, CatalogSkeleton(), CatalogTableProps, CharCounterProps, DeleteDialogProps (+8 more)

### Community 4 - "actions/auth.ts"
Cohesion: 0.14
Nodes (26): AdminFormState, changePassword(), resetPassword(), updatePassword(), updateProfile(), initialState, ResetPasswordPage(), initialState (+18 more)

### Community 5 - "Dashboard e Calendário"
Cohesion: 0.08
Nodes (58): processUnsentAlerts, Apify, calculateSeverity, Ciclo obrigatório de implementação e qualidade, Padrões obrigatórios de código, Contratos de qualidade e segurança, Motor correlate, Cypress (+50 more)

### Community 6 - "Importação de Planos"
Cohesion: 0.05
Nodes (55): dependencies, aws4fetch@^1.0.20, class-variance-authority@^0.7.1, clsx@^2.1.1, date-fns@^4.1.0, @dnd-kit/core@^6.3.1, @dnd-kit/sortable@^10.0.0, @dnd-kit/utilities@^3.2.2 (+47 more)

### Community 7 - "Monitoramento e Testes"
Cohesion: 0.11
Nodes (52): activateUser(), ADMIN_ASSIGNABLE_ROLES, AreaOption, assertCanManageUser(), auditLog(), AuditLogEntry, BUILTIN_ROLES, bulkDeleteUsers() (+44 more)

### Community 8 - "Dependências do Projeto"
Cohesion: 0.10
Nodes (45): xlsx, POST(), POST(), walk(), ACCEPTED_EXTS, FileRow(), FileValidation, safeJson() (+37 more)

### Community 9 - "Button"
Cohesion: 0.07
Nodes (57): lucide-react, AuthPage(), renderCard(), Kpi(), metadata, PLAN_BADGE, createInitialState, CatalogTable() (+49 more)

### Community 10 - "Catálogos Administrativos"
Cohesion: 0.15
Nodes (22): Loading(), Loading(), Loading(), Loading(), Loading(), Loading(), Loading(), Loading() (+14 more)

### Community 11 - "use-planos-data.ts"
Cohesion: 0.22
Nodes (11): getPlanItemsBundle(), getPlanosBootstrap(), getPlans(), getAreas(), getMacroAcoes(), usePlanosData(), loadPlanItems(), refreshItems() (+3 more)

### Community 12 - "Administração Supabase"
Cohesion: 0.05
Nodes (46): Planos 5W2H — What, Why, Where, Who, When, How Much e How, Restrição de horário de login por usuário, Comentários por item de ação, Admin panel para usuários, tenants e permissões, API Reference — docs/API-REFERENCE.md — Server Actions, Auth e exemplos, Arquitetura — docs/ARQUITETURA.md, Upload de anexos de imagem, PDF e Excel, Autenticação por email e senha com reset e confirmação (+38 more)

### Community 13 - "Financeiro e Anexos"
Cohesion: 0.13
Nodes (29): checkPermission(), getCurrentUserPermissions(), loadCustomRolesMap(), AccountAccessStatus, getAccountAccessStatus(), getEffectiveRole(), getRequesterScope(), log (+21 more)

### Community 14 - "plan-form-dialog.tsx"
Cohesion: 0.12
Nodes (24): clonePlanWithDateShift(), ActionItemInsert, addComment(), commentSchema, copyPlan(), createPlanFromTemplate(), createPublicLink(), deleteComment() (+16 more)

### Community 15 - "Gestão de Usuários"
Cohesion: 0.05
Nodes (43): Comentários por item de ação, Upload de anexos em itens de ação, Remoção de plano meio-órfão no upload em lote, Slug de empresa único, gerado no servidor e imutável, Kanban drag-and-drop com @dnd-kit/core, Mapeamento de vocabulário alternativo de status FAROL, Gráfico de Gantt SVG com zoom mês, trimestre e ano, Permissão plans.update na rota /api/plans/[id]/import (+35 more)

### Community 16 - "server.ts"
Cohesion: 0.11
Nodes (19): @supabase/ssr, AuthEmailKind, brand, buildAuthEmail(), renderLayout(), env, envSchema, AuthResult (+11 more)

### Community 17 - "getCurrentTenantId"
Cohesion: 0.11
Nodes (26): crud, deleteArea, getAreasAdmin(), log, upsertArea, getInstituicao(), getCurrentTenantId(), deleteUnit() (+18 more)

### Community 18 - "Testes de Planos"
Cohesion: 0.10
Nodes (28): getRoles(), AdminNav(), allLinks, NavLink, AdminLayout(), checkAdminAccess(), metadata, RolesPage() (+20 more)

### Community 19 - "Formulário de Ações"
Cohesion: 0.07
Nodes (36): Gestão administrativa de contexto regional e documentos, Base de Conhecimento IA e Inteligência Regional — Versão 2.1, Base de conhecimento proprietária knowledge_base, Contexto Local de Execução no prompt do Claude, Busca semântica RAG com pgvector, regional_context JSONB em units e areas, Motor de sugestão contextual suggest5W2H, Clonagem clonePlanWithDateShift e targetTenantId (+28 more)

### Community 20 - "contas-pagar-client.tsx"
Cohesion: 0.07
Nodes (59): getContaById(), pagarParcelasEmLote(), ContaDetalhePage(), metadata, Anual(), diasAteVencer(), FinanceiroClient(), MESES (+51 more)

### Community 21 - "proxy.ts"
Cohesion: 0.15
Nodes (14): logger, Logger, checkAuth(), blockedMessage(), checkProfileRestrictions(), log, ProfileCheckResult, isApiRoute() (+6 more)

### Community 22 - "Navegação e Tenant"
Cohesion: 0.11
Nodes (32): createPlan(), countBy(), init, PlanosPage(), BudgetHealthBar(), CopyPlanButtonProps, PlanQuickActions(), Props (+24 more)

### Community 23 - "types/catalog.ts"
Cohesion: 0.17
Nodes (16): getPrioridades(), RegionalContextFormProps, ItemFormDialogProps, PlanFormDialogProps, PlanItemUnitPreview, ActionPlanFormState, Area, CHANCE_CONTATO (+8 more)

### Community 24 - "Papéis e Permissões"
Cohesion: 0.10
Nodes (30): getAiModelsForPlan(), RegionalContext, suggest5W2H(), UnitRegionalData, invalidBaseUrl(), LlmFormState, LlmSettingsPublic, requireSuperAdmin() (+22 more)

### Community 25 - "item-form-dialog.tsx"
Cohesion: 0.25
Nodes (13): getItemAuditLog(), Field(), ItemFormDialog(), Modal(), Msg(), formatAuditEntryDate(), getAuditEntryMarker(), getAuditEntrySummary() (+5 more)

### Community 26 - "Cliente Supabase"
Cohesion: 0.09
Nodes (19): {{ .ConfirmationURL }}, {{ .Email }}, Confirmation Email Template, Email Change Template, {{ .NewEmail }}, Invite Email Template, Magic Link Email Template, Password Changed Notification Template (+11 more)

### Community 27 - "sanitizeText"
Cohesion: 0.12
Nodes (41): checkIsAdmin(), updateAreaRegionalContext(), mapPgError(), requireAdmin(), checkCompetitorWrite(), deleteCorpoDocente(), deleteCursoInstituicao(), deleteInstituicao() (+33 more)

### Community 28 - "CompaniesClient"
Cohesion: 0.16
Nodes (11): assignCompaniesSchema, assignCompaniesToUnit(), companySchema, deleteCompany(), getCompanies(), readForm(), upsertCompany(), CompaniesClient() (+3 more)

### Community 29 - "Configuração de IA"
Cohesion: 0.07
Nodes (27): devDependencies, husky@^9.1.7, jsdom@^29.1.1, lint-staged@^15.4.3, pino-pretty@^13.1.3, tailwindcss@^4, @tailwindcss/postcss@^4, @testing-library/jest-dom@^6.9.1 (+19 more)

### Community 30 - "Tabela de Planos"
Cohesion: 0.10
Nodes (30): ItemContasSummary, countItems(), EditRow(), paginate(), PlanTable(), collect(), flattenVisible(), PlanTableProps (+22 more)

### Community 31 - "Templates de Email"
Cohesion: 0.08
Nodes (23): public.action_items, public.action_plans, public.plan_audit_log, public.notification_reads, public.notifications, public.item_comments, public.public_links, public.plan_attachments (+15 more)

### Community 32 - "Arquitetura Supabase"
Cohesion: 0.09
Nodes (26): Tabela action_items, Migration 004: action_plan_5w2h, Tabela action_plans, Backup como pré-condição de rollback, Rollback Migration 004 — action_plan_5w2h, Grants, Procedimento manual de rollback da migration 004, Políticas RLS (+18 more)

### Community 33 - "Ações de Benchmarking"
Cohesion: 0.14
Nodes (21): daysBetween(), formatMonthYear(), GanttChart(), getBarColor(), statusColors, Zoom, columns, DraggableCard() (+13 more)

### Community 34 - "Usuários e Empresas"
Cohesion: 0.15
Nodes (23): idx_categorias_despesa_active, idx_categorias_despesa_tenant, idx_conta_attachments_conta, idx_contas_pagar_fornecedor, idx_contas_pagar_item, idx_contas_pagar_plan, idx_contas_pagar_status, idx_contas_pagar_tenant (+15 more)

### Community 35 - "Modelo de Dados"
Cohesion: 0.15
Nodes (22): public.tipos_pa, idx_corpo_docente_curso, idx_corpo_docente_nome, idx_cursos_instituicao_curso, idx_cursos_instituicao_inst, idx_cursos_instituicao_tipo_pa, idx_cursos_instituicao_unit, idx_instituicoes_active (+14 more)

### Community 36 - "Migrations e Rollbacks"
Cohesion: 0.10
Nodes (25): Guards Admin, Owner e Membership, API REST v1, Upload Seguro de Anexos, Reset de Senha e Confirmação de Email, Drag-drop Kanban e Bulk Status, Google Calendar e Outlook Sync, Templates, Cópia, Links Públicos, Comentários e Gantt, DashboardKPI e Progresso (+17 more)

### Community 37 - "_fixture_financeiro_planos.sql"
Cohesion: 0.11
Nodes (16): public.cancelar_conta(), public.excluir_conta(), public.update_conta_with_parcelas(), public.resumo_contas(), auth.users, public.action_items, public.action_plans, public.conta_attachments (+8 more)

### Community 38 - "attachments.ts"
Cohesion: 0.12
Nodes (31): ALLOWED_MIMES, deleteAttachment(), getAttachments(), getAttachmentUrl(), uploadAttachment(), deleteAnexo(), getAnexoUrl(), listarAnexos() (+23 more)

### Community 39 - "Benchmarking no Banco"
Cohesion: 0.17
Nodes (18): @supabase/supabase-js, logout(), FontControl(), getStoredScale(), Navbar(), handleLogout(), NavbarProps, TenantSwitcher() (+10 more)

### Community 40 - "Label"
Cohesion: 0.20
Nodes (14): EditUserDialog(), ScopePicker(), BUILTIN_PERM_ROLES, INHERIT_GLOBAL_ROLE, SUPER_ADMIN_ONLY_PERM_ROLES, TENANT_ROLES, TenantRoleRow(), RegionalContextForm() (+6 more)

### Community 41 - "Guia do Desenvolvedor"
Cohesion: 0.09
Nodes (24): Modelo contas_pagar e parcelas_pagar, Hierarquia Recursiva de Itens, Modelo action_items, Modelo action_plans, Modelo tenants e profiles, Conta e Autenticação, Administração e Escopos, Anexos (+16 more)

### Community 42 - "Gestão de Empresas"
Cohesion: 0.12
Nodes (28): getCorpoDocente(), getCursosInstituicao(), getCursosSuperiores(), getInstituicaoFullDetail(), getInstituicoes(), getMensalidades(), getModalidades(), getTiposPa() (+20 more)

### Community 43 - "codex advisor artifact"
Cohesion: 0.09
Nodes (22): Action items, codex advisor artifact, Concise summary, Debugging, Duration, Examples, Final prompt, Good to know (+14 more)

### Community 44 - "login-form.tsx"
Cohesion: 0.16
Nodes (14): @testing-library/react, login(), signup(), initialState, LoginForm(), initialState, RegisterForm(), RegisterFormProps (+6 more)

### Community 45 - "CRUD de Catálogos"
Cohesion: 0.10
Nodes (22): Documentação Técnica - PlanoCerto, Performance e Checklist de Segurança, Referências Next.js, Supabase, Zod, Tailwind e React 19, Server Actions por Domínio, Estrutura src e supabase, Regras Estritas React e TypeScript, Troubleshooting Técnico, Validação Zod e React Hook Form (+14 more)

### Community 46 - "Consultas Financeiras"
Cohesion: 0.08
Nodes (19): next, GET(), AuthError(), AuthErrorProps, AuthLayout(), ErrorPage(), ErrorPageProps, GlobalError() (+11 more)

### Community 47 - "public.profiles"
Cohesion: 0.10
Nodes (20): on_auth_user_created, public.handle_new_user(), public.is_admin(), public.profiles, public.has_perm(), public.is_admin(), public.roles, public.has_perm() (+12 more)

### Community 48 - "Escopos de Usuários"
Cohesion: 0.11
Nodes (21): Operações de Itens de Ação, Operações de Planos de Ação, Operações de Anexos, API de Categorias de Despesa, Operações de Comentários, API de Contas a Pagar, API Reference - PlanoCerto, API de Fornecedores (+13 more)

### Community 49 - "API e Autenticação"
Cohesion: 0.11
Nodes (21): Autoridade Nacional de Proteção de Dados (ANPD), Conformidade CCPA, California Consumer Privacy Act Resource, Checklist de Compliance para Produção, Lei de Defesa do Consumidor, Documentos Legais - PlanoCerto, Perguntas Frequentes Legais, Conformidade GDPR (+13 more)

### Community 50 - "Documentos Legais"
Cohesion: 0.15
Nodes (15): do_publications_date_idx, do_publications_search_idx, do_publications_source_idx, do_publications_trgm_idx, public.do_publications, do_entities_document_idx, do_entities_normalized_idx, do_entities_publication_idx (+7 more)

### Community 51 - "Contexto de Tenant"
Cohesion: 0.13
Nodes (20): Fase 2 Pipeline DOU de IA, Fase 0 Baseline, Correção de Build Blocker em Server Actions, Refatorações Grandes Deferidas, Plano de Correção — PlanoCerto, Fase 3 Cobertura Frontend, Idempotência do Pipeline e Alertas, Rotação de Chaves Pendente (+12 more)

### Community 52 - "Diário Oficial"
Cohesion: 0.23
Nodes (12): switchTenant(), TenantAwareWrapper(), TenantAwareWrapperProps, TenantContext, TenantContextType, TenantProvider(), TenantProviderProps, Tenant (+4 more)

### Community 53 - "calendar-grid.tsx"
Cohesion: 0.14
Nodes (22): getCurrentUserPlanScope(), CalendarioEmpty(), CalendarioPage(), isFilterKind(), metadata, norm(), CalendarDeadlineItem, CalendarGrid() (+14 more)

### Community 54 - "Catálogo de Prioridades"
Cohesion: 0.11
Nodes (19): Dados Coletados Automaticamente, Mudanças na Política, Privacidade de Menores de 18 Anos, Reconhecimento, Glossário e Conformidade, Ruphus Tecnologia Controladora, Finalidades de Uso dos Dados, Dados Fornecidos Diretamente, Política de Privacidade - PlanoCerto (+11 more)

### Community 55 - "Segurança e RLS"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 56 - "Catálogos no Banco"
Cohesion: 0.12
Nodes (18): Auth JWT e Sessões, Fluxo de Autenticação e Request Autenticado, Backend Self-hosted, Cache e Revalidação Next.js, Arquitetura - PlanoCerto, Frontend Next.js e React 19, Resend, Google Calendar e Microsoft Teams, Performance e Web Vitals (+10 more)

### Community 57 - "Debug Financeiro"
Cohesion: 0.11
Nodes (18): Aceite dos Termos, Criação e Responsabilidades da Conta, Contato dos Termos, Definições de Plataforma, Usuário, Conta, Dados, Tenant e Empresa, Termos de Uso - PlanoCerto, Força Maior, Indenização, Propriedade Intelectual da Plataforma (+10 more)

### Community 58 - "schools.ts"
Cohesion: 0.19
Nodes (11): assignSchoolsSchema, assignSchoolsToUnit(), getSchools(), readForm(), schoolSchema, upsertSchool(), handleAssign(), { createClientMock } (+3 more)

### Community 59 - "distribution-card.tsx"
Cohesion: 0.22
Nodes (11): DistributionCard(), LegendRow(), MiniStat(), SegData, VIEW_OPTIONS, ViewMode, BarChart(), DonutChart() (+3 more)

### Community 60 - "Ações de Catálogo"
Cohesion: 0.13
Nodes (17): Metodologia 5W2H, PostgreSQL, Auth e PostgREST Self-hosted na VPS, Dashboard Executivo, Deploy VPS, Caddy e Cloudflare, Integrações Resend, Teams e Google Calendar, Multi-tenancy e RLS, Next.js App Router 16.4.6, sendPlanNotification e notifyTeams (+9 more)

### Community 61 - "Formulários de Instituições"
Cohesion: 0.14
Nodes (17): Server Actions e Revalidação, API de Autenticação, Comandos npm e Git, Referência do Banco, Debug e Logs, Deploy VPS com Cloudflare, Guia Rápido - PlanoCerto, Variáveis de Ambiente (+9 more)

### Community 62 - "Macro Ações"
Cohesion: 0.18
Nodes (10): git status, Handoff automático — 2026-11-20T00:34:00, Trecho recente da conversa (texto, redigido), ActionRow, adminClient, DOCS_DIR, main(), parseExcel() (+2 more)

### Community 63 - "Badge"
Cohesion: 0.08
Nodes (30): getCategoriasDespesa(), deriveContaDerived(), getContasDoItem(), getContasPagar(), getItemBasicsForConta(), getFornecedores(), CategoriasDespesaPage(), metadata (+22 more)

### Community 64 - "Seleção de Período"
Cohesion: 0.15
Nodes (13): public.areas, public.channels, public.macro_acoes, public.units, idx_sim_metrics_scenario, idx_simulator_scenarios_tenant, public.simulator_channel_metrics, public.simulator_scenarios (+5 more)

### Community 65 - "Validação e Sanitização"
Cohesion: 0.17
Nodes (15): Usuário Não Autenticado, Checklist de Debug Financeiro, supabase db push, Debugando Erro getContasPagar, Foreign Key ou Referência Quebrada, Erro getContasPagar Supabase vazio, Logs Melhorados de contas-pagar.ts, Migrations Ausentes (+7 more)

### Community 66 - "Benchmarking de Concorrentes"
Cohesion: 0.13
Nodes (15): scripts, build, dev, lint, prepare, start, test, test:coverage (+7 more)

### Community 67 - "077_write_policies.test.sql"
Cohesion: 0.14
Nodes (13): auth.users, pg_temp.expect(), public.action_items, public.action_plans, public.conta_attachments, public.contas_pagar, public.is_super_admin(), public.parcelas_pagar (+5 more)

### Community 68 - "Ações Rápidas"
Cohesion: 0.17
Nodes (20): deleteScenario(), getScenarioMetrics(), getScenarios(), metricSchema, scenarioSchema, upsertMetric(), upsertScenario(), ConvCell() (+12 more)

### Community 69 - "Gráficos do Dashboard"
Cohesion: 0.18
Nodes (10): DateRangePicker(), applyPreset(), commit(), openPanel(), DateRangePickerProps, MONTH_NAMES, parseIso(), Preset() (+2 more)

### Community 70 - "vitest"
Cohesion: 0.14
Nodes (10): vitest, itemSchema, planSchema, nome(), sanitizedString(), group(), item(), noop (+2 more)

### Community 71 - "macro-acoes.ts"
Cohesion: 0.28
Nodes (7): crud, deleteMacroAcao, getMacroAcoesAdmin, upsertMacroAcao, MacroAcoesPage(), metadata, macroAcaoSchema

### Community 72 - "Pendências e correções concluídas do PlanoCerto"
Cohesion: 0.17
Nodes (12): admin/loading.tsx com PageLoading, Auth, desativação de conta e restrição de horário no proxy, Correções concluídas de tabela, formulário, filtros, calendário e sugestão por IA, Filtros Tipo PA e Macro Ação afetando totais do dashboard, SkeletonHeader, SkeletonTable e PageLoading em @/components/ui/loading, Unificação dos modelos de loading, Configuração de redirects em next.config.ts, Redirects permanentes de /plano para /planos (+4 more)

### Community 73 - "Modal de Ajuda"
Cohesion: 0.23
Nodes (13): Tipos TypeScript de Competidores, Tabela corpo_docente, Tabela cursos_instituicao, Catálogo cursos_superiores, Benchmarking de Concorrentes — Estrutura de Dados, Herança RLS do Benchmarking, Tabela instituicoes, Tabela mensalidades_concorrentes (+5 more)

### Community 74 - "Membros de Tenants"
Cohesion: 0.18
Nodes (12): API Reference, Checklist de Integração da Ajuda, getDocContent em src/lib/docs.ts, Páginas Dinâmicas /docs/[doc], Integrar Documentação no Frontend, INTEGRACAO-EXEMPLO.tsx, HelpModal Pesquisável, Página /help Centro de Ajuda (+4 more)

### Community 75 - "Revisão Financeira"
Cohesion: 0.21
Nodes (8): next-themes@^0.4.6, next-themes, manrope, metadata, outfit, RootLayout(), Footer(), APP_VERSION

### Community 76 - "notifications.ts"
Cohesion: 0.24
Nodes (9): createNotificationSchema, deleteNotification(), getNotifications(), getUnreadCount(), markAsRead(), NotificationFormState, NotificationItem, NotificationBell() (+1 more)

### Community 77 - "validation/sanitize.ts"
Cohesion: 0.18
Nodes (11): ParcelaRowEditableProps, CategoriaDespesaFormValues, categoriaDespesaSchema, ContaPagarFormValues, contaPagarSchema, PagamentoFormValues, pagamentoSchema, parcelaInputSchema (+3 more)

### Community 78 - "Termos de Uso"
Cohesion: 0.35
Nodes (9): buildDuplicatedRows(), collectSubtree(), walk(), collectSubtreeIds(), DuplicableItem, DuplicatedItemRow, nextSiblingNumber(), remapCopiedNumber() (+1 more)

### Community 79 - "codex advisor artifact"
Cohesion: 0.10
Nodes (20): codex advisor artifact, Debugging, Duration, Examples, Final prompt, Good to know, In Route Handlers and Server Functions, In Server Components (pages and layouts) (+12 more)

### Community 80 - "CardHeader"
Cohesion: 0.09
Nodes (33): HelpPage(), QUICK_GUIDE_FEATURES, TOPIC_CARDS, FarolIcon(), metadata, Params, PublicDashboard(), DashboardClient() (+25 more)

### Community 81 - "Detalhes de Benchmarking"
Cohesion: 0.25
Nodes (9): ITEM_FILTER_KEYS, oneOf(), Params, parseIntParam(), PLAN_FILTER_KEYS, usePlanosUrlParams(), h, realReplaceState (+1 more)

### Community 82 - "public.profiles"
Cohesion: 0.12
Nodes (8): public.effective_role_for_tenant(), public.has_perm_for_tenant(), public.has_perm_for_tenant(), public.role_has_perm(), public.account_access_status(), public.check_request_account(), public.is_admin_of_user(), idx_tenant_members_user

### Community 83 - "_catalog-crud-factory.ts"
Cohesion: 0.13
Nodes (19): CatalogCrudConfig, createCatalogCrud(), delete_(), getAll(), requireScopeTenant(), toggleActive(), upsert(), CrudResult (+11 more)

### Community 84 - "validation/sanitize.ts"
Cohesion: 0.10
Nodes (23): zod, crud, deletePrioridade, parsePayload(), upsertPrioridade, isValidCNPJ(), isValidEmail(), isValidPhone() (+15 more)

### Community 85 - "Correções e IA"
Cohesion: 0.28
Nodes (8): Header compacto de plano, Stats Bar compacta, Tabela compacta com detalhes expansíveis, Escala consistente de tipografia, gaps e padding, Revisão de Layout — Página de Planos Versão 2.0, Filtros em card dedicado, Card View para mobile, Responsividade e hierarquia visual existentes

### Community 86 - "validations/auth.ts"
Cohesion: 0.13
Nodes (18): Bucket, buckets, rateLimit(), RateLimitResult, ChangePasswordFormValues, changePasswordSchema, fullName, LoginFormValues (+10 more)

### Community 87 - "plan-form-dialog.tsx"
Cohesion: 0.32
Nodes (12): getTemplates(), FieldV(), Modal(), Msg(), PlanFormDialog(), buildOfficialPlanHeader(), getPlanFormProgress(), normalizePlanFormValue() (+4 more)

### Community 88 - "Configuração de Build"
Cohesion: 0.24
Nodes (8): ALLOWED_BUILTIN_ROLES, createUserSchema, CreateUserValues, permissionsSchema, sanitizePermissions(), updateUserSchema, UpdateUserValues, userName

### Community 89 - "Filtros de Planos"
Cohesion: 0.22
Nodes (9): Transação automática do Supabase, Documentação obrigatória de rollback destrutivo, Convenções de Migrations, DDL idempotente, Documentação inline do schema, Nomenclatura sequencial de migrations, Recriação segura de políticas RLS, Separação de seed data das migrations (+1 more)

### Community 90 - "Auditoria e Templates"
Cohesion: 0.25
Nodes (8): Metodologia 5W2H no Manual, Exportação Excel e PDF no Manual, FAQ de Compartilhamento e Anexos, Login e Primeiro Acesso, Criar Plano e Itens 5W2H, Suporte do Manual, Seletor de Empresas Tenants, Tabela, Kanban e Gantt no Manual

### Community 91 - "(protected)/layout.tsx"
Cohesion: 0.38
Nodes (10): getCurrentTenant(), getUserTenants(), dynamic, getSessionData(), ProtectedLayout(), ToastProvider(), getSessionCustomRoles, getSessionProfile (+2 more)

### Community 92 - "Documentação no Frontend"
Cohesion: 0.70
Nodes (4): idx_admin_audit_log_admin_id, idx_admin_audit_log_created_at, idx_admin_audit_log_target_user_id, public.admin_audit_log

### Community 93 - "030_super_admin_and_user_scopes.sql"
Cohesion: 0.22
Nodes (13): idx_user_areas_area, idx_user_areas_tenant, idx_user_areas_user, idx_user_units_tenant, idx_user_units_unit, idx_user_units_user, public.user_area_ids(), public.user_areas (+5 more)

### Community 94 - "dashboard/page.tsx"
Cohesion: 0.14
Nodes (19): accBreakdown(), AreaInfo, DashboardActionRow, DashboardPage(), DeadlineItem, DeadlineKind, metadata, norm() (+11 more)

### Community 95 - "Configuração ESLint"
Cohesion: 0.38
Nodes (4): knowledge_base_embedding_idx, public.knowledge_base, idx_knowledge_base_area, idx_knowledge_base_unit

### Community 96 - "075_076_privileges.test.sql"
Cohesion: 0.29
Nodes (8): auth.users, pg_temp.expect_denied(), public.is_super_admin(), public.profiles, public.roles, public.tenant_member_roles, public.tenant_members, public.tenants

### Community 98 - "next.config.ts"
Cohesion: 0.25
Nodes (4): nextConfig, projectRoot, @vitejs/plugin-react@^6.0.1, @vitejs/plugin-react

### Community 99 - "users/page.tsx"
Cohesion: 0.38
Nodes (6): RoleRow, manageableUserIds(), AdminUsersPage(), fetchUsers(), metadata, PageResult

### Community 100 - "public.tenants"
Cohesion: 0.20
Nodes (11): public.tenant_members, public.tenants, idx_companies_cnpj, idx_companies_nome, idx_companies_tenant, idx_companies_unit, public.companies, idx_tenants_cnpj_unique (+3 more)

### Community 101 - "Fornecedores no Banco"
Cohesion: 0.40
Nodes (5): Browser Window Chrome, Three Window Control Dots, Window Icon, Monochrome SVG Icon Design, Rounded Window Frame

### Community 102 - "Regras para Agentes"
Cohesion: 0.70
Nodes (4): idx_schools_nome, idx_schools_tenant, idx_schools_unit, public.schools

### Community 103 - "Ícone de Globo"
Cohesion: 0.67
Nodes (4): Next.js Logo, Next.js, NEXT.JS Wordmark, SVG Vector Format

### Community 104 - "deriveActionItemStatus"
Cohesion: 0.39
Nodes (7): ActionItemStatusInput, deriveActionItemStatus(), hasPositiveNumber(), hasText(), isPast(), parseDate(), ActionItemStatus

### Community 105 - "Configuração PostCSS"
Cohesion: 0.67
Nodes (3): Regras para agentes sobre a versão do Next.js, Documentação local do Next.js em node_modules/next/dist/docs, Referência @AGENTS.md

### Community 106 - "Ícone da Aplicação"
Cohesion: 0.67
Nodes (3): Cancelamento e Exclusão de Conta, Interrupção de Serviço, Política de Reembolso

### Community 107 - "Layout de Benchmarking"
Cohesion: 0.67
Nodes (3): Circular Globe Outline, Globe Icon, Latitude and Longitude Grid

### Community 109 - "AreaUnitFilter"
Cohesion: 0.18
Nodes (5): AreaUnitFilter(), areaState(), toggleArea(), areas, units

### Community 156 - "detail-table.tsx"
Cohesion: 0.40
Nodes (4): DetailTable(), Insight(), ProgressBar(), UnitRow()

### Community 157 - "Rollback da 084_macro_acao_normalizacao"
Cohesion: 0.50
Nodes (3): Antes de aplicar em produção, Para desfazer, Rollback da 084_macro_acao_normalizacao

### Community 165 - "help-modal.tsx"
Cohesion: 0.30
Nodes (9): DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle, FAQ_ITEMS, FAQItem (+1 more)

### Community 166 - "email.ts"
Cohesion: 0.29
Nodes (8): sendRecoveryEmail(), itemCompletedEmail(), itemCreatedEmail(), parseAddress(), planTitle(), sendEmail(), sendViaCloudflare(), fetchMock

### Community 167 - "actions/action-plan.ts"
Cohesion: 0.10
Nodes (37): Para desfazer, Para desfazer, buildItemTree(), bulkUpdateStatus(), deleteItem(), deletePlan(), duplicateItem(), fetchPlanItems() (+29 more)

### Community 168 - "eslint.config.mjs"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@^16.4.6, eslint, eslint-config-next

### Community 169 - "getUnits"
Cohesion: 0.25
Nodes (8): getChannels(), getUnits(), EmpresasPage(), metadata, EscolasPage(), metadata, metadata, SimuladorPage()

### Community 171 - "plan-item-form-helpers.ts"
Cohesion: 0.50
Nodes (7): buildUnitPreview(), findAreaByName(), findUnitByName(), normalizeCatalogValue(), resolveInitialItemArea(), areas, units

### Community 172 - "plan-filters.tsx"
Cohesion: 0.43
Nodes (5): FilterSelect(), IconFilterSelect(), PlanFilters(), PlanFiltersProps, useDebounce()

### Community 173 - "create-plan-duplicate.test.ts"
Cohesion: 0.29
Nodes (3): chain(), c, mockDb()

### Community 174 - "errors.ts"
Cohesion: 0.38
Nodes (5): AppError, AppErrorCode, FormState, getErrorMessage(), isRetryable()

### Community 175 - "unread/route.ts"
Cohesion: 0.40
Nodes (3): GET(), headers, { createClientMock }

### Community 176 - "LogoLoader"
Cohesion: 0.60
Nodes (3): Loading(), Loading(), LogoLoader()

### Community 177 - "getResumoContas"
Cohesion: 0.83
Nodes (3): getResumoContas(), FinanceiroPage(), rangeDoMes()

## Ambiguous Edges - Review These
- `Erro getContasPagar Supabase vazio` → `Usuário Não Autenticado`  [AMBIGUOUS]
  docs/DEBUG-CONTAS-PAGAR.md · relation: possible_cause_of
- `Erro getContasPagar Supabase vazio` → `Foreign Key ou Referência Quebrada`  [AMBIGUOUS]
  docs/DEBUG-CONTAS-PAGAR.md · relation: possible_cause_of
- `Erro getContasPagar Supabase vazio` → `Migrations Ausentes`  [AMBIGUOUS]
  docs/DEBUG-CONTAS-PAGAR.md · relation: possible_cause_of
- `Erro getContasPagar Supabase vazio` → `Bloqueio por RLS`  [AMBIGUOUS]
  docs/DEBUG-CONTAS-PAGAR.md · relation: possible_cause_of

## Knowledge Gaps
- **286 isolated node(s):** `Tabela contas_pagar`, `Checklist de QA funcional, segurança, performance e edge cases`, `Roadmap de auditoria, alertas, exportação e integração bancária`, `Permissões financeiras, RLS e sanitização de busca`, `Validações Zod de contas, parcelas e pagamentos` (+281 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 950 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **56 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Consultas Financeiras` to `Input`, `dashboard-client.tsx`, `prioridades-client.tsx`, `alert-dialog.tsx`, `actions/auth.ts`, `Importação de Planos`, `Monitoramento e Testes`, `Dependências do Projeto`, `Button`, `Financeiro e Anexos`, `plan-form-dialog.tsx`, `server.ts`, `getCurrentTenantId`, `Testes de Planos`, `contas-pagar-client.tsx`, `proxy.ts`, `Navegação e Tenant`, `Papéis e Permissões`, `sanitizeText`, `CompaniesClient`, `Tabela de Planos`, `attachments.ts`, `actions/action-plan.ts`, `Benchmarking no Banco`, `Gestão de Empresas`, `login-form.tsx`, `unread/route.ts`, `Diário Oficial`, `calendar-grid.tsx`, `schools.ts`, `Badge`, `Ações Rápidas`, `Revisão Financeira`, `notifications.ts`, `CardHeader`, `Detalhes de Benchmarking`, `_catalog-crud-factory.ts`, `validations/auth.ts`, `plan-form-dialog.tsx`, `(protected)/layout.tsx`, `dashboard/page.tsx`, `next.config.ts`, `users/page.tsx`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `createClient()` (e.g. with `action-plan-ai.test.ts` and `action-plan-phase3.test.ts`) actually correct?**
  _`createClient()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Tabela contas_pagar`, `Checklist de QA funcional, segurança, performance e edge cases`, `Roadmap de auditoria, alertas, exportação e integração bancária` to the rest of the system?**
  _286 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Input` be split into smaller, more focused modules?**
  _Cohesion score 0.08504504504504505 - nodes in this community are weakly interconnected._
- **Why does `createClient()` connect `sanitizeText` to `actions/auth.ts`, `Monitoramento e Testes`, `Dependências do Projeto`, `use-planos-data.ts`, `Financeiro e Anexos`, `plan-form-dialog.tsx`, `server.ts`, `getCurrentTenantId`, `Testes de Planos`, `contas-pagar-client.tsx`, `Navegação e Tenant`, `types/catalog.ts`, `Papéis e Permissões`, `item-form-dialog.tsx`, `CompaniesClient`, `attachments.ts`, `actions/action-plan.ts`, `Benchmarking no Banco`, `getUnits`, `Gestão de Empresas`, `login-form.tsx`, `create-plan-duplicate.test.ts`, `Consultas Financeiras`, `unread/route.ts`, `getResumoContas`, `Diário Oficial`, `calendar-grid.tsx`, `schools.ts`, `Badge`, `Ações Rápidas`, `notifications.ts`, `_catalog-crud-factory.ts`, `validations/auth.ts`, `plan-form-dialog.tsx`, `(protected)/layout.tsx`, `dashboard/page.tsx`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Erro getContasPagar Supabase vazio` and `Usuário Não Autenticado`?**
  _Edge tagged AMBIGUOUS (relation: possible_cause_of) - confidence is low._
- **What is the exact relationship between `Erro getContasPagar Supabase vazio` and `Foreign Key ou Referência Quebrada`?**
  _Edge tagged AMBIGUOUS (relation: possible_cause_of) - confidence is low._