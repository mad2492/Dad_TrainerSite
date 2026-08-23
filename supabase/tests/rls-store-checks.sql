-- Fonseca Fitness — Storefront Row Level Security verification
--
-- How to run:
--   1. Apply supabase/schema.sql, then supabase/schema-store.sql.
--   2. Open this entire file in the Supabase SQL Editor and click Run.
--   3. Review the Messages output for PASS lines. Any failed assertion stops
--      the script with a FAIL exception.
--
-- The script creates temporary Auth users and storefront fixtures inside one
-- transaction. The final ROLLBACK removes every test row and stock change.

begin;
set local client_min_messages = notice;

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
    'f1a00000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'store-client-a@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Store Client A"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'f1b00000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'store-client-b@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Store Client B"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'f1c00000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'store-coach@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Store Coach"}'::jsonb,
    now(),
    now()
  );

update public.profiles
set role = 'coach'
where id = 'f1c00000-0000-4000-8000-000000000003';

insert into public.products (
  id, name, category, description, price_cents, stock_qty, sizes, active
)
values
  (
    'f1d00000-0000-4000-8000-000000000101',
    'Store active product',
    'recovery',
    'Fixture product that clients can order.',
    5400,
    5,
    null,
    true
  ),
  (
    'f1d00000-0000-4000-8000-000000000102',
    'Store inactive product',
    'supplies',
    'Fixture product hidden from the public catalog.',
    1200,
    5,
    null,
    false
  );

insert into public.orders (id, client_id, status, note)
values (
  'f1e00000-0000-4000-8000-000000000201',
  'f1b00000-0000-4000-8000-000000000002',
  'paid',
  'Client B private order'
);

insert into public.order_items (
  id, order_id, product_id, qty, unit_price_cents
)
values (
  'f1f00000-0000-4000-8000-000000000301',
  'f1e00000-0000-4000-8000-000000000201',
  'f1d00000-0000-4000-8000-000000000101',
  1,
  5400
);

-- ---------------------------------------------------------------------------
-- Anonymous catalog access
-- ---------------------------------------------------------------------------

set local role anon;
set local request.jwt.claims =
  '{"role":"anon","aud":"authenticated"}';

do $anon_catalog$
declare
  v_visible_count integer;
begin
  select count(*) into v_visible_count
  from public.products
  where id = 'f1d00000-0000-4000-8000-000000000101';
  if v_visible_count <> 1 then
    raise exception 'FAIL: anon could not read the active fixture product';
  end if;
  raise notice 'PASS: anon can read active products';

  select count(*) into v_visible_count
  from public.products
  where id = 'f1d00000-0000-4000-8000-000000000102';
  if v_visible_count <> 0 then
    raise exception 'FAIL: anon read the inactive fixture product';
  end if;
  raise notice 'PASS: anon cannot read inactive products';

  begin
    insert into public.products (name, category, price_cents, stock_qty)
    values ('Forbidden anon product', 'supplies', 100, 1);
    raise exception 'UNEXPECTED_SUCCESS_ANON_PRODUCT';
  exception
    when insufficient_privilege then
      raise notice 'PASS: anon cannot write products';
    when others then
      if sqlerrm = 'UNEXPECTED_SUCCESS_ANON_PRODUCT' then
        raise exception 'FAIL: anon inserted a product';
      end if;
      raise;
  end;
end;
$anon_catalog$;

reset role;
set local request.jwt.claims = '{}';

-- ---------------------------------------------------------------------------
-- Client A: isolation, direct-write denial, and RPC checkout
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"f1a00000-0000-4000-8000-000000000001","role":"authenticated","aud":"authenticated"}';

do $client_checkout$
declare
  v_visible_count integer;
  v_order_id uuid;
  v_client_id uuid;
  v_stock_qty integer;
  v_unit_price_cents integer;
begin
  select count(*) into v_visible_count
  from public.products
  where id = 'f1d00000-0000-4000-8000-000000000102';
  if v_visible_count <> 0 then
    raise exception 'FAIL: client A read an inactive product';
  end if;
  raise notice 'PASS: clients cannot read inactive products';

  begin
    insert into public.products (name, category, price_cents, stock_qty)
    values ('Forbidden client product', 'supplies', 100, 1);
    raise exception 'UNEXPECTED_SUCCESS_CLIENT_PRODUCT';
  exception
    when insufficient_privilege then
      raise notice 'PASS: clients cannot write products';
    when others then
      if sqlerrm = 'UNEXPECTED_SUCCESS_CLIENT_PRODUCT' then
        raise exception 'FAIL: client A inserted a product';
      end if;
      raise;
  end;

  select count(*) into v_visible_count
  from public.orders
  where id = 'f1e00000-0000-4000-8000-000000000201';
  if v_visible_count <> 0 then
    raise exception 'FAIL: client A read client B order';
  end if;
  raise notice 'PASS: client A cannot read client B orders';

  select count(*) into v_visible_count
  from public.order_items
  where id = 'f1f00000-0000-4000-8000-000000000301';
  if v_visible_count <> 0 then
    raise exception 'FAIL: client A read client B order items';
  end if;
  raise notice 'PASS: client A cannot read client B order items';

  begin
    insert into public.orders (client_id, note)
    values ('f1a00000-0000-4000-8000-000000000001', 'Forbidden direct order');
    raise exception 'UNEXPECTED_SUCCESS_DIRECT_ORDER';
  exception
    when insufficient_privilege then
      raise notice 'PASS: clients cannot insert orders directly';
    when others then
      if sqlerrm = 'UNEXPECTED_SUCCESS_DIRECT_ORDER' then
        raise exception 'FAIL: client A inserted an order directly';
      end if;
      raise;
  end;

  select public.place_order(
    jsonb_build_array(
      jsonb_build_object(
        'product_id', 'f1d00000-0000-4000-8000-000000000101',
        'qty', 2,
        'size', null,
        'unit_price_cents', 1
      )
    ),
    'RPC checkout fixture'
  ) into v_order_id;

  select client_id into v_client_id
  from public.orders
  where id = v_order_id;
  if v_client_id <> 'f1a00000-0000-4000-8000-000000000001' then
    raise exception 'FAIL: place_order did not attach the order to client A';
  end if;

  select unit_price_cents into v_unit_price_cents
  from public.order_items
  where order_id = v_order_id;
  if v_unit_price_cents <> 5400 then
    raise exception 'FAIL: place_order trusted a client-sent price';
  end if;

  select stock_qty into v_stock_qty
  from public.products
  where id = 'f1d00000-0000-4000-8000-000000000101';
  if v_stock_qty <> 3 then
    raise exception 'FAIL: place_order did not decrement stock atomically';
  end if;
  raise notice 'PASS: place_order creates an owned order, uses current prices, and decrements stock';

  begin
    perform public.place_order(
      jsonb_build_array(
        jsonb_build_object(
          'product_id', 'f1d00000-0000-4000-8000-000000000101',
          'qty', 99,
          'size', null
        )
      ),
      null
    );
    raise exception 'UNEXPECTED_SUCCESS_OUT_OF_STOCK';
  exception when others then
    if sqlerrm = 'UNEXPECTED_SUCCESS_OUT_OF_STOCK' then
      raise exception 'FAIL: place_order accepted insufficient stock';
    elsif sqlerrm like 'Not enough stock for Store active product%' then
      raise notice 'PASS: place_order fails cleanly on insufficient stock';
    else
      raise;
    end if;
  end;
end;
$client_checkout$;

reset role;
set local request.jwt.claims = '{}';

-- ---------------------------------------------------------------------------
-- Coach: full catalog visibility and managed updates
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims =
  '{"sub":"f1c00000-0000-4000-8000-000000000003","role":"authenticated","aud":"authenticated"}';

do $coach_store$
declare
  v_visible_count integer;
  v_stock_qty integer;
  v_order_status text;
begin
  select count(*) into v_visible_count
  from public.products
  where id in (
    'f1d00000-0000-4000-8000-000000000101',
    'f1d00000-0000-4000-8000-000000000102'
  );
  if v_visible_count <> 2 then
    raise exception 'FAIL: coach could not read all fixture products';
  end if;
  raise notice 'PASS: coach can read active and inactive products';

  update public.products
  set stock_qty = 9
  where id = 'f1d00000-0000-4000-8000-000000000102'
  returning stock_qty into v_stock_qty;
  if v_stock_qty <> 9 then
    raise exception 'FAIL: coach could not update product inventory';
  end if;
  raise notice 'PASS: coach can update products';

  update public.orders
  set status = 'shipped'
  where id = 'f1e00000-0000-4000-8000-000000000201'
  returning status into v_order_status;
  if v_order_status <> 'shipped' then
    raise exception 'FAIL: coach could not update an order status';
  end if;
  raise notice 'PASS: coach can update order status';
end;
$coach_store$;

reset role;
set local request.jwt.claims = '{}';

do $$
begin
  raise notice 'PASS: all Fonseca Fitness storefront RLS checks completed';
end;
$$;

rollback;
