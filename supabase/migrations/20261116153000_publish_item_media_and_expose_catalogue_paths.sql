-- CampusFind item photos/videos are intended for the public item catalogue.
-- Keep claim-evidence private; only the item-photos bucket is made public.
update storage.buckets
set public = true
where id = 'item-photos';

-- Expose only the media references and media types needed by the public catalogue.
-- Existing catalogue columns are preserved in their original order.
create or replace view public.item_catalog as
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
  created_at,
  image_path,
  media_path_2,
  media_type,
  media_type_2
from public.item_reports
where status <> 'archived'::text;

grant select on public.item_catalog to anon, authenticated;
