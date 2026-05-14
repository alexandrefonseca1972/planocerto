create table public.ingest_runs (
  id              uuid primary key default gen_random_uuid(),
  source          text not null,
  edition_date    date not null,
  status          text not null check (status in ('running', 'success', 'partial', 'failed')),
  publications_ok integer default 0,
  publications_err integer default 0,
  error_detail    text,
  started_at      timestamptz default now(),
  finished_at    timestamptz,
  unique (source, edition_date)
);