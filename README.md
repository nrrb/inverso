# INVERSO™ — what even is color

A browser-based tool for overlaying text on an image where every character's color is computed **pixel-by-pixel as the inverse of whatever sits underneath it**. Built for designing print-ready artwork — specifically DTG (direct-to-garment) t-shirt graphics — where text needs to stay legible across both a detailed image and the solid shirt color surrounding it.

Everything runs client-side. No server, no sign-in, no uploads.

---

## What it does

Upload a PNG or JPG. Draw text boxes on the canvas. The text color at every pixel is the inversion of the image beneath it: dark areas produce light text, light areas produce dark text, transparent areas invert the configured background color (e.g. black shirt = `#000000` → white text).

**Result:** text that is always readable, no matter what's underneath — and an exported PNG at the full native resolution of your source image, transparency preserved.

---

## Inversion modes

| Mode | How it works |
|---|---|
| **RGB** | `out = (255-r, 255-g, 255-b)` — produces colorful, high-contrast results |
| **Luminance** | Computes `L = 0.299r + 0.587g + 0.114b`; outputs black where `L > 127`, white otherwise — cleaner for grayscale source images |

---

## Fonts

Five curated Google Fonts, loaded on demand:

| Font | Character |
|---|---|
| **Anton** | Ultra-heavy condensed — Impact's sharper twin |
| **UnifrakturMaguntia** | Authentic blackletter / Olde English |
| **Bebas Neue** | Clean all-caps condensed — the t-shirt standard |
| **Permanent Marker** | Hand-drawn marker feel |
| **Bangers** | Comic book / punk rock |

---

## Using the app

1. **Upload** — drag a PNG or JPG onto the canvas, or click to browse.
2. **Add text** — click `+ NEW TEXT!!` in the drawer, then click and drag on the canvas to draw a text box.
3. **Edit** — type in the text content field. Adjust font, size, weight, spacing, alignment, and rotation in the drawer.
4. **Move / resize** — drag the text box to reposition; drag the yellow handles to resize.
5. **Adjust background color** — set the "Transparent BG Color" to match your shirt color. This determines what the text inverts against wherever the source image is transparent.
6. **Export** — click `💾 SAVE .PNG !!!` to download a full-resolution PNG with the text baked in.

### Text layer controls

- **Font family** — one of the 5 curated fonts above
- **Size** — font size in pixels at native (export) resolution
- **Weight** — only weights available for the chosen font are shown
- **Bold / Italic** — toggles; italic is disabled if the font has no italic variant
- **Letter spacing** — in px, supports negative values
- **Line height** — multiplier (e.g. `1.2`)
- **Alignment** — left / center / right
- **Rotation** — degrees, slider + numeric input, pivots around the text box center

### Global controls

- **Transparent BG Color** — color picker + hex input; defaults to `#000000` (black shirt)
- **Inversion Mode** — RGB or Luminance

---

## Development

```bash
npm install
npm run dev
```

Runs the Vite dev server at `http://localhost:5173`.

```bash
npm run build
```

Produces a fully static build in `dist/`. All asset paths are relative (`./`) so the output works at any URL or subpath.

```bash
npx serve dist
```

Test the production build locally before deploying.

---

## Deploy

The app deploys as a static site with no backend.

```bash
npm run deploy
```

This runs `npm run build` then pushes `dist/` to [surge.sh](https://surge.sh). Update the target subdomain in `package.json` → `scripts.deploy` before running.

---

## Tech stack

| | |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Build | Vite |
| Language | TypeScript |
| Text rendering | [`canvas-txt`](https://github.com/geongeorge/canvas-txt) — word wrap, alignment, line height on Canvas 2D |
| Font loading | Google Fonts CSS API — dynamic `<link>` injection + `document.fonts.load()` |
| Rendering | Native HTML5 Canvas 2D; pixel-level inversion via `ImageData` |
| State | Vue `reactive` / `ref` — no external store |
| Deployment | surge.sh static hosting |

---

## How the inversion pipeline works

For each text layer, on every render:

1. The text is rasterized onto an `OffscreenCanvas` as white-on-transparent — producing a **mask** of where the glyphs exist.
2. For every non-transparent pixel in that mask:
   - The corresponding pixel is sampled from the source image.
   - If the source pixel is opaque: its RGB is inverted (RGB mode) or thresholded by luminance.
   - If the source pixel is transparent: the configured background color is inverted instead.
   - The mask's alpha at that pixel is preserved, so anti-aliased glyph edges render correctly.
3. The resulting colored pixel data is composited onto the display canvas at the layer's scaled position and rotation.

Export repeats this at native resolution (no scaling) and downloads the result as a PNG via `canvas.toBlob()`.

---

## Notes

- Text positions, sizes, and font sizes are stored in **native-resolution coordinates**. The canvas view is a scaled preview; the export always matches the original image resolution exactly.
- Fonts are loaded lazily on first selection and cached for the session; switching fonts back and forth incurs no extra network requests.
- The app is entirely offline-capable after the first load, except for Google Fonts (requires internet to load a new font for the first time).
