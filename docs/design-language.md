# Fonseca Fitness design language — "Split × Clinical"

Chosen direction (Aug 2026): Option D (Split) for structure and identity,
Option C (Clinical) for inner-page manners. Reference: the "Fonseca
Homepage" design canvas.

## Type

- **Display**: Archivo 800/900, UPPERCASE, tight leading (0.98–1.08),
  letter-spacing -0.02em on large sizes, +0.06–0.26em on small labels.
  Loaded from Google Fonts; fallback `"Segoe UI", Arial, sans-serif`.
- **Body**: IBM Plex Sans 400/500/600, sentence case, line-height 1.6–1.7.
- Eyebrow labels: Archivo 800, 12px, letter-spacing 0.26em, uppercase.

## Color

Same brand tokens as before — the direction changes usage, not palette:

- `--navy: #0f2740` — dominant panel color; large flat fields, not just text.
- `--red: #b3262d` — slabs and seams: primary buttons, the 4px divider
  between diptych halves. Never as body text on navy.
- `--paper: #f5f3ee`, surfaces `#ffffff`, hairlines `--line: #ded8cc`.
- `--gold: #bd8a3d` (on navy) / `#8a5d1e` (on paper, AA-contrast) — eyebrows
  and numbered markers only.
- Dark theme keeps the existing variable swap; navy panels stay literal.

## Shape & composition

- **Sharp corners**: `--radius: 3px` for controls, 0 for panels and buttons
  on the homepage diptych. No pills except the seam logo badge.
- **Diptych motif**: 50/50 splits with a 4px red seam; the round logo badge
  straddles seams.
- **Hairline discipline** (from C): 1px `--line` rules divide sections;
  numbered `01 / 02 / 03` markers in gold; borders over shadows. Keep the
  soft shadow only for floating elements (dialogs, seam badge).
- Buttons: filled red or navy, or 3px-bordered outline; Archivo 800
  uppercase, letter-spacing 0.06em; square corners; ≥48px tall.

## Voice

Plain, confident, specific: "Show your work." "A short shelf we stand
behind — not a supplement warehouse." No exclamation marks, no hype.
Evidence beats adjectives: lab reports, health history, weekly reviews.

## What stays untouched

All JS behavior, `data-hook` attributes, ids, auth/data modules, and the
demo-mode guarantees. This direction is a reskin, never a rewiring.
