-- unaccent() is STABLE by default; wrap it as IMMUTABLE so it can be used
-- in a generated (stored) column expression.
create or replace function public.immutable_unaccent(text)
  returns text
  language sql immutable parallel safe strict
as $$ select unaccent($1) $$;

create table public.do_publications (
  id            uuid primary key default gen_random_uuid(),
  source        text not null check (source in ('DOU', 'DOE', 'DOM')),
  state         char(2),
  city          text,
  edition_date  date not null,
  edition_num   text,
  section       text,
  act_type      text,
  organ         text,
  title         text,
  content       text not null,
  original_url  text,
  raw_file_path text,
  search_vector tsvector generated always as (
    setweight(to_tsvector('portuguese', coalesce(public.immutable_unaccent(title), '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(public.immutable_unaccent(content), '')), 'B')
  ) stored,
  extracted_at  timestamptz default now(),
  created_at    timestamptz default now()
);

create index do_publications_search_idx on public.do_publications using gin(search_vector);
create index do_publications_trgm_idx on public.do_publications using gin(title gin_trgm_ops);
create index do_publications_date_idx on public.do_publications (edition_date desc);
create index do_publications_source_idx on public.do_publications (source, state, edition_date desc);