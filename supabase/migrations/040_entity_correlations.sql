create table public.entity_correlations (
  id                  uuid primary key default gen_random_uuid(),
  monitored_entity_id  uuid not null,
  do_entity_id        uuid not null references public.do_entities(id),
  publication_id      uuid not null references public.do_publications(id),
  correlation_type    text not null check (correlation_type in (
    'social_peak_do_match',
    'do_publication_found',
    'narrative_contradiction'
  )),
  social_signal       jsonb,
  insight_text        text,
  severity            text check (severity in ('low', 'medium', 'high', 'critical')),
  alert_sent          boolean default false,
  alert_sent_at       timestamptz,
  created_at          timestamptz default now()
);

create index entity_correlations_entity_idx on public.entity_correlations (monitored_entity_id, created_at desc);
create index entity_correlations_unsent_idx on public.entity_correlations (alert_sent, created_at) where alert_sent = false;