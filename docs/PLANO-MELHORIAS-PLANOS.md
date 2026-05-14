# Plano de Implementação: Melhorias no Módulo de Planos de Ação
> Versão 1.0 — Maio 2026

Este documento detalha o roteiro para a evolução do módulo de Planos de Ação (`/planos`), focando em robustez de dados, governança, inteligência artificial e integração estratégica.

---

## FASE 1: Refatoração e Estabilização (Dívida Técnica)
**Objetivo:** Facilitar a manutenção e melhorar a performance da página principal de planos.

- [ ] **1.1 Componentização da `page.tsx`:** 
    - Extrair `PlanTable`, `PlanFilters`, `StatCards` e `ActionRow` para arquivos separados em `src/components/planos/`.
    - Centralizar tipos compartilhados em `src/types/action-plan.ts`.
- [ ] **1.2 Migração de Filtros para URL (Search Params):**
    - Remover filtros puramente em estado React.
    - Usar a URL para armazenar `search`, `status` e `viewMode`. 
    - Benefício: Permite compartilhar links de filtros específicos e melhora o comportamento do botão "voltar".
- [ ] **1.3 Otimização de Queries:**
    - Implementar cache no lado do servidor para catálogos (Unidades, Áreas, Tipos PA).

---

## FASE 2: Governança e Estrutura de Dados
**Objetivo:** Adicionar campos essenciais para controle corporativo e orçamentário.

- [ ] **2.1 Atualização do Schema (Migration):**
    - Tabela `action_plans`: Adicionar `exercicio` (int), `budget_limit` (numeric), `visibility` (text).
    - Tabela `action_items`: Adicionar `kpi_link_id` (uuid).
- [ ] **2.2 Vínculo Forte com Catálogo:**
    - Alterar o campo `unit` para `unit_id` (UUID), forçando a seleção de unidades cadastradas no sistema.
    - Implementar validação para garantir que a Unidade pertence ao Tenant correto.
- [ ] **2.3 Controle Orçamentário em Tempo Real:**
    - Criar utilitário `calculatePlanHealth` que compara a soma dos campos `cost` de todos os itens com o `budget_limit` do plano.
    - Exibir alerta visual no cabeçalho se o plano exceder o orçamento planejado.

---

## FASE 3: Workflows Avançados e UX
**Objetivo:** Melhorar a produtividade do usuário e a integridade da execução.

- [ ] **3.1 Clonagem Inteligente com Ajuste de Datas:**
    - Criar Server Action `clonePlanWithDateShift`.
    - O usuário informa a nova data de início; o sistema projeta todos os `planned_start` e `planned_end` mantendo a duração original das tarefas.
- [ ] **3.2 Evidência Obrigatória para Prioridade Alta:**
    - Bloquear a alteração de status para "Concluído" em itens com `prioridade = 'Alta'` caso não existam anexos ou comentários recentes.
- [ ] **3.3 Log de Alterações Contextual:**
    - Adicionar aba "Histórico" dentro do modal de edição do item (`ItemFormDialog`).
    - Mostrar quem alterou prazos, responsáveis ou custos especificamente daquele item.

---

## FASE 4: Inteligência Artificial e Integrações
**Objetivo:** Reduzir o esforço manual e conectar o plano à estratégia da empresa.

- [ ] **4.1 Sugestor de Conteúdo 5W2H (IA):**
    - Integrar com OpenRouter (Claude-Haiku) para sugerir campos "Por Quê?" e "Como?" com base na descrição da "Ação".
    - Adicionar botão ✨ "Sugerir com IA" nos campos de texto longo do formulário.
- [ ] **4.2 Vínculo com KPIs do Dashboard:**
    - Permitir selecionar um KPI existente do inquilino ao criar uma ação.
    - Ao concluir a ação, disparar notificação sugerindo que o usuário atualize o valor do KPI vinculado.
- [ ] **4.3 Exportação Executiva (PDF One-Pager):**
    - Gerar relatório PDF consolidado com: Status Geral (Farol), Principais Bloqueios, Saúde Financeira e Próximos Vencimentos.

---

## Cronograma Estimado

| Fase | Esforço | Prioridade |
|------|---------|------------|
| Fase 1 | 8h | Alta (Bloqueante) |
| Fase 2 | 12h | Alta |
| Fase 3 | 16h | Média |
| Fase 4 | 20h | Baixa/Diferencial |

---

## Arquitetura Sugerida para Novas Tabelas/Campos

```sql
-- Exemplo de campos novos na migration
ALTER TABLE public.action_plans 
  ADD COLUMN exercicio INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  ADD COLUMN budget_limit NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'restricted'));

ALTER TABLE public.action_items
  ADD COLUMN kpi_link_id UUID REFERENCES public.dashboard_kpis(id) ON DELETE SET NULL;
```

---
*Plano gerado por Gemini CLI em 2026-05-13. Este plano deve ser validado pelo gestor do projeto antes do início da implementação.*
