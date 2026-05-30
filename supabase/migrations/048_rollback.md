# Rollback Migration 048 — reset_action_plans

Esta migration deleta TODOS os dados de planos de ação, Diário Oficial, simulador
e correlações, preservando catálogos e infraestrutura.

## Dados afetados

- `action_plans` (DELETE CASCADE → action_items, plan_audit_log, public_links)
- `action_items` (DELETE CASCADE → plan_attachments, calendar_sync, item_comments)
- `contas_pagar` (SET NULL em plan_id e item_id)
- `do_publications` (DELETE CASCADE → do_entities)
- `entity_correlations` (DELETE)
- `simulator_scenarios` (DELETE CASCADE → simulator_channel_metrics)

## Como reverter

**Única forma segura:** Restaurar a partir de um backup completo do banco
(usando `pg_dump` ou backup do Supabase) feito imediatamente antes da execução.

**Procedimento:**
1. Identificar o backup pré-migration
2. Restaurar as tabelas afetadas listadas acima
3. Verificar integridade referencial após restauração

**IMPORTANTE:** Sem um backup, a deleção é IRREVERSÍVEL.
