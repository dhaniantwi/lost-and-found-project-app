-- Keep the item status in sync with the claim decision in the same database transaction.

create or replace function private.sync_campusfind_item_after_claim_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_claim_count integer;
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'approved' then
    update public.item_reports
    set status = 'claimed', updated_at = now()
    where id = new.item_id;
  elsif new.status = 'collected' then
    update public.item_reports
    set status = 'recovered',
        resolution_date = current_date,
        updated_at = now()
    where id = new.item_id;
  elsif new.status = 'rejected' then
    select count(*) into active_claim_count
    from public.claims
    where item_id = new.item_id
      and id <> new.id
      and status in ('pending', 'approved');

    update public.item_reports
    set status = case when active_claim_count > 0 then 'in_review' else 'open' end,
        resolution_date = null,
        updated_at = now()
    where id = new.item_id
      and status <> 'recovered';
  end if;

  return new;
end;
$$;

revoke all on function private.sync_campusfind_item_after_claim_update() from public, anon, authenticated;
drop trigger if exists sync_campusfind_item_after_claim_update on public.claims;
create trigger sync_campusfind_item_after_claim_update
after update of status on public.claims
for each row execute procedure private.sync_campusfind_item_after_claim_update();
