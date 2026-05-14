create table public.do_entities (
  id              uuid primary key default gen_random_uuid(),
  publication_id  uuid not null references public.do_publications(id) on delete cascade,
  entity_type     text not null check (entity_type in ('person', 'company', 'process')),
  raw_name        text not null,
  normalized_name text not null,
  document        text,
  context_snippet text,
  confidence      numeric(3,2) check (confidence between 0 and 1),
  created_at      timestamptz default now()
);

create index do_entities_normalized_idx on public.do_entities using gin(normalized_name gin_trgm_ops);
create index do_entities_publication_idx on public.do_entities (publication_id);
create index do_entities_document_idx on public.do_entities (document) where document is not null;