# Rollback da 084_macro_acao_normalizacao

A 084 remove itens agrupadores duplicados (mesmo plano, mesma macro ação com grafia diferente)
depois de mover filhos, comentários, anexos, contas e auditoria para o grupo mantido.
A fusão não é reversível por SQL: os IDs dos grupos removidos e a numeração antiga dos filhos se perdem.

## Antes de aplicar em produção

1. Gere um backup: `pg_dump -Fc -f pre-084.dump <banco>`.
2. Veja o que será fundido:

```sql
WITH g AS (
  SELECT id, plan_id, action,
         upper(regexp_replace(regexp_replace(translate(upper(btrim(action)),
           'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
           'AAAAAEEEEIIIIOOOOOUUUUCAAAAAEEEEIIIIOOOOOUUUUC'), '\s*-\s*', ' ', 'g'), '\s+', ' ', 'g')) AS k
  FROM action_items i
  WHERE parent_id IS NULL AND EXISTS (SELECT 1 FROM action_items c WHERE c.parent_id = i.id)
)
SELECT plan_id, k, count(*), string_agg(action, ' / ') FROM g GROUP BY 1, 2 HAVING count(*) > 1;
```

## Para desfazer

Restaure as tabelas `action_items`, `item_comments`, `plan_attachments`, `contas_pagar`,
`plan_audit_log` e `macro_acoes` a partir do backup:
`pg_restore --data-only --table=<tabela> ...` (com triggers desativados) ou restaure o banco inteiro.
A troca de nomes para caixa alta, sozinha, não precisa ser desfeita.
