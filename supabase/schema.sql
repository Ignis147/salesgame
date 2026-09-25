-- =====================================================================
-- SalesQuest: схема для хранения данных пользователей в Supabase
-- Выполните этот SQL один раз в Supabase Studio → SQL Editor
-- (Project ID: izhycodgxrnophnmemwo).
-- =====================================================================

-- 1) Таблица профилей: игровые данные пользователя привязаны к auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null default '',
  name text not null default 'Сотрудник',
  avatar text not null default '🙂',
  role text not null default 'employee' check (role in ('creator', 'admin', 'employee')),
  department text not null default 'Отдел продаж',
  level integer not null default 1,
  xp integer not null default 0,
  xp_to_next integer not null default 1000,
  streak integer not null default 0,
  plan integer not null default 0,
  fact integer not null default 0,
  sales_coins integer not null default 0,
  profile_color text not null default 'pink',
  achievements jsonb not null default '[]'::jsonb,
  monthly_history jsonb not null default '[]'::jsonb,
  purchased_prizes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- 2) Общие данные приложения (призы, челленджи, уведомления, планы, настройки).
create table if not exists public.app_state (
  id text primary key default 'global',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 3) Row Level Security.
alter table public.profiles enable row level security;
alter table public.app_state enable row level security;

-- Каждый пользователь видит всех участников команды и может менять только свой профиль.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select using (auth.role() = 'authenticated');

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- Администраторы и создатель могут управлять профилями других пользователей
-- (назначение админов, удаление участников, выдача достижений).
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('creator', 'admin')
  );
$$;

drop policy if exists "profiles_admin_write" on public.profiles;
create policy "profiles_admin_write" on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());

-- Общие данные доступны всем вошедшим пользователям.
drop policy if exists "app_state_select" on public.app_state;
create policy "app_state_select" on public.app_state for select using (auth.role() = 'authenticated');

drop policy if exists "app_state_write" on public.app_state;
create policy "app_state_write" on public.app_state for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 4) Авто-создание профиля при регистрации в Supabase Auth.
-- Имя и аватар берутся из user_metadata, которые фронтенд передаёт в signUp().
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, avatar, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', 'Сотрудник'),
    coalesce(new.raw_user_meta_data ->> 'avatar', '🙂'),
    case when lower(coalesce(new.email, '')) = 'ignis.kwork@gmail.com' then 'creator' else 'employee' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
