-- Serialize approvals for a found item and prevent multiple approved claimants.
create or replace function private.guard_campusfind_claim_transitions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_campusfind_admin()) then
    raise exception 'Only CampusFind administrators can review claims.';
  end if;

  if old.status is distinct from new.status then
    if old.status = 'pending' and new.status not in ('approved', 'rejected') then
      raise exception 'Pending claims must be approved or rejected before collection.';
    elsif old.status = 'approved' and new.status not in ('collected', 'rejected') then
      raise exception 'Approved claims can only be collected or rejected.';
    elsif old.status in ('rejected', 'collected') then
      raise exception 'Rejected or collected claims cannot be reopened.';
    end if;
  end if;

  if new.status = 'approved' then
    perform 1 from public.item_reports where id = new.item_id for update;
    if exists (
      select 1 from public.claims c
      where c.item_id = new.item_id
        and c.id <> new.id
        and c.status in ('approved', 'collected')
    ) then
      raise exception 'Another claimant has already been approved for this item.';
    end if;
  end if;

  if new.status = 'collected' then
    if old.status <> 'approved' then
      raise exception 'Only an approved claim can be recorded as collected.';
    end if;
    if new.recipient_id_verified is not true
       or new.collected_at is null
       or new.collected_by is distinct from (select auth.uid())
       or nullif(btrim(new.collection_location), '') is null
       or nullif(btrim(new.handover_notes), '') is null then
      raise exception 'Verify the recipient ID and record the handover location and notes before closing the claim.';
    end if;
  else
    new.collected_at := null;
    new.collected_by := null;
    new.recipient_id_verified := false;
    new.handover_notes := null;
  end if;

  return new;
end;
$$;
