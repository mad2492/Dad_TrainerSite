# Fonseca Fitness VTracer Transparent Vector Batch - 2026-06-13

Automated SVG traces from the liked shirt/logo raster assets.

Method:

- Source PNGs were cropped to their visible alpha bounds.
- Fully transparent pixels were temporarily keyed to green before VTracer.
- Green background paths were removed from the SVG output so the final SVGs stay transparent.

These are first-pass vectors, not final production master artwork. Open in Inkscape, Illustrator, or Affinity Designer and inspect/clean before shirt production.

Proof:

- Open `vtracer-transparent-vector-batch-proof.html` in a browser to review the SVGs on dark and light backgrounds.
- `vtracer-transparent-vector-batch-browser-proof.png` is the Chromium-rendered screenshot proof.
- Browser proof is preferred over raster proof images because some rasterizers display transparent SVG areas incorrectly.

## Files

- `fonseca-fitness-front-left-chest-dark.svg` from `dist/fonseca-fitness-shirt-assets/fonseca-fitness-left-chest-dark-shirt.png` (280769 bytes)
- `fonseca-fitness-front-left-chest-light.svg` from `dist/fonseca-fitness-shirt-assets/fonseca-fitness-left-chest-light-shirt.png` (280769 bytes)
- `fonseca-fitness-front-left-chest-horizontal-dark.svg` from `dist/fonseca-fitness-shirt-assets/fonseca-fitness-left-chest-horizontal-dark-shirt.png` (138267 bytes)
- `fonseca-fitness-front-left-chest-horizontal-light.svg` from `dist/fonseca-fitness-shirt-assets/fonseca-fitness-left-chest-horizontal-light-shirt.png` (138256 bytes)
- `fonseca-fitness-back-dark-perfect-circle.svg` from `dist/fonseca-fitness-shirt-assets/selected-back-dark-print-perfect-circle-2026-05-31/fonseca-fitness-shirt-back-dark-shirt-perfect-circle-3600x4200.png` (633351 bytes)
- `fonseca-fitness-back-dark-original-liked-solid-offwhite.svg` from `dist/fonseca-fitness-shirt-assets/back-logo-no-motto-2026-05-31/variant-01-solid-offwhite-badge/fonseca-fitness-shirt-back-dark-shirt.png` (706739 bytes)
- `fonseca-fitness-back-light-original-liked-solid-offwhite.svg` from `dist/fonseca-fitness-shirt-assets/back-logo-no-motto-2026-05-31/variant-01-solid-offwhite-badge/fonseca-fitness-shirt-back-light-shirt.png` (717091 bytes)
- `fonseca-fitness-back-dark-transparent-outline.svg` from `dist/fonseca-fitness-shirt-assets/back-logo-no-motto-2026-05-31/variant-02-transparent-badge-outline/fonseca-fitness-shirt-back-dark-shirt.png` (797056 bytes)
- `fonseca-fitness-back-light-transparent-outline.svg` from `dist/fonseca-fitness-shirt-assets/back-logo-no-motto-2026-05-31/variant-02-transparent-badge-outline/fonseca-fitness-shirt-back-light-shirt.png` (807408 bytes)
- `fonseca-fitness-right-sleeve-flag-patch-border.svg` from `dist/fonseca-fitness-shirt-assets/right-sleeve-flags-accurate-star-options/fonseca-fitness-right-sleeve-flag-accurate-01-patch-border.png` (15626 bytes)
- `fonseca-fitness-right-sleeve-flag-no-border-dark-shirts.svg` from `dist/fonseca-fitness-shirt-assets/right-sleeve-flags-accurate-star-options/fonseca-fitness-right-sleeve-flag-accurate-02-no-border-dark-shirts.png` (14905 bytes)
- `fonseca-fitness-right-sleeve-flag-no-border-light-shirts.svg` from `dist/fonseca-fitness-shirt-assets/right-sleeve-flags-accurate-star-options/fonseca-fitness-right-sleeve-flag-accurate-03-no-border-light-shirts.png` (14905 bytes)
- `fonseca-fitness-right-sleeve-flag-navy-keyline.svg` from `dist/fonseca-fitness-shirt-assets/right-sleeve-flags-accurate-star-options/fonseca-fitness-right-sleeve-flag-accurate-04-navy-keyline.png` (15891 bytes)

## Production Notes

- Use these as editable vector starting points.
- For a bulk shirt order, request a printer proof from a cleaned vector PDF/SVG/EPS.
- Inspect the outer circles, faces/bangs, arm outline gaps, wordmark edges, and flag stars before approving production.
- The back-logo SVGs are useful, but the logo still benefits from manual cleanup because automated tracing creates many small paths.
