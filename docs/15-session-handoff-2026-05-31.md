<!--
  Owner: Marina Brillas
  Organization: FIU College of Business
  Purpose: Captures the current Fonseca Fitness shirt-asset decisions, pushed commits,
  and repo cleanup context so a future Codex session can resume without repeating the
  logo-selection mistakes from this session.
-->

# Session Handoff: Shirt Assets and Logo State

## Current Repo State

- Repository: `C:/Users/Marina/Documents/Dads Website`
- Remote site: `https://mad2492.github.io/Dad_TrainerSite/`
- Current pushed commit: `d9f4e2e Use approved dark shirt back logo`
- Latest cache-busted page link: `https://mad2492.github.io/Dad_TrainerSite/index.html?v=d9f4e2e`
- Current public page uses the approved dark-shirt back logo:
  - Preview: `dist/fonseca-fitness-shirt-assets/preview-shirt-back-dark.png?v=dark-shirt-good`
  - Download: `dist/fonseca-fitness-shirt-assets/fonseca-fitness-shirt-back-dark-shirt.png`

## Key Decision

The good dark-shirt back logo is **not** the v2 file.

Use this file as the approved dark-shirt back print:

- `dist/fonseca-fitness-shirt-assets/fonseca-fitness-shirt-back-dark-shirt.png`

This file exactly matches the user-provided Downloads copy:

- `C:/Users/Marina/Downloads/fonseca-fitness-shirt-back-dark-shirt.png`

Both files were verified as:

- `3600 x 4200`
- `RGBA`
- `300 DPI` metadata
- SHA-256: `C2F259DD7965A904D20ECE7981C74A42A5FEB0B35241C5F8B764E7D3EE30473B`

Do **not** use `fonseca-fitness-shirt-back-dark-shirt-v2.png` for the current shirt mockup. It is retained only as an experimental prior version.

## Canonical Shirt Assets

Back print:

- `fonseca-fitness-shirt-back-light-shirt.png`: full back logo for white, cream, light gray, or other light shirts.
- `fonseca-fitness-shirt-back-dark-shirt.png`: current approved full back logo for black, charcoal, navy, or other dark shirts.
- `fonseca-fitness-shirt-back-dark-shirt-v2.png`: prior experimental dark-shirt version; keep for reference only.

Front left chest:

- `fonseca-fitness-left-chest-light-shirt.png`: simplified circular badge for light shirts.
- `fonseca-fitness-left-chest-dark-shirt.png`: simplified circular badge for dark shirts.
- `fonseca-fitness-left-chest-horizontal-light-shirt.png`: secondary horizontal wordmark option for light shirts.
- `fonseca-fitness-left-chest-horizontal-dark-shirt.png`: secondary horizontal wordmark option for dark shirts.

Right sleeve flags:

- `right-sleeve-flags/fonseca-fitness-right-sleeve-flag-01-patch-border.png`: universal patch-style flag, safest for printers.
- `right-sleeve-flags/fonseca-fitness-right-sleeve-flag-02-no-border-dark-shirts.png`: no-border flag for dark shirts.
- `right-sleeve-flags/fonseca-fitness-right-sleeve-flag-03-no-border-light-shirts.png`: no-border flag for light shirts; light stripes use shirt color.
- `right-sleeve-flags/fonseca-fitness-right-sleeve-flag-04-navy-keyline.png`: light-shirt flag with navy keyline.

## What Happened This Session

- Generated and reviewed several dark-shirt logo variants trying to improve badge text and silhouette details.
- Created `fonseca-fitness-shirt-back-dark-shirt-v2.png` as a candidate with off-white badge words.
- Tried targeted edits around the red female silhouette, including a ponytail/head negative-space fix and a bangs/front-hairline fix.
- Those targeted edits made the logo worse for the user.
- Rolled back the v2 file to the original v2 commit, then clarified that the actual good asset was the non-v2 dark-shirt file.
- Updated `index.html` and `dist/fonseca-fitness-shirt-assets/README.md` so the website and asset notes point to the approved non-v2 dark-shirt logo.

Recent commits:

- `d9f4e2e Use approved dark shirt back logo`
- `f072f3c Rollback dark shirt logo to original v2`
- `4df4c47 Fix female silhouette bangs in dark shirt logo`
- `761dd26 Fix dark shirt logo silhouette cutout`
- `15d7f89 Add dark shirt back logo v2`
- `70a1237 Add right sleeve flag shirt assets`

## Working Tree Caveat

The tracked files are clean after the latest push, but there are many untracked scratch/debug files from logo experiments, especially under:

- `assets/logo/`
- `dist/fonseca-fitness-shirt-assets/`
- `dist/fonseca-fitness-shirt-assets/logo-pass-dark-back/`
- `dist/fonseca-fitness-shirt-assets/right-sleeve-flags-accurate-star-options/`
- `dist/fonseca-fitness-shirt-assets/right-sleeve-flags-star-options/`

Do not stage those scratch files unless the user explicitly asks to preserve or review them. If cleanup is requested, confirm before deleting anything because many are untracked experiment outputs.

## Next Best Steps

- For Printful/mockups, use the current approved back print:
  - `fonseca-fitness-shirt-back-dark-shirt.png` for dark shirts
  - `fonseca-fitness-shirt-back-light-shirt.png` for light shirts
- Use the simplified circle badge for left chest; it reads best at small size.
- Use the sleeve flag option based on shirt color and printer tolerance.
- Before true production, recreate the approved logo as vector artwork. Current PNGs are good for mockups and early printer review, not final screen print or embroidery masters.
