# Codex handoff #3 — commerce backend (products, orders, inventory)

Copy this whole file into Codex as the task prompt. Rounds 1–2 (accounts
layer, live data + coach actions, RLS checks) are merged to main. This round
puts a real catalog and order flow behind the storefront demo.

## Get the code

```bash
git fetch origin claude/peptide-storefront-design-yv6n35
git checkout claude/peptide-storefront-design-yv6n35
git pull --ff-only origin claude/peptide-storefront-design-yv6n35
```

Heads-up: this branch also carries an in-progress homepage rework
(`index.html` is being rebuilt; the old page moved to `proposal.html`).
**Do not touch `index.html` or `proposal.html`** — pull before starting and
work only in the files named below. Push small commits to this same branch;
no force-push, no rebase.

## Context recap

Static GitHub Pages site, no build step, vanilla JS only. `shop.html` /
`product.html` / `cart.html` are a working storefront demo (sample products
hardcoded; add-to-cart is a localStorage counter, key `fonseca-cart-demo`).
`assets/portal-auth.js` (`window.FonsecaAuth`) handles Supabase magic-link
auth; `assets/portal-data.js` (`window.FonsecaData`) binds the portal to live
data; both are silent no-ops in demo mode (placeholder
`assets/portal-config.js`). `supabase/schema.sql` holds the accounts contract
(do not rename anything in it); `supabase/tests/rls-checks.sql` shows the
test idioms to follow (v_-prefixed variables — `current_role` is a reserved
word; PASS only on `insufficient_privilege` for RLS denials, re-raise
anything else; fixture-scoped counts so live data can't break a run;
everything inside one `begin … rollback`).

## Tasks

### 1. `supabase/schema-store.sql` — catalog + orders schema

New idempotent file (same style as schema.sql: `create table if not exists`,
`drop policy if exists` + `create policy`, functions with
`security definer set search_path = ''`, fully-qualified names):

- `public.products`: id uuid pk default gen_random_uuid(); name text not
  null; category text not null check (category in
  ('recovery','growth','metabolic','merch','supplies')); description text;
  price_cents integer not null check (price_cents >= 0); stock_qty integer
  not null default 0 check (stock_qty >= 0); sizes text[] (null for
  non-apparel); active boolean not null default true; created_at
  timestamptz default now().
- `public.orders`: id uuid pk default gen_random_uuid(); client_id uuid not
  null references public.profiles(id); status text not null default
  'pending' check (status in
  ('pending','invoiced','paid','shipped','cancelled')); note text;
  created_at timestamptz default now().
- `public.order_items`: id uuid pk default gen_random_uuid(); order_id uuid
  not null references public.orders(id) on delete cascade; product_id uuid
  not null references public.products(id); qty integer not null check
  (qty > 0); unit_price_cents integer not null check
  (unit_price_cents >= 0); size text.
- `public.place_order(items jsonb, note text default null)` — a security
  definer RPC that atomically: validates the caller is authenticated,
  validates each `{product_id, qty, size}` against active products and
  available stock, decrements `stock_qty`, inserts the order (client_id =
  auth.uid()) and its items priced from the CURRENT products table (never
  trust client-sent prices), and returns the new order id. Raise clear
  exceptions for out-of-stock / unknown product / empty cart. Revoke execute
  from public and anon; grant to authenticated.
- Grants + RLS: products — SELECT for `anon` and `authenticated` (public
  catalog; only `active = true` rows for non-coaches via policy), all writes
  coach-only (`public.is_coach()` from schema.sql). orders/order_items —
  clients SELECT their own (order_items via the parent order), coaches
  SELECT/UPDATE all; INSERT only through `place_order` (no direct insert
  policies for clients). Revoke default grants first, like schema.sql does.
- Commented seed block (commented out, like schema.sql's promotion example)
  inserting the six demo products so going live starts from the same catalog
  the demo shows.

### 2. `supabase/tests/rls-store-checks.sql`

Same harness idioms as rls-checks.sql (transactional, PASS/FAIL notices,
fixture-scoped). Assert at minimum: anon can read active products but not
inactive ones; anon cannot write products; a client cannot write products or
read another client's orders/order_items; a client CANNOT insert into orders
directly; `place_order` succeeds for a client with stock available,
decrements stock, prices items from the products table (ignoring any
client-side price), and fails cleanly on insufficient stock; a coach can
update products and order status. Include the how-to-run header.

### 3. `assets/shop-data.js` — live catalog + checkout binding

New plain script, loaded on shop/product/cart pages after portal-auth.js.
Demo mode: silent no-op (the hardcoded cards stay). Live mode:

- Replace the shop grid's six sample cards with rows from `products`
  (active only), keeping the exact existing card markup/classes and the
  category filter behavior; stock badges from `stock_qty` (In stock / Low
  stock · N left when ≤3 / Out of stock). Bind via `data-hook` attributes
  added to shop.html/product.html/cart.html — zero visual redesign, zero
  new CSS.
- Cart: keep localStorage for the cart contents (upgrade the counter to a
  small JSON cart `{product_id: {qty, size}}` under a NEW key
  `fonseca-cart-v2`, migrating/ignoring the old counter gracefully; in demo
  mode the old counter behavior stays). On cart.html in live mode, render
  the cart from the catalog and offer "Place order" for signed-in users →
  `place_order` RPC → success message with the order id; signed-out users
  see "Sign in to order" linking portal.html. Every failure path renders a
  friendly message, never an uncaught rejection.
- Client portal "Recent orders" card and coach "store orders to pack" line:
  extend `assets/portal-data.js` minimally to read real orders (client: own
  orders with status; coach: pending/paid orders count + a mark-shipped
  action following the existing dialog pattern).

### 4. Verify before each push

```bash
python3 -m http.server 8000
# shop/product/cart in demo mode: pixel-identical to before, clean console,
# filters and the demo cart counter still work end to end.
```

Fake non-placeholder config values temporarily to walk the live-mode error
paths (nothing may throw uncaught); restore placeholders before committing.
Document the manual live-mode test plan in the final commit message.

## Constraints (hard)

- No build step, no new dependencies; keep `FonsecaAuth`/`FonsecaData`
  public APIs and the schema.sql contract unchanged; `schema-store.sql` is
  additive only.
- Demo mode stays pixel-identical and error-free on all pages.
- Never trust client-side prices or stock — the RPC owns both.
- Do not touch `index.html` / `proposal.html` (parallel work in flight).
