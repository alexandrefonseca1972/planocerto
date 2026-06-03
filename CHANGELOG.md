# Changelog

Todas as mudanças notáveis do PlanoCerto são documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o
projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/)
(`MAJOR.MINOR.PATCH`). A versão de referência é a do `package.json`.

## Como versionar

1. Durante o desenvolvimento, registre as mudanças sob `## [Não lançado]`.
2. Ao fechar uma versão, bumpe o `package.json` (sem criar tag/commit):
   `npm run version:patch` · `version:minor` · `version:major`.
3. Mova as entradas de `[Não lançado]` para uma seção `## [x.y.z] - AAAA-MM-DD`.
4. Commit + PR. Após o merge na `main`, crie a tag anotada:
   `git tag -a vX.Y.Z -m "vX.Y.Z" && git push origin vX.Y.Z`.

Categorias usadas: **Adicionado**, **Alterado**, **Corrigido**, **Removido**,
**Segurança**, **Performance**, **Depreciado**.

## [Não lançado]

## [2.2.0] - 2026-06-03

Modelo de acesso multi-tenant, limites por empresa e painel global do super
admin (PRs #12–#18).

### Adicionado
- **Painel do super admin** em `/admin/painel`: KPIs globais (empresas,
  usuários, planos de ação, unidades) e tabela de todas as empresas com plano,
  status, nº de membros e unidades usadas/limite. Aba visível apenas para
  super_admin (#17).
- **Atalhos do painel** com deep-link: "Gerenciar" abre o gerenciador de
  membros da empresa (`?manage=<id>`) e "Nova empresa" abre o diálogo de
  criação (`?new=1`) (#18).
- **Limite de unidades por empresa** (`tenants.max_units`, migration 056):
  o cadastro de unidade bloqueia ao atingir o limite e a tela mostra
  "usadas/limite". `NULL` = ilimitado (#16).

### Alterado
- **Admin escopado por empresa**: o `admin` passa a ver e gerenciar apenas os
  usuários das empresas que o super_admin lhe atribuir (via `tenant_members`),
  sem enxergar super_admins nem usuários de outras empresas (#15).
- **Criação de empresas restrita ao super_admin** (criação/edição de tenants),
  preparando a fase-2 de onboarding/venda online (#16).
- Placeholder e descrição do campo **Nome** da empresa sem nomes de marca (#13).

### Corrigido
- **Rodapé consolidado**: versão exibida em um único `Footer` global, sem
  duplicação entre páginas protegidas (#12).
- Diálogos/alertas de empresa agora **fecham após criar, editar ou excluir**
  (antes permitiam recriação em loop) (#14).
- Painel registra `log.warn` quando uma query de agregação de KPI falha, em vez
  de zerar os números silenciosamente (#18).

### Segurança
- `ROLES_MANAGE` restrito ao super_admin e **teto de atribuição de papéis**: o
  admin não cria super_admins nem escala privilégios além do próprio escopo
  (#15).

## [2.1.0] - 2026-06-03

Migração para o banco de produção novo e consolidação dos PRs #1–#10.

### Adicionado
- Campos **Diretor/Reitor**, **Email** e **Fone** no catálogo de unidades (#4).
- **Validação em tempo real** e melhorias de UX no formulário de unidade
  (FormDialog + máscara de telefone + e-mail normalizado) (#5).
- **Associação em massa** de escolas e empresas a uma unidade — seleção
  múltipla, filtro e coluna de unidade nas listas (#7, #8).
- **Slug de empresa gerado automaticamente** e único no servidor, eliminando o
  erro de duplicidade (#10).

### Alterado
- `database.types.ts` reconciliado com o schema das migrations; colunas
  `profiles.phone`/`profiles.social_media` e `units.responsavel/email/fone`
  adicionadas (migrations 053 e 055).
- Slug de empresa passou a ser imutável após a criação (URLs estáveis).

### Segurança
- **Sanitização robusta de inputs** (DOMPurify) centralizada nos schemas zod,
  cobrindo todo texto livre e fechando lacunas sem validação (notificações,
  papéis) (#2).
- Chaves Supabase migradas para o formato novo (publishable/secret) e RLS
  habilitada em `knowledge_base` (migration 051).

### Corrigido
- Fluxo de **import de planos** unificado entre as duas rotas: vínculo
  pai↔filho robusto, numeração hierárquica consistente e validação server-side
  (headers/tamanho/extensão) no import single-plan (#6).
- Warning "useActionState called outside of a transition" corrigido
  centralmente no `FormDialog` (#9).

### Removido
- Integração **Diário Oficial** (monitor/INLABS) — código e schema (migration 052) (#1).
- Integração **Google Calendar** (código morto) — código e schema (migration 054) (#1).

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
