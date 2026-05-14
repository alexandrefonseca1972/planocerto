# Plano de Implementação: Base de Conhecimento IA e Inteligência Regional
> Versão 2.1 — Foco: Regionalidade, Mercado e Metadados Locais

Este plano detalha a construção de uma base de conhecimento proprietária que alimenta o motor de IA do PlanoCerto, garantindo que as sugestões de planos de ação sejam aderentes à cultura da empresa e ao contexto regional de cada unidade.

---

## 🏗️ Arquitetura Técnica (Inteligência Local)

### 1. Camada de Dados (Contexto Regional)
Além dos manuais gerais, a IA utilizará metadados específicos de cada unidade/área:
- **Perfil Socioeconômico:** Dados sobre o perfil dos candidatos/alunos da região.
- **Regionalidade:** Fatores culturais e de mercado locais.
- **Calendário Regional:** Eventos e feriados específicos da cidade/região da unidade.

### 2. Base de Conhecimento (RAG)
Utilizaremos `pgvector` para busca semântica, permitindo que o administrador cadastre:
- **Playbooks de Sucesso:** Como a empresa operou em regiões similares.
- **Manuais de Normas:** Regras internas de execução.
- **Análises de Mercado:** Documentos sobre concorrência e comportamento local.

---

## 🛠️ Roteiro de Implementação

### FASE 1: Metadados Regionais (Infraestrutura)
- [ ] Criar migration para adicionar campo `regional_context` (JSONB) nas tabelas `units` e `areas`.
- [ ] Este campo armazenará: `perfil_persona`, `eventos_locais`, `principais_concorrentes`, `sazonalidade_regional`.

### FASE 2: Base de Conhecimento (Database)
- [ ] Ativar `pgvector` e criar tabela `knowledge_base` (já iniciado).
- [ ] Adicionar colunas `unit_id` e `area_id` (opcionais) na `knowledge_base` para segmentar o conhecimento por região.

### FASE 3: Motor de Sugestão Contextual (IA)
- [ ] Atualizar `suggest5W2H`:
    1. Identificar a Unidade/Área do Plano de Ação.
    2. Recuperar o `regional_context` associado.
    3. Buscar fragmentos na `knowledge_base` que correspondam à ação E à região.
    4. Injetar tudo no prompt do Claude como "Contexto Local de Execução".

### FASE 4: Interface de Gestão
- [ ] Painel para o Admin configurar o contexto regional de cada unidade.
- [ ] Interface de upload de documentos para a Base de Conhecimento.

---

## 📝 Exemplo de Prompt Enriquecido Regionalmente

*"Você está sugerindo ações para a unidade **MANAUS-CENTRO**. 
Contexto Regional: Perfil de candidatos focado em Pós-Graduação, forte influência do calendário de feriados locais (Círio), clima amazônico (planejar ações internas em períodos de chuva).
Base de Conhecimento: O Playbook de 2025 diz que panfletagem nesta unidade tem baixa conversão; prefira parcerias com empresas do Distrito Industrial."*
