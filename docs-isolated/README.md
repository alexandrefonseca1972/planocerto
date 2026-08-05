# Linha isolada — v2.8.0-isolated

> **Produção (`main` / deploy Vercel prod) NÃO deve ser alterada por este trabalho.**

## Branch

| | |
|---|---|
| Branch de trabalho | `release/v2.8.0-isolated` |
| Base de produção | `main` @ 2.7.x |
| Remote | `origin/release/v2.8.0-isolated` |
| PR | Draft only — **sem merge** sem autorização explícita |

## O que NÃO fazer

1. `git merge release/v2.8.0-isolated` em `main`
2. `git push origin main` com commits desta linha
3. `vercel --prod` / promote preview → production
4. `supabase db push` no projeto Supabase de **produção**
5. Rotacionar secrets de prod sem atualizar Vercel no mesmo momento (só se for incidente de vazamento)

## O que é seguro

1. Desenvolver e commitar em `release/v2.8.0-isolated`
2. `git push origin release/v2.8.0-isolated`
3. Abrir **PR draft** para revisão
4. Preview Vercel da branch (não é produção)
5. Supabase **local** ou projeto **staging** separado para migrations 073/074

## Migrations nesta linha (só no git)

- `073_schools_geolocation.sql`
- `074_companies_geolocation.sql`

Ver `supabase/migrations/073_074_ISOLATED.md`.

## Como testar localmente

```bash
git checkout release/v2.8.0-isolated
npm install
npm run dev          # webpack (darwin x64)
npm test
npm run test:e2e     # opcional: E2E_EMAIL/PASSWORD para fluxos auth
```

## Ativar RAG (local/staging)

Definir no `.env.local` (não commitar):

```
EMBEDDINGS_API_KEY=...
EMBEDDINGS_BASE_URL=https://api.openai.com/v1
EMBEDDINGS_MODEL=text-embedding-3-small
```

Sem a chave, a sugestão 5W2H segue só com contexto regional (fail-safe).

## Critérios para promover a produção (futuro)

1. Checklist de segurança revisado
2. CI verde na PR
3. Staging validado (auth, planos, financeiro, geo se for o caso)
4. Migrations 073/074 aplicadas em staging e depois em prod com backup
5. Aprovação explícita do dono do produto
6. Merge em `main` + deploy controlado
