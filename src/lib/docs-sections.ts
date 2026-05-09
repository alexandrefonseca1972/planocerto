import type { DocsViewerProps } from "@/components/ui/docs-viewer";

export const DOCS_SECTIONS: DocsViewerProps['sections'] = [
  {
    id: "getting-started",
    title: "Começando",
    icon: "🚀",
    content: `## Bem-vindo ao PlanoCerto

PlanoCerto é uma plataforma de gestão de planos de ação baseada na metodologia 5W2H (What, Why, Where, Who, When, How, Cost).

### O que você pode fazer:

- **Criar Planos**: Organize seus projetos e iniciativas
- **Definir Ações**: Use o método 5W2H para estruturar ações
- **Gerenciar Financeiro**: Controle contas a pagar e fornecedores
- **Acompanhar Progresso**: Veja o status em tempo real
- **Compartilhar Documentos**: Exporte em Excel ou PDF

### Primeiros Passos

\`\`\`bash
1. Faça login na plataforma
2. Selecione sua empresa no seletor da navbar
3. Clique em "Novo Plano" para criar seu primeiro plano
4. Adicione itens de ação usando os 7 campos 5W2H
5. Convide sua equipe para colaborar
\`\`\`

### Navegação Principal

- **Dashboard**: Visualize todos os seus planos e KPIs
- **Planos**: Gerencie seus planos de ação
- **Calendário**: Veja as ações por data
- **Financeiro**: Controle contas a pagar
- **Admin**: (Apenas para administradores) Gerencie usuários e catálogos`,
    subsections: [
      { id: "welcome", title: "Bem-vindo" },
      { id: "setup", title: "Configuração Inicial" },
      { id: "navigation", title: "Navegação" },
    ],
  },
  {
    id: "planos",
    title: "Planos 5W2H",
    icon: "📋",
    content: `## Criando e Gerenciando Planos

Um plano é um documento estruturado que agrupa ações relacionadas a um objetivo comum.

### Estrutura de um Plano

Cada plano contém:
- **Título**: Identificação do plano
- **Unidade**: Área ou departamento responsável
- **Responsável**: Pessoa designada
- **Objetivo**: Meta a ser alcançada
- **Itens de Ação**: Tarefas estruturadas em 5W2H

### Como Criar um Plano

\`\`\`bash
1. Clique em "Novo Plano" no topo da página
2. Preencha os campos básicos
3. Clique em "Criar"
4. O plano será criado com status "active"
\`\`\`

### Método 5W2H

Cada item de ação é estruturado em 7 campos:

- **O quê (What)**: Descrição da ação
- **Por quê (Why)**: Justificativa/razão
- **Onde (Where)**: Local de execução
- **Quem (Who)**: Responsável
- **Quando (When)**: Data/prazo
- **Como (How)**: Metodologia
- **Quanto (Cost)**: Orçamento necessário

### Adicionando Itens de Ação

\`\`\`bash
1. Dentro de um plano, clique em "+ Adicionar Item"
2. Preencha todos os 7 campos
3. Clique em "Salvar"
\`\`\`

### Status e Fluxo

- **Active**: Plano em andamento
- **Completed**: Plano finalizado
- **Archived**: Plano arquivado`,
    subsections: [
      { id: "create-plan", title: "Criar Plano" },
      { id: "5w2h", title: "Metodologia 5W2H" },
      { id: "manage-items", title: "Gerenciar Itens" },
      { id: "export", title: "Exportar" },
    ],
  },
  {
    id: "financeiro",
    title: "Gestão Financeira",
    icon: "💰",
    content: `## Módulo Financeiro

Controle suas contas a pagar, registre pagamentos e gerencie fornecedores.

### Contas a Pagar

#### Criando uma Conta a Pagar

\`\`\`bash
1. Acesse Financeiro → Contas a Pagar
2. Clique em "Nova Conta"
3. Preencha os dados:
   - Descrição
   - Fornecedor
   - Valor total
   - Data de vencimento
4. Clique em "Criar"
\`\`\`

#### Estrutura de Parcelas

Contas a pagar podem ter múltiplas parcelas:
- Cada parcela tem data de vencimento e valor
- Status: Pendente, Paga, Atrasada
- Histórico de pagamentos rastreado

#### Registrando Pagamentos

\`\`\`bash
1. Abra a conta desejada
2. Clique em "Registrar Pagamento" na parcela
3. Preencha:
   - Data do pagamento
   - Valor pago
   - Forma de pagamento
4. Clique em "Confirmar"
\`\`\`

### Fornecedores

#### Gerenciando Fornecedores

- Catálogo centralizado de fornecedores
- Informações: Nome, CNPJ, Contato
- Associe contas a pagar a fornecedores
- Histórico de transações por fornecedor

### Categorias de Despesa

Organize suas despesas por categoria:
- Operacional
- Investimento
- Manutenção
- Outras

### Relatórios Financeiros

- Visualize contas vencidas
- Acompanhe fluxo de caixa
- Exporte relatórios em Excel`,
    subsections: [
      { id: "contas-pagar", title: "Contas a Pagar" },
      { id: "fornecedores", title: "Fornecedores" },
      { id: "categorias", title: "Categorias" },
      { id: "pagamentos", title: "Registrar Pagamentos" },
    ],
  },
  {
    id: "admin",
    title: "Painel Administrativo",
    icon: "⚙️",
    content: `## Administração do Sistema

Painel exclusivo para administradores de empresa.

### Gerenciar Usuários

#### Adicionar Usuários

\`\`\`bash
1. Acesse Admin → Usuários
2. Clique em "Convidar Usuário"
3. Insira o email
4. Selecione o papel (Role)
5. Clique em "Enviar Convite"
\`\`\`

#### Papéis Disponíveis

- **admin**: Acesso total ao sistema
- **manager**: Pode criar e editar planos
- **viewer**: Acesso somente leitura
- **finance**: Gerencia contas a pagar
- **user**: Acesso básico

### Catálogos

Gerencie dados centralizados:

#### Fornecedores
- CNPJ obrigatório
- Informações de contato
- Histórico de compras

#### Categorias de Despesa
- Criar/editar categorias personalizadas
- Usar em contas a pagar
- Relatórios por categoria

### Configurações da Empresa

- Logo e nome
- Informações de contato
- Moeda padrão
- Período fiscal

### Auditoria

Visualize:
- Quem criou/modificou registros
- Data e hora das alterações
- Histórico completo de ações`,
    subsections: [
      { id: "users", title: "Usuários" },
      { id: "catalogos", title: "Catálogos" },
      { id: "roles", title: "Papéis" },
      { id: "audit", title: "Auditoria" },
    ],
  },
  {
    id: "features",
    title: "Recursos Avançados",
    icon: "✨",
    content: `## Recursos Avançados

### Compartilhamento Público

Compartilhe seus planos publicamente:

\`\`\`bash
1. Abra um plano
2. Clique em "🔗 Compartilhar"
3. Copie o link gerado
4. Compartilhe por email ou redes sociais
5. Qualquer pessoa pode visualizar (sem login)
\`\`\`

### Exportação

#### Excel
- Todos os itens em uma planilha
- Formatação preservada
- Pronto para apresentações

#### PDF
- Documento formatado para impressão
- Logo da empresa
- Índice automático

\`\`\`bash
1. Abra um plano
2. Clique em "⬇️ Exportar"
3. Escolha o formato
4. Arquivo será baixado automaticamente
\`\`\`

### Múltiplas Empresas

Trabalhe com várias empresas:

\`\`\`bash
1. Use o seletor na navbar: [Minha Empresa ▼]
2. Selecione a empresa desejada
3. Todos os dados serão filtrados
4. Troque de empresa a qualquer momento
\`\`\`

### Anexos

- Adicione documentos aos planos
- Suporte para múltiplos formatos
- Armazenamento seguro na nuvem

### Colaboração

- Convide membros da equipe
- Atribua papéis específicos
- Comente em itens de ação
- Receba notificações de atualizações`,
    subsections: [
      { id: "sharing", title: "Compartilhamento" },
      { id: "export", title: "Exportação" },
      { id: "multi-company", title: "Multi-empresa" },
      { id: "collaboration", title: "Colaboração" },
    ],
  },
  {
    id: "troubleshooting",
    title: "Resolução de Problemas",
    icon: "🔍",
    content: `## Resolvendo Problemas Comuns

### A página não carrega

Se a página aparenta estar travada ou não carrega:

\`\`\`bash
1. Atualize a página (Ctrl+R ou Cmd+R)
2. Limpe o cache:
   - Abra Dev Tools (F12)
   - Vá em Application → Storage
   - Clique em "Clear site data"
3. Feche e abra novamente o navegador
4. Tente em outro navegador
\`\`\`

### Erro de autenticação

Se recebe erro de login:

\`\`\`bash
1. Limpe cookies do navegador
2. Tente fazer logout e login novamente
3. Verifique se o email está correto
4. Se esqueceu a senha, use "Esqueci minha senha"
\`\`\`

### Erro ao salvar dados

Se alterações não são salvas:

\`\`\`bash
1. Verifique sua conexão com a internet
2. Tente novamente
3. Se persistir, limpe o cache (ver acima)
4. Entre em contato com suporte
\`\`\`

### Permissões insuficientes

Se vê mensagem de acesso negado:

\`\`\`bash
1. Verifique seu papel (Role) no sistema
2. Solicite ao admin mais permissões
3. Certifique-se de estar na empresa correta
\`\`\`

### Dados não sincronizam

Se dados não aparecem em outro dispositivo:

\`\`\`bash
1. Atualize a página
2. Faça logout e login novamente
3. Aguarde alguns segundos e atualize novamente
\`\`\`

### Entre em Contato

Se o problema persistir:
- Email: suporte@planocerto.com
- Horário: Segunda a sexta, 9:00-17:00
- Telefone: (11) 99999-9999`,
    subsections: [
      { id: "loading", title: "Problemas de Carregamento" },
      { id: "auth", title: "Autenticação" },
      { id: "data", title: "Dados e Sincronização" },
      { id: "support", title: "Suporte" },
    ],
  },
];
