# Manual do Usuário — PlanoCerto

Plataforma de Planos de Ação 5W2H para gestão empresarial com suporte multitenant.

---

## 1. Primeiro Acesso

### 1.1 Criar Conta
1. Acesse https://planocerto.ruphus.app
2. Clique em **Criar conta**
3. Preencha nome, email e senha (8+ caracteres, maiúscula, minúscula, número, caractere especial)
4. Verifique seu email e clique no link de confirmação
5. Após confirmar, aguarde o administrador associar sua conta a uma empresa

### 1.2 Login
1. Acesse https://planocerto.ruphus.app/auth
2. Digite email e senha
3. Se esquecer a senha, clique em **Esqueceu a senha?** para receber link de recuperação

### 1.3 Página Pendente
Se após o login você for direcionado para a página `/pendente`, significa que sua conta ainda não foi associada a nenhuma empresa. Aguarde o administrador aprovar seu acesso.

---

## 2. Dashboard (Resumo Executivo)

O dashboard é a página inicial após o login. Apresenta:

### 2.1 KPIs (Indicadores)
- **Unidades:** número de empresas que você gerencia
- **Concluídas:** percentual de ações concluídas + tendência (↑ melhor que semana anterior, ↓ pior)
- **Em andamento:** ações em progresso
- **Atrasadas:** ações com prazo vencido

### 2.2 Distribuição (Gráficos)
Três visualizações disponíveis:
- **Rosca:** gráfico donut com gradiente por status
- **Medidor:** gauge semicircular com percentual de conclusão
- **Barras:** barras horizontais empilhadas

Toggle entre as visões pelos botões Rosca / Medidor / Barras. Abaixo do gráfico, um sparkline mostra o ritmo de conclusões nas últimas 4 semanas.

### 2.3 Prazos Próximos
Lista os próximos 3 prazos por unidade, com dias restantes. Itens a 3 dias ou menos são marcados como **urgentes** (!). Clique em qualquer prazo para ir direto ao plano.

### 2.4 Progresso por Unidade
Barras de progresso empilhadas (verde = concluídas, azul = em andamento). Ordenação por 5 critérios:
- Progresso | Nome | Total | Atrasadas | Concluídas
- Clique na mesma opção para inverter ordem (asc/desc)

### 2.5 Detalhamento por Unidade
Tabela completa com todos os indicadores por empresa. Clique no cabeçalho de qualquer coluna para ordenar (seta ↑/↓ indica direção). Clique no nome da unidade para ir ao plano.

---

## 3. Planos de Ação 5W2H

### 3.1 Criar um Plano
1. No menu superior, clique em **Planos**
2. Se não houver plano, clique em **Criar plano de ação**
3. Preencha:
   - **Título:** nome descritivo do plano
   - **Unidade:** departamento ou setor
   - **Diretor:** responsável pela área
   - **Objetivo:** meta do plano
4. Clique em **Criar**

**Dica:** use os **templates** pré-preenchidos (Comercial, Operacional, Expansão) para começar rapidamente.

### 3.2 Adicionar Ações (Itens 5W2H)
Cada ação segue a metodologia 5W2H:

| Campo | Significado | Exemplo |
|-------|-------------|---------|
| **Ação (What)** | O que será feito | "Contratar equipe de vendas" |
| **Por que (Why)** | Justificativa | "Aumentar capacidade de atendimento" |
| **Onde (Where)** | Local | "Sede" |
| **Quem (Who)** | Responsável | "Gerente de RH" |
| **Quando (When)** | Início e Término | Datas planejadas |
| **Quanto (How Much)** | Custo estimado | "R$ 15.000" |
| **Como (How)** | Resultado esperado | "Equipe contratada e treinada" |

### 3.3 Visualizações
Três modos de visualização, alternados pelo botão à direita:

| Modo | Uso |
|------|-----|
| **Tabela** | Visão detalhada com todas as colunas 5W2H. Ideal para edição e análise |
| **Kanban** | Arraste cards entre colunas de status. Ideal para acompanhamento visual |
| **Gantt** | Linha do tempo com barras por ação. Ideal para planejamento temporal |

#### Tabela
- Colunas ocultas em mobile aparecem ao rolar horizontalmente
- **Nº** (fixo à esquerda): número da ação com hierarquia
- **Ação:** texto principal. Clique no ícone de lápis para edição rápida na linha
- **Status (Farol):** clique para mudar o status inline
- **Ações** (fixo à direita): editar, excluir

#### Kanban
- Arraste cards entre colunas para mudar o status
- Colunas: Não Iniciada → Pendente → Em andamento → Em andamento (atraso) → Concluído
- O status é salvo automaticamente ao soltar

#### Gantt
- Visualização temporal com barras coloridas
- **Zoom:** Mês / Trimestre / Ano
- **Linha vermelha tracejada:** data de hoje
- **Cores:** verde (concluído), azul (andamento), vermelho (atrasado), laranja (pendente), cinza (não iniciado)

### 3.4 Ações em Lote
- No modo Tabela, use o botão **Lote (N)** para aplicar um status a todos os itens filtrados de uma vez
- Útil para marcar múltiplas ações como concluídas

### 3.5 Comentários
- Ao editar uma ação (modal completo), na aba **Resultados**, adicione comentários
- Comentários são visíveis para todos os membros da empresa

### 3.6 Anexos
- Na aba **Resultados** do modal de edição, clique em **Anexar** para enviar arquivos
- Tipos permitidos: imagens, PDF, Excel, CSV (máx. 10MB)
- Para baixar, clique no ícone de download. Para remover, clique no X

### 3.7 Exportar
- **Excel (XLSX):** botão na barra de ações — exporta todos os itens do plano
- **PDF:** botão na barra de ações — abre página formatada para impressão (Ctrl+P para salvar)

### 3.8 Copiar Plano
- Clique no ícone de cópia ao lado do título do plano
- Selecione a empresa de destino
- O plano e todos os itens são duplicados (status resetado para "Não Iniciada")

### 3.9 Compartilhar (Link Público)
- Clique no ícone de compartilhamento ao lado do título do plano
- Crie um link público para compartilhar o dashboard (somente leitura)
- O link pode ser acessado por qualquer pessoa, sem login
- Administradores podem gerenciar (criar/excluir) links

---

## 4. Calendário

- Exibe todos os prazos das ações organizados por data
- Separa **próximos prazos** de **prazos vencidos**
- Filtrado automaticamente pela empresa ativa no seletor superior

---

## 5. Perfil

### 5.1 Dados Pessoais
- Visualize e edite seu nome
- Email é somente leitura

### 5.2 Integração Google Calendar
- Conecte sua conta Google para sincronizar automaticamente os prazos das ações
- Ao criar ou editar uma ação com responsável, o evento é criado/atualizado no Google Calendar
- Clique em **Conectar Google** e autorize o acesso
- Para desconectar, clique em **Desconectar**

**Requer configuração do administrador:** `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` nas variáveis de ambiente.

---

## 6. Notificações

### 6.1 Sino de Notificações
- Ícone de sino no canto superior direito da navbar
- Contador vermelho indica notificações não lidas
- Clique no sino para abrir a lista
- Clique em uma notificação para marcá-la como lida
- Atualização automática a cada 30 segundos

### 6.2 Tipos de Notificação
- **Informativa:** comunicados gerais
- **Alerta (warning):** atenção necessária
- **Sucesso:** ações concluídas
- **Erro:** problemas detectados

### 6.3 Notificações por Email
- Ao criar uma ação, o responsável recebe um email
- Ao concluir uma ação, o responsável recebe notificação de conclusão
- Templates HTML com link direto para o plano

**Requer configuração:** `RESEND_API_KEY` nas variáveis de ambiente.

### 6.4 Notificações Microsoft Teams
- Se o administrador configurar o webhook do Teams na empresa, cada criação/atualização de ação envia um card adaptativo para o canal configurado

---

## 7. Administração

Acessível apenas para usuários com papel **admin**.

### 7.1 Usuários (`/admin/users`)
- Criar, editar e excluir usuários
- Definir papel (admin/user)
- Associar usuários a empresas
- Configurar permissões granulares (criar/editar/excluir planos e itens)
- Definir restrições de horário de login
- Ativar/desativar contas

### 7.2 Empresas (`/admin/tenants`)
- Criar, editar e excluir empresas
- Gerenciar membros (adicionar por email, alterar papel, remover)
- Papéis: **owner** (proprietário), **admin** (administrador da empresa), **member** (membro)
- Configurar webhook do Microsoft Teams por empresa
- Definir plano (free/pro/enterprise)

### 7.3 Notificações (`/admin/notifications`)
- Criar notificações para todos os usuários, um usuário específico ou uma empresa específica
- Tipos: info, warning, success, error
- Notificações podem ser fixas (sempre visíveis) ou com data de expiração

---

## 8. Temas e Acessibilidade

### 8.1 Modo Escuro/Claro
- Alternância automática baseada no sistema operacional
- Botão de toggle manual no canto superior direito (ícone de sol/lua)

### 8.2 Tamanho da Fonte
- Controles **A- / A+** na navbar permitem ajustar o tamanho da fonte
- Configuração persiste entre sessões

---

## 9. Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl+N` / `Cmd+N` | Nova ação (na página de planos) |

---

## 10. Perguntas Frequentes

**P: Não vejo nenhuma empresa após o login.**
R: Sua conta ainda não foi associada a uma empresa. Contate o administrador.

**P: Como adiciono um membro à minha empresa?**
R: Acesse `/admin/tenants`, clique na empresa, e use "Adicionar membro" com o email do usuário.

**P: Posso recuperar minha senha?**
R: Sim, na tela de login clique em "Esqueceu a senha?" para receber um email de recuperação.

**P: O Kanban não está funcionando no celular.**
R: O Kanban funciona em dispositivos móveis, mas para arrastar cards recomendamos usar em telas maiores. Use o modo Tabela como alternativa em mobile.

**P: Como exporto o plano para PDF?**
R: Na página de planos, clique no botão "PDF" na barra de ações. A página será aberta em nova aba — use Ctrl+P (Cmd+P no Mac) para salvar como PDF.

**P: As notificações por email não estão chegando.**
R: Verifique se a chave `RESEND_API_KEY` está configurada e se o domínio foi verificado no painel do Resend.

**P: Como funciona a sincronização com Google Calendar?**
R: Conecte sua conta no Perfil > Integração com Calendário. Após conectar, toda ação com responsável definido gera um evento no Google Calendar automaticamente.

---

*PlanoCerto v2.0 — powered by Ruphus*
