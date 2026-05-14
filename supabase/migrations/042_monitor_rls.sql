alter table public.do_publications enable row level security;
alter table public.do_entities enable row level security;
alter table public.entity_correlations enable row level security;
alter table public.ingest_runs enable row level security;

create policy "authenticated users can read publications" on public.do_publications for select to authenticated using (true);

create policy "service role full access publications" on public.do_publications for all to service_role using (true);
create policy "service role full access do_entities" on public.do_entities for all to service_role using (true);
create policy "service role full access entity_correlations" on public.entity_correlations for all to service_role using (true);
create policy "service role full access ingest_runs" on public.ingest_runs for all to service_role using (true);