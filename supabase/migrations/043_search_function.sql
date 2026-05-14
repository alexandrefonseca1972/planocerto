create or replace function search_publications(
  query_text      text,
  source_filter   text    default null,
  state_filter    char(2) default null,
  date_from       date    default null,
  date_to         date    default null,
  act_type_filter text    default null,
  result_limit    int     default 20,
  result_offset   int     default 0
)
returns table (
  id            uuid,
  title         text,
  content       text,
  source        text,
  state         char(2),
  edition_date  date,
  organ         text,
  act_type      text,
  original_url  text,
  rank          float4
)
language sql
stable
as $$
  select
    p.id,
    p.title,
    p.content,
    p.source,
    p.state,
    p.edition_date,
    p.organ,
    p.act_type,
    p.original_url,
    ts_rank(p.search_vector, to_tsquery('portuguese', query_text)) as rank
  from public.do_publications p
  where
    p.search_vector @@ to_tsquery('portuguese', query_text)
    and (source_filter is null or p.source = source_filter)
    and (state_filter is null or p.state = state_filter)
    and (date_from is null or p.edition_date >= date_from)
    and (date_to is null or p.edition_date <= date_to)
    and (act_type_filter is null or p.act_type ilike '%' || act_type_filter || '%')
  order by rank desc, p.edition_date desc
  limit result_limit
  offset result_offset
$$;