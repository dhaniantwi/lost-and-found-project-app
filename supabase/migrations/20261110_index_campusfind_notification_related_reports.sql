-- Index notification links so report deletion and notification lookups stay efficient.
create index if not exists user_notifications_related_report_idx on public.user_notifications (related_report_id);
