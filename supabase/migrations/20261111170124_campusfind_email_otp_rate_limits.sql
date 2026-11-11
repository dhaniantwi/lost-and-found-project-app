create table if not exists public.campusfind_auth_rate_limits (
  id bigint generated always as identity primary key,
  email_hash text not null,
  ip_hash text not null,
  action text not null check (action in ('signup', 'password_otp', 'email_otp', 'verify_otp')),
  created_at timestamptz not null default now()
);

create index if not exists campusfind_auth_rate_limits_email_created_idx
  on public.campusfind_auth_rate_limits (email_hash, created_at desc);

create index if not exists campusfind_auth_rate_limits_ip_created_idx
  on public.campusfind_auth_rate_limits (ip_hash, created_at desc);

alter table public.campusfind_auth_rate_limits enable row level security;

revoke all on table public.campusfind_auth_rate_limits from anon, authenticated;
grant all on table public.campusfind_auth_rate_limits to service_role;
