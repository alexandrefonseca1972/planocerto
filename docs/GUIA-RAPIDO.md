# ⚡ Guia Rápido - PlanoCerto

Comandos e referências essenciais.

---

## 🚀 Setup Local (5 min)

```bash
# 1. Clone
git clone <repo>
cd planocerto

# 2. Dependências
npm install

# 3. Variáveis (.env.local)
cp .env.local.example .env.local
# Preencha as variáveis

# 4. Dev
npm run dev

# ✅ Pronto! Acesse http://localhost:3000
```

---

## 📋 Variáveis .env.local

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Resend)
RESEND_API_KEY=re_xxx

# Google Calendar (OAuth)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Teams (opcional)
TEAMS_WEBHOOK_URL=https://outlook.webhook.office.com/...
```

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Servidor local
npm run typecheck        # Verifica tipos
npm run lint             # ESLint
npm test                 # Testes
npm test:watch           # Testes contínuos

# Build
npm run build            # Build produção
npm start                # Roda build localmente

# Database (Supabase local)
supabase start           # Inicia Supabase local
supabase db push         # Roda migrations
supabase db pull         # Puxa schema do remoto
supabase stop            # Para Supabase local

# Git
git status               # Status
git add .                # Stage changes
git commit -m "msg"      # Commit
git push origin main     # Push

# Deploy
vercel --prod            # Deploy Vercel manual
```

---

## 📁 Estrutura Rápida

```
src/
├── app/(protected)/         # Páginas protegidas
│   ├── admin/              # Painel admin
│   ├── planos/             # Planos 5W2H
│   ├── financeiro/         # Financeiro
│   └── dashboard/          # Dashboard
├── app/actions/            # Server actions
├── components/             # Componentes React
├── lib/
│   ├── supabase/           # Clientes Supabase
│   ├── validations/        # Zod schemas
│   └── permissions.ts      # RBAC
└── types/                  # TypeScript
```

---

## 🔐 Autenticação

### Login API
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### Logout API
```typescript
await supabase.auth.signOut();
```

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

---

## 📊 RBAC (Papéis)

| Papel | Permissões |
|-------|-----------|
| **super_admin** | Tudo (28 permissões) |
| **admin** | Tudo (28 permissões) |
| **manager** | Usuários, planos, financeiro (24) |
| **user** | Planos próprios (4) |
| **viewer** | Leitura (1) |

---

## 💾 Banco de Dados

### Tabelas Principais
```sql
profiles              -- Usuários
tenants              -- Empresas
action_plans         -- Planos 5W2H
action_items         -- Itens de ação
contas_pagar         -- Contas a pagar
parcelas_pagar       -- Parcelas
fornecedores         -- Fornecedores
categorias_despesa   -- Categorias
```

### Acessar Supabase Dashboard
```
https://app.supabase.com
→ Seu projeto → SQL Editor
```

### Query Rápida
```sql
-- Listar planos do tenant
SELECT * FROM action_plans 
WHERE tenant_id = 'UUID'
ORDER BY created_at DESC
LIMIT 10;

-- Listar usuários
SELECT id, email, name, role 
FROM profiles 
WHERE tenant_id = 'UUID';

-- Listar contas atrasadas
SELECT * FROM contas_pagar 
WHERE status != 'quitado' 
AND (SELECT COUNT(*) FROM parcelas_pagar 
     WHERE conta_id = contas_pagar.id 
     AND data_vencimento < NOW()) > 0;
```

---

## 🧪 Testes

```bash
# Rodar todos
npm test

# Watch mode
npm test:watch

# Um arquivo específico
npm test -- utils.test.ts

# Com coverage
npm test -- --coverage
```

### Exemplo Teste
```typescript
import { describe, it, expect } from 'vitest';
import { validateEmail } from '@/lib/utils';

describe('validateEmail', () => {
  it('deve validar email correto', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('deve rejeitar email inválido', () => {
    expect(validateEmail('invalid')).toBe(false);
  });
});
```

---

## 🚢 Deploy

### Vercel (Automático)
```
Git push → GitHub → Vercel webhook
→ npm run build → Deploy
→ https://planocerto.vercel.app
```

### Vercel Manual
```bash
npm run build     # Build local
vercel --prod     # Deploy
```

### Preview Link
Cada PR gera link de preview automático no Vercel.

---

## 🐛 Debug

### Console Log Servidor
```typescript
// Em Server Action/Server Component
export async function myAction() {
  console.log('Server log aqui'); // Aparece no terminal
  
  return { /* ... */ };
}
```

### Chrome DevTools
```javascript
// Network tab → Veja requests
// Application → Cookies → Veja JWT
// Console → Veja erros client
```

### Supabase Logs
```
https://app.supabase.com
→ Seu projeto → Edge Functions / Database
→ Logs reais
```

---

## 📱 Responsive

Breakpoints Tailwind (PlanoCerto usa defaults):
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

Exemplo:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols */}
</div>
```

---

## 🎨 Tailwind

### Common Classes
```
Margin:    m-4 (1rem), mt-2, ml-8
Padding:   p-4, pt-2, px-6
Display:   flex, grid, block, hidden
Grid:      grid-cols-2, gap-4
Text:      text-lg, font-bold, text-red-600
Colors:    bg-blue-500, text-white
Rounded:   rounded-lg, rounded-full
Shadow:    shadow, shadow-lg
```

### Dark Mode
```tsx
<div className="bg-white dark:bg-slate-900">
  {/* Branco em light, escuro em dark */}
</div>
```

---

## 🔑 Componentes UI (shadcn)

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';

<Button onClick={() => {}}>Clique</Button>
<Input placeholder="Buscar..." />
<Dialog open={open} onOpenChange={setOpen}>
  {/* conteúdo */}
</Dialog>
```

---

## 📝 Validação (Zod)

```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  age: z.number().int().min(18),
});

// Usar
try {
  const data = schema.parse(formData);
} catch (e) {
  console.error(e.errors); // Array de erros
}
```

---

## 🔗 Server Actions

```typescript
'use server';

export async function myAction(formData: FormData) {
  const email = formData.get('email');
  
  // Rodar no servidor (seguro)
  const result = await database.query(/* ... */);
  
  revalidatePath('/planos'); // Atualizar cache
  
  return result;
}
```

### Usar no Frontend
```tsx
'use client';

import { myAction } from '@/app/actions';

export default function MyComponent() {
  return (
    <form action={myAction}>
      <input name="email" required />
      <button type="submit">Enviar</button>
    </form>
  );
}
```

---

## 🔄 Revalidação Cache

```typescript
// Invalida rota específica
revalidatePath('/planos/123');

// Invalida padrão
revalidatePath('/planos/[id]');

// Invalida tudo de uma rota
revalidatePath('/planos', 'layout');

// Invalida tag
revalidateTag('planos');
```

---

## 🚨 Erros Comuns

### "RLS policy violation"
Solução:
```typescript
// ❌ Errado
const { data } = await supabase
  .from('action_plans')
  .select()
  .eq('id', planId);

// ✅ Correto
const { data } = await supabase
  .from('action_plans')
  .select()
  .eq('id', planId)
  .eq('tenant_id', tenantId);
```

### "JWT inválido"
Solução: Função usa `await SupabaseServerClient()`

### "Tipo não compatível"
Solução: `npm run typecheck` e fix erros

### Build fail no Vercel
Solução:
```bash
npm run typecheck  # Fix types
npm run lint       # Fix linting
git push           # Resubmeter
```

---

## 🆘 Onde Procurar

| Problema | Procure |
|----------|---------|
| Criar plano | `src/app/actions/action-plan.ts` |
| UI tabela | `src/components/planos/plan-table.tsx` |
| Validação | `src/lib/validations/` |
| Permissões | `src/lib/permissions.ts` |
| Banco dados | `supabase/migrations/` |
| Tipos | `src/types/` |
| Testes | `src/__tests__/` |

---

## 📞 Recursos

- Docs: `/docs` (este repositório)
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs
- React: https://react.dev
- Zod: https://zod.dev
- Tailwind: https://tailwindcss.com

---

## ✅ Checklist Antes de Commitar

- [ ] `npm run typecheck` — sem erros
- [ ] `npm run lint` — sem warnings
- [ ] `npm test` — todos passam
- [ ] Funciona localmente (`npm run dev`)
- [ ] Sem `console.log` debug
- [ ] Commit message descritivo

---

## 🔀 Git Workflow

```bash
# Feature novo
git checkout -b feature/meu-recurso

# Trabalhe...
git add .
git commit -m "feat: descrição"

# Push
git push origin feature/meu-recurso

# Pull request no GitHub
# Review + Merge → Auto deploy Vercel
```

---

**Última atualização:** Maio 2024  
**Versão:** 1.0.0
