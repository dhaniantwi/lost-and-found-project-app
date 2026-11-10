-- First stage: move precise spot and custody details behind owner/admin RLS,
-- and expose a safe public catalogue projection.

alter table public.report_private_details
  add column if not exists specific_spot text,
  add column if not exists storage_location text;

insert into public.report_private_details
  (item_id, owner_id, specific_spot, storage_location)
select i.id, i.reporter_id, i.specific_spot, i.storage_location
from public.item_reports i
where i.specific_spot is not null or i.storage_location is not null
on conflict (item_id) do update
set specific_spot = coalesce(public.report_private_details.specific_spot, excluded.specific_spot),
    storage_location = coalesce(public.report_private_details.storage_location, excluded.storage_location);

drop view if exists public.item_catalog;
create view public.item_catalog
with (security_invoker = true)
as
select id, type, title, category, description, campus_location,
       date_event, color, status, claims_count, resolution_date, created_at
from public.item_reports
where status <> 'archived';

revoke select on public.item_reports from anon;
grant select (id, type, title, category, description, campus_location,
              date_event, color, status, claims_count, resolution_date,
              created_at) on public.item_reports to anon;
grant select on public.item_catalog to anon, authenticated;
