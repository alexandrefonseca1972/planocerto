-- Migration: Delete all action plans, Diário Oficial, and Simulator data
-- while preserving catalogs and infrastructure.
--
-- Cascade chain:
--   action_plans → action_items (CASCADE)
--   action_plans → plan_audit_log (CASCADE)
--   action_plans → public_links (CASCADE)
--   action_items → plan_attachments (CASCADE)
--   action_items → calendar_sync (CASCADE)
--   action_items → item_comments (CASCADE)
--   action_plans → contas_pagar.plan_id (SET NULL)
--   action_items → contas_pagar.item_id (SET NULL)
--   do_publications → do_entities (CASCADE)
--   simulator_scenarios → simulator_channel_metrics (CASCADE)
--
-- Manual order for non-cascade FKs:
--   entity_correlations must be deleted before do_publications

-- 1. Plans and dependent data
DELETE FROM public.action_plans;

-- 2. Diário Oficial
DELETE FROM public.entity_correlations;
DELETE FROM public.do_entities;
DELETE FROM public.do_publications;
DELETE FROM public.ingest_runs;

-- 3. Simulator
DELETE FROM public.simulator_scenarios;

-- 4. Benchmarking (preserva catálogos: modalidades, cursos_superiores, turnos)
--    Cascade: instituicoes → cursos_instituicao → corpo_docente + mensalidades_concorrentes
DELETE FROM public.instituicoes;
