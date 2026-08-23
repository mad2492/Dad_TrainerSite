-- Fonseca Fitness — Supabase database schema
-- Idempotent: safe to run once (or again) on a Supabase project via the SQL editor.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'client' check (role in ('client', 'coach')),
  client_type text check (client_type in ('online', 'in_person')),
  created_at timestamptz default now()
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  total_sessions integer not null check (total_sessions > 0),
  price_cents integer not null default 0,
  purchased_at timestamptz default now()
);

create table if not exists public.session_log (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  coach_id uuid references public.profiles(id),
  occurred_at timestamptz not null default now(),
  note text
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  memo text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'void')),
  method text check (method in ('card', 'ach', 'cash')),
  pay_link_url text,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a new auth user signs up
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'client')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helper: is the current user a coach?
-- ---------------------------------------------------------------------------

create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'coach'
  );
$$;

-- ---------------------------------------------------------------------------
-- Guard: non-coaches cannot change their own role
-- ---------------------------------------------------------------------------

create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Browser requests always have an auth.uid(). Trusted database operations
  -- (including the documented SQL Editor promotion) do not. RLS still blocks
  -- untrusted anonymous requests before this trigger can run.
  if new.role is distinct from old.role
    and auth.uid() is not null
    and not public.is_coach()
  then
    raise exception 'Only a coach can change roles.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ---------------------------------------------------------------------------
-- View: sessions remaining per package
-- ---------------------------------------------------------------------------

create or replace view public.package_remaining
with (security_invoker = true)
as
select
  p.id as package_id,
  p.client_id,
  p.name,
  p.total_sessions,
  count(s.id)::integer as sessions_used,
  p.total_sessions - count(s.id)::integer as sessions_remaining
from public.packages p
left join public.session_log s on s.package_id = p.id
group by p.id, p.client_id, p.name, p.total_sessions;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.packages enable row level security;
alter table public.session_log enable row level security;
alter table public.invoices enable row level security;

-- Supabase grants broad table privileges to its API roles by default. Take
-- those back, then grant only the operations the policies below can allow.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.packages from anon, authenticated;
revoke all on table public.session_log from anon, authenticated;
revoke all on table public.invoices from anon, authenticated;
revoke all on table public.package_remaining from anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.packages to authenticated;
grant select, insert, update, delete on table public.session_log to authenticated;
grant select, insert, update, delete on table public.invoices to authenticated;
grant select on table public.package_remaining to authenticated;

-- Trigger functions never need direct API access. is_coach() is intentionally
-- callable only by signed-in users and reveals only the caller's own role.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.prevent_role_change() from public, anon, authenticated;
revoke all on function public.is_coach() from public, anon, authenticated;
grant execute on function public.is_coach() to authenticated;

-- profiles

drop policy if exists "profiles_select_own_or_coach" on public.profiles;
create policy "profiles_select_own_or_coach" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_coach()));

drop policy if exists "profiles_update_own_or_coach" on public.profiles;
create policy "profiles_update_own_or_coach" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_coach()))
  with check (id = (select auth.uid()) or (select public.is_coach()));
-- Note: role changes by non-coaches are blocked by the protect_profile_role trigger.

-- packages

drop policy if exists "packages_select_own_or_coach" on public.packages;
create policy "packages_select_own_or_coach" on public.packages
  for select to authenticated
  using (client_id = (select auth.uid()) or (select public.is_coach()));

drop policy if exists "packages_insert_coach" on public.packages;
create policy "packages_insert_coach" on public.packages
  for insert to authenticated with check ((select public.is_coach()));

drop policy if exists "packages_update_coach" on public.packages;
create policy "packages_update_coach" on public.packages
  for update to authenticated
  using ((select public.is_coach()))
  with check ((select public.is_coach()));

drop policy if exists "packages_delete_coach" on public.packages;
create policy "packages_delete_coach" on public.packages
  for delete to authenticated using ((select public.is_coach()));

-- session_log (clients see rows via their package's client_id)

drop policy if exists "session_log_select_own_or_coach" on public.session_log;
create policy "session_log_select_own_or_coach" on public.session_log
  for select to authenticated
  using (
    (select public.is_coach())
    or exists (
      select 1 from public.packages pk
      where pk.id = session_log.package_id
        and pk.client_id = (select auth.uid())
    )
  );

drop policy if exists "session_log_insert_coach" on public.session_log;
create policy "session_log_insert_coach" on public.session_log
  for insert to authenticated with check ((select public.is_coach()));

drop policy if exists "session_log_update_coach" on public.session_log;
create policy "session_log_update_coach" on public.session_log
  for update to authenticated
  using ((select public.is_coach()))
  with check ((select public.is_coach()));

drop policy if exists "session_log_delete_coach" on public.session_log;
create policy "session_log_delete_coach" on public.session_log
  for delete to authenticated using ((select public.is_coach()));

-- invoices

drop policy if exists "invoices_select_own_or_coach" on public.invoices;
create policy "invoices_select_own_or_coach" on public.invoices
  for select to authenticated
  using (client_id = (select auth.uid()) or (select public.is_coach()));

drop policy if exists "invoices_insert_coach" on public.invoices;
create policy "invoices_insert_coach" on public.invoices
  for insert to authenticated with check ((select public.is_coach()));

drop policy if exists "invoices_update_coach" on public.invoices;
create policy "invoices_update_coach" on public.invoices
  for update to authenticated
  using ((select public.is_coach()))
  with check ((select public.is_coach()));

drop policy if exists "invoices_delete_coach" on public.invoices;
create policy "invoices_delete_coach" on public.invoices
  for delete to authenticated using ((select public.is_coach()));

-- ---------------------------------------------------------------------------
-- Promoting a user to coach (run manually, once, for the coach's account).
-- Find the user's UUID under Authentication -> Users in the Supabase dashboard.
-- ---------------------------------------------------------------------------

-- update public.profiles set role = 'coach' where id = '<user-uuid>';
