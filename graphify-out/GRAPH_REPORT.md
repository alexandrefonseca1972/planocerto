# Graph Report - planocerto  (2026-11-16)

## Corpus Check
- 424 files · ~231,983 words (26 files changed in this update)
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2620 nodes · 7813 edges · 156 communities (108 shown, 48 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.85)
- Token cost: unavailable from the subagent runtime (3 semantic agents + AST extraction)

## Integrity Notes
- Update diff: 163 new nodes, 125 removed nodes, 230 new edges and 273 removed edges.
- No dangling, missing or collapsed edges; 18 self-loop edges remain.
- `public/vercel.svg` and `vercel.json` were removed intentionally.
- `public/modelo-plano-acao.xlsx` was not processed because optional Office conversion is unavailable.

## Community Hubs (Navigation)
- Autenticação e Interface
- Componentes de Interface
- Dados e Compartilhamento
- Financeiro e React
- Planos e Permissões
- Dashboard e Calendário
- Importação de Planos
- Monitoramento e Testes
- Dependências do Projeto
- Carregamento e Skeletons
- Catálogos Administrativos
- Documentação e Deploy
- Administração Supabase
- Financeiro e Anexos
- Formulários Administrativos
- Gestão de Usuários
- Validação e Formatação
- Histórico de Versões
- Testes de Planos
- Formulário de Ações
- Dashboard Executivo
- Sanitização e Erros
- Navegação e Tenant
- Página de Planos
- Papéis e Permissões
- Benchmarking e Cards
- Cliente Supabase
- Contas a Pagar
- Gestão de Escolas
- Configuração de IA
- Tabela de Planos
- Templates de Email
- Arquitetura Supabase
- Ações de Benchmarking
- Usuários e Empresas
- Modelo de Dados
- Migrations e Rollbacks
- Dependências de Desenvolvimento
- Financeiro no Banco
- Benchmarking no Banco
- Simulador Financeiro
- Guia do Desenvolvedor
- Gestão de Empresas
- Central de Ajuda
- FAQ do Usuário
- CRUD de Catálogos
- Consultas Financeiras
- Identidade Visual
- Escopos de Usuários
- API e Autenticação
- Documentos Legais
- Contexto de Tenant
- Diário Oficial
- Configuração TypeScript
- Catálogo de Prioridades
- Segurança e RLS
- Catálogos no Banco
- Debug Financeiro
- Plataforma e RBAC
- Scripts do Projeto
- Ações de Catálogo
- Formulários de Instituições
- Macro Ações
- Formulário de Plano
- Seleção de Período
- Validação e Sanitização
- Benchmarking de Concorrentes
- Manual do Usuário
- Ações Rápidas
- Gráficos do Dashboard
- Plano de Implementação
- Layout e Tema
- Duplicação de Ações
- Modal de Ajuda
- Membros de Tenants
- Revisão Financeira
- Melhorias de Planos
- Política de Privacidade
- Termos de Uso
- Filtros de URL
- Anexos de Ações
- Detalhes de Benchmarking
- Validação Administrativa
- Papéis no Banco
- Continuidade de Planos
- Correções e IA
- Layout de Planos
- Convenções de Migrations
- Configuração de Build
- Filtros de Planos
- Auditoria e Templates
- Modelos de Domínio
- Documentação no Frontend
- Base de Conhecimento
- RAG no PostgreSQL
- Configuração ESLint
- Seleção Múltipla
- Empresas no Banco
- Ícone de Janela
- Escolas no Banco
- Logo Next.js
- Fornecedores no Banco
- Regras para Agentes
- Ícone de Globo
- Exportação CSV
- Configuração PostCSS
- Ícone da Aplicação
- Layout de Benchmarking
- Layout Financeiro
- Migration de Prioridades
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

## God Nodes (most connected - your core abstractions)
1. `cn()` - 199 edges
2. `createClient()` - 151 edges
3. `Button` - 131 edges
4. `lucide-react` - 105 edges
5. `react` - 103 edges
6. `Input` - 102 edges
7. `Card` - 98 edges
8. `CardContent` - 96 edges
9. `next` - 92 edges
10. `createAdminClient()` - 64 edges

## Surprising Connections (you probably didn't know these)
- `loadPlanItems()` --indirect_call--> `getPlanItemsBundle()`  [INFERRED]
  src/lib/hooks/use-planos-data.ts → src/app/actions/action-plan.ts
- `CatalogCrudConfig` --references--> `createClient()`  [EXTRACTED]
  src/app/actions/_catalog-crud-factory.ts → src/lib/supabase/server.ts
- `AdminNotificationsPage()` --indirect_call--> `createNotification()`  [INFERRED]
  src/app/(protected)/admin/notifications/page.tsx → src/app/actions/notifications.ts
- `AdminNotificationsPage()` --indirect_call--> `deleteNotification()`  [INFERRED]
  src/app/(protected)/admin/notifications/page.tsx → src/app/actions/notifications.ts
- `RolesTable()` --indirect_call--> `createRole()`  [INFERRED]
  src/app/(protected)/admin/roles/roles-table.tsx → src/app/actions/admin.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **** — docs_benchmarking_concorrentes_instituicoes_table_entity, docs_benchmarking_concorrentes_cursos_instituicao_table_entity, docs_benchmarking_concorrentes_corpo_docente_table_entity, docs_benchmarking_concorrentes_mensalidades_table_entity, docs_benchmarking_concorrentes_inherited_rls_entity [EXTRACTED 1.00]
- **** — docs_implementation_plan_ciclo_qualidade_entity, docs_implementation_plan_contratos_qualidade_entity, docs_implementation_plan_vitest_entity, docs_implementation_plan_husky_entity, docs_implementation_plan_testing_strategy_entity [EXTRACTED 1.00]
- **** — docs_implementation_plan_inlabs_client_entity, docs_implementation_plan_sanitizacao_entity, docs_implementation_plan_ingest_worker_entity, docs_implementation_plan_do_publications_entity, docs_implementation_plan_ingest_runs_entity [EXTRACTED 1.00]
- **** — docs_implementation_plan_social_webhook_entity, docs_implementation_plan_social_signal_schema_entity, docs_implementation_plan_correlation_engine_entity, docs_implementation_plan_generate_insight_entity, docs_implementation_plan_entity_correlations_entity, docs_implementation_plan_alert_worker_entity [EXTRACTED 1.00]
- **Stack self-hosted de deployment de produção do PlanoCerto** — readme_vps_deployment, readme_nextjs_16, readme_self_hosted_backend, readme_caddy, readme_systemd, readme_cloudflare [EXTRACTED 1.00]
- **** — docs_arquitetura_frontend_entity, docs_arquitetura_auth_entity, docs_arquitetura_rls_entity, docs_arquitetura_postgresql_entity [EXTRACTED 1.00]
- **** — docs_plano_correcao_ai_pipeline_entity, docs_plano_correcao_idempotency_entity, docs_plano_correcao_llm_cost_entity, docs_plano_correcao_frontend_tests_entity [EXTRACTED 1.00]
- **** — docs_plano_implementacao_phase1_entity, docs_plano_implementacao_phase2_entity, docs_plano_implementacao_phase3_entity, docs_plano_implementacao_phase4_entity, docs_plano_implementacao_phase5_entity, docs_plano_implementacao_phase_review_entity [EXTRACTED 1.00]
- **Self-hosted Auth Email Template Suite** — supabase_templates_magic_link_entity, supabase_templates_recovery_entity, supabase_templates_confirmation_entity, supabase_templates_invite_entity, supabase_templates_email_change_entity, supabase_templates_reauthentication_entity, supabase_templates_password_changed_notification_entity [EXTRACTED 1.00]

## Communities (156 total, 48 thin omitted)

### Community 0 - "Autenticação e Interface"
Cohesion: 0.07
Nodes (60): react, updateProfile(), initialState, PLAN_LABEL, TenantFormDialog(), AreaForm(), FormValues, init (+52 more)

### Community 1 - "Componentes de Interface"
Cohesion: 0.05
Nodes (62): AreaInfo, BarSeg(), BUCKET_DOT, DashboardActionRow, DashboardClientProps, DeadlineItem, DeadlineKind, DeadlineRow() (+54 more)

### Community 2 - "Dados e Compartilhamento"
Cohesion: 0.09
Nodes (43): toggleAreaActive, getPrioridadesAdmin, togglePrioridadeActive, copyPlan(), getTenantMembers(), toggleTipoPAActive, metadata, PrioridadesPage() (+35 more)

### Community 3 - "Financeiro e React"
Cohesion: 0.10
Nodes (54): resetPassword(), updatePassword(), initialState, ResetPasswordPage(), initialState, UpdatePasswordPage(), planBadge(), HelpPage() (+46 more)

### Community 4 - "Planos e Permissões"
Cohesion: 0.06
Nodes (40): lucide-react, signup(), allLinks, NavLink, Field(), init, ScopePicker(), metadata (+32 more)

### Community 5 - "Dashboard e Calendário"
Cohesion: 0.08
Nodes (58): processUnsentAlerts, Apify, calculateSeverity, Ciclo obrigatório de implementação e qualidade, Padrões obrigatórios de código, Contratos de qualidade e segurança, Motor correlate, Cypress (+50 more)

### Community 6 - "Importação de Planos"
Cohesion: 0.05
Nodes (52): dependencies, class-variance-authority@^0.7.1, clsx@^2.1.1, date-fns@^4.1.0, @dnd-kit/core@^6.3.1, @dnd-kit/sortable@^10.0.0, @dnd-kit/utilities@^3.2.2, dompurify@^3.4.18 (+44 more)

### Community 7 - "Monitoramento e Testes"
Cohesion: 0.10
Nodes (50): activateUser(), ADMIN_ASSIGNABLE_ROLES, AreaOption, assertCanManageUser(), auditLog(), AuditLogEntry, BUILTIN_ROLES, bulkDeleteUsers() (+42 more)

### Community 8 - "Dependências do Projeto"
Cohesion: 0.09
Nodes (42): xlsx, getCurrentTenant(), POST(), POST(), ExportCsv(), flattenItems(), ACCEPTED_EXTS, FileRow() (+34 more)

### Community 9 - "Carregamento e Skeletons"
Cohesion: 0.06
Nodes (32): getChannels(), getUnits(), assignCompaniesSchema, assignCompaniesToUnit(), companySchema, deleteCompany(), getCompanies(), readForm() (+24 more)

### Community 10 - "Catálogos Administrativos"
Cohesion: 0.08
Nodes (38): admin/loading.tsx com PageLoading, Auth, desativação de conta e restrição de horário no proxy, Correções concluídas de tabela, formulário, filtros, calendário e sugestão por IA, Filtros Tipo PA e Macro Ação afetando totais do dashboard, SkeletonHeader, SkeletonTable e PageLoading em @/components/ui/loading, Unificação dos modelos de loading, Configuração de redirects em next.config.ts, Redirects permanentes de /plano para /planos (+30 more)

### Community 11 - "Documentação e Deploy"
Cohesion: 0.09
Nodes (39): buildItemTree(), bulkUpdateStatus(), clonePlanWithDateShift(), deleteItem(), deletePlan(), duplicateItem(), getAuditLog(), getPlanItemsBundle() (+31 more)

### Community 12 - "Administração Supabase"
Cohesion: 0.05
Nodes (46): Planos 5W2H — What, Why, Where, Who, When, How Much e How, Restrição de horário de login por usuário, Comentários por item de ação, Admin panel para usuários, tenants e permissões, API Reference — docs/API-REFERENCE.md — Server Actions, Auth e exemplos, Arquitetura — docs/ARQUITETURA.md, Upload de anexos de imagem, PDF e Excel, Autenticação por email e senha com reset e confirmação (+38 more)

### Community 13 - "Financeiro e Anexos"
Cohesion: 0.12
Nodes (39): checkPermission(), createRole(), deleteRole(), getCurrentUserPermissions(), getUserImpact(), loadCustomRolesMap(), updateRole(), getEffectiveRole() (+31 more)

### Community 14 - "Formulários Administrativos"
Cohesion: 0.09
Nodes (32): ActionItemInsert, addComment(), commentSchema, createPlanFromTemplate(), createPublicLink(), deleteComment(), deletePublicLink(), getComments() (+24 more)

### Community 15 - "Gestão de Usuários"
Cohesion: 0.05
Nodes (43): Comentários por item de ação, Upload de anexos em itens de ação, Remoção de plano meio-órfão no upload em lote, Slug de empresa único, gerado no servidor e imutável, Kanban drag-and-drop com @dnd-kit/core, Mapeamento de vocabulário alternativo de status FAROL, Gráfico de Gantt SVG com zoom mês, trimestre e ano, Permissão plans.update na rota /api/plans/[id]/import (+35 more)

### Community 16 - "Validação e Formatação"
Cohesion: 0.08
Nodes (30): @supabase/ssr, env, envSchema, logger, Logger, AuthResult, checkAuth(), log (+22 more)

### Community 17 - "Histórico de Versões"
Cohesion: 0.11
Nodes (36): createCatalogCrud(), delete_(), getAll(), requireScopeTenant(), toggleActive(), upsert(), db(), mapPgError() (+28 more)

### Community 18 - "Testes de Planos"
Cohesion: 0.13
Nodes (29): getRoles(), RoleFormState, RoleRow, AdminNav(), AdminLayout(), checkAdminAccess(), metadata, RolesPage() (+21 more)

### Community 19 - "Formulário de Ações"
Cohesion: 0.07
Nodes (36): Gestão administrativa de contexto regional e documentos, Base de Conhecimento IA e Inteligência Regional — Versão 2.1, Base de conhecimento proprietária knowledge_base, Contexto Local de Execução no prompt do Claude, Busca semântica RAG com pgvector, regional_context JSONB em units e areas, Motor de sugestão contextual suggest5W2H, Clonagem clonePlanWithDateShift e targetTenantId (+28 more)

### Community 20 - "Dashboard Executivo"
Cohesion: 0.11
Nodes (30): getItemBasicsForConta(), CatalogCard, CatalogosPage(), dictionaries, metadata, registries, renderCard(), PageHeader() (+22 more)

### Community 21 - "Sanitização e Erros"
Cohesion: 0.09
Nodes (19): @testing-library/react, vitest, getItems(), getPlanosBootstrap(), getPlans(), CopyPlanButtonProps, PlanQuickActions(), Props (+11 more)

### Community 22 - "Navegação e Tenant"
Cohesion: 0.15
Nodes (26): createPlan(), init, PlanosPage(), BudgetHealthBar(), calculatePlanFinancials(), buildMacroActionOptions(), collectItemClassificationOptions(), walk() (+18 more)

### Community 23 - "Página de Planos"
Cohesion: 0.13
Nodes (31): ANEXO_ALLOWED_MIMES, cancelarConta(), createConta(), deleteAnexo(), deleteConta(), getAnexoUrl(), getContaTenantId(), listarAnexos() (+23 more)

### Community 24 - "Papéis e Permissões"
Cohesion: 0.13
Nodes (25): RegionalContext, suggest5W2H(), UnitRegionalData, getActiveLlmConfig(), getLlmSettings(), LlmFormState, LlmSettingsPublic, requireSuperAdmin() (+17 more)

### Community 25 - "Benchmarking e Cards"
Cohesion: 0.16
Nodes (25): getAiModelsForPlan(), getItemAuditLog(), RegionalContextFormProps, ItemFormDialog(), ItemFormDialogProps, Modal(), Msg(), formatAuditEntryDate() (+17 more)

### Community 26 - "Cliente Supabase"
Cohesion: 0.09
Nodes (19): {{ .ConfirmationURL }}, {{ .Email }}, Confirmation Email Template, Email Change Template, {{ .NewEmail }}, Invite Email Template, Magic Link Email Template, Password Changed Notification Template (+11 more)

### Community 27 - "Contas a Pagar"
Cohesion: 0.11
Nodes (26): getCurrentUserPlanScope(), getUserTenants(), CalendarioEmpty(), CalendarioPage(), isFilterKind(), metadata, norm(), accBreakdown() (+18 more)

### Community 28 - "Gestão de Escolas"
Cohesion: 0.12
Nodes (25): crud, deleteArea, getAreasAdmin(), log, updateAreaRegionalContext(), upsertArea, getInstituicao(), getCurrentTenantId() (+17 more)

### Community 29 - "Configuração de IA"
Cohesion: 0.07
Nodes (27): devDependencies, husky@^9.1.7, jsdom@^29.1.1, lint-staged@^15.4.3, pino-pretty@^13.1.3, tailwindcss@^4, @tailwindcss/postcss@^4, @testing-library/jest-dom@^6.9.1 (+19 more)

### Community 30 - "Tabela de Planos"
Cohesion: 0.11
Nodes (23): ItemContasSummary, EditRow(), itemDepth(), PlanTable(), collect(), flattenVisible(), PlanTableProps, SortHeader() (+15 more)

### Community 31 - "Templates de Email"
Cohesion: 0.10
Nodes (16): public.action_items, public.action_plans, public.plan_audit_log, public.notification_reads, public.notifications, public.item_comments, public.public_links, public.plan_attachments (+8 more)

### Community 32 - "Arquitetura Supabase"
Cohesion: 0.09
Nodes (26): Tabela action_items, Migration 004: action_plan_5w2h, Tabela action_plans, Backup como pré-condição de rollback, Rollback Migration 004 — action_plan_5w2h, Grants, Procedimento manual de rollback da migration 004, Políticas RLS (+18 more)

### Community 33 - "Ações de Benchmarking"
Cohesion: 0.13
Nodes (20): daysBetween(), formatMonthYear(), GanttChart(), getBarColor(), statusColors, Zoom, columns, DraggableCard() (+12 more)

### Community 34 - "Usuários e Empresas"
Cohesion: 0.15
Nodes (23): idx_categorias_despesa_active, idx_categorias_despesa_tenant, idx_conta_attachments_conta, idx_contas_pagar_fornecedor, idx_contas_pagar_item, idx_contas_pagar_plan, idx_contas_pagar_status, idx_contas_pagar_tenant (+15 more)

### Community 35 - "Modelo de Dados"
Cohesion: 0.15
Nodes (22): public.tipos_pa, idx_corpo_docente_curso, idx_corpo_docente_nome, idx_cursos_instituicao_curso, idx_cursos_instituicao_inst, idx_cursos_instituicao_tipo_pa, idx_cursos_instituicao_unit, idx_instituicoes_active (+14 more)

### Community 36 - "Migrations e Rollbacks"
Cohesion: 0.10
Nodes (25): Guards Admin, Owner e Membership, API REST v1, Upload Seguro de Anexos, Reset de Senha e Confirmação de Email, Drag-drop Kanban e Bulk Status, Google Calendar e Outlook Sync, Templates, Cópia, Links Públicos, Comentários e Gantt, DashboardKPI e Progresso (+17 more)

### Community 37 - "Dependências de Desenvolvimento"
Cohesion: 0.12
Nodes (12): next, login(), AuthPage(), ProtectedErrorProps, initialState, LoginForm(), Bucket, buckets (+4 more)

### Community 38 - "Financeiro no Banco"
Cohesion: 0.15
Nodes (21): @supabase/supabase-js, checkIsAdmin(), ALLOWED_MIMES, deleteAttachment(), getAttachments(), getAttachmentUrl(), uploadAttachment(), getCorpoDocente() (+13 more)

### Community 39 - "Benchmarking no Banco"
Cohesion: 0.17
Nodes (17): logout(), FontControl(), getStoredScale(), Navbar(), handleLogout(), NavbarProps, TenantSwitcher(), TenantSwitcherProps (+9 more)

### Community 40 - "Simulador Financeiro"
Cohesion: 0.11
Nodes (19): PendentePage(), BaseCatalogRow, CatalogHeader(), CatalogHeaderProps, CatalogModalProps, CatalogSkeleton(), CatalogTableProps, CharCounterProps (+11 more)

### Community 41 - "Guia do Desenvolvedor"
Cohesion: 0.09
Nodes (24): Modelo contas_pagar e parcelas_pagar, Hierarquia Recursiva de Itens, Modelo action_items, Modelo action_plans, Modelo tenants e profiles, Conta e Autenticação, Administração e Escopos, Anexos (+16 more)

### Community 42 - "Gestão de Empresas"
Cohesion: 0.16
Nodes (20): getInstituicoes(), BenchmarkingPage(), metadata, Detail, FullCurso, corpoDocenteSchema, cursoInstituicaoSchema, instituicaoSchema (+12 more)

### Community 43 - "Central de Ajuda"
Cohesion: 0.17
Nodes (20): estornarPagamento(), getParcelaTenantId(), pagarParcelasEmLote(), registrarPagamento(), ContaDetalheClient(), confirmarEstorno(), handleBatchPay(), handleCancel() (+12 more)

### Community 44 - "FAQ do Usuário"
Cohesion: 0.20
Nodes (20): getResumoContas(), Anual(), diasAteVencer(), FinanceiroClient(), MESES, MESES_FULL, PorFornecedor(), PorStatus() (+12 more)

### Community 45 - "CRUD de Catálogos"
Cohesion: 0.10
Nodes (22): Documentação Técnica - PlanoCerto, Performance e Checklist de Segurança, Referências Next.js, Supabase, Zod, Tailwind e React 19, Server Actions por Domínio, Estrutura src e supabase, Regras Estritas React e TypeScript, Troubleshooting Técnico, Validação Zod e React Hook Form (+14 more)

### Community 46 - "Consultas Financeiras"
Cohesion: 0.14
Nodes (13): AuthError(), AuthErrorProps, AuthLayout(), ErrorPage(), ErrorPageProps, GlobalError(), GlobalErrorProps, NotFoundPage() (+5 more)

### Community 47 - "Identidade Visual"
Cohesion: 0.15
Nodes (19): on_auth_user_created, public.handle_new_user(), public.is_admin(), public.profiles, public.has_perm(), public.is_admin(), idx_user_areas_area, idx_user_areas_tenant (+11 more)

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
Cohesion: 0.18
Nodes (16): switchTenant(), dynamic, getSessionData(), ProtectedLayout(), TenantAwareWrapper(), TenantAwareWrapperProps, ToastProvider(), TenantContext (+8 more)

### Community 53 - "Configuração TypeScript"
Cohesion: 0.16
Nodes (16): CalendarDeadlineItem, CalendarGrid(), CalendarListView(), CalendarMonthView(), DayCell(), DeadlineKind, Dot(), ItemRow() (+8 more)

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

### Community 58 - "Plataforma e RBAC"
Cohesion: 0.14
Nodes (15): CatalogCrudConfig, CrudResult, genderArticles, log, getAreas(), getMacroAcoes(), getPrioridades(), CatalogFormState (+7 more)

### Community 59 - "Scripts do Projeto"
Cohesion: 0.18
Nodes (14): getCategoriasDespesa(), deriveContaDerived(), getContaById(), getContasDoItem(), getContasPagar(), getFornecedores(), CategoriasDespesaPage(), metadata (+6 more)

### Community 60 - "Ações de Catálogo"
Cohesion: 0.13
Nodes (17): Metodologia 5W2H, PostgreSQL, Auth e PostgREST Self-hosted na VPS, Dashboard Executivo, Deploy VPS, Caddy e Cloudflare, Integrações Resend, Teams e Google Calendar, Multi-tenancy e RLS, Next.js App Router 16.4.6, sendPlanNotification e notifyTeams (+9 more)

### Community 61 - "Formulários de Instituições"
Cohesion: 0.14
Nodes (17): Server Actions e Revalidação, API de Autenticação, Comandos npm e Git, Referência do Banco, Debug e Logs, Deploy VPS com Cloudflare, Guia Rápido - PlanoCerto, Variáveis de Ambiente (+9 more)

### Community 62 - "Macro Ações"
Cohesion: 0.13
Nodes (11): nextConfig, projectRoot, @vitejs/plugin-react@^6.0.1, @vitejs/plugin-react, ActionRow, adminClient, DOCS_DIR, main() (+3 more)

### Community 63 - "Formulário de Plano"
Cohesion: 0.26
Nodes (14): formatCNPJ(), isValidCNPJ(), isValidEmail(), isValidPhone(), isValidWebsite(), onlyDigits(), ALLOWED_PRIORIDADE_COLORS, areaSchema (+6 more)

### Community 64 - "Seleção de Período"
Cohesion: 0.17
Nodes (13): public.areas, public.channels, public.macro_acoes, public.units, idx_sim_metrics_scenario, idx_simulator_scenarios_tenant, public.simulator_channel_metrics, public.simulator_scenarios (+5 more)

### Community 65 - "Validação e Sanitização"
Cohesion: 0.17
Nodes (15): Usuário Não Autenticado, Checklist de Debug Financeiro, supabase db push, Debugando Erro getContasPagar, Foreign Key ou Referência Quebrada, Erro getContasPagar Supabase vazio, Logs Melhorados de contas-pagar.ts, Migrations Ausentes (+7 more)

### Community 66 - "Benchmarking de Concorrentes"
Cohesion: 0.13
Nodes (15): scripts, build, dev, lint, prepare, start, test, test:coverage (+7 more)

### Community 67 - "Manual do Usuário"
Cohesion: 0.23
Nodes (11): AdminFormState, CreateUserDialog(), handleGeneratePassword(), toTenantRole(), BUILTIN_PERM_ROLES, INHERIT_GLOBAL_ROLE, SUPER_ADMIN_ONLY_PERM_ROLES, TENANT_ROLES (+3 more)

### Community 68 - "Ações Rápidas"
Cohesion: 0.16
Nodes (13): deleteScenario(), getScenarioMetrics(), getScenarios(), metricSchema, scenarioSchema, upsertMetric(), upsertScenario(), persistMetric() (+5 more)

### Community 69 - "Gráficos do Dashboard"
Cohesion: 0.19
Nodes (10): DateRangePicker(), applyPreset(), commit(), openPanel(), DateRangePickerProps, MONTH_NAMES, parseIso(), Preset() (+2 more)

### Community 70 - "Plano de Implementação"
Cohesion: 0.18
Nodes (13): ChangePasswordFormValues, changePasswordSchema, fullName, LoginFormValues, loginSchema, ProfileFormValues, profileSchema, RegisterFormValues (+5 more)

### Community 71 - "Layout e Tema"
Cohesion: 0.21
Nodes (11): crud, deleteMacroAcao, getMacroAcoesAdmin, toggleMacroAcaoActive, upsertMacroAcao, MacroAcoesPage(), metadata, MacroAcoesClient() (+3 more)

### Community 72 - "Duplicação de Ações"
Cohesion: 0.21
Nodes (9): assignSchoolsSchema, readForm(), schoolSchema, upsertSchool(), sanitizeCNPJ(), sanitizeCPF(), Prioridade, School (+1 more)

### Community 73 - "Modal de Ajuda"
Cohesion: 0.23
Nodes (13): Tipos TypeScript de Competidores, Tabela corpo_docente, Tabela cursos_instituicao, Catálogo cursos_superiores, Benchmarking de Concorrentes — Estrutura de Dados, Herança RLS do Benchmarking, Tabela instituicoes, Tabela mensalidades_concorrentes (+5 more)

### Community 74 - "Membros de Tenants"
Cohesion: 0.18
Nodes (12): API Reference, Checklist de Integração da Ajuda, getDocContent em src/lib/docs.ts, Páginas Dinâmicas /docs/[doc], Integrar Documentação no Frontend, INTEGRACAO-EXEMPLO.tsx, HelpModal Pesquisável, Página /help Centro de Ajuda (+4 more)

### Community 75 - "Revisão Financeira"
Cohesion: 0.21
Nodes (8): next-themes@^0.4.6, next-themes, manrope, metadata, outfit, RootLayout(), Footer(), APP_VERSION

### Community 76 - "Melhorias de Planos"
Cohesion: 0.27
Nodes (9): createNotification(), createNotificationSchema, getNotifications(), getUnreadCount(), markAsRead(), NotificationFormState, NotificationItem, NotificationBell() (+1 more)

### Community 77 - "Política de Privacidade"
Cohesion: 0.20
Nodes (10): ParcelaRowEditableProps, CategoriaDespesaFormValues, categoriaDespesaSchema, ContaPagarFormValues, contaPagarSchema, PagamentoFormValues, pagamentoSchema, parcelaInputSchema (+2 more)

### Community 78 - "Termos de Uso"
Cohesion: 0.35
Nodes (9): buildDuplicatedRows(), collectSubtree(), walk(), collectSubtreeIds(), DuplicableItem, DuplicatedItemRow, nextSiblingNumber(), remapCopiedNumber() (+1 more)

### Community 79 - "Filtros de URL"
Cohesion: 0.26
Nodes (8): public.tenant_members, public.tenants, idx_tenants_cnpj_unique, idx_tenant_member_roles_tenant, idx_tenant_member_roles_user, public.tenant_member_roles, public.validate_tenant_member_role(), validate_tenant_member_role_trg

### Community 80 - "Anexos de Ações"
Cohesion: 0.31
Nodes (9): addMonths(), ContaForm(), adicionarParcela(), ajustarUltimaParaBaterTotal(), aplicarPreset(), atualizarParcela(), gerarParcelas(), distribuirValor() (+1 more)

### Community 81 - "Detalhes de Benchmarking"
Cohesion: 0.25
Nodes (9): ITEM_FILTER_KEYS, oneOf(), Params, parseIntParam(), PLAN_FILTER_KEYS, usePlanosUrlParams(), h, realReplaceState (+1 more)

### Community 82 - "Validação Administrativa"
Cohesion: 0.29
Nodes (8): class-variance-authority, changePassword(), ChangePasswordForm(), initialState, Alert, AlertProps, alertVariants, iconMap

### Community 83 - "Papéis no Banco"
Cohesion: 0.24
Nodes (8): crud, deleteTipoPA, getTiposPA, upsertTipoPA, metadata, TiposPaPage(), tipoPaSchema, TipoPA

### Community 84 - "Continuidade de Planos"
Cohesion: 0.22
Nodes (6): public.roles, public.validate_profile_role(), validate_profile_role_trg, public.is_valid_role_name(), public.effective_role_for_tenant(), public.has_perm_for_tenant()

### Community 85 - "Correções e IA"
Cohesion: 0.28
Nodes (8): Header compacto de plano, Stats Bar compacta, Tabela compacta com detalhes expansíveis, Escala consistente de tipografia, gaps e padding, Revisão de Layout — Página de Planos Versão 2.0, Filtros em card dedicado, Card View para mobile, Responsividade e hierarquia visual existentes

### Community 86 - "Layout de Planos"
Cohesion: 0.25
Nodes (5): zod, SocialSignal, SocialSignalSchema, createTenantSchema, CreateTenantValues

### Community 87 - "Convenções de Migrations"
Cohesion: 0.25
Nodes (3): AreaUnitFilter(), areaState(), toggleArea()

### Community 88 - "Configuração de Build"
Cohesion: 0.28
Nodes (7): ALLOWED_BUILTIN_ROLES, createUserSchema, CreateUserValues, permissionsSchema, updateUserSchema, UpdateUserValues, userName

### Community 89 - "Filtros de Planos"
Cohesion: 0.22
Nodes (9): Transação automática do Supabase, Documentação obrigatória de rollback destrutivo, Convenções de Migrations, DDL idempotente, Documentação inline do schema, Nomenclatura sequencial de migrations, Recriação segura de políticas RLS, Separação de seed data das migrations (+1 more)

### Community 90 - "Auditoria e Templates"
Cohesion: 0.25
Nodes (8): Metodologia 5W2H no Manual, Exportação Excel e PDF no Manual, FAQ de Compartilhamento e Anexos, Login e Primeiro Acesso, Criar Plano e Itens 5W2H, Suporte do Manual, Seletor de Empresas Tenants, Tabela, Kanban e Gantt no Manual

### Community 91 - "Modelos de Domínio"
Cohesion: 0.43
Nodes (5): FilterSelect(), IconFilterSelect(), PlanFilters(), PlanFiltersProps, useDebounce()

### Community 92 - "Documentação no Frontend"
Cohesion: 0.36
Nodes (6): public.plan_template_items, public.plan_templates, idx_admin_audit_log_admin_id, idx_admin_audit_log_created_at, idx_admin_audit_log_target_user_id, public.admin_audit_log

### Community 93 - "Base de Conhecimento"
Cohesion: 0.48
Nodes (7): lookupCnpj(), FornecedorForm(), handleLookup(), submit(), SectionHeader(), submit(), stripFormat

### Community 94 - "RAG no PostgreSQL"
Cohesion: 0.38
Nodes (5): AppError, AppErrorCode, FormState, getErrorMessage(), isRetryable()

### Community 95 - "Configuração ESLint"
Cohesion: 0.38
Nodes (4): knowledge_base_embedding_idx, public.knowledge_base, idx_knowledge_base_area, idx_knowledge_base_unit

### Community 96 - "Seleção Múltipla"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@^16.4.6, eslint, eslint-config-next

### Community 98 - "Ícone de Janela"
Cohesion: 0.67
Nodes (3): itemSchema, planSchema, sanitizedString()

### Community 99 - "Escolas no Banco"
Cohesion: 0.40
Nodes (5): AuthState, Profile, ProfileWithTenants, User, UserRole

### Community 100 - "Logo Next.js"
Cohesion: 0.60
Nodes (5): idx_companies_cnpj, idx_companies_nome, idx_companies_tenant, idx_companies_unit, public.companies

### Community 101 - "Fornecedores no Banco"
Cohesion: 0.40
Nodes (5): Browser Window Chrome, Three Window Control Dots, Window Icon, Monochrome SVG Icon Design, Rounded Window Frame

### Community 102 - "Regras para Agentes"
Cohesion: 0.70
Nodes (4): idx_schools_nome, idx_schools_tenant, idx_schools_unit, public.schools

### Community 103 - "Ícone de Globo"
Cohesion: 0.67
Nodes (4): Next.js Logo, Next.js, NEXT.JS Wordmark, SVG Vector Format

### Community 104 - "Exportação CSV"
Cohesion: 0.83
Nodes (3): idx_fornecedores_active, idx_fornecedores_tenant, public.fornecedores

### Community 105 - "Configuração PostCSS"
Cohesion: 0.67
Nodes (3): Regras para agentes sobre a versão do Next.js, Documentação local do Next.js em node_modules/next/dist/docs, Referência @AGENTS.md

### Community 106 - "Ícone da Aplicação"
Cohesion: 0.67
Nodes (3): Cancelamento e Exclusão de Conta, Interrupção de Serviço, Política de Reembolso

### Community 107 - "Layout de Benchmarking"
Cohesion: 0.67
Nodes (3): Circular Globe Outline, Globe Icon, Latitude and Longitude Grid

### Community 108 - "Layout Financeiro"
Cohesion: 0.67
Nodes (3): ContaFormProps, Fornecedor, CategoriaDespesa

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 837 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **48 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Dependências de Desenvolvimento` to `Autenticação e Interface`, `Componentes de Interface`, `Financeiro e React`, `Planos e Permissões`, `Importação de Planos`, `Monitoramento e Testes`, `Dependências do Projeto`, `Carregamento e Skeletons`, `Documentação e Deploy`, `Financeiro e Anexos`, `Formulários Administrativos`, `Validação e Formatação`, `Histórico de Versões`, `Testes de Planos`, `Dashboard Executivo`, `Navegação e Tenant`, `Página de Planos`, `Papéis e Permissões`, `Contas a Pagar`, `Gestão de Escolas`, `Tabela de Planos`, `Financeiro no Banco`, `Benchmarking no Banco`, `Simulador Financeiro`, `Gestão de Empresas`, `Central de Ajuda`, `FAQ do Usuário`, `Consultas Financeiras`, `Diário Oficial`, `Configuração TypeScript`, `Plataforma e RBAC`, `Scripts do Projeto`, `Macro Ações`, `Ações Rápidas`, `Duplicação de Ações`, `Revisão Financeira`, `Melhorias de Planos`, `Detalhes de Benchmarking`, `Migration de Prioridades`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **What connects `Tabela contas_pagar`, `Checklist de QA funcional, segurança, performance e edge cases`, `Roadmap de auditoria, alertas, exportação e integração bancária` to the rest of the system?**
  _286 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Autenticação e Interface` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `Componentes de Interface` to `Autenticação e Interface`, `Dados e Compartilhamento`, `Financeiro e React`, `Planos e Permissões`, `Monitoramento e Testes`, `Dependências do Projeto`, `Carregamento e Skeletons`, `Catálogos Administrativos`, `Formulários Administrativos`, `Testes de Planos`, `Dashboard Executivo`, `Navegação e Tenant`, `Benchmarking e Cards`, `Tabela de Planos`, `Ações de Benchmarking`, `Benchmarking no Banco`, `Simulador Financeiro`, `Central de Ajuda`, `FAQ do Usuário`, `Consultas Financeiras`, `Diário Oficial`, `Configuração TypeScript`, `Manual do Usuário`, `Gráficos do Dashboard`, `Melhorias de Planos`, `Validação Administrativa`, `Convenções de Migrations`, `Modelos de Domínio`, `Empresas no Banco`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `Componentes de Interface` be split into smaller, more focused modules?**
  _Cohesion score 0.05146242132543503 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Erro getContasPagar Supabase vazio` and `Usuário Não Autenticado`?**
  _Edge tagged AMBIGUOUS (relation: possible_cause_of) - confidence is low._
- **What is the exact relationship between `Erro getContasPagar Supabase vazio` and `Foreign Key ou Referência Quebrada`?**
  _Edge tagged AMBIGUOUS (relation: possible_cause_of) - confidence is low._