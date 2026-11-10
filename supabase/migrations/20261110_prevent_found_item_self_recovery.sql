-- A finder cannot mark a found item as recovered directly. Found items close only
-- when an administrator records the claimant's verified physical handover.
create or replace function private.guard_item_report_updates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'open' or new.claims_count <> 0 or new.resolution_date is not null then
      raise exception 'New reports must start in the open state.';
    end if;
    return new;
  end if;

  if not (select private.is_campusfind_admin()) and pg_trigger_depth() = 1 then
    if new.claims_count is distinct from old.claims_count then
      raise exception 'Claim counts are maintained by the system.';
    end if;

    if new.status is distinct from old.status then
      if not (
        old.type = 'lost'
        and new.reporter_id = (select auth.uid())
        and new.status = 'recovered'
      ) then
        raise exception 'Found-item reports can only be closed through an administrator-recorded ownership handover.';
      end if;
    end if;
  end if;

  return new;
end;
$$;
