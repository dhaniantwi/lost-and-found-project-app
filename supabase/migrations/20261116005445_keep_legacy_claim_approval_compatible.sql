create or replace function private.guard_campusfind_claim_transitions()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
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
      where c.item_id = new.item_id and c.id <> new.id
        and c.status in ('approved', 'collected')
    ) then
      raise exception 'Another claimant has already been approved for this item.';
    end if;

    -- Backward compatibility for older deployed clients that do not send the new fields.
    if old.status = 'pending' and new.collection_code is null then
      new.collection_code := left(regexp_replace(gen_random_uuid()::text, '[^0-9]', '', 'g'), 8);
      new.collection_code_expires_at := coalesce(new.collection_code_expires_at, now() + interval '48 hours');
    end if;

    if old.status = 'pending' or new.collection_code is distinct from old.collection_code then
      if new.collection_code is null
         or new.collection_code !~ '^[0-9]{8}$'
         or new.collection_code_expires_at is null
         or new.collection_code_expires_at <= now()
         or new.collection_code_expires_at > now() + interval '72 hours' then
        raise exception 'Issue a valid eight-digit collection code that expires within 72 hours.';
      end if;
      new.collection_code_issued_at := now();
      new.collection_code_used_at := null;
      new.collection_code_last4 := right(new.collection_code, 4);
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
    if old.collection_code is null
       or new.handover_code is null
       or new.handover_code !~ '^[0-9]{8}$'
       or new.handover_code <> old.collection_code
       or old.collection_code_expires_at is null
       or old.collection_code_expires_at <= now()
       or old.collection_code_used_at is not null then
      raise exception 'The collection code is incorrect, expired, or has already been used.';
    end if;
    new.collection_code_last4 := right(old.collection_code, 4);
    new.collection_code_used_at := now();
    new.collection_code := null;
    new.collection_code_expires_at := null;
    new.handover_code := null;
  elsif new.status = 'rejected' then
    new.collection_code := null;
    new.collection_code_expires_at := null;
    new.handover_code := null;
  else
    new.handover_code := null;
  end if;

  if old.status in ('rejected', 'collected') and (
    new.collection_code is distinct from old.collection_code
    or new.collection_code_expires_at is distinct from old.collection_code_expires_at
    or new.handover_code is distinct from old.handover_code
  ) then
    raise exception 'Closed claims cannot have their collection credentials changed.';
  end if;

  return new;
end;
$function$;
