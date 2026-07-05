# Design system & the interactive background

The visual identity, its tokens, and the animated background — with every knob
you'd want to turn.

## 1. Identity

- **Pure black & white core.** Light = white bg / near-black ink; dark = black
  bg / near-white ink. The page is monochrome; the *only* color is one accent.
- **One accent: a red → light-red → rose gradient**, applied as a **living
  "ember" / plasma** (not a flat color, not pink). It appears on: interactive
  text accents (link hover, `.grad-text`, ghost-button hover), the background
  tessellation's active tiles, and the cursive signature stroke.
- **Typeface: Pally** (see `docs/CONFIGURATION.md` §6).

## 2. Cascade layers

`src/styles/global.css`:

```css
@layer reset, tokens, base, components;
```

Later layers win regardless of import order. See `docs/ARCHITECTURE.md` §5.

## 3. Tokens — `src/styles/tokens.css`

Three theme blocks define the same variables:
- `:root` — light (default)
- `:root.dark` — explicit dark
- `@media (prefers-color-scheme: dark) :root:not(.light):not(.dark)` — system dark

Token groups:

| Group | Examples | Notes |
|---|---|---|
| Type | `--font-sans` (Pally + fallbacks), `--font-mono`, `--step--1..--step-4` | Fluid scale via `clamp()` |
| Weight/leading | `--weight-normal/medium/bold`, `--leading-tight/normal`, `--tracking-tight` | |
| Space | `--space-2xs … --space-3xl` | |
| Radii/shadow | `--radius-sm/md/lg`, `--shadow-sm/md`, `--border-width` | |
| Layout | `--measure` (68ch), `--container` (72rem), `--container-narrow` (44rem) | |
| Motion | `--ease`, `--dur-fast` (120ms), `--dur` (220ms) | |
| Color | `--bg`, `--surface`, `--text`, `--text-muted`, `--border`, `--accent`, `--accent-contrast`, `--focus`, `--selection` | Monochrome + one accent |
| Accent gradient | `--acc-1` (deep), `--acc-2` (mid), `--acc-3` (hot), `--accent-grad` | The ember ramp |
| Background | `--aurora-tint` (`10,10,10` light / `240,240,240` dark) | Neutral ink for the bg |

### The accent (ember)

- **Light:** `--acc-1:#9e1015` (deep crimson), `--acc-2:#e5241d` (red),
  `--acc-3:#ff5636` (hot scarlet).
- **Dark:** `--acc-1:#b81a1a`, `--acc-2:#ff3b2f`, `--acc-3:#ff6a4a`.
- `--accent-grad: linear-gradient(115deg, acc-1, acc-2, acc-3)` — used for the
  `.u-grad` underline and as a fallback.
- **Solid `--accent`** (`#e5352b` / `#ff4d43`) is used only where a gradient
  can't apply structurally: focus outline (`--focus`), card-hover border, and
  text selection (`--selection`).

### Accent text (base.css)

Link hover, active nav (unused now), `.grad-text`, and ghost-button hover fill
text with a **churning plasma**: three rose/coral radial blobs drift over a red
base at 3 tempos (`churn-a/b/c`, 6/8/10s), clipped to the text via
`background-clip: text`. To retune: edit the `@property --ax…--cy` initial
values, the radial `background` layers, and the `churn-*` keyframe targets in
`base.css`.

## 4. Theme behavior

- No-flash: an inline script in `BaseLayout.astro` applies a stored theme before
  paint. There is **no theme toggle UI** (removed with the top bar); theme
  follows the system preference unless `localStorage.theme` was set.
- To re-add a toggle, see `docs/OPERATIONS.md`.

## 5. The background — `src/components/Aurora.astro`

`Aurora` renders **two roots**:

**A) `.aurora` — fixed, behind content (`z-index:0`, `pointer-events:none`):**
- `.aurora__wash` — a static grayscale gradient wash (3 soft radial glows in
  `--aurora-tint`): the "perfect subtle gradient" base.
- `.aurora__sig` — the cursive **"cyberkunju" signature**: a real Sacramento
  script outline (baked path data — no runtime font dep) traced via
  `stroke-dashoffset`, penned slowly, faint (0.12), then it fades and re-signs
  at a random spot. Stroke is the ember gradient with a gentle SMIL flow.
  Hidden under reduced motion.
- `.aurora__grain` — filmic noise at 0.05.

**B) `.aurora-scroll` — fixed viewport clip holding the interactive
tessellation** (translated by `-scrollY` so it scrolls with the page without
inflating page height):
- An SVG (`.aurora__tess`) whose `<g class="aurora__cells">` is filled by JS
  with an **irregular quadrilateral mesh** — a jittered grid of points where 4
  quads meet at each vertex. Faint strokes draw the tiling.
- The mesh **re-randomizes on every refresh** (and on resize) — intended.
- A few random tiles **start lit** in the ember accent.
- **Clicking** a tile toggles it red and it **stays** (global click listener +
  point-in-polygon in page coordinates; ignores clicks on real interactive
  elements; the layer is `pointer-events:none` so nothing is blocked).
- The top-left **wordmark is centered on a chosen top-left tile** (the Aurora JS
  computes a tile centroid and nudges `.brand` via `transform`; re-applied on
  font load and resize).

### Tunables (in `Aurora.astro`)

| Want to change | Where |
|---|---|
| Tile size | `--cell` on `.aurora` (currently `92px`) — JS reads it |
| Irregularity | `jit = cell * 0.36` in the script |
| How many tiles start lit | `const lit = Math.min(6, ...)` in `build()` |
| Where the wordmark sits | `anchor = [110, 56]` + the top-left search bounds in `build()` |
| Tile stroke visibility | `.aurora__tess polygon { stroke: rgba(var(--aurora-tint), 0.15) }` in the **`is:global`** block |
| Tile pop look | `@keyframes tess-pop` (global block) |
| Signature size/opacity/speed | `.aurora__sig` width/opacity + `sig-fade`/`sig-write` keyframes + the loop timing in the script |
| Wash intensity | `.aurora__wash` radial alphas |
| Grain intensity | `.aurora__grain` opacity |

> **Gotcha (important):** the tessellation polygons are created in JavaScript,
> so they do **not** receive Astro's scoped-style attribute. Their CSS lives in
> an **`is:global`** `<style>` block (scoped by the `.aurora__tess` ancestor).
> If you move those rules back into the scoped block, the polygons fall back to
> the SVG default **black fill** and the whole background goes black.

## 6. Components (base.css)

- `.button` (solid ink) and `.button--ghost` (outline; text → ember on hover).
- `.card` (surface + border; lifts and accent-borders on hover).
- `.tag`, `.eyebrow`, `.muted`, `.grad-text`, `.u-grad`, `.skip-link`,
  `.visually-hidden`.
- Layout primitives: `.container`, `.container-narrow`, `.stack`, `.cluster`,
  `.grid-cards`, `.cv-auto`.

## 7. The maintenance page — `maintenance/index.html`

A **standalone** dark page (its own inline styles — not the design system):
wordmark, "under maintenance", a headline, name + email. Tapping the wordmark
**3 times** opens a 6-digit PIN pad that unlocks the site (see
`docs/MAINTENANCE-GATE.md`). Rejected design iterations are kept in
`design-backups/` for reference.
