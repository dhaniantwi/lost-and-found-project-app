-- Item photos can contain sensitive information. Only the report owner and admins may view them.
drop policy if exists "Signed-in users can view item photos" on storage.objects;

create policy "Report owners and admins can view item photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'item-photos'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.is_campusfind_admin())
  )
);
