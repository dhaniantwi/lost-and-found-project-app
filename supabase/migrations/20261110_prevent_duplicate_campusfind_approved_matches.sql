-- Enforce one-to-one approved matches and close competing pending suggestions.
create or replace function private.refresh_campusfind_match_suggestions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.match_suggestions
     set status = 'withdrawn', updated_at = now()
   where status = 'pending'
     and (lost_report_id = new.id or found_report_id = new.id);

  with pairs as (
    select l.id as lost_id, f.id as found_id, l.category as matched_category,
      l.color as lost_color, f.color as found_color,
      l.campus_location as lost_location, f.campus_location as found_location,
      f.date_event - l.date_event as day_gap, words.overlap_count, words.overlap_words
    from public.item_reports l
    join public.item_reports f on l.type = 'lost' and f.type = 'found'
      and lower(btrim(l.category)) = lower(btrim(f.category))
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
      and not exists (
        select 1 from public.match_suggestions approved
        where approved.status = 'approved'
          and (approved.lost_report_id in (l.id, f.id) or approved.found_report_id in (l.id, f.id))
      )
  ),
  scored as (
    select *,
      least(100, 35
        + case when nullif(lower(btrim(lost_color)), '') is not null
          and nullif(lower(btrim(found_color)), '') is not null
          and (lower(btrim(lost_color)) = lower(btrim(found_color))
            or position(lower(btrim(lost_color)) in lower(btrim(found_color))) > 0
            or position(lower(btrim(found_color)) in lower(btrim(lost_color))) > 0) then 15 else 0 end
        + case when lower(btrim(lost_location)) = lower(btrim(found_location)) then 20
          when (lower(lost_location) like '%library%' and lower(found_location) like '%library%')
            or (lower(lost_location) like '%science%' and lower(found_location) like '%science%')
            or (lower(lost_location) like '%casford%' and lower(found_location) like '%casford%')
            or (lower(lost_location) like '%swlt%' and lower(found_location) like '%swlt%') then 15 else 0 end
        + case when overlap_count >= 3 then 20 when overlap_count >= 1 then 10 else 0 end
        + case when day_gap between 0 and 3 then 10 when day_gap between 4 and 10 then 5
          when day_gap = -1 then 5 else 0 end)::integer as confidence
    from pairs
  ),
  eligible as (
    select *,
      jsonb_build_array('Matching category: ' || matched_category)
      || case when nullif(lower(btrim(lost_color)), '') is not null and nullif(lower(btrim(found_color)), '') is not null
        and (lower(btrim(lost_color)) = lower(btrim(found_color))
          or position(lower(btrim(lost_color)) in lower(btrim(found_color))) > 0
          or position(lower(btrim(found_color)) in lower(btrim(lost_color))) > 0)
        then jsonb_build_array('Similar colour: ' || lost_color || ' / ' || found_color) else '[]'::jsonb end
      || case when lower(btrim(lost_location)) = lower(btrim(found_location))
        then jsonb_build_array('Same campus location: ' || lost_location)
        when (lower(lost_location) like '%library%' and lower(found_location) like '%library%')
          or (lower(lost_location) like '%science%' and lower(found_location) like '%science%')
          or (lower(lost_location) like '%casford%' and lower(found_location) like '%casford%')
          or (lower(lost_location) like '%swlt%' and lower(found_location) like '%swlt%')
        then jsonb_build_array('Nearby campus zones: ' || lost_location || ' / ' || found_location) else '[]'::jsonb end
      || case when overlap_count >= 3 then jsonb_build_array('Strong description/title keyword overlap: ' || array_to_string(overlap_words[1:3], ', '))
        when overlap_count >= 1 then jsonb_build_array('Description/title keyword overlap: ' || array_to_string(overlap_words[1:3], ', '))
        else '[]'::jsonb end
      || case when day_gap between 0 and 3 then jsonb_build_array('Found within 72 hours of reported loss')
        when day_gap between 4 and 10 then jsonb_build_array('Dates align within 10 days')
        when day_gap = -1 then jsonb_build_array('Dates differ by approximately one day') else '[]'::jsonb end as match_evidence
    from scored
  )
  insert into public.match_suggestions (lost_report_id, found_report_id, score, evidence, status)
  select lost_id, found_id, confidence, match_evidence, 'pending' from eligible where confidence >= 40
  on conflict (lost_report_id, found_report_id) do update
    set score = excluded.score, evidence = excluded.evidence, status = 'pending', updated_at = now()
    where public.match_suggestions.status = 'withdrawn';
  return new;
end;
$$;

create or replace function private.guard_campusfind_match_review()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'withdrawn' and old.status = 'pending' and pg_trigger_depth() > 1 then
    new.updated_at := now();
    return new;
  end if;
  if new.status is not distinct from old.status then
    raise exception 'A match suggestion can only be updated through a review decision.';
  end if;
  if old.status <> 'pending' or new.status not in ('approved', 'rejected') then
    raise exception 'Only pending suggestions can be approved or rejected.';
  end if;
  if not (select private.is_campusfind_admin()) then
    raise exception 'Administrator access is required.';
  end if;
  if nullif(btrim(new.review_notes), '') is null then
    raise exception 'Please provide a decision note.';
  end if;
  new.reviewed_by := (select auth.uid());
  new.reviewed_at := now();
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.track_campusfind_match_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'approved' then
    update public.match_suggestions
       set status = 'withdrawn'
     where status = 'pending'
       and id <> new.id
       and (
         lost_report_id in (new.lost_report_id, new.found_report_id)
         or found_report_id in (new.lost_report_id, new.found_report_id)
       );
  end if;

  if new.status in ('approved', 'rejected') then
    insert into public.audit_logs (actor_id, action, target_id, details)
    values (
      new.reviewed_by,
      case when new.status = 'approved' then 'MATCH_SUGGESTION_APPROVED' else 'MATCH_SUGGESTION_REJECTED' end,
      new.id,
      'Administrator reviewed a potential lost-and-found report pair.'
    );
  end if;
  return new;
end;
$$;
