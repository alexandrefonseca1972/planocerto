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

### ~~6. Seleção de cidades~~ ✓ Resolvido (falta conferir no navegador) — seleção espelhada em `?units=`; recarregar ou abrir por link mantém as cidades. Entrar pelo menu segue começando sem cidade
- Recarregar `/planos` (ou abrir por link) perde a seleção de cidades. Não verificado se a seleção passa de Planos para o Dashboard pelo menu.

### 7. Atualizações de dependências (sem advisory)
- ~~Rápidas: react 19.3.1, @supabase/supabase-js 2.119.2, radix, tailwind 4.3.5.~~ ✓ Feito (mais lucide-react, react-hook-form, tailwind-merge, tipos)
- Avaliar: isomorphic-dompurify 3.x (sanitização), @supabase/ssr 0.12 (auth/cookies).
- Podem esperar: typescript 7, vitest 5, eslint 10, pino 10, @hookform/resolvers 7.
