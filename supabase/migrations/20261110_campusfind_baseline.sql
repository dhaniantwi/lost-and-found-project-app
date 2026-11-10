-- CampusFind baseline schema snapshot.
-- Apply once to a fresh Supabase project. The live project has this schema
-- deployed through the migration history documented in ../README.md.

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  student_id text,
  phone text,
  hall_of_residence text,
  department text,
  role text not null default 'student' check (role in ('student', 'admin')),
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.item_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('lost', 'found')),
  title text not null,
  category text not null,
  description text not null,
  campus_location text not null,
  specific_spot text,
  date_event date not null,
  color text not null,
  storage_location text,
  image_path text,
  status text not null default 'open' check (status in ('open', 'claimed', 'in_review', 'recovered', 'archived')),
  reward_offered text,
  claims_count integer not null default 0 check (claims_count >= 0),
  resolution_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.report_private_details (
  item_id uuid primary key references public.item_reports(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  distinct_marks text,
  created_at timestamptz not null default now()
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.item_reports(id) on delete cascade,
  claimant_id uuid not null references public.profiles(id) on delete cascade,
  proof_description text not null,
  proof_document_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'collected')),
  admin_notes text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  collection_location text,
  submitted_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_id uuid,
  details text not null default '',
  created_at timestamptz not null default now()
);

create or replace function private.is_campusfind_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;
revoke all on function private.is_campusfind_admin() from public;
grant execute on function private.is_campusfind_admin() to authenticated;

create or replace function public.handle_campusfind_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, student_id, phone, hall_of_residence, department)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'student_id', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'hall_of_residence', ''),
    nullif(new.raw_user_meta_data ->> 'department', '')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
revoke all on function public.handle_campusfind_new_user() from public, anon, authenticated;

create trigger on_campusfind_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_campusfind_new_user();

create index item_reports_catalog_idx on public.item_reports (status, created_at desc);
create index item_reports_reporter_idx on public.item_reports (reporter_id, created_at desc);
create index item_reports_match_idx on public.item_reports (type, category, status);
create index claims_claimant_idx on public.claims (claimant_id, submitted_at desc);
create index claims_item_idx on public.claims (item_id, status);
create index claims_reviewed_by_idx on public.claims (reviewed_by);
create unique index claims_one_per_student_per_item_idx on public.claims (item_id, claimant_id);
create index audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index report_private_details_owner_id_idx on public.report_private_details (owner_id);

alter table public.profiles enable row level security;
alter table public.item_reports enable row level security;
alter table public.report_private_details enable row level security;
alter table public.claims enable row level security;
alter table public.audit_logs enable row level security;

create policy "Profiles visible to owner and admins"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.is_campusfind_admin()));

create policy "Users can update their own non-role profile fields"
on public.profiles for update to authenticated
using (id = (select auth.uid()) or (select private.is_campusfind_admin()))
with check (id = (select auth.uid()) or (select private.is_campusfind_admin()));

revoke update on table public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, student_id, phone, hall_of_residence, department, updated_at) on public.profiles to authenticated;

create policy "Public catalog can read non-archived reports"
on public.item_reports for select to anon
using (status <> 'archived');

create policy "Authenticated catalog and administrator report access"
on public.item_reports for select to authenticated
using (
  status <> 'archived'
  or reporter_id = (select auth.uid())
  or (select private.is_campusfind_admin())
);

create policy "Authenticated students can create their own reports"
on public.item_reports for insert to authenticated
with check (
  reporter_id = (select auth.uid())
  and status = 'open'
  and claims_count = 0
  and resolution_date is null
);

create policy "Owners and admins can update reports"
on public.item_reports for update to authenticated
using (reporter_id = (select auth.uid()) or (select private.is_campusfind_admin()))
with check (reporter_id = (select auth.uid()) or (select private.is_campusfind_admin()));

create policy "Owners and admins can delete reports"
on public.item_reports for delete to authenticated
using (reporter_id = (select auth.uid()) or (select private.is_campusfind_admin()));

grant select (id, type, title, category, description, campus_location, specific_spot, date_event, color, storage_location, status, reward_offered, claims_count, resolution_date, created_at, updated_at) on public.item_reports to anon;
grant select, insert, update, delete on public.item_reports to authenticated;

create view public.item_catalog
with (security_invoker = true)
as
select id, type, title, category, description, campus_location, specific_spot,
       date_event, color, storage_location, status, reward_offered,
       claims_count, resolution_date, created_at
from public.item_reports
where status <> 'archived';
grant select on public.item_catalog to anon, authenticated;

create policy "Report private details visible to owner and admins"
on public.report_private_details for select to authenticated
using (owner_id = (select auth.uid()) or (select private.is_campusfind_admin()));

create policy "Report owners can add private details"
on public.report_private_details for insert to authenticated
with check (owner_id = (select auth.uid()));

create policy "Report owners and admins can update private details"
on public.report_private_details for update to authenticated
using (owner_id = (select auth.uid()) or (select private.is_campusfind_admin()))
with check (owner_id = (select auth.uid()) or (select private.is_campusfind_admin()));
grant select, insert, update, delete on public.report_private_details to authenticated;

create policy "Claimants and admins can view claims"
on public.claims for select to authenticated
using (claimant_id = (select auth.uid()) or (select private.is_campusfind_admin()));

create policy "Users can submit claims for found items"
on public.claims for insert to authenticated
with check (
  claimant_id = (select auth.uid())
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
  and admin_notes is null
  and (
    proof_document_path is null
    or (storage.foldername(proof_document_path))[1] = (select auth.uid())::text
  )
  and exists (
    select 1 from public.item_reports i
    where i.id = item_id
      and i.type = 'found'
      and i.status in ('open', 'in_review')
      and i.reporter_id <> (select auth.uid())
  )
);

create policy "Admins can review claims"
on public.claims for update to authenticated
using ((select private.is_campusfind_admin()))
with check ((select private.is_campusfind_admin()));
grant select, insert, update on public.claims to authenticated;

create policy "Admins can read audit logs"
on public.audit_logs for select to authenticated
using ((select private.is_campusfind_admin()));

create policy "Admins can create audit logs"
on public.audit_logs for insert to authenticated
with check ((select private.is_campusfind_admin()));
grant select, insert on public.audit_logs to authenticated;

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
      if not (new.reporter_id = (select auth.uid()) and new.status = 'recovered') then
        raise exception 'Only administrators can change report status.';
      end if;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_item_report_updates() from public, anon, authenticated;
create trigger guard_campusfind_item_report_updates
before insert or update on public.item_reports
for each row execute procedure private.guard_item_report_updates();

create or replace function private.track_campusfind_claim_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.item_reports
  set claims_count = claims_count + 1,
      status = case when status = 'open' then 'in_review' else status end,
      updated_at = now()
  where id = new.item_id;
  insert into public.audit_logs (actor_id, action, target_id, details)
  values (new.claimant_id, 'CLAIM_SUBMITTED', new.id, 'A student submitted an ownership claim.');
  return new;
end;
$$;
revoke all on function private.track_campusfind_claim_insert() from public, anon, authenticated;
create trigger on_campusfind_claim_insert
after insert on public.claims
for each row execute procedure private.track_campusfind_claim_insert();

create or replace function private.track_campusfind_report_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs (actor_id, action, target_id, details)
  values (
    new.reporter_id,
    case when new.type = 'lost' then 'REPORT_LOST_CREATED' else 'REPORT_FOUND_CREATED' end,
    new.id,
    'A student submitted an item report.'
  );
  return new;
end;
$$;
revoke all on function private.track_campusfind_report_insert() from public, anon, authenticated;
create trigger on_campusfind_report_insert
after insert on public.item_reports
for each row execute procedure private.track_campusfind_report_insert();

create or replace function private.track_campusfind_admin_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.audit_logs (actor_id, action, target_id, details)
    values (
      coalesce(new.reviewed_by, (select auth.uid())),
      'CLAIM_' || upper(new.status),
      new.id,
      'An administrator updated a claim decision.'
    );
  end if;
  return new;
end;
$$;
revoke all on function private.track_campusfind_admin_review() from public, anon, authenticated;
create trigger on_campusfind_claim_review
after update of status on public.claims
for each row execute procedure private.track_campusfind_admin_review();

create or replace function private.track_campusfind_report_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.audit_logs (actor_id, action, target_id, details)
    values (
      coalesce((select auth.uid()), new.reporter_id),
      'REPORT_STATUS_UPDATED',
      new.id,
      'An item report status was changed.'
    );
  end if;
  return new;
end;
$$;
revoke all on function private.track_campusfind_report_update() from public, anon, authenticated;
create trigger on_campusfind_report_update
after update of status on public.item_reports
for each row execute procedure private.track_campusfind_report_update();

create or replace function private.track_campusfind_report_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs (actor_id, action, target_id, details)
  values (
    coalesce((select auth.uid()), old.reporter_id),
    'REPORT_DELETED',
    old.id,
    'An item report was deleted.'
  );
  return old;
end;
$$;
revoke all on function private.track_campusfind_report_delete() from public, anon, authenticated;
create trigger on_campusfind_report_delete
after delete on public.item_reports
for each row execute procedure private.track_campusfind_report_delete();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('item-photos', 'item-photos', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('claim-evidence', 'claim-evidence', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy "Signed-in users can view item photos"
on storage.objects for select to authenticated
using (bucket_id = 'item-photos');

create policy "Users upload item photos into their own folder"
on storage.objects for insert to authenticated
with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users update their own item photos"
on storage.objects for update to authenticated
using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users delete their own item photos"
on storage.objects for delete to authenticated
using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Claimants and admins can view claim evidence"
on storage.objects for select to authenticated
using (
  bucket_id = 'claim-evidence'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.is_campusfind_admin())
  )
);

create policy "Users upload their own claim evidence"
on storage.objects for insert to authenticated
with check (bucket_id = 'claim-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users update their own claim evidence"
on storage.objects for update to authenticated
using (bucket_id = 'claim-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'claim-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users delete their own claim evidence"
on storage.objects for delete to authenticated
using (bucket_id = 'claim-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
