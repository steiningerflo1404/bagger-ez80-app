-- SQL für öffentliche Erfassung + Adminbereich
create table if not exists public.machine_entries (
  id uuid primary key default gen_random_uuid(),
  machine_name text not null default 'Bagger EZ80',
  date date not null,
  member_name text not null,
  hours numeric(8,2) not null check (hours >= 0),
  diesel_liters numeric(8,2) not null default 0 check (diesel_liters >= 0),
  usage_type text not null default 'innerbetrieblich' check (usage_type in ('innerbetrieblich', 'ueberbetrieblich')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.machine_entries enable row level security;
drop policy if exists "public_insert_entries" on public.machine_entries;
drop policy if exists "public_read_inserted_entry" on public.machine_entries;
create policy "public_insert_entries" on public.machine_entries for insert to anon with check (true);
create policy "public_read_inserted_entry" on public.machine_entries for select to anon using (true);
create index if not exists machine_entries_date_idx on public.machine_entries(date);
create index if not exists machine_entries_member_idx on public.machine_entries(member_name);
