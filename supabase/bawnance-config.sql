create table if not exists public.site_config (
  id text primary key,
  contract_address text null check (
    contract_address is null
    or contract_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'
  ),
  updated_at timestamptz not null default now()
);

insert into public.site_config (id, contract_address)
values ('bawnance', null)
on conflict (id) do nothing;

alter table public.site_config enable row level security;

drop policy if exists "Public can read the Bawnance CA" on public.site_config;
create policy "Public can read the Bawnance CA"
on public.site_config for select
to anon, authenticated
using (id = 'bawnance');

grant select on public.site_config to anon, authenticated;
revoke insert, update, delete on public.site_config from anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'site_config'
  ) then
    alter publication supabase_realtime add table public.site_config;
  end if;
end $$;
