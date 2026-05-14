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

`src/proxy.ts` já é reconhecido pelo Next.js/Vercel como middleware — a lógica de auth, desativação de conta e restrição de horário já estava ativa. O `middleware.ts` criado gerava conflito e foi removido.

### ~~3. Rota `/plano` não existe~~ ✓ Resolvido

Adicionado redirect permanente (301) em `next.config.ts`:
- `/plano` → `/planos`
- `/plano/:path*` → `/planos/:path*`
