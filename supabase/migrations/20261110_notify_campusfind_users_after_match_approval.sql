-- Notify both reporters after an administrator approves a suggested match.
create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  related_report_id uuid references public.item_reports(id) on delete set null,
  match_suggestion_id uuid references public.match_suggestions(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint user_notifications_match_user_unique unique (match_suggestion_id, user_id)
);

create index if not exists user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);

alter table public.user_notifications enable row level security;
revoke all on public.user_notifications from anon, authenticated;
grant select on public.user_notifications to authenticated;
grant update (read_at) on public.user_notifications to authenticated;

create policy "Users can read their own notifications"
  on public.user_notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can mark their own notifications read"
  on public.user_notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create or replace function private.guard_campusfind_notification_read()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id
    or new.title is distinct from old.title
    or new.message is distinct from old.message
    or new.related_report_id is distinct from old.related_report_id
    or new.match_suggestion_id is distinct from old.match_suggestion_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Notification content cannot be changed.';
  end if;
  if old.read_at is not null or new.read_at is null then
    raise exception 'Only unread notifications can be marked as read.';
  end if;
  if (select auth.uid()) is distinct from old.user_id then
    raise exception 'You can only update your own notifications.';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_campusfind_notification_read() from public, anon, authenticated;

create trigger guard_campusfind_notification_read
before update on public.user_notifications
for each row execute function private.guard_campusfind_notification_read();

create or replace function private.notify_campusfind_match_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  lost_title text;
  found_title text;
begin
  if old.status = 'pending' and new.status = 'approved' then
    select title into lost_title from public.item_reports where id = new.lost_report_id;
    select title into found_title from public.item_reports where id = new.found_report_id;

    insert into public.user_notifications
      (user_id, title, message, related_report_id, match_suggestion_id)
    select reporter_id,
      'Potential match confirmed',
      'CampusFind administrators confirmed a possible match for your lost item: ' || coalesce(lost_title, 'your report') || '. Review the found report and submit an ownership claim if the item is yours.',
      new.found_report_id,
      new.id
    from public.item_reports
    where id = new.lost_report_id
    on conflict (match_suggestion_id, user_id) do nothing;

    insert into public.user_notifications
      (user_id, title, message, related_report_id, match_suggestion_id)
    select reporter_id,
      'Potential match confirmed',
      'A lost report may match the item you reported as found: ' || coalesce(found_title, 'your report') || '. Review the related report in CampusFind.',
      new.lost_report_id,
      new.id
    from public.item_reports
    where id = new.found_report_id
    on conflict (match_suggestion_id, user_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.notify_campusfind_match_approval() from public, anon, authenticated;

create trigger on_campusfind_match_approved_notify_reporters
after update of status on public.match_suggestions
for each row execute function private.notify_campusfind_match_approval();
