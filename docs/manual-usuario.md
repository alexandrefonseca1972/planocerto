# 📖 Manual do Usuário - PlanoCerto

Bem-vindo ao **PlanoCerto**! Este manual guia você através de todas as funcionalidades da plataforma.

---

## Sumário

1. [Introdução](#introdução)
2. [Primeiros Passos](#primeiros-passos)
3. [Dashboard](#dashboard)
4. [Planos de Ação 5W2H](#planos-de-ação-5w2h)
5. [Módulo Financeiro](#módulo-financeiro)
6. [Administração](#administração)
7. [Configurações](#configurações)
8. [FAQ](#faq)

---

## Introdução

### O que é PlanoCerto?

PlanoCerto é uma plataforma de **gestão de planos de ação** baseada na metodologia **5W2H**. Permite que você:

✅ **Crie planos estruturados** — Defina objetivos claros com What, Why, Where, Who, When, How e Cost
✅ **Acompanhe execução** — Use Kanban, Gantt ou tabela para visualizar o progresso
✅ **Colabore em tempo real** — Convide colegas, faça comentários, anexe arquivos
✅ **Gerencie financeiro** — Registre contas a pagar, fornecedores e categorias
✅ **Tenha visibilidade executiva** — Dashboard com KPIs e métricas

### Metodologia 5W2H

| Letra | Significado | Exemplo |
|-------|-----------|---------|
| **W** | **What** (O quê?) | Implementar sistema CRM |
| **W** | **Why** (Por quê?) | Aumentar vendas em 30% |
| **W** | **Where** (Onde?) | Departamento comercial |
| **W** | **Who** (Quem?) | João (responsável) |
| **W** | **When** (Quando?) | Jan-Mar 2024 |
| **H** | **How** (Como?) | Reuniões semanais, treinamento |
| **H** | **How Much** (Quanto?) | R$ 50.000 |

---

## Primeiros Passos

### 1. Login

1. Acesse [PlanoCerto](https://planocerto.vercel.app)
2. Insira seu **email** e **senha**
3. Clique em **"Entrar"**

### 2. Primeiro Acesso

Se você é novo, o administrador vai:
1. Criar sua conta
2. Definir seu **papel** (usuário, gerente, admin)
3. Enviar convite por email

Clique no link do email para definir sua senha.

### 3. Seletor de Empresas

No topo da página, você vê um seletor de **empresas (tenants)**:

```
[Minha Empresa ▼]
```

Se você tem acesso a múltiplas empresas, clique para trocar.

**Nota:** Cada empresa tem seus próprios planos, usuários e configurações.

---

## Dashboard

### Visão Geral

O Dashboard é a primeira página após login. Mostra:

- **KPI Row** — Métricas resumidas (total de planos, em progresso, concluídos)
- **Status Row** — Planos em andamento com status em tempo real
- **Próximos Prazos** — Itens vencendo nos próximos 7 dias

### Interpretando os Status

| Status | Cor | Significado |
|--------|-----|-----------|
| ⚪ Não Iniciada | Cinza | Não começou ainda |
| 🟡 Pendente | Amarelo | Aguardando ação |
| 🔴 Em andamento (atraso) | Vermelho | Atrasado |
| 🔵 Em andamento | Azul | Dentro do prazo |
| 🟢 Concluído | Verde | Finalizado |

---

## Planos de Ação 5W2H

### Criar um Novo Plano

1. Clique em **"Novo Plano"** no topo
2. Preencha:
   - **Título:** Nome do plano (ex: "Implementar CRM")
   - **Unidade:** Departamento (ex: "Vendas")
   - **Diretor/Responsável:** Seu nome ou outro
   - **Objetivo:** O que se quer alcançar
3. Clique em **"Criar"**

### Adicionar Itens de Ação

1. Abra um plano
2. Clique em **"+ Adicionar Item"**
3. Preencha os 7 campos 5W2H:
   - **O quê** (What): Ação a realizar
   - **Por quê** (Why): Justificativa
   - **Onde** (Where): Local/departamento
   - **Quem** (Who): Responsável
   - **Quando** (When): Datas
   - **Como** (How): Método
   - **Quanto** (How Much): Custo

4. Clique em **"Salvar"**

### Visualizações

#### Tabela
- Vista padrão, com todas as colunas
- Clique na linha para editar
- Arraste para reordenar

#### Kanban
- Arraste itens entre colunas (status)
- Visualize progresso
- Ótimo para gestão ágil

#### Gantt
- Linha do tempo visual
- Veja sobreposições e dependencies
- Zoom: mês, trimestre, ano

### Exportar

#### Para Excel
1. Clique em **"⬇️ Exportar"**
2. Escolha **"Excel"**
3. Arquivo baixa automaticamente

#### Para PDF
1. Clique em **"⬇️ Exportar"**
2. Escolha **"PDF"**
3. Arquivo baixa com formatação

---

## Módulo Financeiro

### Contas a Pagar

#### Criar Conta

1. Clique em **"Financeiro"** → **"Contas a Pagar"**
2. Clique em **"Nova Conta"**
3. Preencha:
   - **Descrição:** "Compra de notebooks"
   - **Documento:** Número da NF (ex: 123456)
   - **Valor Total:** R$ 10.000,00
   - **Fornecedor:** Selecione ou crie
   - **Categoria:** Selecione categoria

4. Clique em **"Salvar"**

#### Adicionar Parcelas

1. Abra a conta
2. Clique em **"+ Adicionar Parcela"**
3. Preencha vencimento e valor
4. Clique em **"Salvar"**

#### Registrar Pagamento

1. Abra a parcela
2. Clique em **"Registrar Pagamento"**
3. Preencha data, valor pago e forma de pagamento
4. Clique em **"Confirmar"**

### Fornecedores

#### Criar Fornecedor

1. Clique em **"Financeiro"** → **"Fornecedores"**
2. Clique em **"Novo Fornecedor"**
3. Preencha:
   - **Nome:** "Empresa XYZ"
   - **CNPJ:** 12.345.678/0001-90
   - **Email e telefone**
   - **Endereço**

4. Clique em **"Salvar"**

### Categorias de Despesa

#### Criar Categoria

1. Clique em **"Financeiro"** → **"Categorias"**
2. Clique em **"Nova Categoria"**
3. Digite nome (ex: "Pessoal", "Operacional")
4. Clique em **"Salvar"**

---

## Administração

### Gestão de Usuários (Admin)

#### Criar Usuário

1. Clique em **"Admin"** → **"Usuários"**
2. Clique em **"Novo Usuário"**
3. Preencha email, nome e papel
4. Clique em **"Convitar"**

Sistema envia email com link de confirmação.

#### Editar Usuário

1. Clique no usuário
2. Clique em **"Editar"**
3. Altere papel ou permissões
4. Clique em **"Salvar"**

### Gestão de Papéis (Admin)

| Papel | Acesso |
|-------|--------|
| **Viewer** | Apenas leitura de planos |
| **User** | Criar e editar planos próprios |
| **Manager** | Gerenciar usuários e planos |
| **Admin** | Acesso total |
| **Super Admin** | Gerencia múltiplas empresas |

---

## Configurações

### Perfil

1. Clique em **"👤 Perfil"** (topo)
2. Clique em **"Meu Perfil"**

Aqui você pode:
- Editar nome
- Trocar senha
- Alternar Dark/Light mode
- Ajustar tamanho de fonte

### Integração Google Calendar

1. Clique em **"Perfil"** → **"Integrações"**
2. Clique em **"Conectar Google Calendar"**
3. Autorize acesso
4. Sistema cria eventos automaticamente

---

## FAQ

**P: Como faço para trocar de empresa?**
R: Use o seletor no topo esquerdo.

**P: Como deleto um plano?**
R: Apenas admins podem. Clique em `...` → `Deletar`.

**P: Perdi minha senha, como recupero?**
R: Clique em **"Esqueceu senha?"** na tela de login.

**P: Posso compartilhar um plano com alguém que não tem conta?**
R: Sim! Use **"🔗 Compartilhar"** para gerar link público.

**P: Como anexo um arquivo a um item?**
R: Abra o item, aba `Anexos`, arraste arquivo ou clique `Escolher`.

---

## Suporte

Dúvidas? Entre em contato:

📧 **Email:** suporte@planocerto.com
💬 **Chat:** Clique em `?` no canto inferior direito

---

**Versão do Manual:** 1.0
**Última atualização:** Maio 2024
