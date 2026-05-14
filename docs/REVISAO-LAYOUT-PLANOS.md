# 📐 Revisão de Layout - Página de Planos

**Data:** Maio 2026  
**Versão:** 2.0  
**Status:** Análise Completa

---

## 📊 Análise Atual do Layout

### ✅ Pontos Fortes

1. **Responsividade Excelente**
   - Layout adapta bem de mobile a desktop
   - Colunas ocultadas em telas pequenas (smart hiding)
   - Tabela horizontal scrollável em mobile
   - Hint "← deslize para ver mais →" em telas pequenas

2. **Densidades Bem Balanceadas**
   - Espaçamento adequado (gap-3, gap-4)
   - Padding consistente (py-2.5, px-2)
   - Não sente apertado nem muito espaçado

3. **Hierarquia Visual Clara**
   - Headers com cores de background (bg-zinc-50)
   - Badges com cores para status
   - Ícones bem dimensionados (h-4 w-4)
   - Sticky header para navegação

4. **Componentes Funcionais**
   - Status dots minimalistas
   - Dropdown menu compacto (⋮)
   - Filtros inline com visual feedback
   - Mudança de visualização (Table/Kanban/Gantt)

---

## 🎯 Áreas de Melhoria Identificadas

### 1. **Header / Seção Superior** 
**Situação Atual:** Múltiplas linhas, muitos botões espalhados

**Problemas:**
- Título + badges + ações em linhas diferentes
- Botões Editar/Excluir em tamanho sm (pequenos)
- Gap grande entre elementos
- Em mobile fica muito espalhado

**Sugestões:**
```
Header melhorado:
┌─────────────────────────────────────────┐
│ 🔷 Meu Plano         [⚙️] [📋] [🔗] [+] │ ← Badges + Ações juntas
├─────────────────────────────────────────┤
│ Unidade • Responsável • Meta             │ ← Subtítulo compacto
└─────────────────────────────────────────┘
```

### 2. **Stats Bar (KPI Cards)**
**Situação Atual:** Espalhado na horizontal com gap-4

**Problemas:**
- 4 pills + buttons = muito conteúdo em uma linha
- Em tablet fica apertado
- BulkStatusButton não é destacado

**Sugestões:**
```
Stats mais compactos:
┌─ Total ─┬─ Em andamento ─┬─ Concluídas ─┬─ Pendentes ─┬── [Kanban] [Histórico] [+ Nova] ──┐
│   5     │       2        │      1       │      2      │                                    │
└─────────┴────────────────┴──────────────┴─────────────┴────────────────────────────────────┘

Ou em duas linhas em mobile:
┌─ Total ─┬─ Em andamento ─┬─ Concluídas ─┬─ Pendentes ─┐
│   5     │       2        │      1       │      2      │
├─────────────────────────────────────────────────────┤
│     [Kanban]  [Histórico]  [+ Nova Ação]           │
└─────────────────────────────────────────────────────┘
```

### 3. **Filtros**
**Situação Atual:** Badges de status + busca espalhados

**Problemas:**
- Muitos badges (5x) ocupam muito espaço
- Em mobile precisa scroll horizontal
- Busca e filtros separados
- Contador "5 de 20" fica isolado

**Sugestões:**
```
Filtros em card dedicado:
┌─ Buscar ações... ─────────────────────────────┐
├─────────────────────────────────────────────────┤
│ Todos (20) │ ⚪ Não Iniciada (3) │ 🟡 Pendente (2) │ ...
│ [×] Limpar Filtros                            │
└─────────────────────────────────────────────────┘
```

### 4. **Tabela**
**Situação Atual:** 9 colunas com smart hiding

**Problemas:**
- Muitas colunas mesmo com hiding
- Sticky columns (left + right) ocupam muito
- Números e ações no final demandam scroll
- Headers em UPPERCASE pequeno (text-[10px])

**Sugestões:**
```
Opção 1 - Reordenação:
│ Nº │ Ação │ Resp │ Status │ Custo │ Datas │ Ações │
      ↑ o mais importante à esquerda, contexto no meio, ações à direita

Opção 2 - Collapsible Details:
│ Nº │ Ação + Subtítulo │ Status │ Ações │ (clique para mais detalhes)

Opção 3 - Cards em Mobile:
Em mobile trocar para "card view" em vez de tabela scrollável
```

### 5. **Linha de Item (ViewRow)**
**Situação Atual:** Dispersa, 9 colunas

**Sugestão Melhorada:**
```
Versão Compacta (Desktop):
┌─────┬──────────────────────────┬────────┬──────────┬─────────┬──────┐
│ 1.1 │ Implementar feature XYZ   │ João   │ ⚫ 75%   │ R$ 500  │ ⋮    │
│     │ Porque isso melhora UX    │        │          │         │      │
└─────┴──────────────────────────┴────────┴──────────┴─────────┴──────┘

Versão Expandida (ao clicar):
┌─────┬──────────────────────────┬────────┬──────────┬─────────┬──────┐
│ 1.1 │ Implementar feature XYZ   │ João   │ ⚫ 75%   │ R$ 500  │ ⋮    │
│     │ Porque isso melhora UX    │        │ 📅 25/5  │ 📊 1 ct │      │
│     │ 📍 Frontend • 🗓️ 1/5-25/5 │        │          │         │      │
└─────┴──────────────────────────┴────────┴──────────┴─────────┴──────┘
```

### 6. **Espaçamento e Tamanhos**
**Problemas:**
- Headers muito pequenos (text-[10px])
- Gap-4 em alguns lugares, gap-1.5 em outros = inconsistente
- Cards com padding p-3 (pequeno) e py-20 (grande) = variável

**Sugestão:**
```
Padrão consistente:
- Heading: text-xs (12px)
- Body: text-sm (14px)
- Small: text-[11px]
- Gaps: gap-2 (pequeno) | gap-3 (médio) | gap-4 (grande)
- Padding: px-2/py-2 (tight) | px-3/py-2.5 (normal) | px-4/py-3 (loose)
```

---

## 🎨 Proposta de Layout Refeito

### Layout Proposto (Desktop 1440px+)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Planos de Ação > [⚙️] [📋] [🔗] [+]                                │ ← Header compacto
│ Unidade: TI | Responsável: João | Meta: Sistema novo               │
├─────────────────────────────────────────────────────────────────────┤
│ ⚪ Total: 5  🔵 Em andamento: 2  🟢 Concluído: 1  🟡 Pendente: 2   │ ← Stats em 1 linha
│                                    [Kanban] [Histórico] [+ Ação]   │
├─────────────────────────────────────────────────────────────────────┤
│ Buscar ações...                                                     │
│ [×] Limpar | ⚪ Não iniciada (3) | 🟡 Pendente (2) | ...          │ ← Filtros organizados
├─────────────────────────────────────────────────────────────────────┤
│ Nº  │ Ação              │ Resp    │ Status  │ Custo    │ Ações    │
├─────┼──────────────────┼─────────┼─────────┼──────────┼──────────┤
│ 1.1 │ Feature XYZ      │ João    │ ⚫ 75%  │ R$ 500   │ ⋮        │
│     │ Melhorar UX      │         │         │          │          │
│ 1.2 │ Testes unitários │ Maria   │ 🟢      │ R$ 300   │ ⋮        │
│ 2.1 │ Deploy prod      │ Carlos  │ 🟡      │ R$ 1k    │ ⋮        │
└─────┴──────────────────┴─────────┴─────────┴──────────┴──────────┘
```

### Layout Proposto (Mobile < 768px)

```
┌──────────────────────────────────────┐
│ Planos de Ação     [⚙️] [🔗] [+]    │ ← Header compacto
│ TI • João • Sistema novo             │
├──────────────────────────────────────┤
│ 5 ações │ 2 em andamento │ 1 concluído │ ← Stats em 3 linhas
├──────────────────────────────────────┤
│ 🔍 Buscar ações...                   │ ← Busca destacada
│ [×] Limpar | ⚪ (3) 🟡 (2) 🔴 (1)   │
├──────────────────────────────────────┤
│ Card View:                           │
│ ┌────────────────────────────────┐  │
│ │ 1.1 Feature XYZ               │  │
│ │ João • ⚫ 75% • R$ 500        │  │
│ │ [📌] [💬] [🧾] [⋮]          │  │
│ └────────────────────────────────┘  │
│ ┌────────────────────────────────┐  │
│ │ 1.2 Testes unitários          │  │
│ │ Maria • 🟢 • R$ 300           │  │
│ │ [📌] [💬] [🧾] [⋮]          │  │
│ └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## 📋 Checklist de Implementação

### Fase 1 - Header (Alta Prioridade)
- [ ] Consolidar title + badges em uma linha
- [ ] Mover ações para dropdown menu
- [ ] Adicionar subtítulo com unit/responsible/goal

### Fase 2 - Stats (Média Prioridade)
- [ ] Compactar pills
- [ ] Reorganizar botões em linha separada em mobile
- [ ] Melhorar visual dos números

### Fase 3 - Filtros (Média Prioridade)
- [ ] Colocar em card dedicado
- [ ] Adicionar "Limpar filtros"
- [ ] Melhorar visual dos badges

### Fase 4 - Tabela (Baixa Prioridade)
- [ ] Avaliar reordenação de colunas
- [ ] Aumentar altura de headers
- [ ] Melhorar visual de rows expandidas

### Fase 5 - Mobile (Média Prioridade)
- [ ] Implementar card view em mobile
- [ ] Testar layout em varios breakpoints
- [ ] Melhorar hint de deslize

---

## 🎯 Benefícios Esperados

✅ **Melhor Organização**
- Informações primárias acima
- Filtros em seção dedicada
- Ações claras e acessíveis

✅ **Melhor Mobile**
- Menos horizontal scroll
- Card view mais legível
- Touch-friendly controls

✅ **Melhor Acessibilidade**
- Headers maiores (mais legível)
- Menos clutter
- Contraste melhorado

---

## 📚 Referências

- Página atual: `src/app/(protected)/planos/page.tsx`
- Componentes: `src/components/planos/`
- Tamanho viewport atual: 1440px design reference

---

**Próximos Passos:**
1. Validar com usuários (qual fase implementar primeiro?)
2. Prototipar melhorias em Figma/mockup
3. Implementar em ordem de prioridade
4. Testar responsividade em todos breakpoints

