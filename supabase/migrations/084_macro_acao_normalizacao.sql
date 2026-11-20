-- 084: padroniza macro ações (itens agrupadores) e funde grupos duplicados no mesmo plano.
--
-- Regras (espelham src/lib/macro-acao.ts):
--   * nome gravado: espaços colapsados, sem espaço nas pontas, CAIXA ALTA;
--   * duplicidade: mesma chave ignorando caixa, acentos, hífens e espaços
--     ("Empresa - Ação" = "EMPRESA-AÇÃO" = "EMPRESA ACAO").
-- Grupos duplicados no mesmo plano: fica o que tem mais filhos (empate: menor sort_order);
-- os filhos dos demais passam para ele e são renumerados no fim (ex.: 4.29, 4.30...).
-- Comentários, anexos, contas e auditoria do grupo removido passam para o grupo mantido.
-- O limite de 40 caracteres vale para novas gravações; nomes longos existentes não são cortados.

CREATE OR REPLACE FUNCTION pg_temp.macro_norm(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  -- translate garante caixa alta nos acentos mesmo se o locale do banco for "C".
  SELECT translate(upper(regexp_replace(btrim(t), '\s+', ' ', 'g')),
                   'áàâãäéèêëíìîïóòôõöúùûüç', 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ')
$$;

CREATE OR REPLACE FUNCTION pg_temp.macro_key(t text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT btrim(regexp_replace(regexp_replace(
           translate(pg_temp.macro_norm(t), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC'),
           '\s*-\s*', ' ', 'g'), '\s+', ' ', 'g'))
$$;

DO $$
DECLARE
  dup record;
  keep_id uuid;
  keep_number text;
  next_n int;
  child record;
  new_number text;
BEGIN
  -- 1) Funde duplicados (mesmo plano + mesma chave) entre itens raiz que têm filhos.
  FOR dup IN
    WITH grupos AS (
      SELECT g.id, g.plan_id, g.sort_order, pg_temp.macro_key(g.action) AS k,
             (SELECT count(*) FROM action_items c WHERE c.parent_id = g.id) AS filhos
      FROM action_items g
      WHERE g.parent_id IS NULL
        AND EXISTS (SELECT 1 FROM action_items c WHERE c.parent_id = g.id)
    ), ranked AS (
      SELECT *, row_number() OVER (PARTITION BY plan_id, k ORDER BY filhos DESC, sort_order, id) AS rn,
             first_value(id) OVER (PARTITION BY plan_id, k ORDER BY filhos DESC, sort_order, id) AS keep
      FROM grupos
    )
    SELECT id, keep FROM ranked WHERE rn > 1 ORDER BY plan_id, sort_order
  LOOP
    keep_id := dup.keep;
    SELECT number INTO keep_number FROM action_items WHERE id = keep_id;
    SELECT coalesce(max(nullif(split_part(number, '.', 2), '')::int), 0)
      INTO next_n
      FROM action_items
     WHERE parent_id = keep_id AND split_part(number, '.', 2) ~ '^\d+$';

    FOR child IN SELECT id, number FROM action_items WHERE parent_id = dup.id ORDER BY sort_order, number LOOP
      next_n := next_n + 1;
      new_number := keep_number || '.' || next_n;
      UPDATE action_items SET parent_id = keep_id, number = new_number WHERE id = child.id;
      -- Descendentes do filho movido (subgrupos): troca o prefixo antigo pelo novo, mantendo o sufixo.
      WITH RECURSIVE sub AS (
        SELECT id FROM action_items WHERE parent_id = child.id
        UNION ALL
        SELECT c.id FROM action_items c JOIN sub ON c.parent_id = sub.id
      )
      UPDATE action_items d
         SET number = new_number || substr(d.number, length(child.number) + 1)
       WHERE d.id IN (SELECT id FROM sub)
         AND d.number LIKE child.number || '.%';
    END LOOP;

    UPDATE item_comments    SET item_id = keep_id WHERE item_id = dup.id;
    UPDATE plan_attachments SET item_id = keep_id WHERE item_id = dup.id;
    UPDATE contas_pagar     SET item_id = keep_id WHERE item_id = dup.id;
    UPDATE plan_audit_log   SET item_id = keep_id WHERE item_id = dup.id;
    DELETE FROM action_items WHERE id = dup.id;
  END LOOP;

  -- 2) Padroniza o nome de todos os grupos (itens raiz com filhos).
  UPDATE action_items g
     SET action = pg_temp.macro_norm(g.action)
   WHERE g.parent_id IS NULL
     AND EXISTS (SELECT 1 FROM action_items c WHERE c.parent_id = g.id)
     AND g.action IS DISTINCT FROM pg_temp.macro_norm(g.action);

  -- 3) Catálogo de macro ações em caixa alta. name é UNIQUE: nomes que colidiriam entre si
  --    depois de normalizar (ex.: "Brindes" e "brindes") ficam como estão, para revisão manual.
  UPDATE macro_acoes m
     SET name = pg_temp.macro_norm(m.name), updated_at = now()
   WHERE m.name IS DISTINCT FROM pg_temp.macro_norm(m.name)
     AND NOT EXISTS (SELECT 1 FROM macro_acoes o
                     WHERE o.id <> m.id AND pg_temp.macro_norm(o.name) = pg_temp.macro_norm(m.name));
END $$;
