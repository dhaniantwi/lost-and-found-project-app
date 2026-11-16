create or replace function private.track_campusfind_admin_review()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  event_action text;
  event_details text;
begin
  if old.status is distinct from new.status then
    event_action := 'CLAIM_' || upper(new.status);
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
      else 'An administrator updated a claim decision.'
    end;
  elsif new.status = 'approved' and new.collection_code is distinct from old.collection_code then
    event_action := 'CLAIM_COLLECTION_CODE_REISSUED';
    event_details := 'A new one-time collection code was issued. Collection point: ' ||
      coalesce(new.collection_location, 'To be confirmed') || '. New expiry: ' ||
      coalesce(new.collection_code_expires_at::text, 'not set') || '.';
  else
    return new;
  end if;

  insert into public.audit_logs (actor_id, action, target_id, details)
  values (coalesce(new.reviewed_by, (select auth.uid())), event_action, new.id, event_details);
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
  if old.status is not distinct from new.status
     and old.collection_code is not distinct from new.collection_code then
    return new;
  end if;

  if new.status = 'approved' then
    notification_title := case when old.status = 'approved'
      then 'Your collection code has been renewed'
      else 'Your claim has been approved' end;
    notification_message :=
      case when old.status = 'approved'
        then 'A new one-time collection code has been issued for your approved claim. '
        else 'Your ownership claim for this item has been approved. ' end ||
      'Collect it in person at ' ||
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
      coalesce(new.collection_location, 'the designated collection point') ||
      '. Keep this update for your records.';
  else
    return new;
  end if;

  insert into public.user_notifications (user_id, title, message, related_report_id)
  values (new.claimant_id, notification_title, notification_message, new.item_id);
  return new;
end;
$function$;

drop trigger if exists on_campusfind_claim_review on public.claims;
create trigger on_campusfind_claim_review
after update of status, collection_code on public.claims
for each row execute function private.track_campusfind_admin_review();

drop trigger if exists on_campusfind_claimant_review_notification on public.claims;
create trigger on_campusfind_claimant_review_notification
after update of status, collection_code on public.claims
for each row execute function private.notify_campusfind_claimant_after_review();
