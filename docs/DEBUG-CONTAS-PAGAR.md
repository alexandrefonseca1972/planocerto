# 🔧 Debugando Erro getContasPagar

Erro: `[getContasPagar] Supabase error: {}`

---

## 📋 Diagnóstico

O erro acontece quando a função `getContasPagar()` tenta buscar contas a pagar, mas o Supabase retorna um erro vazio.

### Causas Possíveis

1. **Migrations não foram rodadas** ❌
   - Tabelas `contas_pagar`, `parcelas_pagar`, `categorias_despesa` não existem
   - RLS policies não estão ativas

2. **Usuário não autenticado** ❌
   - JWT token expirado ou inválido
   - Session perdida

3. **RLS policy bloqueando** ❌
   - Usuário não é membro do tenant
   - Falta função `is_admin()` ou `tenant_members`

4. **Erro de foreign key** ❌
   - Tabela `fornecedores` não existe (migration 032)
   - Referência para `action_plans` ou `action_items` quebrada

---

## ✅ Solução Passo-a-Passo

### 1️⃣ Verificar Migrations

```bash
# Se usar Supabase local
supabase status

# Ver migrations rodadas
supabase db shell
SELECT * FROM _pg_migrations;

# Ou no dashboard Supabase
Settings → Database → Migrations
```

### 2️⃣ Rodar Migrations (se necessário)

```bash
# Local
supabase db push

# Production (Supabase Cloud)
# Via dashboard ou CLI:
supabase db push --linked
```

### 3️⃣ Verificar se Tabelas Existem

```sql
-- No Supabase SQL Editor ou terminal
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Procure por:
-- ✓ contas_pagar
-- ✓ parcelas_pagar
-- ✓ categorias_despesa
-- ✓ conta_attachments
-- ✓ fornecedores (migration 032)
```

### 4️⃣ Verificar RLS Policies

```sql
-- SQL para ver policies
SELECT schemaname, tablename, policyname, qual 
FROM pg_policies 
WHERE tablename IN ('contas_pagar', 'parcelas_pagar');

-- Procure por policies:
-- ✓ contas_pagar read/insert/update/delete
-- ✓ parcelas_pagar read/insert/update/delete
```

### 5️⃣ Verificar Autenticação

```typescript
// No código, adicione log:
const supabase = await createClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();

console.log('Auth user:', user?.id);
console.log('Auth error:', authError);

// Sem user, RLS vai bloquear tudo
```

### 6️⃣ Verificar Acesso ao Tenant

```sql
-- Seu user_id (encontre em auth.users ou profiles)
SELECT * FROM tenant_members 
WHERE user_id = 'SEU_USER_ID';

-- Se vazio = não está membro de nenhum tenant
-- Adicione:
INSERT INTO tenant_members (tenant_id, user_id, role)
VALUES ('TENANT_UUID', 'USER_UUID', 'admin');
```

### 7️⃣ Verificar Função is_admin()

```sql
-- Teste a função
SELECT is_admin();

-- Se retorna erro, função não existe ou JWT inválido
-- Função deve estar em migration 001 ou 030
```

---

## 🔍 Logs Melhorados

A versão atualizada de `contas-pagar.ts` agora mostra melhor:

```
[getContasPagar] Supabase error: {
  type: 'Error',
  code: 'PGRST116',           // 404 - tabela não encontrada
  message: 'relation "public.contas_pagar" does not exist',
  details: null,
  hint: 'Did you mean ...'
}
```

---

## 🛠️ Problemas Comuns e Soluções

### Problema: Tabelas não existem

**Erro:**
```
code: 'PGRST116'
message: 'relation "public.contas_pagar" does not exist'
```

**Solução:**
```bash
supabase db push
```

---

### Problema: RLS bloqueando

**Erro:**
```
code: 'PGRST201' (ou 42501)
message: 'new row violates row-level security policy'
```

**Solução:**
Verificar:
1. User está autenticado? `await supabase.auth.getUser()`
2. User é membro do tenant? `SELECT * FROM tenant_members WHERE user_id = ...`
3. Função `is_admin()` existe? `SELECT is_admin()`

---

### Problema: Foreign key inválida

**Erro:**
```
code: 'PGRST116'
message: 'relation "public.fornecedores" does not exist'
```

**Solução:**
```bash
# Migration 032 não foi rodada
supabase db push
```

---

### Problema: User não autenticado

**Erro:**
```
[getContasPagar] Supabase error: {
  type: 'Error'
  // Sem code, message, details
}
```

**Solução:**
```typescript
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) {
  console.error('User not authenticated!');
  return [];
}
```

---

## 📝 Checklist de Debug

- [ ] Migrations rodadas? (`supabase db push`)
- [ ] Tabelas existem? (`SELECT tablename FROM pg_tables ...`)
- [ ] RLS policies ativas? (`SELECT policyname FROM pg_policies ...`)
- [ ] User autenticado? (`auth.getUser()`)
- [ ] User é membro de tenant? (`tenant_members`)
- [ ] Função `is_admin()` existe? (`SELECT is_admin()`)
- [ ] Logs atualizados mostram detalhes? (check `contas-pagar.ts`)

---

## 🔗 Comandos Rápidos

```bash
# Ver status Supabase local
supabase status

# Rodar migrations
supabase db push

# Acessar SQL editor local
supabase db shell

# Ver logs em tempo real
supabase functions serve

# Reset database (⚠️ apaga dados)
supabase db reset

# Restart services
supabase stop
supabase start
```

---

## 📞 Se Continuar com Erro

1. **Capture o erro melhorado:**
   ```
   [getContasPagar] Supabase error: {
     code: '...',
     message: '...',
     details: '...'
   }
   ```

2. **Verifique:**
   - Code do erro no Postgres (e.g., `PGRST116` = not found, `42501` = permission)
   - Se migration existe: `supabase migrations list`
   - Se RLS policy está correta

3. **Consulte:**
   - [Supabase Error Codes](https://supabase.com/docs/api/error-codes)
   - [PostgreSQL Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html)
   - Documentação técnica: `DOCUMENTACAO-TECNICA.md`

---

## 🎯 Teste Depois de Corrigir

```typescript
// Teste simples
const contas = await getContasPagar();
console.log('Contas:', contas.length); // Deve ser um array (vazio ou não)
```

---

**Última atualização:** Maio 2024  
**Versão:** 1.0
