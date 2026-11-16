alter table public.claims
  add column if not exists collection_code text,
  add column if not exists collection_code_expires_at timestamptz,
  add column if not exists collection_code_issued_at timestamptz,
  add column if not exists collection_code_used_at timestamptz,
  add column if not exists collection_code_last4 text,
  add column if not exists handover_code text;

alter table public.claims
  add constraint claims_collection_code_format
  check (collection_code is null or collection_code ~ '^[0-9]{8}$');

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

create or replace function private.track_campusfind_admin_review()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  event_details text;
begin
  if old.status is distinct from new.status then
    event_details := case new.status
      when 'approved' then
        'Claim approved. Collection point: ' || coalesce(new.collection_location, 'To be confirmed') ||
        '. Collection code expires at ' || coalesce(new.collection_code_expires_at::text, 'not set') || '.'
      when 'collected' then
        'Physical handover completed at ' || coalesce(new.collection_location, 'unspecified location') ||
        '. Recipient ID verified. Code ending ' || coalesce(new.collection_code_last4, '----') ||
        '. Handover notes: ' || coalesce(new.handover_notes, 'None')
      when 'rejected' then
        'Claim rejected. Administrator notes: ' || coalesce(new.admin_notes, 'None')
      else
        'An administrator updated a claim decision.'
    end;

    insert into public.audit_logs (actor_id, action, target_id, details)
    values (coalesce(new.reviewed_by, (select auth.uid())),
      'CLAIM_' || upper(new.status), new.id, event_details);
  end if;
  return new;
end;
$function$;

create or replace function private.notify_campusfind_claimant_after_review()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  notification_title text;
  notification_message text;
begin
  if old.status is not distinct from new.status then return new; end if;

  if new.status = 'approved' then
    notification_title := 'Your claim has been approved';
    notification_message :=
      'Your ownership claim for this item has been approved. Collect it in person at ' ||
      coalesce(new.collection_location, 'the designated UCC Security collection desk') ||
      '. Your one-time collection code is ' || new.collection_code ||
      '. It expires at ' || to_char(new.collection_code_expires_at, 'DD Mon YYYY HH24:MI "UTC"') ||
      '. Bring your original UCC student ID. Do not share this code with anyone except authorized collection staff.';
  elsif new.status = 'rejected' then
    notification_title := 'Update on your ownership claim';
    notification_message := 'Your ownership claim was not approved. Administrator note: ' ||
      coalesce(new.admin_notes, 'Please contact the CampusFind Security Desk for clarification.');
  elsif new.status = 'collected' then
    notification_title := 'Item handover completed';
    notification_message := 'The handover of your claimed item has been recorded as complete at ' ||
      coalesce(new.collection_location, 'the designated collection point') || '. Keep this update for your records.';
  else
    return new;
  end if;

  insert into public.user_notifications (user_id, title, message, related_report_id)
  values (new.claimant_id, notification_title, notification_message, new.item_id);
  return new;
end;
$function$;

drop trigger if exists on_campusfind_claimant_review_notification on public.claims;
create trigger on_campusfind_claimant_review_notification
after update of status on public.claims
for each row execute function private.notify_campusfind_claimant_after_review();

create index if not exists claims_approved_collection_expiry_idx
  on public.claims (collection_code_expires_at) where status = 'approved';
