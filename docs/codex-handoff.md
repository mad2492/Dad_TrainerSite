# Codex handoff — portal personas + accounts layer

Copy this whole file into Codex as the task prompt. It has repo context,
what to pull, what to review hardest, and the rules of the road.

## Get the code

```bash
git fetch origin claude/peptide-storefront-design-yv6n35
git checkout claude/peptide-storefront-design-yv6n35
git pull --ff-only origin claude/peptide-storefront-design-yv6n35
```

Open PR: https://github.com/mad2492/Dad_TrainerSite/pull/1 (draft). Push any
fixes as new commits to this same branch — no force-push, no rebase.

## Project context

Static site served from the repo root by GitHub Pages. **No build step, no
frameworks, no package.json** — plain HTML/CSS/JS only, and it must stay that
way. Owner is a personal trainer (Pete); his adult child maintains the site.
Brand tokens live as CSS custom properties in `index.html` and are duplicated
in `portal.html` (`--navy #0f2740`, `--red #b3262d`, `--paper #f5f3ee`,
`--gold #bd8a3d`, radius 8px, Inter stack). Light + dark themes via
`body[data-theme="dark"]`.

What's on this branch:

- `portal.html` — persona demo: Guest / Client / Coach views switched by URL
  hash (`#guest` / `#client` / `#coach`), tab pills in the header, theme
  toggle. All client/coach data is hardcoded sample data on purpose.
- `assets/portal-auth.js` — dormant Supabase auth module (`window.FonsecaAuth`):
  magic-link sign-in, profile fetch, role→persona routing. With placeholder
  config it must be a silent no-op ("demo mode").
- `assets/portal-config.js` — ships with placeholder values; real keys go here
  (anon key is publish-safe by design; RLS is the security boundary).
- `supabase/schema.sql` — profiles (role client|coach), packages, session_log,
  invoices, `package_remaining` view, `is_coach()` helper, RLS on everything.
- `docs/accounts-setup.md` — owner-facing go-live guide.

## Primary task: adversarial review + fixes

Review the two code-heavy pieces and fix what you find (small, surgical
commits):

1. `supabase/schema.sql` — RLS correctness above all:
   - Can a client read or write another client's packages / session_log /
     invoices through any path (including the view and the trigger paths)?
   - Can a client change their own `role` by any route (direct update, upsert,
     the signup trigger)?
   - Is `is_coach()` (security definer) safe — search_path pinned, no
     recursion into RLS-protected reads that would loop?
   - Idempotency: does the whole file re-run cleanly on a project where it
     already ran once?
2. `assets/portal-auth.js`:
   - Magic-link redirect handling (Supabase URL hash) vs. the page's own
     persona hash routing — any conflict?
   - Races: CDN script load vs. `init()`, repeated `init()`, auth state
     change firing before profile fetch resolves.
   - Every failure path must resolve (no uncaught rejections) and demo mode
     must stay a true no-op.
3. `portal.html` inline script (bottom of file) — wiring only: script order,
   the `authLive` gating, and that the sign-in button's demo behavior is fully
   detached in live mode.

## Constraints (hard)

- Keep the schema contract names exactly as-is (`profiles`, `packages`,
  `session_log`, `invoices`, `package_remaining`, `is_coach()`, column names) —
  the front end and docs reference them.
- Demo mode must remain pixel-identical and error-free with placeholder config.
- No new dependencies, no bundler, no TypeScript, no framework.
- Don't touch `index.html` beyond what's already there; don't rename files.

## How to verify locally

```bash
python3 -m http.server 8000
# http://localhost:8000/portal.html            → demo mode, three personas via tabs/hash
# http://localhost:8000/portal.html#coach      → coach view directly; toggle Dark
```

Live-mode smoke test without a real backend: temporarily put fake non-placeholder
values in `assets/portal-config.js`, reload — the sign-in form should switch to
"Email me a sign-in link", and every failure should surface as a friendly note,
never an uncaught error. Restore the placeholders before committing.

## Optional follow-on (only if asked)

Next milestones, in order: wire the coach view to real Supabase data
(clients + `package_remaining` + invoices), then invoice sending with Stripe
payment links (ACH-first for low fees). Don't start these as part of the
review task.
