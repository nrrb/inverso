# Inversion Text Overlay — Project Plan

## Overview

A browser-based web app for overlaying text on a PNG image where the text color is dynamically computed pixel-by-pixel as the inverse of whatever is underneath it. Designed for creating print-ready artwork (specifically DTG-printed t-shirts) where a grayscale image sits over a configurable "background" color (e.g., black for a black shirt), and text should remain legible across both the image and the surrounding background.

The app outputs a transparency-preserving PNG at the native resolution of the source image.

**Deployment target**: static hosting on surge.sh — the app must run fully client-side with no backend or runtime environment variables.

## Tech Stack

- **Framework**: Vue 3 (Composition API, `<script setup>`)
- **Build tool**: Vite
- **Language**: TypeScript (recommended for type safety on canvas/font APIs)
- **Styling**: Plain CSS or a lightweight utility lib — no heavy UI framework needed
- **Canvas**: Native HTML5 Canvas 2D API (no WebGL needed for v1)
- **Text wrapping**: `canvas-txt` — handles word-wrap, alignment, line-height on canvas
- **Font loading**: Google Fonts CSS API via dynamic `<link>` injection + `document.fonts.load()`
- **State**: Vue reactivity (`ref`, `reactive`); no Pinia/Vuex needed for v1
- **No backend** — entirely client-side

## Core Concept: The Inversion Pipeline

The app maintains two parallel canvases conceptually:

1. **Source canvas** — holds the uploaded PNG at native resolution. Used as the color source for inversion sampling.
2. **Display canvas** — what the user sees and interacts with, scaled to fit the viewport.

**Important**: All text positioning, sizing, and rendering math is stored in native-resolution coordinates. The display canvas is purely a scaled view. Export always uses native resolution.

**The inversion algorithm** runs per-text-layer at render time:

1. Rasterize the text glyphs onto an offscreen canvas at native resolution (white fill on transparent background — this canvas is just a **mask** for where text exists).
2. For each pixel in the text mask with non-zero alpha:
   - Sample the corresponding pixel from the source image at the same coordinates.
   - If the source pixel has alpha > 0: invert its RGB (per the selected algorithm).
   - If the source pixel is transparent: invert the configured "transparent background color" (e.g., black → white).
   - Multiply the resulting color's alpha by the text mask's alpha at that pixel (preserves anti-aliased text edges).
3. Composite the colored text pixels onto the final output canvas.

### Inversion algorithms (user-selectable)

- **Pure RGB**: `out.r = 255 - in.r`, etc.
- **Luminance-based**: compute luminance `L = 0.299*r + 0.587*g + 0.114*b`; if `L > 127`, text is black (0,0,0); if `L <= 127`, text is white (255,255,255). Optional: smooth ramp around the threshold instead of binary cutoff (decide during build whether to expose threshold as a setting — default 127, hardcode for v1 unless trivial).

## Layout

```
┌─────────────────────────────────────────────┬──────────────┐
│                                             │              │
│                                             │   Settings   │
│              Canvas Viewport                │    Drawer    │
│         (image + text overlays)             │              │
│      (fit-to-viewport, native export)       │  (collapsible│
│                                             │   to right)  │
│                                             │              │
└─────────────────────────────────────────────┴──────────────┘
```

- **Left/main area**: the canvas, scaled to fit. Image plus all text layers rendered live. Selected text layer shows a bounding box with corner handles.
- **Right drawer**: collapsible (toggle button on the drawer edge). Contains all settings. When collapsed, an arrow/handle remains visible for re-opening.

## Features (v1)

### Image
- Upload PNG (drag-and-drop + file picker).
- Display at fit-to-viewport scale; export at native resolution.
- Preserve transparency throughout the pipeline.

### Text layers
- **Multiple text layers**, listed in the drawer with select/delete/reorder controls.
- **Create**: click a "+ Add text" button, then drag a rectangle on the canvas to define the initial text box.
- **Select**: click a text layer on the canvas or in the layer list. Selected layer shows handles.
- **Move**: click and drag inside the text box.
- **Resize**: drag corner handles on the bounding box. Resizing scales the box (text re-wraps to new width; font size remains independent unless user also adjusts it).
- **Delete**: button in layer list, or Delete/Backspace when selected.

### Per-text-layer settings (in drawer when layer is selected)
- Text content (multi-line textarea; auto-wraps within the text box width).
- Font family (Google Fonts dropdown with search/filter).
- Font size (number input, in px at native resolution).
- Font weight (dropdown — only weights available for the chosen font).
- Bold toggle (shortcut to nearest bold weight).
- Italic toggle (only if font has an italic variant; disable otherwise).
- Letter spacing (px, can be negative).
- Line height (multiplier, e.g., 1.0–2.0).
- Text alignment (left / center / right — buttons).
- Rotation (degrees, slider + numeric input; rotates around the text box center).

### Global settings (in drawer, always visible)
- **Transparent background color**: color picker. Determines what color is "underneath" the text wherever the source image is transparent. For a black-shirt mockup this is black (`#000000`).
- **Inversion algorithm**: radio/toggle between "Pure RGB" and "Luminance threshold".
- **Export PNG**: button — downloads the composited result at native source resolution.

### Drawer behavior
- Collapsible via a toggle button.
- Scrollable internally if content overflows.
- Sections: Global Settings, Layers List, Selected Layer Settings.

## Out of Scope for v1
- Save/load project state.
- Copy to clipboard.
- Undo/redo.
- Image filters or adjustments.
- Non-PNG image formats.
- Text effects (shadow, stroke, gradient fill — the inversion *is* the fill).
- Mobile/touch optimization (desktop-first; touch is a nice-to-have).

## Architecture

### Component tree (proposed)

```
App.vue
├── CanvasViewport.vue          // hosts the display canvas + interaction layer
│   ├── ImageLayer              // renders source image
│   ├── TextLayer (xN)          // renders each text layer with inversion
│   └── SelectionOverlay        // bounding box + handles for selected layer
└── SettingsDrawer.vue
    ├── GlobalSettings.vue      // bg color, inversion mode, export button
    ├── LayerList.vue           // list of text layers
    └── TextLayerSettings.vue   // settings for selected layer
```

### State shape (roughly)

```ts
interface AppState {
  sourceImage: ImageBitmap | null;
  sourceWidth: number;            // native px
  sourceHeight: number;
  transparentBgColor: string;     // hex
  inversionMode: 'rgb' | 'luminance';
  textLayers: TextLayer[];
  selectedLayerId: string | null;
}

interface TextLayer {
  id: string;
  content: string;
  x: number;                      // native-px top-left
  y: number;
  width: number;                  // native-px box width (for wrapping)
  height: number;                 // native-px box height (auto or manual)
  rotation: number;               // degrees
  fontFamily: string;             // Google Fonts family name
  fontSize: number;               // native px
  fontWeight: number;             // 100–900
  italic: boolean;
  letterSpacing: number;          // px
  lineHeight: number;             // multiplier
  align: 'left' | 'center' | 'right';
}
```

### Rendering loop

On any state change affecting visuals (debounced ~16ms for perf):
1. Clear the display canvas.
2. Draw the source image scaled to display canvas size.
3. For each text layer:
   - Compute its rasterized text mask at **native resolution** on an offscreen canvas.
   - Run the inversion pass against the source image to produce colored text pixels.
   - Draw the resulting colored text **scaled down** to the display canvas at the layer's position.
4. Draw the selection overlay (in screen-space, not part of export).

**Export** repeats steps 1–3 but at native resolution onto a hidden export canvas, then `toBlob('image/png')` → download.

## Google Fonts Integration

- Fetch the Google Fonts list once at app start from the [Google Fonts Developer API](https://developers.google.com/fonts/docs/developer_api) (requires an API key — make this configurable via `.env` / `VITE_GOOGLE_FONTS_API_KEY`) **OR** ship a hardcoded curated list and skip the API (simpler for v1 — recommended).
- When user selects a font:
  - Inject a `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=...">` into `<head>` with the needed weights/styles.
  - `await document.fonts.load('${fontSize}px "${fontFamily}"')` before rendering text with it.
- Cache loaded fonts so re-selecting doesn't re-fetch.

**Recommendation for v1**: ship a hardcoded list of ~50 popular Google Fonts with their available weights/styles, served from a JSON file in the repo. Avoids API key management. Upgrade to live API later.

## Interaction Details

### Drag-to-create text box
1. User clicks "+ Add text" — cursor becomes crosshair.
2. User mousedown on canvas → record start point in native coords.
3. Mousemove → draw preview rectangle.
4. Mouseup → finalize: create a new TextLayer with that rect's bounds, default font/size, and "Type here" placeholder content. Auto-select the new layer.

### Move / resize
- **Move**: mousedown inside the selected text box (not on a handle) → drag updates `x, y`.
- **Resize**: mousedown on a corner handle → drag updates `width, height` (and possibly `x, y` for top/left handles). Text re-wraps; font size does not change automatically.
- All coordinates converted between display-space and native-space via a single `displayScale` factor.

### Rotation
- Either a dedicated rotation handle above the text box, or rotation is controlled only via the drawer slider for v1 (simpler — recommend this).

## Performance Considerations

- The pixel-level inversion pass is the hot path. For each text layer:
  - Get the text mask's `ImageData`.
  - Get the source image's `ImageData` for the relevant region.
  - Loop pixel-by-pixel. For a 4000×4000px image with text covering 500×200px, that's 100k iterations — fast in JS.
- Cache the source image's full `ImageData` once on upload; reuse for all sampling.
- Debounce re-renders (e.g., during slider drags) to ~16ms or use `requestAnimationFrame`.
- Re-render only affected regions when possible (v1: just re-render the whole thing; optimize later).
- For very large images (>8000px), consider warning the user or capping export resolution.

## Deployment (surge.sh)

The app is deployed as a fully static site to [surge.sh](https://surge.sh). Everything runs client-side, so no server, no API routes, no SSR.

### Vite config requirements
- `base: './'` in `vite.config.ts` — ensures all asset paths are relative, so the build works at any URL/subpath surge gives you.
- Default `outDir: 'dist'` is fine.
- No SPA routing needed (single-page app, no client-side router), so no Surge `200.html` fallback workaround required. If a router is added later, copy `dist/index.html` to `dist/200.html` post-build for fallback routing.

### Static-friendly constraints (already baked into this plan)
- No backend / no API routes.
- No environment variables required at runtime (the Google Fonts list is bundled as a static JSON file in v1).
- All third-party calls are direct from the browser (Google Fonts CSS API — public, no key needed for CSS endpoint).
- All user files (uploaded PNGs, exported PNGs) stay in the browser; nothing is uploaded anywhere.

### Build & deploy commands
```bash
npm run build              # outputs to dist/
npx surge ./dist <your-subdomain>.surge.sh
```

Add an npm script for convenience:
```json
"scripts": {
  "deploy": "npm run build && surge ./dist <your-subdomain>.surge.sh"
}
```

### Things to verify in the build
- Open `dist/index.html` and confirm all `<script>` and `<link>` paths are relative (start with `./`, not `/`).
- Test by serving `dist/` locally with a static server (`npx serve dist`) — should work identically to the deployed version.
- Confirm bundle size is reasonable. Google Fonts list as JSON is the only sizable asset; keep it lean (font metadata only, no preloaded font files).

## Build Phases

### Phase 1: Skeleton
- Vite + Vue 3 + TS scaffold.
- Two-pane layout (canvas + drawer) with collapse toggle.
- PNG upload and display in canvas (no scaling logic yet — just get it on screen).

### Phase 2: Coordinate system
- Implement native-vs-display coordinate transforms.
- Fit-to-viewport scaling that updates on window resize.

### Phase 3: First text layer
- Hardcode a single text layer with fixed font/size/position.
- Implement the inversion pipeline end-to-end (mask → sample → composite).
- Verify visually against test images.

### Phase 4: Text layer interactivity
- Drag-to-create.
- Selection, move, resize handles.
- Bounding box overlay.

### Phase 5: Settings drawer
- All per-layer controls wired up.
- Global controls (bg color, inversion mode).
- Layer list with select/delete/reorder.

### Phase 6: Google Fonts
- Hardcoded font list (JSON in repo).
- Dynamic `<link>` injection + `document.fonts.load()`.
- Font picker with search/filter.

### Phase 7: Polish + export
- Bold/italic toggles, letter spacing, line height, alignment, rotation.
- PNG export at native resolution.
- Empty states, error handling (e.g., non-PNG upload).

### Phase 8: Deploy
- Verify `base: './'` and relative paths in build output.
- Test `dist/` with a local static server.
- Deploy to surge.sh and smoke-test in production.

## Resolved Decisions

1. **Anti-aliased text edges**: output the inverted color at the mask's alpha value — e.g. alpha 0.5 at an edge pixel produces a semi-transparent pixel in the output PNG. The shirt color shows through. Correct for DTG where the background is known.
2. **Italic fallback**: disable the italic toggle if the chosen font has no italic variant. No faux-italic.
3. **Text box height**: auto-grow downward to fit content. User can resize manually but content always fits.
4. **Rotation pivot**: text box center.
5. **Text wrapping**: use `canvas-txt` library for word-wrap, alignment, and line-height support. Supplement with `ctx.letterSpacing` (Chrome 94+/Firefox 104+/Safari 17+) for letter spacing.
6. **Layer reorder**: up/down arrow buttons in the layer list (no drag-and-drop for v1).
7. **Visual design**: see `DESIGN.md` — maximalist Y2K / shock-site aesthetic. Win95 chrome in the drawer, full chaos everywhere else.

## Success Criteria

- Upload a 3000×3000px grayscale PNG → see it on canvas, scaled to fit.
- Drag to create a text box, type "HELLO", pick a Google Font (e.g., Bebas Neue), pick a bold weight.
- The text appears with pixel-by-pixel inverted color: white where the image is dark, black where the image is light, and the inverted-bg-color (e.g., white) where the image is transparent.
- Drag the text box around — colors update in real time.
- Rotate the text — inversion still tracks correctly.
- Click "Export PNG" → downloads a 3000×3000px PNG with preserved transparency and the text baked in with correct inverted colors.