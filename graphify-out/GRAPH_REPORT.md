# Graph Report - planocerto  (2026-11-19)

## Corpus Check
- 610 files · ~364,774 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 1, .jsonl 1, .xlsb 1)

## Summary
- 2881 nodes · 8432 edges · 165 communities (110 shown, 55 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 99 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `95d6a5de`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Input
- Componentes de Interface
- tenants/page.tsx
- Financeiro e React
- react
- Dashboard e Calendário
- Importação de Planos
- Monitoramento e Testes
- Dependências do Projeto
- Carregamento e Skeletons
- Catálogos Administrativos
- Documentação e Deploy
- Administração Supabase
- Financeiro e Anexos
- plan-form-dialog.tsx
- Gestão de Usuários
- Validação e Formatação
- sanitizeText
- Testes de Planos
- Formulário de Ações
- contas-pagar-client.tsx
- vitest
- Navegação e Tenant
- Página de Planos
- Papéis e Permissões
- Unit
- Cliente Supabase
- (protected)/layout.tsx
- getUnitsAdmin
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
- Button
- Guia do Desenvolvedor
- Gestão de Empresas
- codex advisor artifact
- proxy.ts
- CRUD de Catálogos
- Consultas Financeiras
- public.profiles
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
- actions/catalog.ts
- unidades-client.tsx
- Ações de Catálogo
- Formulários de Instituições
- Macro Ações
- fornecedores.ts
- Seleção de Período
- Validação e Sanitização
- Benchmarking de Concorrentes
- 077_write_policies.test.sql
- Ações Rápidas
- Gráficos do Dashboard
- actions/auth.ts
- Layout e Tema
- schools.ts
- Modal de Ajuda
- Membros de Tenants
- Revisão Financeira
- Melhorias de Planos
- validation/sanitize.ts
- Termos de Uso
- codex advisor artifact
- help/page.tsx
- Detalhes de Benchmarking
- public.profiles
- tipos-pa-client.tsx
- prioridades-client.tsx
- Correções e IA
- item-form-dialog.tsx
- Convenções de Migrations
- Configuração de Build
- Filtros de Planos
- Auditoria e Templates
- Modelos de Domínio
- Documentação no Frontend
- 030_super_admin_and_user_scopes.sql
- lib/sanitize.ts
- Configuração ESLint
- 075_076_privileges.test.sql
- Empresas no Banco
- next.config.ts
- Escolas no Banco
- public.tenants
- Fornecedores no Banco
- Regras para Agentes
- Ícone de Globo
- create-plan-duplicate.test.ts
- Configuração PostCSS
- Ícone da Aplicação
- Layout de Benchmarking
- pg_temp.count_as
- unread/route.ts
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
- painel/page.tsx
- Rollback da 084_macro_acao_normalizacao
- 078_account_access.test.sql
- 082_concorrencia.test.sh

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
- `Para desfazer` --references--> `toIdList()`  [INFERRED]
  .omc/artifacts/ask/codex-revis-o-de-c-digo-das-mudan-as-n-o-commitadas-git-diff-arqui-2026-11-19T23-16-50-981Z.md → src/app/actions/action-plan.ts
- `Para desfazer` --references--> `toIdList()`  [INFERRED]
  .omc/artifacts/ask/codex-verifica-o-das-corre-es-dos-7-achados-da-revis-o-anterior-re-2026-11-19T23-24-22-314Z.md → src/app/actions/action-plan.ts
- `Para desfazer` --references--> `getPlans()`  [INFERRED]
  .omc/artifacts/ask/codex-revis-o-de-c-digo-das-mudan-as-n-o-commitadas-git-diff-arqui-2026-11-19T23-16-50-981Z.md → src/app/actions/action-plan.ts
- `Para desfazer` --references--> `getPlans()`  [INFERRED]
  .omc/artifacts/ask/codex-verifica-o-das-corre-es-dos-7-achados-da-revis-o-anterior-re-2026-11-19T23-24-22-314Z.md → src/app/actions/action-plan.ts
- `Para desfazer` --references--> `getItems()`  [INFERRED]
  .omc/artifacts/ask/codex-revis-o-de-c-digo-das-mudan-as-n-o-commitadas-git-diff-arqui-2026-11-19T23-16-50-981Z.md → src/app/actions/action-plan.ts

## Import Cycles
- 2-file cycle: `src/app/actions/tenant.ts -> src/lib/supabase/session.ts -> src/app/actions/tenant.ts`
- 3-file cycle: `src/app/actions/_helpers.ts -> src/lib/supabase/session.ts -> src/app/actions/tenant.ts -> src/app/actions/_helpers.ts`
- 3-file cycle: `src/app/actions/admin.ts -> src/lib/supabase/session.ts -> src/app/actions/tenant.ts -> src/app/actions/admin.ts`
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

## Communities (165 total, 55 thin omitted)

### Community 0 - "Input"
Cohesion: 0.12
Nodes (28): lookupCnpj(), toggleFornecedorActive(), TenantFormDialog(), AreaForm(), CategoriaForm(), FormValues, FornecedoresClient(), handleToggle() (+20 more)

### Community 1 - "Componentes de Interface"
Cohesion: 0.05
Nodes (56): AreaInfo, BarSeg(), BUCKET_DOT, DashboardActionRow, DashboardClientProps, DeadlineItem, DeadlineKind, DeadlineRow() (+48 more)

### Community 2 - "tenants/page.tsx"
Cohesion: 0.09
Nodes (54): toggleAreaActive, deleteNotification(), getTenantMembers(), AdminNotificationsPage(), Field(), init, AdminTenantsPage(), initialState (+46 more)

### Community 3 - "Financeiro e React"
Cohesion: 0.08
Nodes (57): getResumoContas(), ResetPasswordPage(), renderCard(), Anual(), diasAteVencer(), FinanceiroClient(), MESES, MESES_FULL (+49 more)

### Community 4 - "react"
Cohesion: 0.09
Nodes (49): class-variance-authority, react, AdminFormState, login(), signup(), updatePassword(), AuthPage(), initialState (+41 more)

### Community 5 - "Dashboard e Calendário"
Cohesion: 0.08
Nodes (58): processUnsentAlerts, Apify, calculateSeverity, Ciclo obrigatório de implementação e qualidade, Padrões obrigatórios de código, Contratos de qualidade e segurança, Motor correlate, Cypress (+50 more)

### Community 6 - "Importação de Planos"
Cohesion: 0.05
Nodes (54): dependencies, aws4fetch@^1.0.20, class-variance-authority@^0.7.1, clsx@^2.1.1, date-fns@^4.1.0, @dnd-kit/core@^6.3.1, @dnd-kit/sortable@^10.0.0, @dnd-kit/utilities@^3.2.2 (+46 more)

### Community 7 - "Monitoramento e Testes"
Cohesion: 0.11
Nodes (51): activateUser(), ADMIN_ASSIGNABLE_ROLES, AreaOption, assertCanManageUser(), auditLog(), AuditLogEntry, BUILTIN_ROLES, bulkDeleteUsers() (+43 more)

### Community 8 - "Dependências do Projeto"
Cohesion: 0.06
Nodes (71): xlsx, getCurrentUserPlanScope(), POST(), POST(), CalendarioEmpty(), CalendarioPage(), isFilterKind(), metadata (+63 more)

### Community 9 - "Carregamento e Skeletons"
Cohesion: 0.08
Nodes (26): assignCompaniesSchema, assignCompaniesToUnit(), companySchema, deleteCompany(), getCompanies(), readForm(), upsertCompany(), CHANCE_BADGES (+18 more)

### Community 10 - "Catálogos Administrativos"
Cohesion: 0.08
Nodes (38): admin/loading.tsx com PageLoading, Auth, desativação de conta e restrição de horário no proxy, Correções concluídas de tabela, formulário, filtros, calendário e sugestão por IA, Filtros Tipo PA e Macro Ação afetando totais do dashboard, SkeletonHeader, SkeletonTable e PageLoading em @/components/ui/loading, Unificação dos modelos de loading, Configuração de redirects em next.config.ts, Redirects permanentes de /plano para /planos (+30 more)

### Community 11 - "Documentação e Deploy"
Cohesion: 0.08
Nodes (56): Para desfazer, Para desfazer, buildItemTree(), bulkUpdateStatus(), clonePlanWithDateShift(), createPlan(), deleteItem(), deletePlan() (+48 more)

### Community 12 - "Administração Supabase"
Cohesion: 0.05
Nodes (46): Planos 5W2H — What, Why, Where, Who, When, How Much e How, Restrição de horário de login por usuário, Comentários por item de ação, Admin panel para usuários, tenants e permissões, API Reference — docs/API-REFERENCE.md — Server Actions, Auth e exemplos, Arquitetura — docs/ARQUITETURA.md, Upload de anexos de imagem, PDF e Excel, Autenticação por email e senha com reset e confirmação (+38 more)

### Community 13 - "Financeiro e Anexos"
Cohesion: 0.12
Nodes (31): checkPermission(), AccountAccessStatus, getRequesterScope(), log, manageableUserIds(), repointActiveTenant(), RequesterScope, tenantsWithSingleOwner() (+23 more)

### Community 14 - "plan-form-dialog.tsx"
Cohesion: 0.35
Nodes (11): getTemplates(), Modal(), Msg(), PlanFormDialog(), buildOfficialPlanHeader(), getPlanFormProgress(), normalizePlanFormValue(), PlanFormDraft (+3 more)

### Community 15 - "Gestão de Usuários"
Cohesion: 0.05
Nodes (43): Comentários por item de ação, Upload de anexos em itens de ação, Remoção de plano meio-órfão no upload em lote, Slug de empresa único, gerado no servidor e imutável, Kanban drag-and-drop com @dnd-kit/core, Mapeamento de vocabulário alternativo de status FAROL, Gráfico de Gantt SVG com zoom mês, trimestre e ano, Permissão plans.update na rota /api/plans/[id]/import (+35 more)

### Community 16 - "Validação e Formatação"
Cohesion: 0.09
Nodes (28): @supabase/ssr, ActionItemInsert, commentSchema, copyPlan(), createPlanFromTemplate(), GET(), findUnitForTenantByName(), normalizeUnitName() (+20 more)

### Community 17 - "sanitizeText"
Cohesion: 0.11
Nodes (40): crud, deleteArea, getAreasAdmin(), log, updateAreaRegionalContext(), upsertArea, CatalogCrudConfig, createCatalogCrud() (+32 more)

### Community 18 - "Testes de Planos"
Cohesion: 0.09
Nodes (36): createRole(), deleteRole(), getRoles(), RoleFormState, RoleRow, updateRole(), AdminNav(), AdminLayout() (+28 more)

### Community 19 - "Formulário de Ações"
Cohesion: 0.07
Nodes (36): Gestão administrativa de contexto regional e documentos, Base de Conhecimento IA e Inteligência Regional — Versão 2.1, Base de conhecimento proprietária knowledge_base, Contexto Local de Execução no prompt do Claude, Busca semântica RAG com pgvector, regional_context JSONB em units e areas, Motor de sugestão contextual suggest5W2H, Clonagem clonePlanWithDateShift e targetTenantId (+28 more)

### Community 20 - "contas-pagar-client.tsx"
Cohesion: 0.06
Nodes (52): getItemBasicsForConta(), addMonths(), ContaForm(), adicionarParcela(), ajustarUltimaParaBaterTotal(), aplicarPreset(), atualizarParcela(), gerarParcelas() (+44 more)

### Community 21 - "vitest"
Cohesion: 0.10
Nodes (10): @testing-library/react, vitest, createTenantSchema, CreateTenantValues, areas, units, {
  clonePlanWithDateShiftMock,
  copyPlanMock,
  getUserTenantsMock,
}, { rateLimitMock, createClientMock } (+2 more)

### Community 22 - "Navegação e Tenant"
Cohesion: 0.15
Nodes (24): countBy(), init, PlanosPage(), BudgetHealthBar(), CopyPlanButtonProps, Props, buildMacroActionOptions(), collectItemClassificationOptions() (+16 more)

### Community 23 - "Página de Planos"
Cohesion: 0.09
Nodes (44): ANEXO_ALLOWED_MIMES, cancelarConta(), createConta(), deleteAnexo(), deleteConta(), deriveContaDerived(), estornarPagamento(), getAnexoUrl() (+36 more)

### Community 24 - "Papéis e Permissões"
Cohesion: 0.08
Nodes (38): getAiModelsForPlan(), RegionalContext, suggest5W2H(), UnitRegionalData, changePassword(), getLlmSettings(), invalidBaseUrl(), LlmFormState (+30 more)

### Community 25 - "Unit"
Cohesion: 0.27
Nodes (14): RegionalContextFormProps, ItemFormDialogProps, PlanFormDialogProps, buildUnitPreview(), findAreaByName(), findUnitByName(), normalizeCatalogValue(), PlanItemUnitPreview (+6 more)

### Community 26 - "Cliente Supabase"
Cohesion: 0.09
Nodes (19): {{ .ConfirmationURL }}, {{ .Email }}, Confirmation Email Template, Email Change Template, {{ .NewEmail }}, Invite Email Template, Magic Link Email Template, Password Changed Notification Template (+11 more)

### Community 27 - "(protected)/layout.tsx"
Cohesion: 0.35
Nodes (11): @supabase/supabase-js, getCurrentTenant(), getUserTenants(), dynamic, getSessionData(), ProtectedLayout(), ToastProvider(), getSessionCustomRoles (+3 more)

### Community 28 - "getUnitsAdmin"
Cohesion: 0.26
Nodes (10): getInstituicao(), getUnitsAdmin(), EditarInstituicaoPage(), generateMetadata(), Props, generateMetadata(), InstituicaoDetailPage(), Props (+2 more)

### Community 29 - "Configuração de IA"
Cohesion: 0.06
Nodes (32): eslintConfig, devDependencies, eslint@^9, eslint-config-next@^16.4.6, husky@^9.1.7, jsdom@^29.1.1, lint-staged@^15.4.3, pino-pretty@^13.1.3 (+24 more)

### Community 30 - "Tabela de Planos"
Cohesion: 0.10
Nodes (23): ItemContasSummary, countItems(), EditRow(), paginate(), PlanTable(), collect(), flattenVisible(), PlanTableProps (+15 more)

### Community 31 - "Templates de Email"
Cohesion: 0.08
Nodes (23): public.action_items, public.action_plans, public.plan_audit_log, public.notification_reads, public.notifications, public.item_comments, public.public_links, public.plan_attachments (+15 more)

### Community 32 - "Arquitetura Supabase"
Cohesion: 0.09
Nodes (26): Tabela action_items, Migration 004: action_plan_5w2h, Tabela action_plans, Backup como pré-condição de rollback, Rollback Migration 004 — action_plan_5w2h, Grants, Procedimento manual de rollback da migration 004, Políticas RLS (+18 more)

### Community 33 - "Ações de Benchmarking"
Cohesion: 0.12
Nodes (22): daysBetween(), formatMonthYear(), GanttChart(), getBarColor(), statusColors, Zoom, columns, DraggableCard() (+14 more)

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
Cohesion: 0.24
Nodes (15): ALLOWED_MIMES, deleteAttachment(), getAttachments(), getAttachmentUrl(), uploadAttachment(), AttachmentSection(), formatSize(), isImage() (+7 more)

### Community 39 - "Benchmarking no Banco"
Cohesion: 0.17
Nodes (17): logout(), FontControl(), getStoredScale(), Navbar(), handleLogout(), NavbarProps, TenantSwitcher(), TenantSwitcherProps (+9 more)

### Community 40 - "Button"
Cohesion: 0.12
Nodes (18): createPublicLink(), deletePublicLink(), getPublicLinks(), PendentePage(), ExportCsv(), flattenItems(), PlanQuickActions(), PlanStats() (+10 more)

### Community 41 - "Guia do Desenvolvedor"
Cohesion: 0.09
Nodes (24): Modelo contas_pagar e parcelas_pagar, Hierarquia Recursiva de Itens, Modelo action_items, Modelo action_plans, Modelo tenants e profiles, Conta e Autenticação, Administração e Escopos, Anexos (+16 more)

### Community 42 - "Gestão de Empresas"
Cohesion: 0.10
Nodes (41): checkCompetitorWrite(), deleteCorpoDocente(), deleteCursoInstituicao(), deleteInstituicao(), deleteMensalidade(), getCorpoDocente(), getCursosInstituicao(), getCursosSuperiores() (+33 more)

### Community 43 - "codex advisor artifact"
Cohesion: 0.09
Nodes (22): Action items, codex advisor artifact, Concise summary, Debugging, Duration, Examples, Final prompt, Good to know (+14 more)

### Community 44 - "proxy.ts"
Cohesion: 0.15
Nodes (14): logger, Logger, checkAuth(), blockedMessage(), checkProfileRestrictions(), log, ProfileCheckResult, isApiRoute() (+6 more)

### Community 45 - "CRUD de Catálogos"
Cohesion: 0.10
Nodes (22): Documentação Técnica - PlanoCerto, Performance e Checklist de Segurança, Referências Next.js, Supabase, Zod, Tailwind e React 19, Server Actions por Domínio, Estrutura src e supabase, Regras Estritas React e TypeScript, Troubleshooting Técnico, Validação Zod e React Hook Form (+14 more)

### Community 46 - "Consultas Financeiras"
Cohesion: 0.09
Nodes (20): lucide-react, next, AuthError(), AuthErrorProps, AuthLayout(), ErrorPage(), ErrorPageProps, GlobalError() (+12 more)

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
Cohesion: 0.27
Nodes (10): TenantAwareWrapper(), TenantAwareWrapperProps, TenantContext, TenantContextType, TenantProvider(), TenantProviderProps, Tenant, TenantMember (+2 more)

### Community 53 - "Configuração TypeScript"
Cohesion: 0.19
Nodes (14): CalendarGrid(), CalendarListView(), CalendarMonthView(), DayCell(), Dot(), ItemRow(), KindFilter(), MONTH_NAMES (+6 more)

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

### Community 58 - "actions/catalog.ts"
Cohesion: 0.19
Nodes (12): getChannels(), getPrioridades(), getUnits(), EmpresasPage(), metadata, EscolasPage(), metadata, metadata (+4 more)

### Community 59 - "unidades-client.tsx"
Cohesion: 0.13
Nodes (29): getCategoriasDespesa(), CategoriasDespesaPage(), metadata, CatalogCard, CatalogosPage(), dictionaries, metadata, registries (+21 more)

### Community 60 - "Ações de Catálogo"
Cohesion: 0.13
Nodes (17): Metodologia 5W2H, PostgreSQL, Auth e PostgREST Self-hosted na VPS, Dashboard Executivo, Deploy VPS, Caddy e Cloudflare, Integrações Resend, Teams e Google Calendar, Multi-tenancy e RLS, Next.js App Router 16.4.6, sendPlanNotification e notifyTeams (+9 more)

### Community 61 - "Formulários de Instituições"
Cohesion: 0.14
Nodes (17): Server Actions e Revalidação, API de Autenticação, Comandos npm e Git, Referência do Banco, Debug e Logs, Deploy VPS com Cloudflare, Guia Rápido - PlanoCerto, Variáveis de Ambiente (+9 more)

### Community 62 - "Macro Ações"
Cohesion: 0.13
Nodes (14): Claude Security, Claude Security, git status, Handoff automático — 2026-11-18T13:02:12, The front-desk menu, The front-desk menu, Trecho recente da conversa (texto, redigido), ActionRow (+6 more)

### Community 63 - "fornecedores.ts"
Cohesion: 0.11
Nodes (26): zod, BrasilApiCnpj, CnpjLookupResult, getFornecedores(), FornecedoresPage(), metadata, ContasPagarPage(), metadata (+18 more)

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
Cohesion: 0.19
Nodes (10): DateRangePicker(), applyPreset(), commit(), openPanel(), DateRangePickerProps, MONTH_NAMES, parseIso(), Preset() (+2 more)

### Community 70 - "actions/auth.ts"
Cohesion: 0.10
Nodes (27): sendRecoveryEmail(), resetPassword(), updateProfile(), AuthEmailKind, brand, buildAuthEmail(), renderLayout(), itemCompletedEmail() (+19 more)

### Community 71 - "Layout e Tema"
Cohesion: 0.23
Nodes (12): crud, deleteMacroAcao, getMacroAcoesAdmin, toggleMacroAcaoActive, upsertMacroAcao, MacroAcoesPage(), metadata, FormValues (+4 more)

### Community 72 - "schools.ts"
Cohesion: 0.12
Nodes (16): assignSchoolsSchema, getSchools(), readForm(), schoolSchema, upsertSchool(), handleAssign(), AppError, AppErrorCode (+8 more)

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
Cohesion: 0.24
Nodes (9): createNotification(), createNotificationSchema, getNotifications(), getUnreadCount(), markAsRead(), NotificationFormState, NotificationItem, NotificationBell() (+1 more)

### Community 77 - "validation/sanitize.ts"
Cohesion: 0.14
Nodes (14): itemSchema, planSchema, nome(), CategoriaDespesaFormValues, categoriaDespesaSchema, ContaPagarFormValues, contaPagarSchema, PagamentoFormValues (+6 more)

### Community 78 - "Termos de Uso"
Cohesion: 0.35
Nodes (9): buildDuplicatedRows(), collectSubtree(), walk(), collectSubtreeIds(), DuplicableItem, DuplicatedItemRow, nextSiblingNumber(), remapCopiedNumber() (+1 more)

### Community 79 - "codex advisor artifact"
Cohesion: 0.10
Nodes (20): codex advisor artifact, Debugging, Duration, Examples, Final prompt, Good to know, In Route Handlers and Server Functions, In Server Components (pages and layouts) (+12 more)

### Community 80 - "help/page.tsx"
Cohesion: 0.16
Nodes (17): HelpPage(), QUICK_GUIDE_FEATURES, TOPIC_CARDS, CardDescription, DocsViewerProps, Tabs(), TabsContent(), TabsContentProps (+9 more)

### Community 81 - "Detalhes de Benchmarking"
Cohesion: 0.25
Nodes (9): ITEM_FILTER_KEYS, oneOf(), Params, parseIntParam(), PLAN_FILTER_KEYS, usePlanosUrlParams(), h, realReplaceState (+1 more)

### Community 82 - "public.profiles"
Cohesion: 0.12
Nodes (8): public.effective_role_for_tenant(), public.has_perm_for_tenant(), public.has_perm_for_tenant(), public.role_has_perm(), public.account_access_status(), public.check_request_account(), public.is_admin_of_user(), idx_tenant_members_user

### Community 83 - "tipos-pa-client.tsx"
Cohesion: 0.13
Nodes (18): crud, deleteTipoPA, getTiposPA, toggleTipoPAActive, upsertTipoPA, metadata, TiposPaPage(), FormValues (+10 more)

### Community 84 - "prioridades-client.tsx"
Cohesion: 0.19
Nodes (14): crud, deletePrioridade, getPrioridadesAdmin, parsePayload(), togglePrioridadeActive, upsertPrioridade, metadata, PrioridadesPage() (+6 more)

### Community 85 - "Correções e IA"
Cohesion: 0.28
Nodes (8): Header compacto de plano, Stats Bar compacta, Tabela compacta com detalhes expansíveis, Escala consistente de tipografia, gaps e padding, Revisão de Layout — Página de Planos Versão 2.0, Filtros em card dedicado, Card View para mobile, Responsividade e hierarquia visual existentes

### Community 86 - "item-form-dialog.tsx"
Cohesion: 0.26
Nodes (13): getItemAuditLog(), ItemFormDialog(), Modal(), Msg(), formatAuditEntryDate(), getAuditEntryMarker(), getAuditEntrySummary(), getAuditEntryTone() (+5 more)

### Community 87 - "Convenções de Migrations"
Cohesion: 0.25
Nodes (3): AreaUnitFilter(), areaState(), toggleArea()

### Community 88 - "Configuração de Build"
Cohesion: 0.24
Nodes (8): ALLOWED_BUILTIN_ROLES, createUserSchema, CreateUserValues, permissionsSchema, sanitizePermissions(), updateUserSchema, UpdateUserValues, userName

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
Cohesion: 0.70
Nodes (4): idx_admin_audit_log_admin_id, idx_admin_audit_log_created_at, idx_admin_audit_log_target_user_id, public.admin_audit_log

### Community 93 - "030_super_admin_and_user_scopes.sql"
Cohesion: 0.22
Nodes (13): idx_user_areas_area, idx_user_areas_tenant, idx_user_areas_user, idx_user_units_tenant, idx_user_units_unit, idx_user_units_user, public.user_area_ids(), public.user_areas (+5 more)

### Community 94 - "lib/sanitize.ts"
Cohesion: 0.27
Nodes (8): addComment(), deleteComment(), getComments(), Comment, CommentSection(), fmtRelative(), isValidUrl(), sanitizeRecord()

### Community 95 - "Configuração ESLint"
Cohesion: 0.38
Nodes (4): knowledge_base_embedding_idx, public.knowledge_base, idx_knowledge_base_area, idx_knowledge_base_unit

### Community 96 - "075_076_privileges.test.sql"
Cohesion: 0.29
Nodes (8): auth.users, pg_temp.expect_denied(), public.is_super_admin(), public.profiles, public.roles, public.tenant_member_roles, public.tenant_members, public.tenants

### Community 98 - "next.config.ts"
Cohesion: 0.25
Nodes (4): nextConfig, projectRoot, @vitejs/plugin-react@^6.0.1, @vitejs/plugin-react

### Community 99 - "Escolas no Banco"
Cohesion: 0.40
Nodes (5): AuthState, Profile, ProfileWithTenants, User, UserRole

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

### Community 104 - "create-plan-duplicate.test.ts"
Cohesion: 0.29
Nodes (3): chain(), c, mockDb()

### Community 105 - "Configuração PostCSS"
Cohesion: 0.67
Nodes (3): Regras para agentes sobre a versão do Next.js, Documentação local do Next.js em node_modules/next/dist/docs, Referência @AGENTS.md

### Community 106 - "Ícone da Aplicação"
Cohesion: 0.67
Nodes (3): Cancelamento e Exclusão de Conta, Interrupção de Serviço, Política de Reembolso

### Community 107 - "Layout de Benchmarking"
Cohesion: 0.67
Nodes (3): Circular Globe Outline, Globe Icon, Latitude and Longitude Grid

### Community 109 - "unread/route.ts"
Cohesion: 0.40
Nodes (3): GET(), headers, { createClientMock }

### Community 156 - "painel/page.tsx"
Cohesion: 0.50
Nodes (4): AdminPainelPage(), Kpi(), metadata, PLAN_BADGE

### Community 157 - "Rollback da 084_macro_acao_normalizacao"
Cohesion: 0.50
Nodes (3): Antes de aplicar em produção, Para desfazer, Rollback da 084_macro_acao_normalizacao

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 951 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **55 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Consultas Financeiras` to `Input`, `Componentes de Interface`, `tenants/page.tsx`, `Financeiro e React`, `react`, `Importação de Planos`, `Monitoramento e Testes`, `Dependências do Projeto`, `Carregamento e Skeletons`, `Documentação e Deploy`, `Financeiro e Anexos`, `plan-form-dialog.tsx`, `Validação e Formatação`, `sanitizeText`, `Testes de Planos`, `contas-pagar-client.tsx`, `Navegação e Tenant`, `Página de Planos`, `Papéis e Permissões`, `(protected)/layout.tsx`, `painel/page.tsx`, `getUnitsAdmin`, `Tabela de Planos`, `attachments.ts`, `Benchmarking no Banco`, `Button`, `Gestão de Empresas`, `proxy.ts`, `Diário Oficial`, `Configuração TypeScript`, `unidades-client.tsx`, `fornecedores.ts`, `Ações Rápidas`, `actions/auth.ts`, `Layout e Tema`, `schools.ts`, `Revisão Financeira`, `Melhorias de Planos`, `Detalhes de Benchmarking`, `tipos-pa-client.tsx`, `prioridades-client.tsx`, `next.config.ts`, `unread/route.ts`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `createClient()` (e.g. with `action-plan-ai.test.ts` and `action-plan-phase3.test.ts`) actually correct?**
  _`createClient()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Tabela contas_pagar`, `Checklist de QA funcional, segurança, performance e edge cases`, `Roadmap de auditoria, alertas, exportação e integração bancária` to the rest of the system?**
  _286 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Input` be split into smaller, more focused modules?**
  _Cohesion score 0.12307692307692308 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `Componentes de Interface` to `Input`, `tenants/page.tsx`, `Financeiro e React`, `react`, `Monitoramento e Testes`, `Dependências do Projeto`, `Carregamento e Skeletons`, `Catálogos Administrativos`, `plan-form-dialog.tsx`, `Testes de Planos`, `contas-pagar-client.tsx`, `Navegação e Tenant`, `(protected)/layout.tsx`, `Tabela de Planos`, `Ações de Benchmarking`, `Benchmarking no Banco`, `Button`, `Gestão de Empresas`, `Consultas Financeiras`, `Configuração TypeScript`, `unidades-client.tsx`, `Ações Rápidas`, `Gráficos do Dashboard`, `Melhorias de Planos`, `help/page.tsx`, `item-form-dialog.tsx`, `Convenções de Migrations`, `Modelos de Domínio`, `Empresas no Banco`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Erro getContasPagar Supabase vazio` and `Usuário Não Autenticado`?**
  _Edge tagged AMBIGUOUS (relation: possible_cause_of) - confidence is low._
- **What is the exact relationship between `Erro getContasPagar Supabase vazio` and `Foreign Key ou Referência Quebrada`?**
  _Edge tagged AMBIGUOUS (relation: possible_cause_of) - confidence is low._