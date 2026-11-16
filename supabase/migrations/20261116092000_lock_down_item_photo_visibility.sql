-- Make item-report media private and enforce owner/admin-only reads.
-- The public catalogue remains browsable, but it no longer exposes storage paths.

begin;

update storage.buckets
set public = false
where id = 'item-photos';

drop policy if exists "Signed-in CampusFind users can view item photos" on storage.objects;
drop policy if exists "Report owners and admins can view item photos" on storage.objects;

create policy "Report owners and admins can view item photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'item-photos'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.is_campusfind_admin())
  )
);

drop view if exists public.item_catalog;

create view public.item_catalog
with (security_invoker = true)
as
select
  id,
  type,
  title,
  category,
  description,
  campus_location,
  date_event,
  color,
  status,
  claims_count,
  resolution_date,
  created_at
from public.item_reports
where status <> 'archived';

grant select on public.item_catalog to anon, authenticated;

-- Address the one confirmed unindexed FK without removing existing indexes.
create index if not exists claims_collected_by_idx
  on public.claims (collected_by)
  where collected_by is not null;

commit;
