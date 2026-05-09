# 🏗️ Arquitetura - PlanoCerto

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15+)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React 19 Components (TypeScript)                    │   │
│  │  ├─ Server Components (default)                      │   │
│  │  ├─ Client Components ('use client')                 │   │
│  │  └─ Server Actions (business logic)                  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/HTTPS
┌────────────────────▼────────────────────────────────────────┐
│               Supabase (Backend)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                                 │   │
│  │  ├─ 20+ tabelas                                      │   │
│  │  ├─ RLS Policies (segurança)                         │   │
│  │  ├─ Triggers (audit log)                             │   │
│  │  └─ Índices (performance)                            │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Auth (JWT)                                          │   │
│  │  ├─ Email/Password                                   │   │
│  │  ├─ Reset Password                                   │   │
│  │  └─ Session Management                               │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Storage (File Upload)                               │   │
│  │  ├─ Plan Attachments                                 │   │
│  │  ├─ Conta Attachments                                │   │
│  │  └─ Logos (tenant)                                   │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Postgrest (AutoAPI)                                 │   │
│  │  └─ GraphQL/REST endpoints auto-gerados              │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ 
         ┌───────────┴────────────┬─────────────┐
         │                        │             │
    ┌────▼─────┐       ┌────────▼──┐    ┌──────▼───┐
    │  Resend  │       │Google Cal │    │ Teams    │
    │ (Email)  │       │  (OAuth)  │    │(Webhook) │
    └──────────┘       └───────────┘    └──────────┘
```

---

## Fluxo de Dados

### 1. Autenticação

```
Usuário digita email/senha
        ↓
Frontend chama /auth/login (Server Action)
        ↓
Backend valida com Supabase Auth
        ↓
Auth retorna JWT + Refresh Token
        ↓
JWT armazenado em HTTP-Only Cookie (seguro)
        ↓
Header Authorization: Bearer <JWT>
        ↓
@supabase/ssr gerencia renovação automática
```

### 2. Request Autenticado

```
Frontend faz request (com JWT no cookie)
        ↓
Supabase valida JWT
        ↓
RLS Policy verifica tenant_id do usuário
        ↓
Policy aprova/nega acesso
        ↓
Dados retornam apenas do tenant autorizado
```

### 3. Server Action

```
Frontend: <form action={createPlan}>
        ↓
Form submete dados
        ↓
Server Action roda no servidor
        ↓
Valida com Zod Schema
        ↓
Chama Supabase (JWT incluído)
        ↓
RLS garante isolamento
        ↓
Retorna resultado para cliente
        ↓
Frontend atualiza UI (revalidação automática)
```

---

## Componentes de Rede

### Database (PostgreSQL)

```
Tabelas principais:
├─ profiles           (usuários)
├─ tenants            (empresas)
├─ action_plans       (planos 5W2H)
├─ action_items       (itens de ação)
├─ action_plan_items_attachments (anexos)
├─ contas_pagar       (contas a pagar)
├─ parcelas_pagar     (parcelas)
├─ conta_attachments  (anexos de conta)
├─ fornecedores       (fornecedores)
├─ categorias_despesa (categorias)
├─ areas              (áreas da empresa)
├─ units              (unidades)
├─ roles              (papéis custom)
├─ audit_log          (log de ações)
├─ notifications      (notificações)
├─ plan_templates     (templates)
└─ ...

RLS garantida em TODAS.
```

### Auth (Supabase Auth)

```
Fluxo OAuth:
Google Calendar → OIDC → Token → Refresh Token → Acesso
```

### Storage (Supabase Storage)

```
Buckets:
├─ plan-attachments/     (itens anexos)
│   └─ {tenant_id}/{plan_id}/{file}
├─ conta-attachments/    (contas anexos)
│   └─ {tenant_id}/{conta_id}/{file}
└─ tenant-logos/         (logos)
    └─ {tenant_id}/logo.png
```

---

## Modelo de Dados

### Relações Chave

```
tenants (1) ──→ (N) profiles
           ├─→ (N) action_plans
           ├─→ (N) contas_pagar
           ├─→ (N) fornecedores
           ├─→ (N) areas
           ├─→ (N) units
           └─→ (N) roles

action_plans (1) ──→ (N) action_items
              ├─→ (N) comments
              └─→ (N) attachments

contas_pagar (1) ──→ (N) parcelas_pagar
             ├─→ (N) conta_attachments
             ├─→ (1) fornecedores
             └─→ (1) categorias_despesa

profiles (1) ──→ (N) user_areas
         ├─→ (N) user_units
         └─→ (1) active_tenant
```

### Hierarquia de Items

```
action_items podem ser aninhados:

parent_id = NULL → Item raiz (1.0)
parent_id = 1.0 UUID → Subitem (1.1)
parent_id = 1.1 UUID → Sub-subitem (1.1.1)
```

---

## Permissões e RLS

### RLS Policy Exemplo

```sql
-- action_plans: Usuário vê planos do seu tenant
CREATE POLICY "users_see_tenant_plans" 
  ON action_plans FOR SELECT 
  USING (
    tenant_id = (
      SELECT active_tenant_id FROM profiles WHERE id = auth.uid()
    ) 
    OR is_admin(auth.uid())
  );

-- action_items: Herança da policy do plano
-- (se vê o plano, vê seus items)
```

### Permission Matrix

```
┌─────────────────┬─────────┬──────────┬─────────┬───────┐
│ Action          │ Viewer  │ User     │ Manager │ Admin │
├─────────────────┼─────────┼──────────┼─────────┼───────┤
│ Ler planos      │ ✅      │ ✅       │ ✅      │ ✅    │
│ Criar planos    │ ❌      │ ✅       │ ✅      │ ✅    │
│ Editar planos   │ ❌      │ ✅ own   │ ✅      │ ✅    │
│ Deletar planos  │ ❌      │ ❌       │ ❌      │ ✅    │
│ Gerenciar users │ ❌      │ ❌       │ ✅      │ ✅    │
│ Finananceiro    │ ❌      │ ✅ read  │ ✅      │ ✅    │
│ Admin panel     │ ❌      │ ❌       │ ✅      │ ✅    │
└─────────────────┴─────────┴──────────┴─────────┴───────┘
```

---

## Cache e Revalidação

### Next.js Caching

```
Request → Next.js Cache
  ├─ Static (revalidatePath)
  ├─ Dynamic (no cache)
  └─ ISR (incremental static regeneration)
```

### Estratégia PlanoCerto

```
Dashboard     → ISR 60s (KPIs não tão real-time)
Planos        → Dynamic (sempre fresh)
Financeiro    → Dynamic
Admin         → Dynamic (sensível)
Publico (s/)  → ISR 300s (link compartilhado)
```

### Revalidação

```typescript
// Server Action
export async function updatePlan(id: string, data: Plan) {
  // ... atualiza DB
  
  revalidatePath('/dashboard');      // Dashboard
  revalidatePath(`/planos/${id}`);   // Página do plano
  revalidatePath('/planos');         // Lista de planos
}
```

---

## Segurança em Camadas

### 1. Network
- HTTPS only
- CORS configurado no Supabase
- Rate limiting no Vercel

### 2. Auth
- JWT com expiry 1h
- Refresh token com expiry 7d
- HTTP-Only cookies (não acessível via JS)

### 3. Database
- RLS em todas as tabelas
- Policies validam auth.uid()
- Sem acesso direto sem auth

### 4. Application
- Zod validation
- Sanitização de input
- CSRF prevention (Next.js built-in)

### 5. API
- Server Actions (não exponível)
- STS headers (X-Frame-Options, etc)

---

## Performance

### Frontend Optimizations

```
1. Code Splitting → Lazy load pages
2. Image Optimization → next/image
3. Bundle Analysis → Monitore size
4. Server Components → Menos JS
5. Streaming → Dashboard carrega incrementalmente
```

### Backend Optimizations

```
1. Índices PostgreSQL → queries rápidas
2. Prepared Statements → SQL seguro e rápido
3. Connection Pooling → Supabase gerencia
4. Query Optimization → Evite N+1
5. Caching → Redis (opcional futura)
```

### Métricas

```
Target:
├─ LCP (Largest Contentful Paint) < 2.5s
├─ FID (First Input Delay) < 100ms
├─ CLS (Cumulative Layout Shift) < 0.1
└─ FCP (First Contentful Paint) < 1.8s
```

---

## Deployment

### Vercel (Frontend)

```
GitHub → Push
  ↓
Vercel Webhook detecta
  ↓
Build: npm run build
  ↓
Deploy automático
  ↓
Edge: CDN global
  ↓
https://planocerto.vercel.app
```

### Supabase (Backend)

```
PostgreSQL:
├─ Hosted na Supabase (cloud)
├─ Backups automáticos
├─ Point-in-time recovery
└─ Replicação geográfica (opcional)

Auth:
├─ JWT tokens
├─ Hosted sessions
└─ OAuth integrations

Storage:
├─ S3-compatible
├─ CDN automático
└─ 50GB free tier
```

---

## Troubleshooting de Performance

### Dashboard lento?
- Cheque N+1 queries
- Ative índices em PostgreSQL
- Reduza quantidade de items listados

### Anexo não sobe?
- Arquivo > 10MB? Aumente `maxFileSize` em API
- Bucket cheio? Limpe arquivos antigos
- Permissão Storage? Verifique RLS

### Login lento?
- JWT expirou? Aguarde renovação
- Auth em cache? Limpe cookies
- Supabase down? Checke status.supabase.com

---

## Roadmap Técnico

### Curto Prazo (1-2 sprints)
- [ ] Webhooks para notificações real-time
- [ ] Bulk operations (delete multi planos)
- [ ] Improved mobile UX

### Médio Prazo (3-6 meses)
- [ ] WebSocket para colaboração real-time
- [ ] Redis cache layer
- [ ] Full-text search com Postgres

### Longo Prazo (6+ meses)
- [ ] Edge Functions para notifications
- [ ] Multi-language (i18n)
- [ ] Custom workflows (no-code)
- [ ] Advanced analytics
