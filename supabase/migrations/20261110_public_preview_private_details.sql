-- CampusFind: keep public previews separate from private ownership/custody details.
-- Existing report details are copied before the legacy columns are removed.

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

-- Remove broad table-level SELECT grants and expose only the columns each role needs.
revoke select on public.item_reports from anon, authenticated;

grant select (id, type, title, category, description, campus_location,
              date_event, color, status, claims_count, resolution_date,
              created_at)
on public.item_reports to anon;

grant select (id, reporter_id, type, title, category, description,
              campus_location, date_event, color, image_path, status,
              reward_offered, claims_count, resolution_date, created_at, updated_at)
on public.item_reports to authenticated;

grant select on public.item_catalog to anon, authenticated;

-- Precise location and custody data now live only in the owner/admin-protected table.
alter table public.item_reports
  drop column if exists specific_spot,
  drop column if exists storage_location;
