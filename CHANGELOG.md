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

### Adicionado
- **Geolocalização na Carteira de Escolas (MVP "Cadastro de Locais" — Auvo)**:
  novos campos latitude/longitude (coordenadas manuais) no cadastro de escolas
  (migration 065, nullable), com validação de faixa no schema e link "Ver no
  mapa" na lista (Google Maps por coordenadas ou, na ausência, pelo endereço).
  Helper puro `src/lib/geo.ts` (buildMapsUrl/validações) testado. Geocoding
  automático e replicação para Empresas ficam para os próximos ciclos.
- **Testes E2E com Playwright (Fase 4d)**: suíte versionada em `e2e/` cobrindo os
  fluxos críticos — headers de segurança, redirect de rota protegida, render do
  login, erro de credenciais inválidas, login real + cookie HttpOnly, dashboard
  sem violações de CSP, menu arquivar/reativar de planos e não-estouro no mobile.
  Roda com `npm run test:e2e` (sobe o dev server automaticamente). Os fluxos
  autenticados usam `E2E_EMAIL`/`E2E_PASSWORD` (nunca commitados) e são pulados
  se ausentes — a suíte roda em qualquer máquina sem vazar segredos.

### Alterado
- **Responsividade do admin em mobile (Fase 4c)**: a barra de navegação do admin
  (Painel/Usuários/Empresas/…) agora rola horizontalmente em telas estreitas em
  vez de forçar a largura da página inteira — todas as telas admin deixam de
  estourar no mobile (overflow caiu de ~393px para o baseline ~44px num viewport
  de 375px). As tabelas densas (usuários, catálogos) rolam dentro do próprio card.
- **Máscara e validação inline de CNPJ no cadastro de instituição** (Fase 4b,
  benchmarking): o campo CNPJ passa a ter máscara progressiva
  (00.000.000/0000-00) e aviso inline quando inválido — alinhando-se aos demais
  forms (fornecedores, unidades, empresas, perfil) que já tinham máscaras e
  validação em tempo real.
- **UX do dashboard (Fase 4a, itens da auditoria 2026-06-22)**: saudação agora é
  pessoal ("Boa noite, <nome>"); o widget de Prazos agrupa ações idênticas
  (mesmo título/data/unidade) numa entrada com contador `×N` em vez de repetir a
  mesma linha; cards de KPI zerados ganham CTA "Registrar nos planos →". Helper
  `groupDeadlines` extraído e testado.

### Adicionado
- **Arquivar/Reativar plano em um clique** (Fase 3 do roadmap): novo item no menu
  "Ações" do plano (`plan-quick-actions.tsx`) que alterna a situação sem abrir o
  formulário completo, via a action `setPlanStatus` (PLANS_UPDATE, escopo de
  tenant explícito e audit log). A lista recarrega no cliente refletindo a nova
  situação. Os filtros Ativos/Arquivados e o histórico por item já existiam.
- **RAG na sugestão de IA 5W2H** (Fase 2 do roadmap): o `suggest5W2H` agora
  recupera trechos relevantes da base de conhecimento do tenant (pgvector +
  `match_knowledge`, migration 045b) e os injeta no prompt, além do contexto
  regional. Novo `callEmbeddings` (`src/lib/llm-client.ts`), helpers em
  `src/lib/knowledge-base.ts` e a action `addKnowledge` para ingestão de
  documentos (segmentável por unidade/área). Embeddings via config única de app
  (`EMBEDDINGS_API_KEY`/`BASE_URL`/`MODEL`, default OpenAI text-embedding-3-small
  = 1536 dims) — consistência exigida pelo match. **Fail-safe**: sem a chave, o
  RAG fica desativado e a sugestão segue só com o contexto regional.

### Segurança
- **Cookies de autenticação `HttpOnly`/`SameSite`/`Secure`** (Fase 1 do roadmap):
  o token `sb-*-auth-token` deixa de ser legível por `document.cookie` (mitiga
  roubo de sessão via XSS). Centralizado em `hardenCookieOptions`
  (`src/lib/supabase/cookie-options.ts`) e aplicado no client de servidor e no
  middleware. Seguro porque todo acesso ao Supabase é server-side.
- **Anti-IDOR explícito em `getContaById`**: filtro por `tenant_id` do tenant
  ativo (fail-closed), alinhado a `getContasPagar` — defesa em profundidade
  além do RLS.

### Corrigido
- **Resiliência a 503/timeouts intermitentes do Supabase**: novo helper
  `withRetry` com backoff exponencial e `isRetryable` ampliado (erros em formato
  de objeto do PostgREST). Aplicado ao `auth.getUser()` do middleware para
  evitar logout/erro 503 espúrios em falhas transitórias.
- **Suíte de testes voltou a 100% verde**: o mock de `sanitizedString` retornava
  `undefined` e derrubava o load de schemas em 2 arquivos de teste.

## [2.2.1] - 2026-06-03

Correções de produção: empresa ativa na importação de planos, sanitização sem
jsdom no servidor e revisão do fluxo de upload (PRs #21–#22).

### Corrigido
- **"Nenhuma empresa ativa" na importação de planos** mesmo com empresa ativa
  visível na UI: `createUser` agora define `active_tenant_id` na criação,
  `getCurrentTenantId` tem fallback para o primeiro tenant visível (alinhado
  com o layout) e o `upload-batch` usa `getCurrentTenant()` (#22).
- **FAROL com vocabulário alternativo** de planilhas de clientes — `A INICIAR`,
  `ATRASADO`, `CONCLUÍDO NO PRAZO` — agora mapeado para os status corretos,
  em vez de cair em "Não Iniciada" com avisos em massa (#22).
- **Plano meio-órfão no upload em lote**: quando só os grupos eram criados e
  todos os itens falhavam, o plano ficava no banco e "Tentar novamente"
  duplicava; agora é removido (#22).
- Diálogo de upload avisa quando arquivos acima do limite de 10 são
  descartados (o aviso nunca disparava) e o botão diz "arquivo(s)" no modo de
  importação para plano existente (#22).
- **500 no login em produção**: sanitização de inputs não usa mais jsdom no
  servidor (isomorphic-dompurify), cujos `require()` dinâmicos quebravam sob
  Turbopack em função serverless (#21).

### Segurança
- `/api/plans/[id]/import` agora exige a permissão `plans.update` — antes
  qualquer membro do tenant (inclusive Visualizador) conseguia inserir itens
  via chamada direta à API (#22).

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
