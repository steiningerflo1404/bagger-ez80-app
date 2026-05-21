
-- Supabase SQL für Bagger EZ80 Maschinengemeinschaft
-- In Supabase öffnen: SQL Editor -> New Query -> alles einfügen -> Run

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  role text not null default 'member' check (role in ('member', 'cashier', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.machine_entries (
  id uuid primary key default gen_random_uuid(),
  machine_name text not null default 'Bagger EZ80',
  date date not null,
  member_name text not null,
  hours numeric(8,2) not null check (hours >= 0),
  diesel_liters numeric(8,2) not null default 0 check (diesel_liters >= 0),
  usage_type text not null default 'innerbetrieblich' check (usage_type in ('innerbetrieblich', 'ueberbetrieblich')),
  note text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.machine_entries enable row level security;

drop policy if exists "profiles_select_own_or_admin_cashier" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;

drop policy if exists "entries_select_authenticated" on public.machine_entries;
drop policy if exists "entries_insert_authenticated" on public.machine_entries;
drop policy if exists "entries_delete_admin_cashier" on public.machine_entries;
drop policy if exists "entries_update_admin_cashier" on public.machine_entries;

create policy "profiles_select_own_or_admin_cashier"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role in ('admin', 'cashier')
  )
);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_admin"
on public.profiles
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role = 'admin'
  )
);

-- Alle angemeldeten Mitglieder dürfen aktuell alle Einträge sehen.
-- Falls Mitglieder wirklich NUR eigene Einträge sehen sollen, kann man diese Policy später enger machen.
create policy "entries_select_authenticated"
on public.machine_entries
for select
to authenticated
using (true);

create policy "entries_insert_authenticated"
on public.machine_entries
for insert
to authenticated
with check (created_by = auth.uid());

create policy "entries_delete_admin_cashier"
on public.machine_entries
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role in ('admin', 'cashier')
  )
);

create policy "entries_update_admin_cashier"
on public.machine_entries
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role in ('admin', 'cashier')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and p.role in ('admin', 'cashier')
  )
);

create index if not exists machine_entries_date_idx on public.machine_entries(date);
create index if not exists machine_entries_member_idx on public.machine_entries(member_name);
create index if not exists machine_entries_created_by_idx on public.machine_entries(created_by);

-- Rollen setzen:
-- Nachdem sich der Kassier/Verwalter einmal angemeldet hat, seine E-Mail unten eintragen und ausführen:
-- update public.profiles set role = 'cashier', name = 'NAME' where email = 'EMAIL';
-- update public.profiles set role = 'admin', name = 'NAME' where email = 'EMAIL';
