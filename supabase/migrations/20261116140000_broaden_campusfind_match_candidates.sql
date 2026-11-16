-- Broaden CampusFind matching: compare every eligible lost/found pair and
-- treat category as evidence rather than an absolute gate.
create or replace function private.refresh_campusfind_match_suggestions()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.match_suggestions set status = 'withdrawn', updated_at = now()
  where status = 'pending' and (lost_report_id = new.id or found_report_id = new.id);

  with pairs as (
    select l.id as lost_id, f.id as found_id, l.category as lost_category, f.category as found_category,
      (lower(btrim(coalesce(l.category, ''))) = lower(btrim(coalesce(f.category, '')))) as category_matches,
      l.color as lost_color, f.color as found_color,
      l.campus_location as lost_location, f.campus_location as found_location,
      f.date_event - l.date_event as day_gap, words.overlap_count, words.overlap_words
    from public.item_reports l
    join public.item_reports f on l.type = 'lost' and f.type = 'found'
      and l.id <> f.id and l.reporter_id <> f.reporter_id
    cross join lateral (
      select count(distinct token)::integer as overlap_count,
        coalesce(array_agg(distinct token) filter (where token is not null), array[]::text[]) as overlap_words
      from unnest(regexp_split_to_array(lower(coalesce(l.title, '') || ' ' || coalesce(l.description, '')), '[^a-z0-9]+')) as lt(token)
      where length(token) > 2
        and token <> all (array['the','and','with','for','near','left','lost','found','this','that','after','from','have','been'])
        and token = any(regexp_split_to_array(lower(coalesce(f.title, '') || ' ' || coalesce(f.description, '')), '[^a-z0-9]+'))
    ) words
    where l.status not in ('recovered', 'archived') and f.status in ('open', 'in_review')
      and (l.id = new.id or f.id = new.id)
  ),
  scored as (
    select *,
      least(100,
        case when category_matches then 35 else 0 end
        + case when nullif(lower(btrim(lost_color)), '') is not null
          and nullif(lower(btrim(found_color)), '') is not null
          and (lower(btrim(lost_color)) = lower(btrim(found_color))
            or position(lower(btrim(lost_color)) in lower(btrim(found_color))) > 0
            or position(lower(btrim(found_color)) in lower(btrim(lost_color))) > 0) then 15 else 0 end
        + case when lower(btrim(coalesce(lost_location, ''))) = lower(btrim(coalesce(found_location, ''))) then 20
          when (lower(coalesce(lost_location, '')) like '%library%' and lower(coalesce(found_location, '')) like '%library%')
            or (lower(coalesce(lost_location, '')) like '%science%' and lower(coalesce(found_location, '')) like '%science%')
            or (lower(coalesce(lost_location, '')) like '%casford%' and lower(coalesce(found_location, '')) like '%casford%')
            or (lower(coalesce(lost_location, '')) like '%swlt%' and lower(coalesce(found_location, '')) like '%swlt%') then 15 else 0 end
        + case when overlap_count >= 3 then 20 when overlap_count >= 1 then 10 else 0 end
        + case when day_gap between 0 and 3 then 10 when day_gap between 4 and 10 then 5
          when day_gap = -1 then 5 else 0 end)::integer as confidence
    from pairs
  ),
  eligible as (
    select *,
      (case when category_matches then jsonb_build_array('Matching category: ' || coalesce(lost_category, ''))
        else jsonb_build_array('Different categories: ' || coalesce(lost_category, 'Unspecified') || ' / ' || coalesce(found_category, 'Unspecified') || ' — inspect item details') end)
      || case when nullif(lower(btrim(lost_color)), '') is not null and nullif(lower(btrim(found_color)), '') is not null
        and (lower(btrim(lost_color)) = lower(btrim(found_color))
          or position(lower(btrim(lost_color)) in lower(btrim(found_color))) > 0
          or position(lower(btrim(found_color)) in lower(btrim(lost_color))) > 0)
        then jsonb_build_array('Similar colour: ' || lost_color || ' / ' || found_color) else '[]'::jsonb end
      || case when lower(btrim(coalesce(lost_location, ''))) = lower(btrim(coalesce(found_location, '')))
        then jsonb_build_array('Same campus location: ' || coalesce(lost_location, ''))
        when (lower(coalesce(lost_location, '')) like '%library%' and lower(coalesce(found_location, '')) like '%library%')
          or (lower(coalesce(lost_location, '')) like '%science%' and lower(coalesce(found_location, '')) like '%science%')
          or (lower(coalesce(lost_location, '')) like '%casford%' and lower(coalesce(found_location, '')) like '%casford%')
          or (lower(coalesce(lost_location, '')) like '%swlt%' and lower(coalesce(found_location, '')) like '%swlt%')
        then jsonb_build_array('Nearby campus zones: ' || coalesce(lost_location, '') || ' / ' || coalesce(found_location, '')) else '[]'::jsonb end
      || case when overlap_count >= 3 then jsonb_build_array('Strong description/title keyword overlap: ' || array_to_string(overlap_words[1:3], ', '))
        when overlap_count >= 1 then jsonb_build_array('Description/title keyword overlap: ' || array_to_string(overlap_words[1:3], ', '))
        else '[]'::jsonb end
      || case when day_gap between 0 and 3 then jsonb_build_array('Found within 72 hours of reported loss')
        when day_gap between 4 and 10 then jsonb_build_array('Dates align within 10 days')
        when day_gap = -1 then jsonb_build_array('Dates differ by approximately one day') else '[]'::jsonb end as match_evidence
    from scored
  )
  insert into public.match_suggestions (lost_report_id, found_report_id, score, evidence, status)
  select lost_id, found_id, confidence, match_evidence, 'pending'
  from eligible
  where (category_matches and confidence >= 40) or (not category_matches and confidence >= 45)
  on conflict (lost_report_id, found_report_id) do update
    set score = excluded.score, evidence = excluded.evidence, status = 'pending', updated_at = now()
    where public.match_suggestions.status = 'withdrawn';
  return new;
end;
$$;

-- Re-evaluate existing reports so eligible cross-category pairs are discovered
-- immediately. Existing approved/rejected decisions are never overwritten.
update public.item_reports set category = category
where type in ('lost', 'found');
