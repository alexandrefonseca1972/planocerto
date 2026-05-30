# Convenções de Migrations

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
