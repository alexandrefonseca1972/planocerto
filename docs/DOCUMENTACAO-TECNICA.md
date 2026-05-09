# 📚 Documentação Técnica - PlanoCerto

## Visão Geral

**PlanoCerto** é uma plataforma SaaS de planos de ação baseada na metodologia 5W2H (What, Why, Where, Who, When, How, How Much). Oferece funcionalidades avançadas para gestão de projetos, financeiro e colaboração em tempo real.

### Características Principais
- ✅ Multi-tenant com isolamento completo de dados
- ✅ RBAC (Role-Based Access Control) com 5 papéis padrão
- ✅ Permissões granulares por usuário
- ✅ Planos 5W2H com drag-and-drop Kanban
- ✅ Módulo financeiro (contas a pagar, fornecedores)
- ✅ Dashboard executivo com KPIs
- ✅ Notificações por email (Resend)
- ✅ Integração Microsoft Teams
- ✅ Sincronização Google Calendar

---

## Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | Next.js App Router | 16.2.4 |
| | React | 19.2.4 |
| | TypeScript | 5.x |
| | Tailwind CSS | 4.x |
| **Backend** | Supabase (PostgreSQL) | - |
| | Authentication | JWT |
| | RLS (Row-Level Security) | ✅ Ativada |
| **Bibliotecas** | Zod | Validação |
| | React Hook Form | Formulários |
| | @dnd-kit | Drag-and-drop |
| | Lucide Icons | Ícones |
| | Resend | Email |
| **Testes** | Vitest | Unit tests |
| | Testing Library | Component tests |
| **Deploy** | Vercel | CI/CD automático |

---

## Arquitetura

```
PlanoCerto
├── Frontend (Next.js 15+)
│   ├── App Router protegido
│   ├── Server Components
│   └── Server Actions
├── Backend (Supabase)
│   ├── PostgreSQL + RLS
│   ├── Postgrest (API automática)
│   └── Edge Functions (opcional)
└── Armazenamento
    ├── Storage (anexos)
    ├── Database (dados)
    └── Auth (usuários)
```

### Fluxo de Autenticação

```
1. Usuário faz login
   ↓
2. Supabase Auth emite JWT
   ↓
3. JWT armazenado em cookie seguro (@supabase/ssr)
   ↓
4. Cada request valida JWT via RLS
   ↓
5. Policies PostgreSQL garantem isolamento
```

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/                    # Autenticação
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── update-password/
│   ├── (protected)/               # App protegido (RLS ativo)
│   │   ├── admin/                 # Painel administrativo
│   │   │   ├── catalogos/         # Catálogos de dados
│   │   │   ├── users/             # Gestão de usuários
│   │   │   ├── roles/             # Gestão de papéis
│   │   │   └── tenants/           # Gestão de empresas
│   │   ├── dashboard/             # Dashboard executivo
│   │   ├── planos/                # Planos de ação 5W2H
│   │   ├── financeiro/            # Módulo financeiro
│   │   │   ├── contas-pagar/
│   │   │   ├── fornecedores/
│   │   │   └── categorias/
│   │   ├── calendario/            # Calendário de prazos
│   │   ├── simulador/             # Simulador financeiro
│   │   ├── profile/               # Perfil do usuário
│   │   └── empresas/              # Multi-tenant
│   ├── actions/                   # Server Actions (20 arquivos)
│   │   ├── admin.ts               # Ações de admin
│   │   ├── action-plan.ts         # Planos de ação
│   │   ├── contas-pagar.ts        # Contas a pagar
│   │   ├── fornecedores.ts        # Fornecedores
│   │   ├── auth.ts                # Autenticação
│   │   ├── shared.ts              # Ações compartilhadas
│   │   └── ...
│   ├── api/                       # API Routes
│   │   └── export/                # Export PDF/Excel
│   └── s/[token]/                 # Dashboard público
├── components/
│   ├── admin/                     # Componentes de admin
│   ├── forms/                     # Formulários
│   ├── layout/                    # Layout components
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   └── tenant-selector.tsx
│   ├── planos/                    # Componentes de planos
│   │   ├── plan-table.tsx
│   │   ├── kanban-board.tsx
│   │   ├── gantt-chart.tsx
│   │   └── attachments.tsx
│   ├── financeiro/                # Componentes de financeiro
│   └── ui/                        # Componentes reutilizáveis
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Supabase client-side
│   │   ├── server.ts              # Supabase server-side
│   │   ├── admin.ts               # Admin client
│   │   └── database.types.ts      # Types gerados
│   ├── validations/               # Zod schemas
│   ├── schemas/                   # SQL schemas
│   ├── permissions.ts             # RBAC definitions
│   ├── email.ts                   # Email templates
│   ├── teams.ts                   # Teams webhook
│   ├── format-br.ts               # Formatação BR
│   └── utils.ts                   # Utilidades
├── types/                         # TypeScript interfaces
│   ├── action-plan.ts
│   ├── auth.ts
│   ├── tenant.ts
│   ├── financeiro.ts
│   └── ...
└── __tests__/                     # Testes
    ├── utils.test.ts
    └── validations.test.ts

supabase/
├── migrations/                    # 35 migrations SQL
│   ├── 001_profiles.sql
│   ├── 002_tenants.sql
│   ├── ...
│   └── 035_fornecedores_seed.sql
└── config.toml                    # Configuração local
```

---

## Sistema de Permissões (RBAC)

### Papéis Padrão

| Papel | Descrição | Permissões |
|-------|-----------|-----------|
| **super_admin** | Gerencia empresas e tem acesso total | 28 permissões |
| **admin** | Acesso total ao sistema | 28 permissões |
| **manager** | Gerencia usuários, empresas e planos | 24 permissões |
| **user** | Criar e editar planos | 4 permissões |
| **viewer** | Apenas leitura | 1 permissão |

### Permissões Disponíveis

```typescript
PERMISSIONS = {
  // Usuários
  USERS_READ, USERS_CREATE, USERS_UPDATE, USERS_DELETE,
  USERS_MANAGE_TENANTS,
  
  // Empresas (Tenants)
  TENANTS_READ, TENANTS_CREATE, TENANTS_UPDATE, TENANTS_DELETE,
  TENANTS_MANAGE_MEMBERS,
  
  // Planos
  PLANS_CREATE, PLANS_READ, PLANS_UPDATE, PLANS_DELETE,
  
  // Notificações
  NOTIFICATIONS_CREATE, NOTIFICATIONS_UPDATE, NOTIFICATIONS_DELETE,
  
  // Templates
  TEMPLATES_MANAGE,
  
  // Relatórios
  REPORTS_VIEW,
  
  // Configurações
  SETTINGS_MANAGE, ADMIN_ACCESS, ROLES_MANAGE,
  
  // Financeiro
  FINANCE_READ, FINANCE_CREATE, FINANCE_UPDATE, FINANCE_DELETE,
}
```

### Escopo por Usuário

Usuários podem ter acesso restrito a:
- **Áreas** (`user_areas`) — Áreas da empresa
- **Unidades** (`user_units`) — Unidades da empresa

Se vazio = sem restrição.

---

## Banco de Dados

### Tabelas Principais

#### `profiles` (Usuários)
```sql
id                 UUID (FK auth.users)
email              TEXT UNIQUE
name               TEXT
role               TEXT (super_admin, admin, manager, user, viewer)
permissions        JSONB (sobrescreve role)
is_active          BOOLEAN
login_start_time   TIME
login_end_time     TIME
active_tenant_id   UUID (FK tenants)
created_at         TIMESTAMP
updated_at         TIMESTAMP
```

#### `tenants` (Empresas)
```sql
id                 UUID PRIMARY KEY
name               TEXT
slug               TEXT UNIQUE
logo_url           TEXT
contact_email      TEXT
contact_phone      TEXT
address            TEXT
city               TEXT
state              TEXT
created_at         TIMESTAMP
updated_at         TIMESTAMP
```

#### `action_plans` (Planos 5W2H)
```sql
id                 UUID PRIMARY KEY
tenant_id          UUID (FK tenants)
title              TEXT
unit               TEXT
director           TEXT
goal               TEXT
status             action_plan_status (active, archived)
user_id            UUID (FK profiles)
created_at         TIMESTAMP
updated_at         TIMESTAMP
```

#### `action_items` (Itens de Ação)
```sql
id                 UUID PRIMARY KEY
plan_id            UUID (FK action_plans)
parent_id          UUID (FK action_items) -- hierarquia
number             TEXT (1.0, 1.1, etc)
action             TEXT (O QUÊ)
why                TEXT (POR QUÊ)
where              TEXT (ONDE)
responsible        TEXT (QUEM)
planned_start      DATE
planned_end        DATE
actual_start       DATE
actual_end         DATE
cost               TEXT
expected_result    TEXT
actual_result      TEXT
status             INT (1-5, "Não iniciada" até "Concluído")
observations       TEXT
created_at         TIMESTAMP
updated_at         TIMESTAMP
```

#### `contas_pagar` (Contas a Pagar)
```sql
id                 UUID PRIMARY KEY
tenant_id          UUID (FK tenants)
plan_id            UUID (FK action_plans) NULLABLE
item_id            UUID (FK action_items) NULLABLE
fornecedor_id      UUID (FK fornecedores) NULLABLE
categoria_id       UUID (FK categorias_despesa) NULLABLE
descricao          TEXT
documento          TEXT (número NF, etc)
emissao            DATE
valor_total        NUMERIC
status             conta_status (pendente, parcial, quitado, cancelado)
observacoes        TEXT
created_by         UUID (FK profiles)
created_at         TIMESTAMP
updated_at         TIMESTAMP
```

#### `parcelas_pagar` (Parcelas)
```sql
id                 UUID PRIMARY KEY
conta_id           UUID (FK contas_pagar)
numero             INT
data_vencimento    DATE
valor              NUMERIC
data_pagamento     DATE NULLABLE
valor_pago         NUMERIC NULLABLE
forma_pagamento    forma_pagamento (pix, boleto, dinheiro, etc)
status             parcela_status (pendente, pago, cancelado)
observacoes        TEXT
created_at         TIMESTAMP
updated_at         TIMESTAMP
```

### RLS (Row-Level Security)

**Todas as tabelas têm RLS ativado.** Policies garantem:
- Usuários veem apenas dados do seu tenant
- Admins veem dados do seu tenant + gerenciados
- Super admins veem tudo

Exemplo de policy:
```sql
-- Usuários veem planos do seu tenant
CREATE POLICY "Users see their tenant plans"
ON action_plans FOR SELECT
USING (
  tenant_id = (SELECT active_tenant_id FROM profiles WHERE id = auth.uid())
  OR (SELECT is_admin() FROM profiles WHERE id = auth.uid())
);
```

---

## Server Actions

Server Actions são funções TypeScript que rodmm no servidor (seguras).

### Padrão de Server Action

```typescript
import { SupabaseServerClient } from '@/lib/supabase/server';

export async function myAction(formData: FormData) {
  const supabase = await SupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Unauthorized');
  
  // Lógica de negócio aqui
  const { data, error } = await supabase
    .from('table')
    .insert({ /* ... */ });
    
  if (error) throw error;
  
  return { success: true, data };
}
```

### Server Actions por Domínio

| Arquivo | Funcionalidade |
|---------|----------------|
| `auth.ts` | Login, registro, reset senha |
| `action-plan.ts` | CRUD de planos e itens |
| `admin.ts` | Gestão de usuários, papéis, tenants |
| `contas-pagar.ts` | CRUD de contas e parcelas |
| `fornecedores.ts` | CRUD de fornecedores |
| `shared.ts` | Ações compartilhadas |
| `tenant.ts` | Gestão de tenants |

---

## Validações

Zod é usado para validar dados em client e server.

### Exemplo

```typescript
// lib/validations/admin.ts
export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['user', 'manager', 'admin']),
  tenant_id: z.string().uuid(),
});

type CreateUserInput = z.infer<typeof CreateUserSchema>;

// No formulário
const form = useForm<CreateUserInput>({
  resolver: zodResolver(CreateUserSchema),
});
```

---

## Notificações

### Email (Resend)

```typescript
// lib/email.ts
export async function sendPlanNotification(
  email: string,
  planTitle: string,
  userName: string
) {
  const html = `
    <h1>Plano: ${planTitle}</h1>
    <p>Olá ${userName}!</p>
    <!-- ... -->
  `;
  
  await resend.emails.send({
    from: 'noreply@planocerto.com',
    to: email,
    subject: `Plano: ${planTitle}`,
    html,
  });
}
```

### Microsoft Teams (Adaptive Cards)

```typescript
// lib/teams.ts
export async function notifyTeams(
  webhookUrl: string,
  planTitle: string,
  actionItem: string
) {
  const card = {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      contentUrl: null,
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          { type: 'TextBlock', text: planTitle, weight: 'bolder' },
          { type: 'TextBlock', text: actionItem },
        ],
      },
    }],
  };
  
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  });
}
```

---

## Desenvolvimento

### Setup Local

```bash
# 1. Clone o repositório
git clone <repo-url>
cd planocerto

# 2. Instale dependências
npm install

# 3. Crie .env.local
cp .env.local.example .env.local
# Preencha as variáveis

# 4. Rodar migrations (se usar Supabase local)
supabase start
supabase db push

# 5. Desenvolva
npm run dev
```

### Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx

# Email
RESEND_API_KEY=re_xxxx

# Google Calendar
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxx

# Teams (opcional)
TEAMS_WEBHOOK_URL=https://outlook.webhook.office.com/...

# APP
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Testes

```bash
# Rodar testes
npm test

# Watch mode
npm test:watch

# Com coverage
npm test -- --coverage
```

### Build e Deploy

```bash
# Build local
npm run build

# Start produção local
npm start

# Deploy Vercel (automático via GitHub)
git push origin main
```

---

## Migrations

Cada migration incrementa a versão do banco.

### Estrutura de Migration

```sql
-- supabase/migrations/NNN_descricao.sql
-- Criar nova tabela
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see their tenant" ON new_table
FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

-- Índices
CREATE INDEX idx_new_table_tenant_id ON new_table(tenant_id);
```

### Migrations Principais

| ID | Descrição |
|----|-----------|
| 001 | Profiles (usuários) |
| 002 | Tenants (empresas) |
| 004 | Action Plans 5W2H |
| 005 | Audit Log |
| 006 | RBAC + Notificações |
| 011 | Plan Attachments |
| 016 | Permission System |
| 021 | Custom Roles |
| 027 | Areas/Units by Tenant |
| 030 | Super Admin + User Scopes |
| 032 | Fornecedores |
| 033 | Contas a Pagar |

---

## React 19 / TypeScript

### Strict Rules

O projeto usa `eslintConfig: { extends: ['next/core-web-vitals'] }` com regras estritas.

#### ❌ Não permitido

```typescript
// Refs em render
const ref = useRef(null);
return <div ref={ref} />; // Erro se não usado

// setState direto em effect
useEffect(() => {
  setCount(count + 1); // Erro: dependency missing
}, [count]);

// Tipo `any`
const data: any = ...;
```

#### ✅ Permitido

```typescript
// Refs com propósito claro
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => {
  inputRef.current?.focus();
}, []);

// useCallback para dependências complexas
const handleChange = useCallback(() => {
  setCount(count + 1);
}, [count]);

// Types explícitos
interface User { id: string; name: string; }
const user: User = { id: '1', name: 'John' };
```

---

## Performance

### Next.js 15+ Otimizações

1. **App Router** — Melhor performance que Pages Router
2. **Server Components** — Padrão; apenas componentes interativos usam `'use client'`
3. **Streaming** — Dashboard carrega incrementalmente
4. **Image Optimization** — `next/image` automático
5. **Code Splitting** — Lazy loading de páginas

### Checklist de Performance

- [ ] Componentes interativos têm `'use client'`
- [ ] Queries Supabase não rodam em render
- [ ] Imagens usam `next/image`
- [ ] Bundles monitorados (`npm run build`)
- [ ] Testes de performance no CI/CD

---

## Segurança

### Checklist

- [x] RLS em todas as tabelas
- [x] Validação Zod em client e server
- [x] JWT em cookies seguro (`@supabase/ssr`)
- [x] Sanitização de input (XSS prevention)
- [x] CORS configurado no Supabase
- [x] Rate limiting em API routes
- [x] Senhas hasheadas (Supabase Auth)
- [x] Audit log de ações

### Exemplo: RLS + Permissions

```typescript
// Server action: apenas admins podem deletar usuários
export async function deleteUser(userId: string) {
  const supabase = await SupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('permissions')
    .single();
  
  if (!hasPermission(profile, 'users.delete')) {
    throw new Error('Unauthorized');
  }
  
  // RLS vai garantir que não delete usuários de outro tenant
  return supabase.from('profiles').delete().eq('id', userId);
}
```

---

## Troubleshooting

### Problema: "RLS policy violation"
**Solução:** Verify que o user está no tenant correto (`active_tenant_id`).

### Problema: "JWT inválido"
**Solução:** Verifique se `@supabase/ssr` está configurado no layout.tsx.

### Problema: "Permissão negada"
**Solução:** Verifique `permissions.ts` e a policy RLS.

### Problema: Build fail no Vercel
**Solução:** Rode `npm run typecheck` localmente e `npm run lint`.

---

## Referências

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Zod Docs](https://zod.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React 19 Upgrade](https://react.dev/blog/2024/12/19/react-19)
