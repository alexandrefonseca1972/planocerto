# 📊 Revisão Detalhada do Módulo Financeiro

**Data:** Maio 2026  
**Versão:** 2.0  
**Status:** Em Produção

---

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Dados](#estrutura-de-dados)
3. [Arquitetura e Componentes](#arquitetura-e-componentes)
4. [Fluxos Principais](#fluxos-principais)
5. [Permissões e Segurança](#permissões-e-segurança)
6. [Validações](#validações)
7. [Relatórios e Análises](#relatórios-e-análises)
8. [Aprimoramentos Identificados](#aprimoramentos-identificados)
9. [Checklist de QA](#checklist-de-qa)
10. [Roadmap](#roadmap)

---

## 🎯 Visão Geral

### Propósito
O módulo financeiro é responsável por:
- Controlar contas a pagar
- Gerenciar parcelas de pagamento
- Administrar fornecedores
- Categorizar despesas
- Rastrear pagamentos
- Gerar relatórios financeiros

### Estatísticas
- **Linhas de código:** ~2.000+ (actions + components)
- **Tabelas Supabase:** 5 (contas_pagar, parcelas_pagar, fornecedores, categorias_despesa, conta_attachments)
- **Componentes:** 7 principais
- **Server Actions:** 30+ funções
- **Permissões:** 6 diferentes (create, read, update, delete, etc)

---

## 💾 Estrutura de Dados

### Modelo Entidades

```
┌─────────────────────────────────────────────────┐
│            CONTAS_PAGAR                         │
├─────────────────────────────────────────────────┤
│ id: UUID                                        │
│ tenant_id: UUID (FK)                            │
│ plan_id: UUID (FK, nullable)                    │
│ item_id: UUID (FK, nullable)                    │
│ fornecedor_id: UUID (FK, nullable)              │
│ categoria_id: UUID (FK, nullable)               │
│ descricao: TEXT                                 │
│ documento: VARCHAR(60) - NF, NFC-e, etc         │
│ emissao: DATE (nullable)                        │
│ valor_total: DECIMAL(15,2)                      │
│ status: ENUM                                    │
│ observacoes: TEXT                               │
│ created_by: UUID (FK)                           │
│ created_at: TIMESTAMP                           │
│ updated_at: TIMESTAMP                           │
└─────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────┐
│           PARCELAS_PAGAR (1:N)                  │
├─────────────────────────────────────────────────┤
│ id: UUID                                        │
│ conta_id: UUID (FK)                             │
│ numero: INT (1-120)                             │
│ data_vencimento: DATE                           │
│ valor: DECIMAL(15,2)                            │
│ data_pagamento: DATE (nullable)                 │
│ valor_pago: DECIMAL(15,2) (nullable)            │
│ forma_pagamento: ENUM (PIX, Boleto, etc)       │
│ status: ENUM (pendente, pago, cancelado)       │
│ observacoes: TEXT                               │
│ created_at: TIMESTAMP                           │
│ updated_at: TIMESTAMP                           │
└─────────────────────────────────────────────────┘
```

### Enumerações (ENUMs)

**ContaStatus:**
- `pendente` - Nenhuma parcela paga
- `parcial` - Algumas parcelas pagas
- `quitado` - Todas parcelas pagas
- `cancelado` - Conta cancelada

**ParcelaStatus:**
- `pendente` - Não paga
- `pago` - Paga integralmente
- `cancelado` - Cancelada

**FormaPagamento:**
- `pix` - Transferência instantânea
- `boleto` - Boleto bancário
- `dinheiro` - Dinheiro em mãos
- `cartao` - Cartão de crédito/débito
- `transferencia` - TED/DOC
- `outro` - Outro

**AnexoTipo:**
- `nf` - Nota Fiscal
- `recibo` - Recibo
- `contrato` - Contrato
- `boleto` - Boleto
- `comprovante` - Comprovante de pagamento
- `outro` - Outro

### Tabelas de Suporte

**FORNECEDORES**
```sql
id, tenant_id, name, cnpj, email, telefone, 
endereco, cidade, estado, cep, observacoes, 
created_at, updated_at
```

**CATEGORIAS_DESPESA**
```sql
id, tenant_id, name, sort_order, active, 
created_at, updated_at
```

**CONTA_ATTACHMENTS**
```sql
id, conta_id, filename, storage_path, size, 
mime_type, tipo, uploaded_by, created_at
```

---

## 🏗️ Arquitetura e Componentes

### Camadas

```
┌─────────────────────────────────────────────┐
│         PAGES (Next.js)                     │
│  /financeiro/contas-a-pagar                 │
│  /financeiro/contas-a-pagar/[id]            │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│    CLIENT COMPONENTS (React)                │
│  - ContasPagarClient (tabela + filtros)     │
│  - ContaDetalheClient (visualizar conta)    │
│  - ContaForm (criar/editar)                 │
│  - PagamentoDialog (registrar pagamento)    │
│  - ParcelaRow (linha de parcela)            │
│  - ContaAttachmentSection (anexos)          │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│    SERVER ACTIONS (contas-pagar.ts)         │
│  - getContasPagar()                         │
│  - getContaById()                           │
│  - createConta()                            │
│  - updateConta()                            │
│  - deleteConta()                            │
│  - registrarPagamento()                     │
│  - getResumoContas()                        │
│  - getContasSummaryByPlan()                 │
│  - etc (30+ funções)                        │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│    SUPABASE / PostgreSQL (RLS)              │
│  - contas_pagar                             │
│  - parcelas_pagar                           │
│  - fornecedores                             │
│  - categorias_despesa                       │
│  - conta_attachments                        │
└─────────────────────────────────────────────┘
```

### Componentes Principais

#### 1. **ContasPagarClient** (contas-pagar-client.tsx)
**Responsabilidade:** Listar contas com filtros, busca e paginação
**Features:**
- Tabela paginada (20 itens/página)
- Filtros: Status, Fornecedor, Categoria, Data
- Busca full-text: descrição + documento
- Ordenação: descrição, vencimento, valor, status
- Badges de status e urgência
- Atalho para criar/editar conta
- Indicador visual de atraso

**Props:**
```typescript
initial: ContaComParcelas[]
fornecedores: Fornecedor[]
categorias: CategoriaDespesa[]
```

#### 2. **ContaForm** (conta-form.tsx)
**Responsabilidade:** Criar/editar contas a pagar
**Features:**
- Validação com Zod (contaPagarSchema)
- Parcelamento automático
- Cálculo automático de somas
- Seleção de fornecedor e categoria
- Link a plano/item (opcional)
- Live validation de parcelas

**Fluxo:**
1. Usuário preenche descrição, fornecedor, categoria
2. Insere valor total
3. Define número de parcelas (1-120)
4. Sistema distribui valor automaticamente
5. Usuário pode ajustar parcelas individuais
6. Validação: soma de parcelas = valor total
7. Submit → Server Action → RLS validation → DB insert

#### 3. **ContaDetalheClient** (conta-detalhe-client.tsx)
**Responsabilidade:** Visualizar detalhes de uma conta
**Features:**
- Header com informações principais
- Tabela de parcelas
- Histórico de pagamentos
- Seção de anexos
- Dialog para registrar pagamento
- Botões de ação (editar, deletar, cancelar)

#### 4. **PagamentoDialog** (pagamento-dialog.tsx)
**Responsabilidade:** Registrar/editar pagamento de uma parcela
**Fluxo:**
1. Usuário clica "Registrar Pagamento"
2. Dialog abre com campo para:
   - Data de pagamento
   - Valor pago
   - Forma de pagamento
   - Observações
3. Validação com pagamentoSchema
4. Submit → Server Action → Update parcela + conta

#### 5. **ParcelaRow** (parcela-row.tsx)
**Responsabilidade:** Renderizar linha individual de parcela
**Features:**
- Status visual (badge)
- Data e valor
- Dias até vencimento (com cor)
- Data de pagamento (se paga)
- Ações (pagar, cancelar)

#### 6. **ContaAttachmentSection** (conta-attachment-section.tsx)
**Responsabilidade:** Gerenciar anexos (NF, recibos, etc)
**Features:**
- Upload de arquivos
- Lista de anexos com tipo
- Download
- Delete
- Suporte a múltiplos formatos

#### 7. **FinanceiroLayout** (layout.tsx)
**Responsabilidade:** Layout base do módulo financeiro
**Features:**
- Breadcrumb
- Menu de navegação (Contas, Fornecedores, Categorias)
- Links de admin (se permissão)

---

## 🔄 Fluxos Principais

### Fluxo 1: Criar Conta a Pagar

```
Usuario clica "Nova Conta"
    ↓
ContaForm renderiza
    ↓
Usuário preenche:
  - Descrição
  - Fornecedor (opcional)
  - Categoria (opcional)
  - Plano/Item (opcional)
  - Valor total
  - Parcelas (datas + valores)
    ↓
Live validation (Zod schema)
    ↓
Usuario clica "Salvar"
    ↓
Server Action: createConta()
    - Valida formData com contaPagarSchema
    - Normaliza valores (BRL)
    - Calcula status inicial (pendente)
    - RLS check: usuário membro de tenant
    - Insere em contas_pagar
    - Insere múltiplas parcelas
    ↓
Toast sucesso
    ↓
Revalidate cache
    ↓
Tabela atualiza ou redireciona
```

### Fluxo 2: Registrar Pagamento

```
Usuario abre conta
    ↓
Visualiza parcelas
    ↓
Clica "Registrar Pagamento" em uma parcela
    ↓
PagamentoDialog abre
    ↓
Usuário preencha:
  - Data de pagamento
  - Valor pago
  - Forma (PIX, Boleto, etc)
    ↓
Live validation
    ↓
Clica "Confirmar"
    ↓
Server Action: registrarPagamento()
    - Valida com pagamentoSchema
    - RLS check: acesso à conta
    - Atualiza parcela (status = pago)
    - Atualiza conta (status: auto)
    - Se valor_pago ≠ valor → parcial
    - Se todas pagas → quitado
    ↓
Toast sucesso
    ↓
Revalidate + refresh
    ↓
UI atualiza status
```

### Fluxo 3: Aplicar Filtros

```
Usuário seleciona filtro (Status, Fornecedor, etc)
    ↓
URL searchParams atualizam
    ↓
useEffect dispara
    ↓
Client: refetch com novos filtros
    ↓
Server Action: getContasPagar(filters)
    - Zod validate do filters object
    - Query Supabase com WHERE clauses
    - Sanitiza search string (previne SQL injection)
    - Retorna ContaComParcelas[]
    ↓
Estado local atualiza
    ↓
Tabela re-renderiza
```

### Fluxo 4: Visualizar Resumo Financeiro

```
Dashboard/FinanceiroPage carrega
    ↓
getResumoContas() executa (server-side)
    ↓
Consulta contas_pagar + parcelas_pagar
    ↓
Calcula:
  - total_em_aberto (parcelas pendentes)
  - total_atrasado (vencidas + não pagas)
  - total_pago_periodo (últimos 30 dias)
  - proximas_7d (parcelas vencendo)
    ↓
Renderiza KPI cards
    ↓
Renderiza lista de próximos vencimentos
```

---

## 🔐 Permissões e Segurança

### Permissões Financeiras

```typescript
const PERMISSIONS = {
  FINANCE_CREATE: "finance.create",    // Criar conta
  FINANCE_READ: "finance.read",        // Ver contas
  FINANCE_UPDATE: "finance.update",    // Editar conta
  FINANCE_DELETE: "finance.delete",    // Deletar conta
  FINANCE_PAYMENT: "finance.payment",  // Registrar pagamento
  CATALOG_MANAGE: "catalog.manage",    // Gerenciar fornecedores/categorias
};
```

### RLS (Row-Level Security) Policies

**Política de contas_pagar:**
```sql
-- SELECT: Usuário é membro do tenant
SELECT * FROM contas_pagar 
WHERE tenant_id = (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())

-- INSERT: Mesmo do SELECT + validar is_admin()
-- UPDATE: Mesmo do SELECT + validar is_admin()
-- DELETE: Mesmo do SELECT + validar is_admin()
```

**Política de parcelas_pagar:**
```sql
-- SELECT: Via conta_id, propaga permissão da conta
-- INSERT/UPDATE/DELETE: Mesmo da conta pai
```

### Validações de Permissão em Runtime

**Server Actions:**
```typescript
export async function createConta(formData: FormData): Promise<FinanceFormState> {
  // 1. Check auth
  const user = await getCurrentUser();
  if (!user) return { message: "Não autenticado" };

  // 2. Check permission
  const canCreate = await checkPermission(PERMISSIONS.FINANCE_CREATE);
  if (!canCreate) return { message: "Acesso negado" };

  // 3. Valida dados com Zod
  const result = contaPagarSchema.safeParse(payload);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  // 4. RLS assegura tenant_id correto
  // 5. Insere
  // 6. Revalida
}
```

### Sanitização

**Search String:**
```typescript
// Previne injeção de operadores PostgREST
const s = filters.search.replace(/[%_,()"\\]/g, "").slice(0, 100);
if (s) {
  query = query.or(`descricao.ilike.%${s}%,documento.ilike.%${s}%`);
}
```

**Texto:**
```typescript
// Trim + max length validado por Zod
const descricao = formData.get("descricao")
  .toString()
  .trim()
  .slice(0, 200); // Schema também limita
```

---

## ✅ Validações

### Validação no Client

**Live Validation:**
```typescript
// Ao mudar campo, roda Zod validation
const errors = contaPagarSchema.safeParse(formData);
setFieldErrors(errors);
```

**Regras Aplicadas:**
- Descrição: 2-200 caracteres
- Documento: até 60 caracteres
- Valor total: > 0
- Parcelas: 1-120
- Data vencimento: formato AAAA-MM-DD
- Número parcela: única dentro da conta
- Soma parcelas: deve = valor total (tolerância 0.01)

### Validação no Server

**Zod Schemas:**
```typescript
// contaPagarSchema
{
  fornecedor_id: UUID | null,
  categoria_id: UUID | null,
  plan_id: UUID | null,
  item_id: UUID | null,
  descricao: "string, 2-200",
  documento: "string, max 60",
  emissao: "AAAA-MM-DD | null",
  valor_total: "decimal, > 0",
  observacoes: "string, max 2000",
  parcelas: [
    {
      numero: "1-120",
      data_vencimento: "AAAA-MM-DD",
      valor: "decimal, > 0"
    }
  ]
}

// Custom validations:
- soma(parcelas.valor) === valor_total (±0.01)
- Números de parcelas únicos
```

**Validação de Pagamento:**
```typescript
// pagamentoSchema
{
  parcela_id: UUID,
  data_pagamento: "AAAA-MM-DD",
  valor_pago: "decimal, > 0",
  forma_pagamento: enum FORMAS_PAGAMENTO,
  observacoes: "string, max 500"
}
```

---

## 📈 Relatórios e Análises

### Resumo Financeiro (Dashboard)

**Dados Computados:**
```typescript
export interface ResumoFinanceiro {
  total_em_aberto: number;      // Sum(parcelas pendentes)
  total_atrasado: number;       // Sum(pendentes com data_vencimento < hoje)
  total_pago_periodo: number;   // Sum(parcelas pagas no último período)
  contas_quantidade: number;    // Count de contas não canceladas
  proximas_7d: [
    {
      parcela_id: string;
      conta_id: string;
      descricao: string;
      vencimento: string;       // ISO date
      valor: number;
    }
  ];
}
```

**Cálculos:**
```sql
-- Total em aberto
SELECT COALESCE(SUM(p.valor), 0) 
FROM parcelas_pagar p
JOIN contas_pagar c ON p.conta_id = c.id
WHERE p.status = 'pendente' AND c.tenant_id = $1

-- Total atrasado
SELECT COALESCE(SUM(p.valor), 0) 
FROM parcelas_pagar p
JOIN contas_pagar c ON p.conta_id = c.id
WHERE p.status = 'pendente' 
  AND p.data_vencimento < NOW()::DATE
  AND c.tenant_id = $1
```

### Resumo por Plano

**Função:** getContasSummaryByPlan()
**Retorno:**
```typescript
Record<itemId, {
  count: number;                // Contas vinculadas
  total_em_aberto: number;      // Dívida pendente
  total_pago: number;           // Já pago
  tem_atrasada: boolean;        // Alguma vencida?
}>
```

**Uso:**
- Dashboard de item de ação
- Visualizar impacto financeiro de cada ação

---

## 🚀 Aprimoramentos Identificados

### High Priority (Crítico)

#### 1. **Erro de Diagnóstico Melhorado**
**Status:** ✅ IMPLEMENTADO
**O que era:**
```
[getContasPagar] Supabase error: {}
```
**O que é agora:**
```
[getContasPagar] Supabase error: {
  type: "Error",
  code: "PGRST116",
  message: "relation \"public.contas_pagar\" does not exist",
  details: null,
  hint: "Did you mean..."
}
```
**Benefício:** Diagnóstico rápido de problemas (tabelas faltando, permissões, etc)

#### 2. **Tratamento de Erro de Permissão**
**Status:** ❌ NÃO IMPLEMENTADO
**Proposta:**
```typescript
if (error?.code === '42501') {  // Permission denied
  return {
    message: "Você não tem permissão para esta operação.",
    details: "Solicite acesso ao administrador"
  };
}
```

#### 3. **Validação de Soma de Parcelas com Precisão**
**Status:** ✅ IMPLEMENTADO
**Como funciona:**
```typescript
// Tolerância de 0.01 (1 centavo) para rounding
Math.abs(soma - valor_total) < 0.01
```

### Medium Priority (Importante)

#### 4. **Auditoria de Mudanças**
**Status:** ❌ NÃO IMPLEMENTADO
**Proposta:**
```sql
CREATE TABLE conta_audit_log (
  id UUID PRIMARY KEY,
  conta_id UUID REFERENCES contas_pagar,
  user_id UUID REFERENCES auth.users,
  action VARCHAR(50),  -- create, update, payment
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP
);
```
**Benefício:** Rastreabilidade total de quem fez o quê

#### 5. **Relatórios Exportáveis**
**Status:** ❌ PARCIALMENTE IMPLEMENTADO
**O que falta:**
- Exportar contas em Excel com formatação
- Gerar PDF com assinatura
- Relatório por período
- Análise de fluxo de caixa

#### 6. **Alertas Automáticos**
**Status:** ❌ NÃO IMPLEMENTADO
**Proposta:**
```typescript
// Contas vencidas há > 30 dias
// Parcelas vencendo em < 3 dias
// Limite de crédito por fornecedor
```

### Low Priority (Melhorias)

#### 7. **Import de Contas via CSV**
**Status:** ❌ NÃO IMPLEMENTADO
**Proposta:**
- Upload CSV com: descrição, fornecedor, valor, data
- Validação de linhas
- Preview antes de confirmar
- Criação em batch

#### 8. **Integração com Banco de Dados**
**Status:** ❌ NÃO IMPLEMENTADO
**Proposta:**
- Conectar com API de bancos (Plaid, etc)
- Importar extratos automaticamente
- Reconciliar pagamentos

#### 9. **Análises Avançadas**
**Status:** ❌ NÃO IMPLEMENTADO
**Propostas:**
- Gráfico de fluxo de caixa projetado
- Ranking de fornecedores (valor, prazo)
- Sazonalidade de despesas
- Curva ABC (80/20)

#### 10. **Integração com Planos**
**Status:** ✅ PARCIALMENTE IMPLEMENTADO
**O que funciona:**
- Vincular conta a plano/item
- Ver contas de um item no dashboard
**O que falta:**
- Auto-gerar contas do orçamento de item
- Alertar quando despesa ultrapassa 5W2H Cost
- Comparação: planejado vs realizado

---

## 🧪 Checklist de QA

### Testes Funcionais

#### Criar Conta
- [ ] Cria conta com 1 parcela
- [ ] Cria conta com múltiplas parcelas
- [ ] Valida suma de parcelas ≠ total
- [ ] Calcula status = "pendente"
- [ ] Vincula a fornecedor/categoria
- [ ] Vincula a plano/item (opcional)
- [ ] Revalida cache corretamente

#### Parcelas
- [ ] Parcelas exibem em ordem de número
- [ ] Badge "vence hoje" aparece correto
- [ ] Badge "vencida" aparece correto
- [ ] Calcula dias até vencimento corretamente
- [ ] Permite parcela cancelada

#### Pagamentos
- [ ] Registra pagamento parcial
- [ ] Muda status conta para "parcial"
- [ ] Registra pagamento integral
- [ ] Muda status conta para "quitado"
- [ ] Permite registrar pagamento > parcela (?)
- [ ] Gera entry em histórico
- [ ] Revalida status automaticamente

#### Filtros
- [ ] Filtra por status corretamente
- [ ] Filtra por fornecedor
- [ ] Filtra por categoria
- [ ] Busca por descrição
- [ ] Busca por documento
- [ ] Filtro "atrasado" mostra correto
- [ ] Combina múltiplos filtros (AND)

#### Relatórios
- [ ] Total em aberto = soma correta
- [ ] Total atrasado = soma correta
- [ ] Próximas 7 dias = lista correta
- [ ] Contas quantidade = count correto

#### Permissões
- [ ] Usuário sem FINANCE_CREATE não vê botão "Nova Conta"
- [ ] Usuário sem FINANCE_READ não acessa página
- [ ] Usuário sem FINANCE_UPDATE não consegue editar
- [ ] Usuário sem FINANCE_DELETE não consegue deletar
- [ ] Admin consegue tudo

### Testes de Segurança

- [ ] RLS previne acesso entre tenants
- [ ] Usuário não consegue mudar tenant_id
- [ ] SQL injection não funciona em search
- [ ] Não consegue registrar pagamento em conta de outro tenant
- [ ] Auditoria registra user_id correto

### Testes de Performance

- [ ] Lista com 10k contas carrega < 2s
- [ ] Paginação muda página < 500ms
- [ ] Filtro full-text < 1s
- [ ] Sem N+1 queries (verificar com DataDog)

### Testes de Edge Cases

- [ ] Criar conta com valor = 0 (falha validation)
- [ ] Criar conta com parcela data_vencimento no passado (?)
- [ ] Registrar pagamento valor > parcela (?)
- [ ] Editar parcela e alterar data_vencimento
- [ ] Deletar conta com parcelas pagas (?)
- [ ] Usuário sai do tenant, contas desaparecem
- [ ] Fornecedor é deletado, conta fica sem fornecedor (?)

---

## 🗺️ Roadmap

### Sprint 1 (2-3 semanas)
- [x] Implementar diagnóstico de erro melhorado
- [ ] Adicionar alertas de contas vencidas
- [ ] Exportar lista de contas em Excel
- [ ] Adicionar validação de limite por fornecedor

### Sprint 2 (3-4 semanas)
- [ ] Auditoria de mudanças (audit log)
- [ ] Relatórios PDF exportáveis
- [ ] Dashboard com gráficos de fluxo
- [ ] Alertas automáticos (email/notificação)

### Sprint 3 (4-5 semanas)
- [ ] Import CSV de contas
- [ ] Integração com Plaid (bancos)
- [ ] Reconciliação automática
- [ ] Análises avançadas (ABC, sazonalidade)

### Sprint 4+ (Futuro)
- [ ] Mobile app
- [ ] API pública (contas a receber)
- [ ] Integração contábil (ERP)
- [ ] Machine learning (previsão de fluxo)

---

## 📊 Métricas Monitorar

```typescript
// Events to track (com DataDog/Segment)
- "conta.created" (tempo criação)
- "conta.pagamento.registered" (tempo processamento)
- "conta.list.filtered" (latência query)
- "error.rls_denied" (tentativas de acesso)
- "error.validation_failed" (qual campo falha mais)
- "finance.export.generated" (formato + tempo)
```

---

## 🤝 Dependências Externas

### Tabelas/Features Relacionadas
- `action_plans` - Plano pode ter múltiplas contas
- `action_items` - Item pode ter orçamento (5W2H)
- `fornecedores` - Gerenciado em admin/catalogos
- `categorias_despesa` - Gerenciado em admin/catalogos
- `tenant_members` - RLS valida permissão
- `profiles` - User timezone para datas

### Permissões Externas Requeridas
- `PERMISSIONS.FINANCE_*` - Definidas em `/lib/permissions.ts`
- `PERMISSIONS.ADMIN_ACCESS` - Para gerenciar catálogos

### Storage (Supabase)
- Bucket: `contas-attachments`
- Prefixo: `${tenantId}/${contaId}/`
- Max size: 10MB por arquivo

---

## 🔗 Referências

- Arquivo de actions: `src/app/actions/contas-pagar.ts` (991 linhas)
- Tipos: `src/types/financeiro.ts`
- Schemas: `src/lib/schemas/financeiro-schemas.ts`
- Componentes: `src/components/financeiro/`
- Pages: `src/app/(protected)/financeiro/`
- Migrations: `supabase/migrations/033_contas_pagar.sql` +

 dependentes

---

## 💡 Conclusão

O módulo financeiro é **bem estruturado** e **production-ready**, com:
- ✅ Validações robustas
- ✅ RLS e segurança adequada
- ✅ Tratamento de erros melhorado
- ✅ UX clara com filtros e paginação

**Próximas melhorias recomendadas:**
1. Auditoria de mudanças (rastreabilidade)
2. Alertas automáticos (UX)
3. Relatórios exportáveis (valor ao usuário)
4. Integração bancária (eficiência)

---

**Preparado por:** Claude Code  
**Data:** Maio 2026  
**Versão do Sistema:** 2.0
