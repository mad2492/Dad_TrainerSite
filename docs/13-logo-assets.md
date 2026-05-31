# Logo Assets

Purpose: track the Fonseca Fitness logo direction, brand colors, font direction, and needed production files.

## Current Direction

Approved direction:

- Vintage bodybuilding badge style
- Faceless Pete/Lisa silhouettes
- Circular emblem
- Navy/charcoal and deep red palette
- Bold athletic `FONSECA FITNESS` wordmark
- Tagline: `Stronger Together. Better Together.`
- Theme words: `Strength - Nutrition - Accountability`

## Brand Colors

- Primary Navy: `#0F2740`
- Primary Red: `#B3262D`
- Off-White: `#F5F3EE`

## Font Direction

Official draft wordmark font:

- Rockwell Extra Bold (`ROCKEB.TTF`)
- Use for both `FONSECA` and `FITNESS` in the primary logo and horizontal header lockups.
- Keep the wordmarks centered on the badge centerline.
- Use a thin off-white outline only; avoid thick white blocks or mixed varsity fonts.
- Use navy tagline text on light-background logo assets.
- Use white tagline text only on dark-safe/reversed assets.

Primary wordmark style:

- Bold athletic slab-serif
- Varsity-inspired block font
- Style references: collegiate custom lettering and classic athletic slab-serif marks

Supporting text/tagline:

- Clean sans-serif
- Keep secondary text smaller and simpler than the wordmark

## Needed Logo Files

The GPT output has produced good visual direction, but not production files yet.

## First Export Package Review

Received `fonseca-fitness-logo-assets.zip` on May 24, 2026.

Verdict: useful as a direction check, not ready to use on the site.

What was good:

- The file names match the asset set we asked for.
- The colors and general silhouette direction are consistent with the approved concept.
- The package included a simple brand spec.

What failed:

- Several PNGs are effectively blank or white-only.
- The `horizontal-header` and `favicon` files have the wrong proportions for their intended use.
- The primary logo images still contain cropped pieces from other logo layouts, so they are not clean standalone exports.
- No true SVG/vector artwork was included.
- The brand spec file has a text encoding issue in the title.

Decision:

- Do not place this asset package on the public proposal page as the official logo.
- Keep asking for export cleanup, not new design concepts.
- Use the current brand colors and direction while waiting for clean files.

## Chroma-Key Web Draft Asset

Received `Generated image 1.png` on May 29, 2026.

This was generated on a green-screen background so the background could be removed locally.

Workspace files:

- `assets/logo/fonseca-fitness-logo-green-source.png`
- `assets/logo/fonseca-fitness-logo-transparent.png`
- `assets/logo/fonseca-fitness-logo-green-source-v2.png`
- `assets/logo/fonseca-fitness-logo-transparent-v2.png`
- `assets/logo/fonseca-fitness-logo-transparent-v3.png`
- `assets/logo/fonseca-fitness-logo-cleaned-v5.png`
- `assets/logo/fonseca-fitness-logo-cleaned-v6.png`
- `assets/logo/fonseca-fitness-imagegen-transparent-interior.png`
- `dist/fonseca-fitness-logo-assets.zip`
- `assets/logo/fonseca-fitness-mark-v2.png`
- `assets/logo/fonseca-fitness-header-green-source.png`
- `assets/logo/fonseca-fitness-header-transparent.png`

Validation:

- The transparent output is a PNG with alpha.
- The image corners are fully transparent.
- The visual direction is strong enough to use on the website draft.
- The v2 logo is based on the multi-logo reference sheet and is the current active website draft.
- The v3 logo removed the remaining opaque light fill from the `FONSECA` wordmark region.
- The v5 logo fills only the upper badge interior and removes the lower white outline around the `FITNESS` row.
- The v6 logo fills the lower badge gap more completely and removes the bottom stretched-diamond flourish.
- The transparent-interior imagegen variant is the selected initial web direction.
- The header mark is cropped from the current v2 logo for the website navigation.
- The horizontal header lockup was generated on green and chroma-keyed for the website navigation.

Decision:

- Use `fonseca-fitness-imagegen-transparent-interior.png` as the current main web draft logo.
- Use `dist/fonseca-fitness-logo-assets.zip` as the initial downloadable web asset package.
- Still treat this as a cleaned raster draft, not final production artwork.
- Final production still needs true SVG/vector recreation before serious printing, embroidery, shirts, or merchandise.

Needed:

- Primary full logo with tagline
- Primary full logo without tagline
- Horizontal website header logo
- Simplified circle icon
- Circle badge with `Strength - Nutrition - Accountability`
- White/reversed version
- One-color navy version
- One-color black version, optional
- Favicon-ready square icon

Preferred formats:

- SVG/vector for final production
- Transparent PNG for website/mockups
- High-resolution PNG for review/sharing
- Square icon PNG for favicon/social profile testing

## Use Cases

- Primary full logo with tagline: homepage, business cards, social banners, marketing materials
- Primary full logo without tagline: general branding, shirts, posters, profile headers
- Horizontal website header version: website navbar/header, email signatures, app/web top navigation
- Simplified circle icon: social profile images, app icon, favicon, watermark
- Circle badge with `Strength - Nutrition - Accountability`: merch, stickers, gym banners, premium branding placements
- White/reversed version: dark backgrounds, navy shirts, embroidery, video overlays
- One-color navy version: embroidery, print invoices, minimal merchandise, single-color applications

## Shirt Raster Exports

Folder: `dist/fonseca-fitness-shirt-assets/`

Back print:

- Use `fonseca-fitness-shirt-back-light-shirt.png` on white, light gray, cream, or other light shirts.
- Use `fonseca-fitness-shirt-back-dark-shirt.png` on navy, black, charcoal, or other dark shirts.
- Recommended back print size: 11 to 12 inches wide, centered between the shoulder blades.

Front left chest:

- Preferred: simplified circle icon, using `fonseca-fitness-left-chest-light-shirt.png` or `fonseca-fitness-left-chest-dark-shirt.png`.
- Recommended front-left size: 3.25 to 3.75 inches wide.
- Avoid the full back logo on the front-left breast area because the `Strength / Nutrition / Accountability` and ornament details become too small.
- Use the horizontal left-chest files only if a front wordmark is required and the printer confirms the small text will hold.

Right sleeve flag:

- Folder: `dist/fonseca-fitness-shirt-assets/right-sleeve-flags/`
- Use reversed-field American flag orientation for the right sleeve.
- All four files use the Fonseca Fitness palette: navy `#0F2740`, red `#B3262D`, and off-white `#F5F3EE`.
- `fonseca-fitness-right-sleeve-flag-01-patch-border.png`: safest universal option across light and dark shirts.
- `fonseca-fitness-right-sleeve-flag-02-no-border-dark-shirts.png`: no-border option for dark shirts.
- `fonseca-fitness-right-sleeve-flag-03-no-border-light-shirts.png`: no-border option for light shirts, with transparent light stripe areas.
- `fonseca-fitness-right-sleeve-flag-04-navy-keyline.png`: light-shirt option with a thin navy keyline instead of a cream patch border.
- Recommended right-sleeve size: about 3.25 to 3.75 inches wide.

## Next Prompt Goal

Ask GPT for separated logo files, not a new design.

Key instruction:

> Do not redesign. Export each approved version as a separate centered image with transparent background, clean padding, and no captions or labels.
