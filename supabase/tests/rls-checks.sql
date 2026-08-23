-- Fonseca Fitness — Row Level Security verification
--
-- How to run:
--   1. Apply supabase/schema.sql to the project first.
--   2. Open this entire file in the Supabase SQL Editor and click Run.
--   3. Review the Messages output for PASS lines. Any failed assertion stops
--      the script with a FAIL exception.
--
-- The script creates temporary Auth users and account data inside one
-- transaction. The final ROLLBACK removes every test row.

begin;
set local client_min_messages = notice;

-- Stable test identifiers make the JWT simulations easy to read. Because the
-- transaction rolls back, they never remain in the project.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'f0a00000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'rls-client-a@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"RLS Client A"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'f0b00000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'rls-client-b@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"RLS Client B"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'f0c00000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'rls-coach@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"RLS Coach"}'::jsonb,
    now(),
    now()
  );

-- The signup trigger created all three profiles as clients. This trusted SQL
-- Editor operation promotes only the designated coach.
update public.profiles
set client_type = 'in_person'
where id in (
  'f0a00000-0000-4000-8000-000000000001',
  'f0b00000-0000-4000-8000-000000000002'
);

update public.profiles
set role = 'coach'
where id = 'f0c00000-0000-4000-8000-000000000003';

insert into public.packages (id, client_id, name, total_sessions, price_cents)
values
  (
    'f0a10000-0000-4000-8000-000000000101',
    'f0a00000-0000-4000-8000-000000000001',
    'Client A package',
    10,
    45000
  ),
  (
    'f0b10000-0000-4000-8000-000000000102',
    'f0b00000-0000-4000-8000-000000000002',
    'Client B package',
    5,
    25000
  );

insert into public.session_log (id, package_id, coach_id, note)
values
  (
    'f0b20000-0000-4000-8000-000000000201',
    'f0b10000-0000-4000-8000-000000000102',
    'f0c00000-0000-4000-8000-000000000003',
    'Client B private session'
  );

insert into public.invoices (id, client_id, amount_cents, memo, status, method, sent_at)
values
  (
    'f0a30000-0000-4000-8000-000000000301',
    'f0a00000-0000-4000-8000-000000000001',
    45000,
    'Client A invoice',
    'sent',
    'ach',
    now()
  ),
  (
    'f0b30000-0000-4000-8000-000000000302',
    'f0b00000-0000-4000-8000-000000000002',
    25000,
    'Client B invoice',
    'sent',
    'card',
    now()
  );

-- ---------------------------------------------------------------------------
-- Client A
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"f0a00000-0000-4000-8000-000000000001","role":"authenticated","aud":"authenticated"}';

do $client_a$
declare
  visible_count integer;
  current_role text;
begin
  select count(*) into visible_count
  from public.packages
  where client_id = 'f0a00000-0000-4000-8000-000000000001';
  if visible_count <> 1 then
    raise exception 'FAIL: client A could not read their own package';
  end if;
  raise notice 'PASS: client A can read their own package';

  select count(*) into visible_count
  from public.packages
  where client_id = 'f0b00000-0000-4000-8000-000000000002';
  if visible_count <> 0 then
    raise exception 'FAIL: client A read client B packages';
  end if;
  raise notice 'PASS: client A cannot read client B packages';

  select count(*) into visible_count
  from public.invoices
  where client_id = 'f0b00000-0000-4000-8000-000000000002';
  if visible_count <> 0 then
    raise exception 'FAIL: client A read client B invoices';
  end if;
  raise notice 'PASS: client A cannot read client B invoices';

  select count(*) into visible_count
  from public.session_log
  where id = 'f0b20000-0000-4000-8000-000000000201';
  if visible_count <> 0 then
    raise exception 'FAIL: client A read client B session log';
  end if;
  raise notice 'PASS: client A cannot read client B session log';

  select count(*) into visible_count
  from public.package_remaining
  where client_id = 'f0b00000-0000-4000-8000-000000000002';
  if visible_count <> 0 then
    raise exception 'FAIL: package_remaining leaked client B data to client A';
  end if;
  raise notice 'PASS: package_remaining does not leak client B data to client A';

  begin
    update public.profiles
    set role = 'coach'
    where id = 'f0a00000-0000-4000-8000-000000000001';
    raise exception 'UNEXPECTED_SUCCESS_ROLE';
  exception when others then
    if sqlerrm = 'UNEXPECTED_SUCCESS_ROLE' then
      raise exception 'FAIL: client A changed their own role';
    end if;
    raise notice 'PASS: client A cannot change their own role';
  end;

  select role into current_role
  from public.profiles
  where id = 'f0a00000-0000-4000-8000-000000000001';
  if current_role <> 'client' then
    raise exception 'FAIL: client A role changed despite the guard';
  end if;

  begin
    insert into public.packages (client_id, name, total_sessions)
    values ('f0a00000-0000-4000-8000-000000000001', 'Forbidden package', 1);
    raise exception 'UNEXPECTED_SUCCESS_PACKAGE';
  exception when others then
    if sqlerrm = 'UNEXPECTED_SUCCESS_PACKAGE' then
      raise exception 'FAIL: client A inserted a package';
    end if;
    raise notice 'PASS: client A cannot insert packages';
  end;

  begin
    insert into public.invoices (client_id, amount_cents, memo)
    values ('f0a00000-0000-4000-8000-000000000001', 100, 'Forbidden invoice');
    raise exception 'UNEXPECTED_SUCCESS_INVOICE';
  exception when others then
    if sqlerrm = 'UNEXPECTED_SUCCESS_INVOICE' then
      raise exception 'FAIL: client A inserted an invoice';
    end if;
    raise notice 'PASS: client A cannot insert invoices';
  end;

  begin
    insert into public.session_log (package_id, note)
    values ('f0a10000-0000-4000-8000-000000000101', 'Forbidden session');
    raise exception 'UNEXPECTED_SUCCESS_SESSION';
  exception when others then
    if sqlerrm = 'UNEXPECTED_SUCCESS_SESSION' then
      raise exception 'FAIL: client A inserted a session log';
    end if;
    raise notice 'PASS: client A cannot insert session logs';
  end;
end;
$client_a$;

reset role;
set local request.jwt.claims = '{}';

-- ---------------------------------------------------------------------------
-- Client B: a focused reciprocal isolation check
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"f0b00000-0000-4000-8000-000000000002","role":"authenticated","aud":"authenticated"}';

do $client_b$
declare
  visible_count integer;
begin
  select count(*) into visible_count
  from public.packages
  where client_id = 'f0a00000-0000-4000-8000-000000000001';
  if visible_count <> 0 then
    raise exception 'FAIL: client B read client A packages';
  end if;
  raise notice 'PASS: client B cannot read client A packages';

  select count(*) into visible_count
  from public.package_remaining
  where client_id = 'f0a00000-0000-4000-8000-000000000001';
  if visible_count <> 0 then
    raise exception 'FAIL: package_remaining leaked client A data to client B';
  end if;
  raise notice 'PASS: package_remaining does not leak client A data to client B';
end;
$client_b$;

reset role;
set local request.jwt.claims = '{}';

-- ---------------------------------------------------------------------------
-- Coach
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"f0c00000-0000-4000-8000-000000000003","role":"authenticated","aud":"authenticated"}';

do $coach$
declare
  visible_count integer;
  updated_status text;
begin
  select count(*) into visible_count from public.packages;
  if visible_count <> 2 then
    raise exception 'FAIL: coach could not read all packages';
  end if;
  raise notice 'PASS: coach can read all packages';

  select count(*) into visible_count from public.invoices;
  if visible_count <> 2 then
    raise exception 'FAIL: coach could not read all invoices';
  end if;
  raise notice 'PASS: coach can read all invoices';

  select count(*) into visible_count from public.session_log;
  if visible_count <> 1 then
    raise exception 'FAIL: coach could not read all session logs';
  end if;
  raise notice 'PASS: coach can read all session logs';

  select count(*) into visible_count from public.package_remaining;
  if visible_count <> 2 then
    raise exception 'FAIL: coach could not read all package_remaining rows';
  end if;
  raise notice 'PASS: coach can read all package_remaining rows';

  insert into public.packages (id, client_id, name, total_sessions, price_cents)
  values (
    'f0c10000-0000-4000-8000-000000000103',
    'f0a00000-0000-4000-8000-000000000001',
    'Coach-created package',
    3,
    15000
  );
  raise notice 'PASS: coach can insert packages';

  insert into public.invoices (id, client_id, amount_cents, memo, status, method, sent_at)
  values (
    'f0c30000-0000-4000-8000-000000000303',
    'f0a00000-0000-4000-8000-000000000001',
    15000,
    'Coach-created invoice',
    'sent',
    'cash',
    now()
  );
  raise notice 'PASS: coach can insert invoices';

  insert into public.session_log (id, package_id, coach_id, note)
  values (
    'f0c20000-0000-4000-8000-000000000203',
    'f0c10000-0000-4000-8000-000000000103',
    'f0c00000-0000-4000-8000-000000000003',
    'Coach-created session'
  );
  raise notice 'PASS: coach can insert session logs';

  update public.invoices
  set status = 'paid', paid_at = now()
  where id = 'f0b30000-0000-4000-8000-000000000302'
  returning status into updated_status;
  if updated_status <> 'paid' then
    raise exception 'FAIL: coach could not mark an invoice paid';
  end if;
  raise notice 'PASS: coach can update invoices';

  update public.profiles
  set role = 'coach'
  where id = 'f0a00000-0000-4000-8000-000000000001';
  select role into updated_status
  from public.profiles
  where id = 'f0a00000-0000-4000-8000-000000000001';
  if updated_status <> 'coach' then
    raise exception 'FAIL: coach could not promote a client';
  end if;
  update public.profiles
  set role = 'client'
  where id = 'f0a00000-0000-4000-8000-000000000001';
  raise notice 'PASS: coach can manage profile roles';
end;
$coach$;

reset role;
set local request.jwt.claims = '{}';

do $$
begin
  raise notice 'PASS: all Fonseca Fitness RLS checks completed';
end;
$$;

rollback;
