# Pendências — PlanoCerto

## Concluído (esta sessão)

- [x] Expandir/Recolher tudo na tabela do plano
- [x] Erro "Verifique os campos" ao salvar plano (campos `exercicio` e `budget_limit`)
- [x] Ícones nos filtros Tipo PA e Macro Ação no dashboard
- [x] Duplicidade visual no calendário (exibia `tenant` em vez de `planTitle`)
- [x] Filtro de unidade unificado: dashboard → Planos → Calendário via `TenantContext`
- [x] Dropdown Tipo PA / Macro Ação dinâmico (só mostra opções da unidade selecionada)
- [x] Botão "SUGERIR COM IA" inativo com badge "Em breve"
- [x] Filtros Tipo PA / Macro Ação agora afetam os totais do dashboard (breakdown por ação)

---

## Pendente

### ~~1. Unificação dos modelos de loading~~ ✓ Resolvido

- `benchmarking/loading.tsx` — migrado para `SkeletonHeader + SkeletonTable` de `@/components/ui/loading`
- `planos/page.tsx` — `if (loading)` alinhado com `planos/loading.tsx` (`SkeletonHeader + SkeletonTable`)
- Nota: `admin/loading.tsx` usa `PageLoading` (spinner) intencionalmente

### ~~2. `middleware.ts`~~ Não era pendência

`src/proxy.ts` já é reconhecido pelo Next.js como middleware — a lógica de auth, desativação de conta e restrição de horário já estava ativa. O `middleware.ts` criado gerava conflito e foi removido.

### ~~3. Rota `/plano` não existe~~ ✓ Resolvido

Adicionado redirect permanente (301) em `next.config.ts`:
- `/plano` → `/planos`
- `/plano/:path*` → `/planos/:path*`

---

## Concluído — 20/11/2026 (PRs #42 a #50)

- [x] Contagem só de ações na tabela de vários planos; cidades mantidas ao recarregar (`?units=`)
- [x] Dependências: react 19.3.1, supabase-js, radix, tailwind; @supabase/ssr 0.12.7; isomorphic-dompurify 4.7.0
- [x] Segurança: XSS armazenado na impressão do plano e nos emails (`escapeHtml` + CSP)
- [x] Relatório executivo do plano (menu Ações): farol, bloqueios, saúde financeira, próximos vencimentos
- [x] Celular: sem rolagem lateral em Planos, form de ação, Dashboard e Financeiro
- [x] Segurança: escopo de empresa na gestão de usuários (tomada de conta entre empresas, listagem entre empresas, autoescalada de permissões, open redirect, reset de senha)
- [x] `docs/PLANO-CORRECAO.md`, `PLANO-MELHORIAS-PLANOS.md` (11 de 12; 4.2 descartado) e `REVISAO-LAYOUT-PLANOS.md` revisados

## Concluído — v2.8.0 (19/11/2026)

- [x] Agrupamento macro ação → cidade na tabela de vários planos; filtro de macro só com ações dentro da macro
- [x] Macro ação padronizada (caixa alta, ≤ 40 caracteres, sem duplicidade) + migration 084 (fusão de grupos duplicados)
- [x] Bloqueio de plano ativo duplicado (mesmo título, unidade e exercício)
- [x] Telas atualizam sem recarregar (efeitos pós-gravação) e ao voltar para a aba
- [x] Consultas otimizadas (lote + paginação), RLS por conjunto (086), resumo financeiro em SQL (086b), sininho fora da fila (087), índices (085)
- [x] IA: API key protegida e cifrada; limites de custo e permissão na sugestão
- [x] E-mail pelo Cloudflare Email Service (só envio)
- [x] Medidor do dashboard, botões/links redundantes, X no e-mail do login, revisão de português
- [x] `scripts/deploy.sh` com atualização automática do grafo (graphify)

## Pendente

### ~~4. Dependência `xlsx` com vulnerabilidade alta (ReDoS / prototype pollution)~~ ✓ Resolvido — SheetJS 0.20.3 do CDN oficial; `npm audit` sem vulnerabilidades
- `xlsx@0.18.5` do npm não recebe correções; o ReDoS é explorável no upload de Excel do servidor (`/api/plans/[id]/import`, `/api/plans/upload-batch`).
- Correção: `"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"` (mesma API) + teste de importação com .xlsx/.xls/.xlsb.

### ~~5. Contagem "N de 4182" na tabela de vários planos~~ ✓ Resolvido — topo usa `countActions`: com vários planos, macros (cabeçalhos) não contam
- O contador do topo soma ações + linhas de macro (ex.: "22 de 4182" com 14 ações); o rodapé mostra 14. Alinhar para contar só ações.

### ~~6. Seleção de cidades~~ ✓ Resolvido — seleção espelhada em `?units=`; recarregar ou abrir por link mantém as cidades. Entrar pelo menu segue começando sem cidade. Testado: a seleção passa de Planos para o Dashboard pelo menu
- Recarregar `/planos` (ou abrir por link) perde a seleção de cidades. Não verificado se a seleção passa de Planos para o Dashboard pelo menu.

### 7. Atualizações de dependências (sem advisory)
- ~~Rápidas: react 19.3.1, @supabase/supabase-js 2.119.2, radix, tailwind 4.3.5.~~ ✓ Feito (mais lucide-react, react-hook-form, tailwind-merge, tipos)
- ~~Avaliar: isomorphic-dompurify 3.x (sanitização), @supabase/ssr 0.12 (auth/cookies).~~ ✓ Feito — ssr 0.12.7 sem mudanças incompatíveis (só correções de cookie); isomorphic-dompurify 4.7.0 fixo (a 3.23 foi marcada obsoleta pelo mantenedor: subiu o Node mínimo sem versão maior; a 4.x é o mesmo código). Exige Node ≥ 22.22.2 (VPS: 22.23.4; Mac local 22.19 só avisa)
- Podem esperar (versão maior, exigem migração): typescript 7, vitest 5, eslint 10, pino 10, @hookform/resolvers 7, @testing-library/jest-dom 8, lint-staged 16, p-retry 9.
- `isomorphic-dompurify` está fixo em 4.7.0: atualizar manualmente (o `^` não é usado de propósito).

### 8. Convite com aceite ao incluir usuário em empresa
- `addTenantMember` (`src/app/actions/tenant.ts`) inclui qualquer usuário existente pelo email, sem aceite dele. Desde o PR #50 isso não permite mais tomar a conta (quem está em empresa fora do escopo só é gerenciado pelo super admin), mas o nome/email da pessoa passa a aparecer na outra empresa.
- Proposta: convite por email; a pessoa só entra na empresa se aceitar. Mudança de produto (tabela de convites, email, tela de aceite).

### 9. Revisar logs de acesso das falhas corrigidas no PR #50
- Antes do PR #50, qualquer usuário logado podia listar membros (nome/email) de todas as empresas (`getTenantMembers`, `getAllUnits`, `getAllAreas`...), e gerente/admin podia trocar senha de usuário de outra empresa ou conceder a si permissões.
- Conferido em produção: sem login a listagem não funcionava (o Next só executa a action em páginas protegidas).
- Verificar nos logs da VPS e no `audit_log` (`reset_password_temp`, mudanças de permissão) se alguém usou essas falhas até 20/11/2026.

### 10. Testes de tela e divisão dos arquivos grandes
- `users-table.tsx` (~1.900 linhas), `dashboard-client.tsx` (~1.700) e `admin.ts` (~1.100). Ver `docs/PLANO-CORRECAO.md`, Fase 4.
- Pré-requisito: testes de interface desses componentes. Depois, dividir em PRs pequenos.
