# Migrations 073/074 — somente repositório (linha isolada)

Estas migrations existem na branch `release/v2.8.0-isolated` e **não devem** ser
aplicadas em produção sem:

1. Backup do banco
2. Aplicação e validação em **staging** (projeto Supabase separado)
3. Aprovação explícita do dono do produto
4. `supabase migration list` / repair se o histórico estiver dessincronizado

Conteúdo:
- `073_schools_geolocation.sql` — `schools.latitude`, `schools.longitude`
- `074_companies_geolocation.sql` — `companies.latitude`, `companies.longitude`

Comando **proibido** neste contexto isolado: `supabase db push` apontando para o projeto de produção.

Quando for promover: usar `supabase db push` (ou SQL Editor) **no ambiente alvo**
após merge consciente da branch.
