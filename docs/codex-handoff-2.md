# Codex handoff #2 — real data + coach actions

Copy this whole file into Codex as the task prompt. Round 1 (adversarial
review of the accounts layer) is merged into the branch and verified; this
round builds the live data layer on top of it.

## Get the code

```bash
git fetch origin claude/peptide-storefront-design-yv6n35
git checkout claude/peptide-storefront-design-yv6n35
git pull --ff-only origin claude/peptide-storefront-design-yv6n35
```

Push commits to this same branch (they land on draft PR #1). No force-push,
no rebase. Small, reviewable commits — one per numbered task below is ideal.

## Context recap

Static GitHub Pages site, **no build step / no frameworks — hard rule**.
`portal.html` has three persona views (`#view-guest`, `#view-client`,
`#view-coach`) switched by hash; all client/coach numbers shown are hardcoded
sample data. `assets/portal-auth.js` (`window.FonsecaAuth`) handles Supabase
magic-link auth and role→persona routing; with placeholder config in
`assets/portal-config.js` everything runs in demo mode. `supabase/schema.sql`
defines profiles (role client|coach), packages, session_log, invoices, the
`package_remaining` view, `is_coach()`, and hardened RLS (your round-1 work).
Keep the `FonsecaAuth` public API and the schema contract names stable.

## Tasks

### 1. `assets/portal-data.js` — live data binding

New plain-script module, loaded after `portal-auth.js`, exposing
`window.FonsecaData`. In demo mode (`FonsecaAuth.enabled === false`) it is a
silent no-op and the sample data stays exactly as-is. In live mode, after
sign-in, it replaces sample content with real rows:

- **Client persona**: their name; their packages with sessions remaining
  (from `package_remaining`); their invoices (status, amount, pay link if
  present). The training-plan card stays sample data — there is no plans
  table yet; label it "sample plan" in live mode.
- **Coach persona**: stats row computed from real data (active clients =
  profiles with role 'client'; unpaid invoices count + total where status =
  'sent'; packages running low = sessions_remaining <= 3); the client table
  from profiles joined with `package_remaining` and open invoices; the
  needs-attention list computed from the same queries.

Bind by adding `data-hook="..."` attributes to the existing markup in
`portal.html` — do NOT change classes, styles, or layout (visual design is
handled elsewhere; if a container is missing for something, add it with an
existing class and zero new CSS). Loading and error states: reuse the
`.signin-note` text style; every failure renders a friendly message, never a
blank card, never an uncaught rejection.

### 2. Coach actions (live mode only)

Wire the coach view's buttons through RLS-guarded writes:

- **Log session**: pick one of the client's packages (skip the picker when
  there's only one), insert into `session_log`, refresh the remaining count.
- **New invoice**: amount, memo, method (`ach`/`card`/`cash`), optional
  pay-link URL (the coach pastes a Stripe Payment Link created in the Stripe
  dashboard — no Stripe API integration in this round), insert with status
  'sent' and `sent_at = now()`.
- **Mark paid**: set status 'paid', `paid_at = now()` (the cash/manual path).

Use plain `<dialog>` or an inline form styled with existing classes for any
input; confirm destructive-ish actions with the dialog itself, no
`window.confirm`. In demo mode these buttons keep their current inert demo
behavior.

### 3. `supabase/tests/rls-checks.sql` — prove the policies

A script runnable in the Supabase SQL editor that simulates three actors
(client A, client B, coach) via `set local role` + `set local
request.jwt.claims`, and asserts at minimum: client A cannot read client B's
packages/invoices/session_log; client A cannot update their own role; client
A cannot insert packages/invoices; coach can do all of the above; the
`package_remaining` view leaks nothing cross-client. Print PASS/FAIL lines
(DO blocks with raise notice are fine — no pgTAP dependency). Add a short
"how to run" section at the top of the file.

### 4. Schema changes — only if truly needed

Prefer none. If task 1–2 genuinely needs a column, append an idempotent,
guarded `alter table` block at the end of `schema.sql` with a dated comment —
never rewrite existing statements, never rename contract names.

## Constraints (hard, same as round 1)

- No build step, no dependencies beyond the existing supabase-js CDN load.
- Demo mode must remain pixel-identical and error-free (placeholder config).
- Don't redesign anything visual; zero new CSS beyond what task 2's dialog
  strictly needs, built from existing classes/variables.
- Keep `FonsecaAuth` API and schema contract names unchanged.

## Verify before each push

```bash
python3 -m http.server 8000   # from the repo root
# portal.html → demo mode: all three personas identical to before, clean console
```

For live-mode logic you can't hit a real backend from tests; instead
document a manual test plan in the final commit message (what to click once
real keys exist), and make sure every network-failure path degrades to a
friendly message — temporarily fake non-placeholder config values and click
through to confirm nothing throws uncaught. Restore placeholders before
committing.
