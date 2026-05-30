# Rollback Migration 004 — action_plan_5w2h

Esta migration é a base inicial do sistema (cria `action_plans`, `action_items`, RLS, triggers).
É a 4ª migration do projeto, executada apenas em ambientes novos.

## Como reverter

O rollback desta migration não é prático pois ela cria as tabelas fundamentais do sistema.
Se aplicada em um banco já populado, o `DROP TABLE IF EXISTS action_plans CASCADE` no início
causaria perda de dados.

**Pré-condição para rollback:** Backup do banco antes da execução.

**Procedimento manual se necessário:**
1. Restaurar backup das tabelas `action_plans`, `action_items` e dependentes
2. Recriar políticas RLS conforme definidas na migration
3. Recriar triggers (updated_at, etc.)
4. Reaplicar grants
