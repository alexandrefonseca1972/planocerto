# Convenções de Migrations

## Isolamento (release/v2.8.0-isolated)

| Arquivo | Conteúdo | Aplicar em produção? |
|---|---|---|
| `073_schools_geolocation.sql` | `schools.latitude/longitude` | **Só com autorização** + staging primeiro |
| `074_companies_geolocation.sql` | `companies.latitude/longitude` | **Só com autorização** + staging primeiro |

Numeração **073/074** evita colisão com `065_tenant_member_roles` e `066_tenant_scoped_rls_*` da main.  
**Nunca** rodar `supabase db push` no projeto de produção sem checklist e backup.

## Nomenclatura

- Prefixo numérico sequencial de 3 dígitos: `NNN_descricao_curta.sql`
- snake_case, descritivo, em inglês para palavras técnicas e português para contexto
- Números devem ser únicos — sem duplicatas
- Para migrations que precisam rodar entre números existentes, usar sufixo alfabético (ex: `045a`, `045b`)

## Regras

1. **DDL com idempotência:** Usar `IF EXISTS` / `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`
2. **Políticas RLS:** Sempre `DROP POLICY IF EXISTS` antes de `CREATE POLICY`
3. **Sem seed data em migrations:** Dados de referência vão em arquivos de seed (`supabase/seed-*.sql`)
4. **Migrations destrutivas:** (DROP TABLE, DELETE FROM) exigem documentação de rollback (`NNN_rollback.md`)
5. **Cada migration faz UMA coisa:** Evitar misturar criação de tabelas não-relacionadas na mesma migration
6. **Sem BEGIN/COMMIT explícito:** Supabase wrappa cada migration em transaction automaticamente
7. **COMMENT ON COLUMN/TABLE** recomendado para documentar schema inline
