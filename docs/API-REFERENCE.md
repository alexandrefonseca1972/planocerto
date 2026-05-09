# 🔌 API Reference - PlanoCerto

## Visão Geral

PlanoCerto expõe funcionalidades via **Server Actions** (backend) e **Supabase Postgrest** (banco de dados). Não há REST API pública explícita, mas você pode usar o cliente Supabase.

### Tipos de Acesso

1. **Server Actions** — Funções TypeScript seguras no servidor
2. **Supabase JavaScript Client** — Acesso direto ao banco (com RLS)
3. **Supabase REST API** — Endpoints HTTP automáticos (Postgrest)

---

## Autenticação

### JWT Token

Todos os requests requerem autenticação:

```typescript
// Obter token no servidor
const supabase = await SupabaseServerClient();
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Usar em requests
const response = await fetch('https://xxxx.supabase.co/rest/v1/table', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
});
```

### Refresh Token

Token expira em 1 hora. `@supabase/ssr` renova automaticamente.

---

## Server Actions

Server Actions são funções TypeScript que rodam no servidor.

### Padrão

```typescript
'use server';

import { SupabaseServerClient } from '@/lib/supabase/server';
import { CreatePlanSchema } from '@/lib/validations';

export async function createPlan(formData: FormData) {
  // 1. Validar
  const parsed = CreatePlanSchema.parse({
    title: formData.get('title'),
    unit: formData.get('unit'),
    // ...
  });

  // 2. Autenticar
  const supabase = await SupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // 3. Executar
  const { data, error } = await supabase
    .from('action_plans')
    .insert({
      tenant_id: user.user_metadata.active_tenant_id,
      title: parsed.title,
      unit: parsed.unit,
      // ...
    })
    .select()
    .single();

  if (error) throw error;

  // 4. Revalidar cache
  revalidatePath('/planos');
  
  return { success: true, data };
}
```

### Action Plans

#### Criar Plano

**Arquivo:** `src/app/actions/action-plan.ts`

```typescript
export async function createActionPlan(formData: FormData) {
  // Cria um novo plano 5W2H
  // Retorna: { success, data: ActionPlan }
}

// Uso no frontend:
const formAction = createActionPlan;
// <form action={formAction}>
```

**Input:**
```typescript
{
  title: string;        // "Implementar CRM"
  unit: string;         // "Vendas"
  director: string;     // "João Silva"
  goal: string;         // "Aumentar vendas 30%"
  tenant_id: string;    // UUID
}
```

**Output:**
```typescript
{
  success: boolean;
  data: {
    id: string;
    tenant_id: string;
    title: string;
    unit: string;
    director: string;
    goal: string;
    status: "active" | "archived";
    user_id: string;
    created_at: string;
    updated_at: string;
  }
}
```

#### Atualizar Plano

```typescript
export async function updateActionPlan(
  id: string,
  data: Partial<ActionPlan>
) {
  // Atualiza plano existente
}
```

#### Deletar Plano

```typescript
export async function deleteActionPlan(id: string) {
  // Deleta plano (apenas admin)
}
```

#### Arquivar Plano

```typescript
export async function archiveActionPlan(id: string) {
  // Muda status para "archived"
}
```

### Action Items

#### Criar Item

**Arquivo:** `src/app/actions/action-plan.ts`

```typescript
export async function createActionItem(
  planId: string,
  parentId: string | null,
  data: ActionItemInput
) {
  // Cria item dentro de plano
  // Pode ser subordinado a outro item (parentId)
}
```

**Input:**
```typescript
{
  action: string;           // O quê
  why: string;              // Por quê
  where: string;            // Onde
  responsible: string;      // Quem
  planned_start: string;    // Quando (data)
  planned_end: string;      // Quando (data)
  cost: string;             // Quanto
  expected_result: string;  // Como
  observations: string;     // Notas
}
```

#### Atualizar Item

```typescript
export async function updateActionItem(id: string, data: Partial<ActionItem>) {
  // Atualiza item existente
}
```

#### Mudar Status

```typescript
export async function updateActionItemStatus(
  id: string,
  status: 1 | 2 | 3 | 4 | 5  // Não iniciada até Concluído
) {
  // Atualiza apenas o status
}
```

#### Deletar Item

```typescript
export async function deleteActionItem(id: string) {
  // Deleta item (apenas admin/manager)
}
```

### Comentários

```typescript
export async function addComment(
  itemId: string,
  text: string,
  mentions: string[]  // Opcional: emails para mencionar
) {
  // Adiciona comentário em item
}

export async function deleteComment(commentId: string) {
  // Deleta comentário (apenas autor)
}
```

### Anexos

```typescript
export async function uploadAttachment(
  itemId: string,
  file: File,
  attachmentType: 'image' | 'document' | 'spreadsheet'
) {
  // Upload arquivo para Storage
  // Retorna: { url, size, mime_type }
}

export async function deleteAttachment(attachmentId: string) {
  // Remove arquivo de Storage
}
```

---

## Contas a Pagar

### Criar Conta

**Arquivo:** `src/app/actions/contas-pagar.ts`

```typescript
export async function createContaPagar(formData: FormData) {
  // Cria nova conta a pagar
}
```

**Input:**
```typescript
{
  descricao: string;
  documento: string;        // NF number
  emissao: string;          // ISO date
  valor_total: number;
  status: ContaStatus;      // "pendente", "parcial", etc
  observacoes: string;
  fornecedor_id?: string;
  categoria_id?: string;
  plan_id?: string;         // Link a plano (opcional)
  item_id?: string;         // Link a item (opcional)
}
```

### Registrar Pagamento

```typescript
export async function registrarPagamento(
  parcelaId: string,
  data: {
    data_pagamento: string;
    valor_pago: number;
    forma_pagamento: FormaPagamento;  // 'pix', 'boleto', etc
  }
) {
  // Registra pagamento em parcela
  // Atualiza status de conta automaticamente
}
```

### Fornecedores

```typescript
export async function createFornecedor(data: {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}) {
  // Cria fornecedor
}

export async function updateFornecedor(id: string, data: Partial<Fornecedor>) {
  // Atualiza fornecedor
}

export async function deactivateFornecedor(id: string) {
  // Desativa fornecedor (soft delete)
}
```

### Categorias

```typescript
export async function createCategoria(name: string) {
  // Cria categoria de despesa
}

export async function updateCategoria(id: string, name: string) {
  // Atualiza nome
}

export async function reorderCategorias(ids: string[]) {
  // Atualiza ordem (sort_order)
}
```

---

## Admin

### Usuários

```typescript
export async function createUser(data: {
  email: string;
  name: string;
  role: 'viewer' | 'user' | 'manager' | 'admin';
  tenant_id: string;
  areas?: string[];         // IDs de áreas (restrição)
  units?: string[];         // IDs de unidades (restrição)
  login_start_time?: string;
  login_end_time?: string;
}) {
  // Convida novo usuário (envia email)
}

export async function updateUser(id: string, data: Partial<User>) {
  // Atualiza permissões, papel, restrições
}

export async function deleteUser(id: string) {
  // Desativa usuário (soft delete)
}

export async function grantPermissions(
  userId: string,
  permissions: Permission[]
) {
  // Sobrescreve permissões do papel
}
```

### Papéis

```typescript
export async function createRole(data: {
  key: string;              // slug único: "supervisor"
  label: string;            // "Supervisor"
  description: string;
  permissions: Permission[];
  tenant_id?: string;       // Se custom por tenant
}) {
  // Cria papel custom
}

export async function updateRole(id: string, data: Partial<Role>) {
  // Atualiza papel
}

export async function deleteRole(id: string) {
  // Deleta papel (apenas se sem usuários)
}
```

### Tenants

```typescript
export async function createTenant(data: {
  name: string;
  slug: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  state: string;
}) {
  // Cria nova empresa (super_admin apenas)
}

export async function updateTenant(id: string, data: Partial<Tenant>) {
  // Atualiza informações
}

export async function uploadTenantLogo(tenantId: string, file: File) {
  // Upload logo
}
```

---

## Supabase REST API (Postgrest)

Você também pode acessar diretamente pelo Postgrest:

### Listar Planos

```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://xxxx.supabase.co/rest/v1/action_plans?tenant_id=eq.UUID"
```

### Inserir Plano

```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Meu Plano","unit":"TI",...}' \
  "https://xxxx.supabase.co/rest/v1/action_plans"
```

### Atualizar

```bash
curl -X PATCH -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"archived"}' \
  "https://xxxx.supabase.co/rest/v1/action_plans?id=eq.UUID"
```

### Deletar

```bash
curl -X DELETE -H "Authorization: Bearer TOKEN" \
  "https://xxxx.supabase.co/rest/v1/action_plans?id=eq.UUID"
```

---

## JavaScript Client (Supabase)

### Setup

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

### Exemplo: Listar Planos

```typescript
const { data, error } = await supabase
  .from('action_plans')
  .select(`
    *,
    action_items(
      id,
      action,
      status,
      planned_end
    )
  `)
  .eq('tenant_id', tenantId)
  .order('created_at', { ascending: false });

if (error) throw error;
return data;
```

### Exemplo: Criar Item com Comentário

```typescript
// 1. Insert item
const { data: item } = await supabase
  .from('action_items')
  .insert({
    plan_id: planId,
    action: 'Fazer pesquisa',
    status: 1,
    // ...
  })
  .select()
  .single();

// 2. Insert comment
await supabase
  .from('item_comments')
  .insert({
    item_id: item.id,
    content: 'Item criado',
    user_id: userId,
  });

return item;
```

### Exemplo: Real-time Listening

```typescript
const subscription = supabase
  .from('action_items')
  .on('*', payload => {
    console.log('Change:', payload);
    // Atualizar UI
  })
  .subscribe();

// Depois
subscription.unsubscribe();
```

---

## Rate Limiting

- **Postgrest:** 1000 requests/minuto por IP
- **Auth:** 100 login attempts/hora por IP
- **Storage:** 50 uploads/minuto

---

## Erros Comuns

### 403 Forbidden
**Causa:** RLS policy negou acesso
**Solução:** Verifique tenant_id e permissões

```typescript
// ❌ Errado
const { data } = await supabase
  .from('action_plans')
  .select()
  .eq('id', itemId);  // RLS rejeita

// ✅ Correto
const { data } = await supabase
  .from('action_plans')
  .select()
  .eq('id', itemId)
  .eq('tenant_id', userTenantId);  // Match tenant
```

### 401 Unauthorized
**Causa:** Token inválido/expirado
**Solução:** Re-login ou aguarde renovação

### 400 Bad Request
**Causa:** Validação Zod falhou
**Solução:** Cheque tipos dos campos

```typescript
// ❌ Errado
{ planned_start: "2024-01-01" }  // String

// ✅ Correto
{ planned_start: new Date("2024-01-01").toISOString() }
```

---

## Webhooks (Futura)

Planejamos adicionar webhooks para:
- Quando plano é criado/atualizado
- Quando item muda status
- Quando conta vence
- Quando comentário é adicionado

---

## Rate Limits

```
Endpoint                    Limite          Janela
───────────────────────────────────────────────────
Create Action Plan          100/min         user
Update Action Item          100/min         user
Upload Attachment           20/min          user
Create Conta Pagar          100/min         user
Admin endpoints             50/min          admin
```

---

## Versioning

Atualmente em **v1.0.0**. Mudanças breaking serão em nova versão.

---

## Documentação Adicional

- [Zod Schemas](../src/lib/validations)
- [Database Types](../src/lib/supabase/database.types.ts)
- [Server Actions](../src/app/actions)
- [Supabase Docs](https://supabase.com/docs)

---

**Versão API:** 1.0.0  
**Última atualização:** Maio 2024
