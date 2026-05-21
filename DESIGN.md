# Visual Design Spec — Maximalist Y2K / Shock Site

This is the design language for the Inverso app. The vibe is **late-90s / early-00s web at its most unhinged**: Geocities personal pages, shock sites, deviantArt circa 2003, Win95/98 chrome, marquee scrolls, animated GIFs, glittery banners, screaming Impact text, and absolutely zero restraint.

The aesthetic should feel like a genuine artifact from 1999 that somehow runs on modern browsers — not a polished modern app cosplaying as retro. **The visual obnoxiousness is intentional and load-bearing**: it pairs with offensive/edgy t-shirt content by signaling "this is not a polished brand pretending to be edgy" — it's coming from a coherent worldview. The site itself is a shirt.

## Core principles

1. **Maximize everything**: more colors, more animations, more borders, more stickers. If a thing could be in motion, it probably should be.
2. **Mixed type system, never harmonized**: Impact for shouting, Comic Sans for "personal" voice, Tahoma for Win95 chrome, Courier/monospace for "data." Use all four in the same view. Never unify.
3. **Win95 chrome where the user actually works**: the settings drawer uses Win95-style bevels, title bars, and form elements. This is the *only* place where usability wins over chaos — the user spends time here, and the chrome is its own kind of nostalgia-grounded.
4. **Screaming around the workspace, not inside it**: the canvas itself (where the image + text preview lives) stays relatively clean — the user needs to see what they're designing. Chaos lives in the header, footer, drawer headers, marquee, and decorative stickers around the frame.
5. **Sentence case is forbidden**: ALL CAPS for headers and buttons. lowercase~with~tildes for "personal" notes. Mixed case only inside form inputs.

## Color palette

A deliberately clashing set. Use them together. Do not introduce a calmer palette anywhere.

| Name | Hex | Use |
|---|---|---|
| Magenta | `#ff00ff` | Primary accent, borders, button gradients |
| Cyan | `#00ffff` | Secondary accent, inset borders |
| Yellow | `#ffff00` | Highlights, selection states, "NEW!!" stamps |
| Hot red | `#ff0000` | Export button, danger, blinking elements |
| Acid green | `#00ff00` | Marquee borders, visitor counter, "active" status |
| Royal blue | `#0000ff` | Section header gradient (with `#000080`) |
| Navy | `#000080` | Section header gradient base, link color |
| Win95 gray | `#c0c0c0` | Drawer chrome, button bevels |
| Black | `#000000` | Marquee bg, canvas bg, hard outlines |
| White | `#ffffff` | Highlights on bevels, form inputs |
| Cream sticker | `#ffffcc` | Layer list rows |

### Diagonal rainbow stripe (signature element)
The outermost app border uses a repeating diagonal stripe of magenta/cyan/yellow at 20px intervals, 45° angle. This is the app's framing device — it should always be visible around the perimeter.

```css
background: repeating-linear-gradient(
  45deg,
  #ff00ff 0, #ff00ff 20px,
  #00ffff 20px, #00ffff 40px,
  #ffff00 40px, #ffff00 60px
);
```

## Typography

| Use case | Font stack | Notes |
|---|---|---|
| Big shouting headers, app title, buttons-that-matter | `'Impact', 'Arial Black', sans-serif` | Heavy letter-spacing tightening (-1 to -2px), skew(-5deg) on the app title, triple text-shadow in black + magenta + cyan |
| "Personal" / decorative text (taglines, footer flair) | `'Comic Sans MS', 'Chalkboard SE', cursive` | Lowercase, often wrapped in `~*~ tildes ~*~` |
| Win95 chrome (drawer labels, inputs, layer list) | `'Tahoma', sans-serif` | The actual contemporary OS font — grounds the drawer in real Win95/98 |
| Counters, code-like elements, marquee secondary | `'Courier New', monospace` | Used sparingly for visitor counter and timestamps |

**Type rules:**
- App title is `38px` Impact, skewed `-5deg`, text-shadow stack: `3px 3px 0 #000, 6px 6px 0 #ff00ff, -2px -2px 0 #00ffff`
- Section headers are `11px Tahoma 700` on a blue gradient bar
- Form labels are `10px Tahoma 700 uppercase` in navy (`#000080`)
- Form inputs are `12px Tahoma 400` in black on white
- Big CTA (export button) is `22px Impact uppercase` with `2px 2px 0 #000` text-shadow

## Animations

Use liberally. None of these should be subtle.

| Name | Behavior | Where used |
|---|---|---|
| `marquee` | `translateX(100%) → translateX(-100%)` over 18s linear infinite | Top marquee text |
| `rainbow` | Animate `background-position` of a 5-stop linear gradient over 4s linear infinite | Header background |
| `blink` | `opacity: 0` at 50%, 0.8–1.2s infinite | Tagline, "NEW" markers in marquee, "SIGN MY GUESTBOOK" footer link |
| `spin` | `rotate(360deg)` over 3s linear infinite (one direction in left corner, reverse in right) | Header corner decorations (⚙ and ★) |
| `wobble` | `rotate(-3deg) → rotate(3deg)` over 0.6s ease-in-out infinite | 🔥 sticker on canvas |
| `pulse` | `scale(1) → scale(1.08)` over 0.5–1.2s infinite | 💰 sticker, "NEW!!" stamp, export button |
| `flicker` | Cycle text color through magenta/cyan/yellow over 0.4s infinite | Footer "SIGN MY GUESTBOOK" |

**Performance note**: animations are CSS-only, transform/opacity-based. None should trigger layout. If perf becomes an issue (unlikely), consider adding a "calm mode" toggle in v2 — but **default is full chaos**.

## Layout structure

```
┌──────────────────────────────────────────────────────────┐  ← diagonal rainbow stripe border (6px ridge)
│ MARQUEE: "★彡 WELCOME TO INVERSO™ ::: ..."             │  ← black bg, yellow text, green outset border
├──────────────────────────────────────────────────────────┤
│ ⚙          INVERSO™                                  ★  │  ← rainbow-animated gradient bg
│            ~*~ what even is color ~*~                    │  ← spinning corner stars
├────────────────────────────────────┬─────────────────────┤
│                                    │  ★ GLOBAL SETTINGS  │  ← Win95 title bar (blue gradient)
│                                    │  ┌───────────────┐  │
│         CANVAS VIEWPORT            │  │ Bkgd color    │  │
│      (fit-to-viewport image        │  │ Inversion     │  │
│       + live-inverted text)        │  ├───────────────┤  │
│                                    │  │ ★ TEXT LAYERS │  │
│  🔥 ┌──────────────┐  NEW!!        │  │ ★ LAYER 1     │  │
│     │              │                │  │ ♥ LAYER 2     │  │
│     │   IMAGE +    │                │  │ [+ NEW TEXT!!]│  │
│     │   TEXT W/    │                │  ├───────────────┤  │
│     │   HANDLES    │                │  │ ★ SELECTED    │  │
│     │              │                │  │ content       │  │
│     └──────────────┘  💰            │  │ font / size   │  │
│                                    │  │ ...           │  │
│                                    │  └───────────────┘  │
│                                    │  [💾 SAVE .PNG !!!] │  ← red gradient, pulsing, Impact
├────────────────────────────────────┴─────────────────────┤
│ VISITORS: 00041337  ★  SIGN MY GUESTBOOK  ★  POWERED... │  ← black footer, flickering link
└──────────────────────────────────────────────────────────┘
```

- Outer container: 8px padding, 6px ridge `#ff00ff` border, diagonal stripe background visible through padding
- Body: CSS grid `1fr 260px`, gap 6px
- Drawer: `#c0c0c0` background, 3px outset white border, 6px padding, flex-column with 6px gap

## Component specs

### Top marquee
- Height ~24px, black bg, 3px outset acid-green border
- Yellow ALL CAPS Tahoma text, 13px, letter-spacing 2px
- Scrolls right-to-left, 18s loop
- Required content elements (mix freely): `★彡` and `彡★` kaomoji bookends, `:::` separators, blinking `<em>NEW</em>` markers, "BEST VIEWED IN NETSCAPE NAVIGATOR 4.7" reference, "SIGN MY GUESTBOOK" callout, Japanese characters for decoration (注意, 危険, etc.)

### Header
- Padding 14px, 4px outset white border
- Background: 5-stop animated rainbow gradient (`#ff00ff → #00ffff → #ffff00 → #ff0000 → #ff00ff`), `background-size: 200% 100%`, animated horizontally over 4s
- App title `INVERSO™`: Impact 38px, white, skewed -5deg, triple text-shadow as specified
- Tagline below: Comic Sans 14px, white with black text-shadow, wrapped in `~*~` tildes, blinking
- Spinning corner glyphs: `⚙` left, `★` right, 26px, opposite spin directions

### Canvas area
- 4px inset cyan border
- Background: radial gradient white → light pink, with an SVG pattern overlay of tiny magenta/cyan dots at 30% opacity
- Min-height 460px, flex-centered
- The actual image frame is `max-width: 340px`, `aspect-ratio: 1`, black bg, 3px ridge yellow border

### Canvas decorations (stickers around the image)
These are decorative-only and overlay the canvas area, not the image itself. They should not interfere with image preview. Required at minimum:
- **🔥 sticker** top-left, 32px, wobble animation
- **💰 sticker** bottom-right, 32px, pulse animation
- **"NEW!!" badge** top-right of canvas frame: red bg `#ff0000`, yellow Impact text `#ffff00`, 4px 8px padding, 2px white border, rotated 15deg, pulsing

These can be toggled off via a "calm stickers" option in the drawer (low priority, v2).

### Text layer on image (the actual user content)
- Anchor: drag handles at 4 corners — yellow `#ffff00` squares with 2px magenta border, 10×10px
- Bounding box: 2px dashed yellow
- Text itself: rendered via the inversion pipeline (mock uses `mix-blend-mode: difference` for preview)

### Settings drawer
- Outer: `#c0c0c0` bg, 3px outset white border
- Each section: white bg, 2px inset gray border, 8px padding
- Section header bar: blue gradient (`#000080 → #0000ff`), white Tahoma 11px 700, padding 3px 6px, with mock window controls (`_ □ ×`) on the right rendered as gray buttons
- Section title is prefixed with `★` (always)

### Form elements (inside drawer)
- **Label**: `10px Tahoma 700 uppercase`, navy `#000080`, prefixed with `▸`
- **Text input / textarea**: 2px inset gray border, white bg, Tahoma 12px, padding 3px 5px
- **Color swatch**: 24×24 div with 2px inset border, next to a hex input
- **Dropdown** (font picker, etc.): styled like text input with `▾` appended to value text

### Toggle buttons (B/I, L/C/R align, RGB/LUMA)
- **Default**: linear-gradient `#ff66ff → #ff00ff`, 2px outset `#ff99ff`, white Impact text with black 1px text-shadow, letter-spacing 1px
- **Active**: linear-gradient `#00ff00 → #008800`, 2px inset `#88ff88`

### Layer list items
- `#ffffcc` (cream) bg, 1px solid gray border, 4px 6px padding, Tahoma 11px
- Selected: yellow gradient bg `#ffff00 → #ffaa00`, weight 700
- Each row prefixed with `★` (selected) or `·` `♥` `✦` (others, varied for personality)
- Delete button: `✖` in hot red `#ff0000`, weight 900

### Add-layer button
- Full-width, linear-gradient cyan `#00ffff → #0088ff`, 2px outset light-cyan, Impact white text with black shadow
- Label: `+ NEW TEXT!!`

### Export button
- The single most-emphasized element in the entire UI
- Full-width, linear-gradient red `#ff0000 → #aa0000`, 4px outset `#ff6666`
- `22px Impact` text, color `#ffff00`, text-shadow `2px 2px 0 #000`, letter-spacing 2px, uppercase
- Always pulse-animated
- Label: `💾 SAVE .PNG !!!`

### Footer
- Black bg, 2px ridge magenta border, padding 6px, Tahoma 10px white text, centered
- Required elements:
  - **Visitor counter**: Courier `#00ff00` on black, 1px green border, padding 1px 6px, weight 700, letter-spacing 2px, text like `VISITORS: 00041337` (the number can be a fixed faux value; do not implement a real counter)
  - **"SIGN MY GUESTBOOK"** link with flicker animation cycling magenta/cyan/yellow
  - **Tagline**: e.g. `POWERED BY HATE & HTML` (placeholder — Nicholas to provide own)
  - Separated by `★` glyphs with non-breaking spaces

## Mandatory references

These elements **must appear** somewhere in the UI — they're load-bearing for the aesthetic:

- [x] Marquee scrolling text at the top
- [x] Animated rainbow gradient on header
- [x] At least one spinning element (header corner glyphs)
- [x] At least one blinking element (tagline)
- [x] Win95-style chrome on the settings drawer (bevels, title bars, mock window controls)
- [x] Comic Sans somewhere unironically (the tagline)
- [x] Impact in CTA buttons
- [x] A "visitor counter" in the footer
- [x] A "guestbook" reference
- [x] Mixed-script decoration (`★彡`, Japanese chars, `~*~`, `:::`, `▸`, `♥`)
- [x] At least one rotated "NEW!!" or "HOT!!" stamp/sticker

## What to avoid

Even maximalism has a few rules:

- **No actual auto-playing audio** — the joke lands without subjecting users to MIDI on load. (A muted `<audio>` icon in the footer for nostalgia is fine.)
- **No real GIFs at large file sizes** — use CSS animations and emoji. Keeps the app fast and static-deployable.
- **No mid-content animations on the user's actual work area** — the image and the text being designed must render cleanly without animation interference. Stickers around the canvas are fine; effects inside the image preview are not.
- **No modern UI conventions sneaking in** — no card shadows, no border-radius, no smooth transitions, no skeleton loaders. Hard edges, hard state changes.
- **No accessibility-breaking choices that affect actual function** — animations are decorative-only; all form interactions are keyboard-accessible; color is never the sole indicator of state (toggle buttons also change bevel from outset to inset). Marquees and blinkers can be paused via `prefers-reduced-motion`, but the rest of the chaos stays.

## `prefers-reduced-motion`

If the user has `prefers-reduced-motion: reduce` set, pause the marquee, spinning glyphs, blink, flicker, wobble, pulse, and rainbow animations — but **keep all the static styling**. The site should still look like 1999 even without movement.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-iteration-count: 1 !important;
  }
}
```

## Copy / voice

The app's copy throughout — button labels, tooltips, empty states, error messages — should match the aesthetic. Some flavor:

- "+ NEW TEXT!!" (not "Add text layer")
- "💾 SAVE .PNG !!!" (not "Export")
- Empty canvas state: "DROP A .PNG OR DIE TRYING"
- Upload error: "THAT AIN'T A PNG, FRIEND ☹"
- Loading state: "PROCESSING... PLEASE DO NOT CLOSE THIS WINDOW"
- Section names get `★` prefixes
- Footer tagline is provocative but not gratuitous (Nicholas to finalize the actual line)

Avoid corporate language entirely. No "Welcome to your workspace," no "Get started by uploading a file." If a message could appear in a 2024 SaaS app, rewrite it.

## Future flexibility

This spec is opinionated, but a few things are worth leaving room for:

- **Theme toggle** for v2: a "calm mode" that disables animations and stickers but keeps the color palette and Win95 chrome. Some users will want to actually concentrate.
- **Custom footer tagline**: hardcode for now, but factor it as a single constant so it's easy to change without hunting.
- **Visitor counter as easter egg**: the number is fixed in v1, but could be a real localStorage counter showing the user their own session count for extra absurdity.

## Bottom line

If the result feels embarrassing to ship, you've hit the brief. If it feels tasteful, push harder.