# Graph Report - planocerto  (2026-11-16)

## Corpus Check
- 426 files · ~231,901 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 1, .xlsb 1, .ico 1)

## Summary
- 2582 nodes · 7856 edges · 147 communities (103 shown, 44 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 90 edges (avg confidence: 0.85)
- Token cost: unavailable from the subagent runtime (13 semantic agents + AST extraction)

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
- Migration de Prioridades
- Execuções de Ingestão
- Configurações de LLM
- Configuração Vercel
- Logo de Email
- Ícone de Arquivo
- Logo Vercel

## Integrity Notes
- 5 dangling-endpoint edges and 18 self-loop edges reported by diagnostics.
- 151 same-endpoint edges collapsed during undirected graph construction.
- `src/app/(protected)/admin/tenants/page.tsx` was only partially modeled by the AST parser, although TypeScript and the production build pass.
- `public/modelo-plano-acao.xlsx` was not processed because optional Office conversion is unavailable.

## God Nodes (most connected - your core abstractions)
1. `cn()` - 199 edges
2. `createClient()` - 173 edges
3. `Button` - 131 edges
4. `lucide-react` - 105 edges
5. `react` - 103 edges
6. `Input` - 102 edges
7. `Card` - 98 edges
8. `CardContent` - 96 edges
9. `next` - 92 edges
10. `createAdminClient()` - 66 edges

## Surprising Connections (you probably didn't know these)
- `ResetPasswordPage()` --indirect_call--> `resetPassword()`  [INFERRED]
  src/app/(auth)/auth/reset/page.tsx → src/app/actions/auth.ts
- `AdminNotificationsPage()` --indirect_call--> `createNotification()`  [INFERRED]
  src/app/(protected)/admin/notifications/page.tsx → src/app/actions/notifications.ts
- `AdminNotificationsPage()` --indirect_call--> `deleteNotification()`  [INFERRED]
  src/app/(protected)/admin/notifications/page.tsx → src/app/actions/notifications.ts
- `RolesTable()` --indirect_call--> `createRole()`  [INFERRED]
  src/app/(protected)/admin/roles/roles-table.tsx → src/app/actions/admin.ts
- `RolesTable()` --indirect_call--> `deleteRole()`  [INFERRED]
  src/app/(protected)/admin/roles/roles-table.tsx → src/app/actions/admin.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Stack de deployment de produção do PlanoCerto** — readme_vps_deployment, readme_nextjs_16, readme_caddy, readme_systemd, readme_cloudflare [EXTRACTED 1.00]
- **** — docs_arquitetura_nextjs_frontend_entity, docs_arquitetura_supabase_auth_entity, docs_arquitetura_multi_tenant_rls_entity, docs_arquitetura_postgresql_database_entity [EXTRACTED 1.00]
- **** — docs_benchmarking_concorrentes_instituicoes_table_entity, docs_benchmarking_concorrentes_cursos_instituicao_table_entity, docs_benchmarking_concorrentes_corpo_docente_table_entity, docs_benchmarking_concorrentes_mensalidades_table_entity, docs_benchmarking_concorrentes_inherited_rls_entity [EXTRACTED 1.00]
- **** — docs_documentacao_tecnica_action_plans_table_entity, docs_documentacao_tecnica_action_items_table_entity, docs_documentacao_tecnica_contas_pagar_table_entity, docs_documentacao_tecnica_parcelas_table_entity [EXTRACTED 1.00]
- **** — docs_implementation_plan_inlabs_client_entity, docs_implementation_plan_sanitizacao_entity, docs_implementation_plan_ingest_worker_entity, docs_implementation_plan_do_publications_entity, docs_implementation_plan_ingest_runs_entity [EXTRACTED 1.00]
- **** — docs_implementation_plan_social_webhook_entity, docs_implementation_plan_social_signal_schema_entity, docs_implementation_plan_correlation_engine_entity, docs_implementation_plan_generate_insight_entity, docs_implementation_plan_entity_correlations_entity, docs_implementation_plan_alert_worker_entity [EXTRACTED 1.00]
- **** — docs_implementation_plan_ciclo_qualidade_entity, docs_implementation_plan_contratos_qualidade_entity, docs_implementation_plan_vitest_entity, docs_implementation_plan_husky_entity, docs_implementation_plan_testing_strategy_entity [EXTRACTED 1.00]
- **Supabase Auth Email Template Suite** — supabase_templates_confirmation_entity, supabase_templates_email_change_entity, supabase_templates_invite_entity, supabase_templates_magic_link_entity, supabase_templates_password_changed_notification_entity, supabase_templates_reauthentication_entity, supabase_templates_recovery_entity [EXTRACTED 1.00]

## Communities (147 total, 44 thin omitted)

### Community 0 - "Autenticação e Interface"
Cohesion: 0.05
Nodes (67): changePassword(), login(), signup(), updatePassword(), updateProfile(), initialState, ResetPasswordPage(), initialState (+59 more)

### Community 1 - "Componentes de Interface"
Cohesion: 0.10
Nodes (54): lucide-react, getTenantMembers(), AdminNotificationsPage(), Field(), init, createInitialState, RolesTable(), AdminTenantsPage() (+46 more)

### Community 2 - "Dados e Compartilhamento"
Cohesion: 0.05
Nodes (52): @supabase/ssr@^0.10.2, @supabase/ssr, ActionItemInsert, addComment(), commentSchema, copyPlan(), createPlanFromTemplate(), createPublicLink() (+44 more)

### Community 3 - "Financeiro e React"
Cohesion: 0.06
Nodes (49): react, ProtectedErrorProps, initialState, Props, UnitOption, addMonths(), ContaForm(), adicionarParcela() (+41 more)

### Community 4 - "Planos e Permissões"
Cohesion: 0.07
Nodes (48): buildItemTree(), bulkUpdateStatus(), clonePlanWithDateShift(), deleteItem(), deletePlan(), duplicateItem(), getAuditLog(), getItems() (+40 more)

### Community 5 - "Dashboard e Calendário"
Cohesion: 0.06
Nodes (45): getCurrentUserPlanScope(), CalendarioEmpty(), CalendarioPage(), isFilterKind(), metadata, norm(), accBreakdown(), AreaInfo (+37 more)

### Community 6 - "Importação de Planos"
Cohesion: 0.08
Nodes (47): xlsx, ActionRow, adminClient, DOCS_DIR, main(), parseExcel(), PlanHeader, slugify() (+39 more)

### Community 7 - "Monitoramento e Testes"
Cohesion: 0.08
Nodes (58): processUnsentAlerts, Apify, calculateSeverity, Ciclo obrigatório de implementação e qualidade, Padrões obrigatórios de código, Contratos de qualidade e segurança, Motor correlate, Cypress (+50 more)

### Community 8 - "Dependências do Projeto"
Cohesion: 0.05
Nodes (52): dependencies, class-variance-authority@^0.7.1, clsx@^2.1.1, date-fns@^4.1.0, @dnd-kit/core@^6.3.1, @dnd-kit/sortable@^10.0.0, @dnd-kit/utilities@^3.2.2, dompurify@^3.4.18 (+44 more)

### Community 9 - "Carregamento e Skeletons"
Cohesion: 0.08
Nodes (38): admin/loading.tsx com PageLoading, Auth, desativação de conta e restrição de horário no proxy, Correções concluídas de tabela, formulário, filtros, calendário e sugestão por IA, Filtros Tipo PA e Macro Ação afetando totais do dashboard, SkeletonHeader, SkeletonTable e PageLoading em @/components/ui/loading, Unificação dos modelos de loading, Configuração de redirects em next.config.ts, Redirects permanentes de /plano para /planos (+30 more)

### Community 10 - "Catálogos Administrativos"
Cohesion: 0.11
Nodes (34): toggleAreaActive, togglePrioridadeActive, toggleTipoPAActive, CatalogCard, CatalogosPage(), dictionaries, metadata, registries (+26 more)

### Community 11 - "Documentação e Deploy"
Cohesion: 0.05
Nodes (45): Planos 5W2H — What, Why, Where, Who, When, How Much e How, Restrição de horário de login por usuário, Comentários por item de ação, Admin panel para usuários, tenants e permissões, API Reference — docs/API-REFERENCE.md, Arquitetura — docs/ARQUITETURA.md, Upload de anexos de imagem, PDF e Excel, Autenticação por email e senha com reset e confirmação (+37 more)

### Community 12 - "Administração Supabase"
Cohesion: 0.12
Nodes (39): checkPermission(), createRole(), deleteRole(), getUserAuditLog(), getUserImpact(), updateRole(), getRequesterScope(), log (+31 more)

### Community 13 - "Financeiro e Anexos"
Cohesion: 0.10
Nodes (41): ANEXO_ALLOWED_MIMES, cancelarConta(), createConta(), deleteAnexo(), deleteConta(), estornarPagamento(), getAnexoUrl(), getContaTenantId() (+33 more)

### Community 14 - "Formulários Administrativos"
Cohesion: 0.12
Nodes (29): lookupCnpj(), initialState, PLAN_LABEL, TenantFormDialog(), AreaForm(), CategoriaForm(), FormValues, FornecedoresClient() (+21 more)

### Community 15 - "Gestão de Usuários"
Cohesion: 0.11
Nodes (38): activateUser(), ADMIN_ASSIGNABLE_ROLES, assertCanManageUser(), auditLog(), BUILTIN_ROLES, bulkDeleteUsers(), checkIsAdmin(), createUser() (+30 more)

### Community 16 - "Validação e Formatação"
Cohesion: 0.09
Nodes (29): zod, crud, deleteTipoPA, getTiposPA, upsertTipoPA, metadata, TiposPaPage(), isValidCNPJ() (+21 more)

### Community 17 - "Histórico de Versões"
Cohesion: 0.05
Nodes (40): Comentários por item de ação, Upload de anexos em itens de ação, Remoção de plano meio-órfão no upload em lote, Slug de empresa único, gerado no servidor e imutável, Kanban drag-and-drop com @dnd-kit/core, Mapeamento de vocabulário alternativo de status FAROL, Gráfico de Gantt SVG com zoom mês, trimestre e ano, Permissão plans.update na rota /api/plans/[id]/import (+32 more)

### Community 18 - "Testes de Planos"
Cohesion: 0.10
Nodes (24): vitest, daysBetween(), formatMonthYear(), GanttChart(), getBarColor(), statusColors, Zoom, columns (+16 more)

### Community 19 - "Formulário de Ações"
Cohesion: 0.13
Nodes (30): getAiModelsForPlan(), getItemAuditLog(), RegionalContextFormProps, Field(), ItemFormDialog(), ItemFormDialogProps, Modal(), Msg() (+22 more)

### Community 20 - "Dashboard Executivo"
Cohesion: 0.09
Nodes (31): AreaInfo, BarSeg(), BUCKET_DOT, DashboardActionRow, DashboardClient(), DashboardClientProps, DeadlineItem, DeadlineKind (+23 more)

### Community 21 - "Sanitização e Erros"
Cohesion: 0.14
Nodes (31): updateAreaRegionalContext(), createCatalogCrud(), delete_(), getAll(), requireScopeTenant(), toggleActive(), upsert(), db() (+23 more)

### Community 22 - "Navegação e Tenant"
Cohesion: 0.12
Nodes (22): @supabase/supabase-js, logout(), markAsRead(), NotificationItem, FontControl(), getStoredScale(), Navbar(), handleLogout() (+14 more)

### Community 23 - "Página de Planos"
Cohesion: 0.15
Nodes (24): quickUpdateItemAction(), updatePlan(), init, PlanosPage(), BudgetHealthBar(), BudgetHealthBarProps, buildMacroActionOptions(), collectItemClassificationOptions() (+16 more)

### Community 24 - "Papéis e Permissões"
Cohesion: 0.13
Nodes (26): getRoles(), AdminNav(), allLinks, NavLink, AdminLayout(), checkAdminAccess(), metadata, RolesPage() (+18 more)

### Community 25 - "Benchmarking e Cards"
Cohesion: 0.15
Nodes (28): AuthPage(), renderCard(), planBadge(), CatalogTable(), CursoCard(), CursoFormPanel(), DocenteFormPanel(), getTipoBadgeClass() (+20 more)

### Community 26 - "Cliente Supabase"
Cohesion: 0.11
Nodes (22): next, createPlan(), getCorpoDocente(), getCursosInstituicao(), getCursosSuperiores(), getInstituicaoFullDetail(), getMensalidades(), getModalidades() (+14 more)

### Community 27 - "Contas a Pagar"
Cohesion: 0.11
Nodes (26): getItemBasicsForConta(), Anual(), diasAteVencer(), FinanceiroClient(), MESES, MESES_FULL, PorFornecedor(), PorStatus() (+18 more)

### Community 28 - "Gestão de Escolas"
Cohesion: 0.11
Nodes (20): assignSchoolsSchema, assignSchoolsToUnit(), getSchools(), readForm(), schoolSchema, upsertSchool(), Field(), init (+12 more)

### Community 29 - "Configuração de IA"
Cohesion: 0.13
Nodes (25): RegionalContext, suggest5W2H(), UnitRegionalData, getActiveLlmConfig(), getLlmSettings(), LlmFormState, LlmSettingsPublic, requireSuperAdmin() (+17 more)

### Community 30 - "Tabela de Planos"
Cohesion: 0.12
Nodes (27): ItemContasSummary, EditRow(), itemDepth(), PlanTable(), collect(), flattenVisible(), PlanTableProps, SortHeader() (+19 more)

### Community 31 - "Templates de Email"
Cohesion: 0.09
Nodes (20): {{ .ConfirmationURL }}, {{ .Email }}, Confirmation Email Template, Email Change Template, {{ .NewEmail }}, Invite Email Template, Magic Link Email Template, Password Changed Notification Template (+12 more)

### Community 32 - "Arquitetura Supabase"
Cohesion: 0.09
Nodes (30): Tabela action_items, Tabela action_plans, Fluxo de Request Autenticado, Cache e Revalidação Next.js, Tabela categorias_despesa, Tabela contas_pagar, Arquitetura - PlanoCerto, Tabela fornecedores (+22 more)

### Community 33 - "Ações de Benchmarking"
Cohesion: 0.13
Nodes (25): checkCompetitorWrite(), deleteCorpoDocente(), deleteCursoInstituicao(), deleteInstituicao(), deleteMensalidade(), getInstituicoes(), BenchmarkingPage(), metadata (+17 more)

### Community 34 - "Usuários e Empresas"
Cohesion: 0.12
Nodes (25): AdminFormState, AreaOption, AuditLogEntry, getAllAreas(), getAllUnits(), getUserAreaIds(), getUserUnitIds(), RoleRow (+17 more)

### Community 35 - "Modelo de Dados"
Cohesion: 0.10
Nodes (16): public.action_items, public.action_plans, public.plan_audit_log, public.notification_reads, public.notifications, public.item_comments, public.public_links, public.plan_attachments (+8 more)

### Community 36 - "Migrations e Rollbacks"
Cohesion: 0.09
Nodes (26): Tabela action_items, Migration 004: action_plan_5w2h, Tabela action_plans, Backup como pré-condição de rollback, Rollback Migration 004 — action_plan_5w2h, Grants, Procedimento manual de rollback da migration 004, Políticas RLS (+18 more)

### Community 37 - "Dependências de Desenvolvimento"
Cohesion: 0.07
Nodes (26): devDependencies, husky@^9.1.7, jsdom@^29.1.1, lint-staged@^15.4.3, pino-pretty@^13.1.3, tailwindcss@^4, @tailwindcss/postcss@^4, @testing-library/jest-dom@^6.9.1 (+18 more)

### Community 38 - "Financeiro no Banco"
Cohesion: 0.15
Nodes (23): idx_categorias_despesa_active, idx_categorias_despesa_tenant, idx_conta_attachments_conta, idx_contas_pagar_fornecedor, idx_contas_pagar_item, idx_contas_pagar_plan, idx_contas_pagar_status, idx_contas_pagar_tenant (+15 more)

### Community 39 - "Benchmarking no Banco"
Cohesion: 0.15
Nodes (22): public.tipos_pa, idx_corpo_docente_curso, idx_corpo_docente_nome, idx_cursos_instituicao_curso, idx_cursos_instituicao_inst, idx_cursos_instituicao_tipo_pa, idx_cursos_instituicao_unit, idx_instituicoes_active (+14 more)

### Community 40 - "Simulador Financeiro"
Cohesion: 0.17
Nodes (20): deleteScenario(), getScenarioMetrics(), getScenarios(), metricSchema, scenarioSchema, upsertMetric(), upsertScenario(), ConvCell() (+12 more)

### Community 41 - "Guia do Desenvolvedor"
Cohesion: 0.10
Nodes (24): API de Autenticação Supabase, Revalidação de Cache, Checklist Antes de Commit, Erros Comuns de Desenvolvimento, Referência Rápida do Banco, Debugging Servidor, Browser e Supabase, Deploy Vercel Automático e Manual, Comandos de Desenvolvimento (+16 more)

### Community 42 - "Gestão de Empresas"
Cohesion: 0.15
Nodes (16): assignCompaniesSchema, assignCompaniesToUnit(), companySchema, deleteCompany(), getCompanies(), readForm(), upsertCompany(), CHANCE_BADGES (+8 more)

### Community 43 - "Central de Ajuda"
Cohesion: 0.14
Nodes (20): HelpPage(), QUICK_GUIDE_FEATURES, TOPIC_CARDS, DocContent(), DocSection, DocsViewer(), DocsViewerProps, formatText() (+12 more)

### Community 44 - "FAQ do Usuário"
Cohesion: 0.12
Nodes (22): Conta e Autenticação, Uso de Planos de Ação 5W2H, Administração de Usuários, Papéis e Empresas, Aparência e Tamanho de Fonte, Anexos de Arquivos, Comentários e Menções, Dashboard e KPIs, FAQ Completo - PlanoCerto (+14 more)

### Community 45 - "CRUD de Catálogos"
Cohesion: 0.13
Nodes (17): crud, deleteArea, getAreasAdmin(), log, upsertArea, CatalogCrudConfig, CrudResult, genderArticles (+9 more)

### Community 46 - "Consultas Financeiras"
Cohesion: 0.15
Nodes (17): getCategoriasDespesa(), deriveContaDerived(), getContaById(), getContasDoItem(), getContasPagar(), getResumoContas(), getFornecedores(), CategoriasDespesaPage() (+9 more)

### Community 47 - "Identidade Visual"
Cohesion: 0.15
Nodes (14): AuthError(), AuthErrorProps, AuthLayout(), ErrorPage(), ErrorPageProps, GlobalError(), GlobalErrorProps, NotFoundPage() (+6 more)

### Community 48 - "Escopos de Usuários"
Cohesion: 0.15
Nodes (19): on_auth_user_created, public.handle_new_user(), public.is_admin(), public.profiles, public.has_perm(), public.is_admin(), idx_user_areas_area, idx_user_areas_tenant (+11 more)

### Community 49 - "API e Autenticação"
Cohesion: 0.11
Nodes (21): Operações de Itens de Ação, Operações de Planos de Ação, Operações de Anexos, API de Categorias de Despesa, Operações de Comentários, API de Contas a Pagar, API Reference - PlanoCerto, API de Fornecedores (+13 more)

### Community 50 - "Documentos Legais"
Cohesion: 0.11
Nodes (21): Autoridade Nacional de Proteção de Dados (ANPD), Conformidade CCPA, California Consumer Privacy Act Resource, Checklist de Compliance para Produção, Lei de Defesa do Consumidor, Documentos Legais - PlanoCerto, Perguntas Frequentes Legais, Conformidade GDPR (+13 more)

### Community 51 - "Contexto de Tenant"
Cohesion: 0.18
Nodes (17): getUserTenants(), switchTenant(), dynamic, getSessionData(), ProtectedLayout(), TenantAwareWrapper(), TenantAwareWrapperProps, ToastProvider() (+9 more)

### Community 52 - "Diário Oficial"
Cohesion: 0.15
Nodes (15): do_publications_date_idx, do_publications_search_idx, do_publications_source_idx, do_publications_trgm_idx, public.do_publications, do_entities_document_idx, do_entities_normalized_idx, do_entities_publication_idx (+7 more)

### Community 53 - "Configuração TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 54 - "Catálogo de Prioridades"
Cohesion: 0.13
Nodes (15): crud, deletePrioridade, getPrioridadesAdmin, parsePayload(), upsertPrioridade, metadata, PrioridadesPage(), prioridadeSchema (+7 more)

### Community 55 - "Segurança e RLS"
Cohesion: 0.13
Nodes (17): Documentação Técnica - PlanoCerto, Desenvolvimento Local, Migrations do Banco, Isolamento Multi-tenant, Next.js Documentation, Práticas de Performance Next.js, React 19 Upgrade, Row-Level Security (+9 more)

### Community 56 - "Catálogos no Banco"
Cohesion: 0.17
Nodes (13): public.areas, public.channels, public.macro_acoes, public.units, idx_sim_metrics_scenario, idx_simulator_scenarios_tenant, public.simulator_channel_metrics, public.simulator_scenarios (+5 more)

### Community 57 - "Debug Financeiro"
Cohesion: 0.17
Nodes (15): Usuário Não Autenticado, Checklist de Debug Financeiro, supabase db push, Debugando Erro getContasPagar, Foreign Key ou Referência Quebrada, Erro getContasPagar Supabase vazio, Logs Melhorados de contas-pagar.ts, Migrations Ausentes (+7 more)

### Community 58 - "Plataforma e RBAC"
Cohesion: 0.13
Nodes (16): Metodologia 5W2H, Gestão de Planos 5W2H, Dashboard Executivo, Notificações e Integrações, Next.js App Router 16.2.4, Catálogo de Permissões Granulares, Plataforma SaaS PlanoCerto, Sistema RBAC (+8 more)

### Community 59 - "Scripts do Projeto"
Cohesion: 0.13
Nodes (15): scripts, build, dev, lint, prepare, start, test, test:coverage (+7 more)

### Community 60 - "Ações de Catálogo"
Cohesion: 0.21
Nodes (11): getAreas(), getChannels(), getMacroAcoes(), getPrioridades(), getUnits(), EmpresasPage(), metadata, EscolasPage() (+3 more)

### Community 61 - "Formulários de Instituições"
Cohesion: 0.24
Nodes (12): getInstituicao(), upsertInstituicao(), getUnitsAdmin(), EditarInstituicaoPage(), generateMetadata(), Props, generateMetadata(), InstituicaoDetailPage() (+4 more)

### Community 62 - "Macro Ações"
Cohesion: 0.22
Nodes (12): crud, deleteMacroAcao, getMacroAcoesAdmin, toggleMacroAcaoActive, upsertMacroAcao, MacroAcoesPage(), metadata, FormValues (+4 more)

### Community 63 - "Formulário de Plano"
Cohesion: 0.32
Nodes (12): getTemplates(), FieldV(), Modal(), Msg(), PlanFormDialog(), buildOfficialPlanHeader(), getPlanFormProgress(), normalizePlanFormValue() (+4 more)

### Community 64 - "Seleção de Período"
Cohesion: 0.19
Nodes (10): DateRangePicker(), applyPreset(), commit(), openPanel(), DateRangePickerProps, MONTH_NAMES, parseIso(), Preset() (+2 more)

### Community 65 - "Validação e Sanitização"
Cohesion: 0.17
Nodes (10): CategoriaDespesaFormValues, categoriaDespesaSchema, ContaPagarFormValues, contaPagarSchema, PagamentoFormValues, pagamentoSchema, parcelaInputSchema, sanitizeCNPJ() (+2 more)

### Community 66 - "Benchmarking de Concorrentes"
Cohesion: 0.23
Nodes (13): Tipos TypeScript de Competidores, Tabela corpo_docente, Tabela cursos_instituicao, Catálogo cursos_superiores, Benchmarking de Concorrentes — Estrutura de Dados, Herança RLS do Benchmarking, Tabela instituicoes, Tabela mensalidades_concorrentes (+5 more)

### Community 67 - "Manual do Usuário"
Cohesion: 0.18
Nodes (13): Metodologia 5W2H, Administração de usuários e papéis Viewer, User, Manager, Admin e Super Admin, Dashboard com KPIs, status e próximos prazos, Manual do Usuário — PlanoCerto Versão 1.0, Exportação de planos para Excel e PDF, Login, primeiro acesso e seletor de tenants, Criação de planos e itens de ação 5W2H, Perfil, preferências e integração Google Calendar (+5 more)

### Community 68 - "Ações Rápidas"
Cohesion: 0.19
Nodes (8): @testing-library/react@^16.3.2, @testing-library/react, CopyPlanButtonProps, PlanQuickActions(), Props, {
  clonePlanWithDateShiftMock,
  copyPlanMock,
  getUserTenantsMock,
}, plan, ActionPlan

### Community 69 - "Gráficos do Dashboard"
Cohesion: 0.26
Nodes (11): DistributionCard(), LegendRow(), MiniStat(), SegData, VIEW_OPTIONS, ViewMode, BarChart(), DonutChart() (+3 more)

### Community 70 - "Plano de Implementação"
Cohesion: 0.30
Nodes (11): Plano de Implementação — PlanoCerto v2, Tratamento de erro padronizado em server actions, Fase 1 — Correções críticas, Fase 2 — Segurança, dados e UX crítica, Fase 3 — Qualidade e performance, Fase 4 — Funcionalidades ausentes, Fase 5 — Novas funcionalidades e API REST v1, Revisão pós-fase com lint, typecheck, testes, build e smoke test (+3 more)

### Community 71 - "Layout e Tema"
Cohesion: 0.21
Nodes (8): next-themes@^0.4.6, next-themes, manrope, metadata, outfit, RootLayout(), Footer(), APP_VERSION

### Community 72 - "Duplicação de Ações"
Cohesion: 0.35
Nodes (9): buildDuplicatedRows(), collectSubtree(), walk(), collectSubtreeIds(), DuplicableItem, DuplicatedItemRow, nextSiblingNumber(), remapCopiedNumber() (+1 more)

### Community 73 - "Modal de Ajuda"
Cohesion: 0.30
Nodes (9): DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle, FAQ_ITEMS, FAQItem (+1 more)

### Community 74 - "Membros de Tenants"
Cohesion: 0.26
Nodes (8): public.tenant_members, public.tenants, idx_tenants_cnpj_unique, idx_tenant_member_roles_tenant, idx_tenant_member_roles_user, public.tenant_member_roles, public.validate_tenant_member_role(), validate_tenant_member_role_trg

### Community 75 - "Revisão Financeira"
Cohesion: 0.22
Nodes (11): Fluxos de contas a pagar, fornecedores e categorias, Modelo contas_pagar, parcelas_pagar e tabelas de suporte, Revisão Detalhada do Módulo Financeiro — Versão 2.0, Módulo financeiro de contas a pagar, Fluxo registrarPagamento e atualização de status, Checklist de QA funcional, segurança, performance e edge cases, Roadmap de auditoria, alertas, exportação e integração bancária, Permissões financeiras, RLS e sanitização de busca (+3 more)

### Community 76 - "Melhorias de Planos"
Cohesion: 0.20
Nodes (11): Sugestor 5W2H com OpenRouter e Claude-Haiku, Clonagem inteligente clonePlanWithDateShift, Componentização de /planos e filtros na URL, Histórico contextual no ItemFormDialog, Plano de Melhorias no Módulo de Planos de Ação — Versão 1.0, Exportação executiva PDF One-Pager, Schema de governança action_plans e action_items, Vínculo de ações com KPIs do Dashboard (+3 more)

### Community 77 - "Política de Privacidade"
Cohesion: 0.22
Nodes (11): Notificação de violação de segurança e ANPD, Cookies, analytics e controles de rastreamento, Coleta de dados pessoais, de uso, técnicos e de terceiros, Compartilhamento com organização, processadores e autoridades, Política de Privacidade — PlanoCerto Versão 1.0, Transferência internacional de dados e cláusulas contratuais, Finalidades e bases legais de tratamento sob LGPD, Direitos LGPD de acesso, correção, exclusão, portabilidade e oposição (+3 more)

### Community 78 - "Termos de Uso"
Cohesion: 0.20
Nodes (11): Uso aceitável e monitoramento de violações, Criação, responsabilidades e desativação de contas, Cancelamento pelo usuário ou pela Empresa, Confidencialidade, segurança, LGPD e backups, Termos de Uso — PlanoCerto Versão 1.0, Integrações com Google Calendar, Microsoft Teams, Supabase e Resend, Propriedade intelectual e direitos sobre dados do usuário, Jurisdição e disposições gerais no Brasil e São Paulo (+3 more)

### Community 79 - "Filtros de URL"
Cohesion: 0.25
Nodes (9): ITEM_FILTER_KEYS, oneOf(), Params, parseIntParam(), PLAN_FILTER_KEYS, usePlanosUrlParams(), h, realReplaceState (+1 more)

### Community 80 - "Anexos de Ações"
Cohesion: 0.42
Nodes (8): ALLOWED_MIMES, deleteAttachment(), getAttachments(), getAttachmentUrl(), uploadAttachment(), AttachmentSection(), formatSize(), isImage()

### Community 81 - "Detalhes de Benchmarking"
Cohesion: 0.29
Nodes (7): columns, DetailRow, DetailTable(), Insight(), ProgressBar(), SortKey, UnitRow()

### Community 82 - "Validação Administrativa"
Cohesion: 0.24
Nodes (8): ALLOWED_BUILTIN_ROLES, createUserSchema, CreateUserValues, permissionsSchema, sanitizePermissions(), updateUserSchema, UpdateUserValues, userName

### Community 83 - "Papéis no Banco"
Cohesion: 0.22
Nodes (6): public.roles, public.validate_profile_role(), validate_profile_role_trg, public.is_valid_role_name(), public.effective_role_for_tenant(), public.has_perm_for_tenant()

### Community 84 - "Continuidade de Planos"
Cohesion: 0.28
Nodes (8): Clonagem clonePlanWithDateShift e targetTenantId, Diagnóstico do estado atual do módulo /planos, Plano de Continuidade da Implementação do Módulo de Planos — Versão 1.0, Governança com exercicio, budget_limit e visibility, Evidência obrigatória para itens de prioridade alta, Inconsistência de persistência em updatePlan, Consolidação antes de expansão em cinco fases, Vínculo forte de action_plans com units por unit_id

### Community 85 - "Correções e IA"
Cohesion: 0.28
Nodes (8): Correção do bloqueador de build em módulos use server, Pipeline de IA DOU ingest, extract, correlate e alerts, Plano de Correção — PlanoCerto, Cobertura de testes do frontend e thresholds, Migrations 049 e 050 e repair do histórico Supabase, Idempotência e governança de custo do pipeline de IA, Ciclo de correção risco primeiro com critérios de saída, Hardening de segurança, tenant, XSS, rate limit e timezone

### Community 86 - "Layout de Planos"
Cohesion: 0.28
Nodes (8): Header compacto de plano, Stats Bar compacta, Tabela compacta com detalhes expansíveis, Escala consistente de tipografia, gaps e padding, Revisão de Layout — Página de Planos Versão 2.0, Filtros em card dedicado, Card View para mobile, Responsividade e hierarquia visual existentes

### Community 87 - "Convenções de Migrations"
Cohesion: 0.22
Nodes (9): Transação automática do Supabase, Documentação obrigatória de rollback destrutivo, Convenções de Migrations, DDL idempotente, Documentação inline do schema, Nomenclatura sequencial de migrations, Recriação segura de políticas RLS, Separação de seed data das migrations (+1 more)

### Community 88 - "Configuração de Build"
Cohesion: 0.25
Nodes (4): nextConfig, projectRoot, @vitejs/plugin-react@^6.0.1, @vitejs/plugin-react

### Community 89 - "Filtros de Planos"
Cohesion: 0.43
Nodes (5): FilterSelect(), IconFilterSelect(), PlanFilters(), PlanFiltersProps, useDebounce()

### Community 90 - "Auditoria e Templates"
Cohesion: 0.36
Nodes (6): public.plan_template_items, public.plan_templates, idx_admin_audit_log_admin_id, idx_admin_audit_log_created_at, idx_admin_audit_log_target_user_id, public.admin_audit_log

### Community 91 - "Modelos de Domínio"
Cohesion: 0.38
Nodes (7): Modelo action_items, Modelo action_plans, Modelo contas_pagar, Módulo Financeiro, Modelo parcelas_pagar, Modelo profiles, Modelo tenants

### Community 92 - "Documentação no Frontend"
Cohesion: 0.38
Nodes (7): Deploy da documentação em GitHub Pages, Vercel ou Next.js, Navegação de ajuda na Navbar e Sidebar Admin, DocsSearch, Renderização dinâmica de documentos Markdown e MDX, Integrar Documentação no Frontend, HelpModal e FAQ pesquisável, Página de Help /help

### Community 93 - "Base de Conhecimento"
Cohesion: 0.48
Nodes (7): Gestão administrativa de contexto regional e documentos, Base de Conhecimento IA e Inteligência Regional — Versão 2.1, Base de conhecimento proprietária knowledge_base, Contexto Local de Execução no prompt do Claude, Busca semântica RAG com pgvector, regional_context JSONB em units e areas, Motor de sugestão contextual suggest5W2H

### Community 94 - "RAG no PostgreSQL"
Cohesion: 0.38
Nodes (4): knowledge_base_embedding_idx, public.knowledge_base, idx_knowledge_base_area, idx_knowledge_base_unit

### Community 95 - "Configuração ESLint"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@^16.4.6, eslint, eslint-config-next

### Community 97 - "Empresas no Banco"
Cohesion: 0.60
Nodes (5): idx_companies_cnpj, idx_companies_nome, idx_companies_tenant, idx_companies_unit, public.companies

### Community 98 - "Ícone de Janela"
Cohesion: 0.40
Nodes (5): Browser Window Chrome, Three Window Control Dots, Window Icon, Monochrome SVG Icon Design, Rounded Window Frame

### Community 99 - "Escolas no Banco"
Cohesion: 0.70
Nodes (4): idx_schools_nome, idx_schools_tenant, idx_schools_unit, public.schools

### Community 100 - "Logo Next.js"
Cohesion: 0.67
Nodes (4): Next.js Logo, Next.js, NEXT.JS Wordmark, SVG Vector Format

### Community 101 - "Fornecedores no Banco"
Cohesion: 0.83
Nodes (3): idx_fornecedores_active, idx_fornecedores_tenant, public.fornecedores

### Community 102 - "Regras para Agentes"
Cohesion: 0.67
Nodes (3): Regras para agentes sobre a versão do Next.js, Documentação local do Next.js em node_modules/next/dist/docs, Referência @AGENTS.md

### Community 103 - "Ícone de Globo"
Cohesion: 0.67
Nodes (3): Circular Globe Outline, Globe Icon, Latitude and Longitude Grid

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
- **252 isolated node(s):** `Documentação local do Next.js em node_modules/next/dist/docs`, `Referência @AGENTS.md`, `Keep a Changelog 1.1.0`, `Migração de produção para VPS com Caddy, systemd, Cloudflare e Supabase self-hosted`, `Domínio planocerto.app para aplicação e Auth` (+247 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 803 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Tabela de Planos` to `Autenticação e Interface`, `Componentes de Interface`, `Financeiro e React`, `Dashboard e Calendário`, `Importação de Planos`, `Carregamento e Skeletons`, `Catálogos Administrativos`, `Formulários Administrativos`, `Testes de Planos`, `Formulário de Ações`, `Dashboard Executivo`, `Navegação e Tenant`, `Página de Planos`, `Papéis e Permissões`, `Benchmarking e Cards`, `Contas a Pagar`, `Gestão de Escolas`, `Usuários e Empresas`, `Simulador Financeiro`, `Central de Ajuda`, `Identidade Visual`, `Contexto de Tenant`, `Formulário de Plano`, `Seleção de Período`, `Gráficos do Dashboard`, `Modal de Ajuda`, `Detalhes de Benchmarking`, `Filtros de Planos`, `Seleção Múltipla`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `createClient()` (e.g. with `action-plan-ai.test.ts` and `action-plan-phase3.test.ts`) actually correct?**
  _`createClient()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Documentação local do Next.js em node_modules/next/dist/docs`, `Referência @AGENTS.md`, `Keep a Changelog 1.1.0` to the rest of the system?**
  _252 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Autenticação e Interface` be split into smaller, more focused modules?**
  _Cohesion score 0.054706163401815576 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Cliente Supabase` to `Autenticação e Interface`, `Componentes de Interface`, `Dados e Compartilhamento`, `Financeiro e React`, `Planos e Permissões`, `Dashboard e Calendário`, `Importação de Planos`, `Dependências do Projeto`, `Catálogos Administrativos`, `Administração Supabase`, `Financeiro e Anexos`, `Formulários Administrativos`, `Gestão de Usuários`, `Dashboard Executivo`, `Sanitização e Erros`, `Navegação e Tenant`, `Página de Planos`, `Papéis e Permissões`, `Benchmarking e Cards`, `Contas a Pagar`, `Gestão de Escolas`, `Configuração de IA`, `Tabela de Planos`, `Ações de Benchmarking`, `Usuários e Empresas`, `Simulador Financeiro`, `Gestão de Empresas`, `CRUD de Catálogos`, `Consultas Financeiras`, `Identidade Visual`, `Contexto de Tenant`, `Formulários de Instituições`, `Macro Ações`, `Formulário de Plano`, `Layout e Tema`, `Filtros de URL`, `Anexos de Ações`, `Detalhes de Benchmarking`, `Configuração de Build`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Erro getContasPagar Supabase vazio` and `Usuário Não Autenticado`?**
  _Edge tagged AMBIGUOUS (relation: possible_cause_of) - confidence is low._
- **What is the exact relationship between `Erro getContasPagar Supabase vazio` and `Foreign Key ou Referência Quebrada`?**
  _Edge tagged AMBIGUOUS (relation: possible_cause_of) - confidence is low._