create extension if not exists pgcrypto;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  app_instance_id text not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  expense_date date not null,
  expense_time time not null,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  app_instance_id text not null,
  name text not null,
  color text not null,
  icon text not null default 'Tag',
  is_default boolean not null default false,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.preferences (
  app_instance_id text primary key,
  settings jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists expenses_instance_date_idx on public.expenses(app_instance_id, expense_date desc, expense_time desc);
create index if not exists expenses_instance_category_idx on public.expenses(app_instance_id, category);
create index if not exists categories_instance_name_idx on public.categories(app_instance_id, name);

alter table public.expenses enable row level security;
alter table public.categories enable row level security;
alter table public.preferences enable row level security;

drop policy if exists "No direct anon expense access" on public.expenses;
drop policy if exists "No direct anon category access" on public.categories;
drop policy if exists "No direct anon preference access" on public.preferences;
drop policy if exists "Open personal expense access" on public.expenses;
drop policy if exists "Open personal category access" on public.categories;
drop policy if exists "Open personal preference access" on public.preferences;

create policy "Open personal expense access" on public.expenses for all to anon using (true) with check (true);
create policy "Open personal category access" on public.categories for all to anon using (true) with check (true);
create policy "Open personal preference access" on public.preferences for all to anon using (true) with check (true);
