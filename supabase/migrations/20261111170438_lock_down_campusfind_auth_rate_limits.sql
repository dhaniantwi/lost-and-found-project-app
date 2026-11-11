create policy "Deny client access to CampusFind auth rate limits"
on public.campusfind_auth_rate_limits
for all
to anon, authenticated
using (false)
with check (false);
