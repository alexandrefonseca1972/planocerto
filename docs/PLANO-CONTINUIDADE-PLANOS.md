# Plano de Continuidade da Implementação do Módulo de Planos
> Versão 1.0 — 2026-05-13

Este documento substitui a leitura literal do roadmap anterior e reorganiza a continuidade com base no estado atual do código. Parte relevante do que estava proposto já foi iniciada, então a prioridade agora é consolidar, corrigir inconsistências e só depois expandir o módulo.

## 1. Diagnóstico do estado atual

### Já implementado ou claramente em andamento
- Componentização relevante da tela `/planos`, com extração de `PlanFormDialog`, `ItemFormDialog`, `PlanStats`, `PlanFilters` e `PlanTable`.
- Migração parcial de filtros para URL (`q`, `status`, `view`) na página de planos.
- Campos de governança no plano:
  - `exercicio`
  - `budget_limit`
  - `visibility`
- Exibição de orçamento e saúde financeira no cabeçalho do plano.
- Clonagem de plano com deslocamento de datas (`clonePlanWithDateShift`).
- Sugestão assistida por IA para campos 5W2H (`suggest5W2H`).
- Regra de evidência obrigatória para itens de prioridade alta foi iniciada.

### Inconsistências e lacunas encontradas
- A edição de plano ainda não persiste todos os novos campos de governança de forma consistente.
  - `createPlan` lê `exercicio`, `budget_limit` e `visibility`.
  - `updatePlan` ainda monta `raw` apenas com `title`, `unit`, `director` e `goal`.
- A regra de evidência obrigatória em `updateItemStatus` depende de `item.prioridade`, mas esse campo não está no `select` usado na action.
- O vínculo forte com catálogo ainda não aconteceu.
  - O módulo continua baseado em `unit` textual.
  - A IA também resolve contexto regional buscando `units` por nome, o que mantém risco de ambiguidade.
- A clonagem expõe seleção de empresa destino no frontend, mas o backend ainda ignora `targetTenantId`.
- O roadmap anterior considera como pendentes itens que já estão parcialmente implementados, então ele não serve mais como fonte única de prioridade.

## 2. Diretriz de continuidade

Ordem recomendada:

1. Fechar o que já entrou no código, mas ainda está inconsistente.
2. Endurecer o modelo de dados para reduzir ambiguidade operacional.
3. Completar regras de negócio e fluxos do usuário.
4. Só então investir em integrações estratégicas e funcionalidades diferenciais.

## 3. Plano de execução

### Fase 0 — Consolidação imediata
Objetivo: remover inconsistências entre schema, formulário, server actions e testes.

- Ajustar `updatePlan` para aceitar e persistir:
  - `exercicio`
  - `budget_limit`
  - `visibility`
- Revisar `ActionPlan` e o fluxo do formulário para garantir default e hidratação corretos na edição.
- Corrigir `updateItemStatus` para consultar `prioridade` antes de validar evidência obrigatória.
- Revisar `clonePlanWithDateShift` para evitar copiar colunas indevidas do registro original.
- Validar o comportamento real dos testes existentes e cobrir regressões nas actions novas.

Critérios de aceite:
- Criar e editar plano alteram os mesmos campos.
- Item de prioridade alta não pode ser concluído sem comentário ou anexo.
- Clonagem gera plano consistente, com datas deslocadas e status reiniciados.

### Fase 1 — Fechamento da governança de planos
Objetivo: transformar os campos recém-criados em regras úteis de operação.

- Expor `status = archived` no fluxo de edição/listagem.
- Permitir filtro por:
  - exercício
  - visibilidade
  - arquivado/ativo
- Consolidar o orçamento no dashboard do plano:
  - gasto previsto
  - saldo
  - percentual consumido
  - estado visual de excesso
- Adicionar testes para cálculo orçamentário e estados de exibição.

Critérios de aceite:
- Usuário consegue arquivar e localizar planos por ciclo.
- Cabeçalho do plano comunica orçamento e restrição de acesso sem ambiguidade.

### Fase 2 — Vínculo forte com catálogo
Objetivo: parar de depender de texto livre para unidade e reduzir erro estrutural.

- Introduzir `unit_id` em `action_plans`.
- Migrar leitura e escrita do módulo para `unit_id` como referência principal.
- Manter `unit` textual apenas como compatibilidade temporária ou campo derivado.
- Ajustar:
  - formulário de plano
  - queries de listagem
  - importação
  - contexto regional da IA
  - permissões por área/unidade
- Criar migration de backfill usando correspondência entre `tenant_id` e `units`.

Critérios de aceite:
- Plano passa a referenciar unidade oficial por ID.
- IA e relatórios deixam de depender de busca por nome.

### Fase 3 — Fechamento dos workflows operacionais
Objetivo: concluir os fluxos já desenhados para uso diário do módulo.

- Finalizar clonagem com opção real de empresa destino, se isso fizer parte do produto.
  - Se não fizer, remover o seletor do frontend para evitar promessa falsa.
- Adicionar histórico contextual por item no modal.
- Melhorar status e farol com mensagens operacionais mais claras para o usuário.
- Revisar ações em lote para garantir compatibilidade com as regras novas.

Critérios de aceite:
- Não há controles visuais sem backend correspondente.
- Usuário consegue entender por que um item não pode ser concluído.

### Fase 4 — Integrações e inteligência
Objetivo: expandir o módulo depois da base estar estável.

- Vínculo entre ações e KPIs.
- Sugestões IA com contexto regional mais confiável.
- Relatório executivo em PDF.
- Integração com inteligência regional e monitoramento externo quando o plano estiver maduro o suficiente.

Critérios de aceite:
- As features de IA agregam produtividade sem fragilizar governança ou dados.

## 4. Backlog recomendado por prioridade

### Prioridade alta
- Corrigir persistência de `exercicio`, `budget_limit` e `visibility` na edição.
- Corrigir validação de evidência obrigatória por prioridade alta.
- Revisar clonagem de plano para consistência de dados.
- Validar testes do módulo contra o estado atual das actions.

### Prioridade média
- Arquivamento e filtros por exercício/visibilidade.
- Orçamento consolidado no cabeçalho e na listagem.
- Histórico contextual por item.
- Decisão de produto sobre clonagem entre tenants.

### Prioridade estratégica
- `unit_id` em `action_plans`.
- KPI link em `action_items`.
- IA contextual fortalecida.
- PDF executivo e integrações externas.

## 5. Sequência sugerida de entregas

### Sprint 1
- Fase 0 completa.
- Correções com testes automatizados mínimos.

### Sprint 2
- Fase 1 completa.
- Ajustes visuais e filtros de governança.

### Sprint 3
- Fase 2 iniciada com migration e compatibilidade retroativa.

### Sprint 4
- Fase 3.

### Sprint 5+
- Fase 4.

## 6. Risco principal

O maior risco hoje não é falta de feature. É divergência entre o que a interface já sugere, o que o banco suporta e o que as server actions realmente persistem. Se isso não for fechado primeiro, qualquer nova camada de IA, KPI ou integração externa vai aumentar dívida técnica e comportamento inconsistente.
