-- Restrict submission deletion to administrators and allow admins to remove
-- associated private submission/claim evidence from Supabase Storage.

drop policy if exists "Owners and admins can delete reports" on public.item_reports;
create policy "Only admins can delete reports"
on public.item_reports
for delete
to authenticated
using ((select private.is_campusfind_admin()));

drop policy if exists "Admins can delete item photos and claim evidence" on storage.objects;
create policy "Admins can delete item photos and claim evidence"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('item-photos', 'claim-evidence')
  and (select private.is_campusfind_admin())
);
