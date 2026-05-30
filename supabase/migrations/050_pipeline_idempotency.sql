-- 050_pipeline_idempotency.sql
-- Idempotência do pipeline de IA (ingest → extract → correlate → alerts).
-- Permite reprocessar uma data / reenviar um webhook sem gerar duplicatas.

-- Entidades extraídas: uma por (publicação, nome normalizado, tipo).
-- Suporta upsert com ignoreDuplicates na extração.
CREATE UNIQUE INDEX IF NOT EXISTS uq_do_entities_pub_norm_type
  ON public.do_entities (publication_id, normalized_name, entity_type);

-- Correlações: uma por par (entidade monitorada, entidade do DO).
-- Reenvio do mesmo sinal social não recria a correlação (e portanto não
-- redispara alerta). Trade-off conhecido: um novo pico para a MESMA publicação
-- do DO não gera nova correlação — é a mesma evidência factual subjacente.
CREATE UNIQUE INDEX IF NOT EXISTS uq_entity_correlations_pair
  ON public.entity_correlations (monitored_entity_id, do_entity_id);
