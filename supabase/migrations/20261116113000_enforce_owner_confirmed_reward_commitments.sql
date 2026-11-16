-- A reward may only be published when the reporting owner explicitly confirms the commitment.
alter table public.item_reports
  add column if not exists reward_commitment_confirmed boolean not null default false;

create or replace function private.enforce_campusfind_reward_commitment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if nullif(btrim(coalesce(new.reward_offered, '')), '') is not null
     and coalesce(new.reward_commitment_confirmed, false) is not true then
    raise exception 'A reward must be explicitly confirmed by the item owner before it can be published.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_campusfind_reward_commitment on public.item_reports;
create trigger enforce_campusfind_reward_commitment
before insert or update of reward_offered, reward_commitment_confirmed
on public.item_reports
for each row execute function private.enforce_campusfind_reward_commitment();
