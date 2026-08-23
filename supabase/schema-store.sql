-- Fonseca Fitness — Supabase storefront schema
-- Idempotent: safe to run once (or again) after supabase/schema.sql.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('recovery', 'growth', 'metabolic', 'merch', 'supplies')),
  description text,
  price_cents integer not null check (price_cents >= 0),
  stock_qty integer not null default 0 check (stock_qty >= 0),
  sizes text[],
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'invoiced', 'paid', 'shipped', 'cancelled')),
  note text,
  created_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  qty integer not null check (qty > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  size text
);

-- ---------------------------------------------------------------------------
-- Atomic checkout RPC
-- ---------------------------------------------------------------------------

create or replace function public.place_order(items jsonb, note text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_client_id uuid := auth.uid();
  v_order_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_product_id uuid;
  v_qty integer;
  v_size text;
begin
  if v_client_id is null then
    raise exception 'You must be signed in to place an order.';
  end if;

  if $1 is null
    or jsonb_typeof($1) <> 'array'
    or jsonb_array_length($1) = 0
  then
    raise exception 'Your cart is empty.';
  end if;

  insert into public.orders (client_id, note)
  values (v_client_id, nullif(btrim($2), ''))
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements($1)
  loop
    if jsonb_typeof(v_item) <> 'object'
      or not (v_item ? 'product_id')
      or not (v_item ? 'qty')
    then
      raise exception 'Each cart item needs a product_id and quantity.';
    end if;

    begin
      v_product_id := nullif(v_item ->> 'product_id', '')::uuid;
    exception when invalid_text_representation then
      raise exception 'A cart item has an invalid product id.';
    end;

    begin
      v_qty := (v_item ->> 'qty')::integer;
    exception when invalid_text_representation or numeric_value_out_of_range then
      raise exception 'A cart item has an invalid quantity.';
    end;

    if v_product_id is null then
      raise exception 'A cart item has an invalid product id.';
    end if;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Cart quantities must be greater than zero.';
    end if;

    select product.*
    into v_product
    from public.products as product
    where product.id = v_product_id
    for update;

    if not found then
      raise exception 'Unknown product: %.', v_product_id;
    end if;
    if not v_product.active then
      raise exception 'Product % is not available.', v_product.name;
    end if;

    v_size := nullif(btrim(v_item ->> 'size'), '');
    if v_product.sizes is null then
      if v_size is not null then
        raise exception 'Product % does not accept a size.', v_product.name;
      end if;
    elsif v_size is null or not (v_size = any(v_product.sizes)) then
      raise exception 'Choose an available size for %.', v_product.name;
    end if;

    if v_product.stock_qty < v_qty then
      raise exception 'Not enough stock for % (requested %, available %).',
        v_product.name, v_qty, v_product.stock_qty;
    end if;

    update public.products
    set stock_qty = stock_qty - v_qty
    where id = v_product.id;

    insert into public.order_items (
      order_id,
      product_id,
      qty,
      unit_price_cents,
      size
    )
    values (
      v_order_id,
      v_product.id,
      v_qty,
      v_product.price_cents,
      v_size
    );
  end loop;

  return v_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants and Row Level Security
-- ---------------------------------------------------------------------------

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on table public.products from public, anon, authenticated;
revoke all on table public.orders from public, anon, authenticated;
revoke all on table public.order_items from public, anon, authenticated;

grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;
grant select, update on table public.orders to authenticated;
grant select, update on table public.order_items to authenticated;

revoke all on function public.place_order(jsonb, text) from public, anon, authenticated;
grant execute on function public.place_order(jsonb, text) to authenticated;

-- Public catalog. A separate authenticated-only policy lets coaches also see
-- inactive products without requiring anon to execute is_coach().
drop policy if exists "products_select_active" on public.products;
create policy "products_select_active" on public.products
  for select to anon, authenticated
  using (active = true);

drop policy if exists "products_select_coach" on public.products;
create policy "products_select_coach" on public.products
  for select to authenticated
  using ((select public.is_coach()));

drop policy if exists "products_insert_coach" on public.products;
create policy "products_insert_coach" on public.products
  for insert to authenticated
  with check ((select public.is_coach()));

drop policy if exists "products_update_coach" on public.products;
create policy "products_update_coach" on public.products
  for update to authenticated
  using ((select public.is_coach()))
  with check ((select public.is_coach()));

drop policy if exists "products_delete_coach" on public.products;
create policy "products_delete_coach" on public.products
  for delete to authenticated
  using ((select public.is_coach()));

drop policy if exists "orders_select_own_or_coach" on public.orders;
create policy "orders_select_own_or_coach" on public.orders
  for select to authenticated
  using (client_id = (select auth.uid()) or (select public.is_coach()));

drop policy if exists "orders_update_coach" on public.orders;
create policy "orders_update_coach" on public.orders
  for update to authenticated
  using ((select public.is_coach()))
  with check ((select public.is_coach()));

drop policy if exists "order_items_select_own_or_coach" on public.order_items;
create policy "order_items_select_own_or_coach" on public.order_items
  for select to authenticated
  using (
    (select public.is_coach())
    or exists (
      select 1
      from public.orders as parent_order
      where parent_order.id = order_items.order_id
        and parent_order.client_id = (select auth.uid())
    )
  );

drop policy if exists "order_items_update_coach" on public.order_items;
create policy "order_items_update_coach" on public.order_items
  for update to authenticated
  using ((select public.is_coach()))
  with check ((select public.is_coach()));

-- ---------------------------------------------------------------------------
-- Optional demo-catalog seed
-- Uncomment and run once when the storefront is ready to go live.
-- ---------------------------------------------------------------------------

-- insert into public.products (
--   id, name, category, description, price_cents, stock_qty, sizes, active
-- )
-- values
--   ('f0010000-0000-4000-8000-000000000001', 'BPC-157 · 5mg', 'recovery', 'Recovery support selected with guidance from your coach.', 5400, 12, null, true),
--   ('f0010000-0000-4000-8000-000000000002', 'TB-500 · 5mg', 'recovery', 'Recovery support selected with guidance from your coach.', 6200, 8, null, true),
--   ('f0010000-0000-4000-8000-000000000003', 'CJC-1295 / Ipamorelin · 10mg', 'growth', 'Growth and performance support selected with guidance from your coach.', 8900, 3, null, true),
--   ('f0010000-0000-4000-8000-000000000004', 'MOTS-c · 10mg', 'metabolic', 'Metabolic support selected with guidance from your coach.', 7400, 0, null, true),
--   ('f0010000-0000-4000-8000-000000000005', 'Fonseca Fitness Tee · Navy', 'merch', 'A soft Fonseca Fitness training tee in navy.', 2800, 20, array['S', 'M', 'L', 'XL', '2XL'], true),
--   ('f0010000-0000-4000-8000-000000000006', 'Fonseca Fitness Tee · Bone', 'merch', 'A soft Fonseca Fitness training tee in bone.', 2800, 20, array['S', 'M', 'L', 'XL', '2XL'], true)
-- on conflict (id) do nothing;
