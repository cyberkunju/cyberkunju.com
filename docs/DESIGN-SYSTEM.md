# Design system & the interactive background

The visual identity, its tokens, and the animated background — with every knob
you'd want to turn.

## 1. Identity

- **Pure black & white core.** Light = white bg / near-black ink; dark = black
  bg / near-white ink. The page is monochrome; the *only* color is one accent.
- **One accent: a red → light-red → rose gradient**, applied as a **living
  "ember" / plasma** (not a flat color, not pink). It appears on: interactive
  text accents (link hover, `.grad-text`, ghost-button hover) and the
  background tessellation's red top/bottom band (`#tessPop` gradient).
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

`Aurora` renders **two roots**, both `position:fixed`, `z-index:0`,
`pointer-events:none`, behind content (`main` is `z-index:1`).

### A) `.aurora` — static ambient layer

- **`.aurora__wash`** — a static grayscale gradient wash: three stacked radial
  glows in `rgba(var(--aurora-tint), a)` (`--aurora-tint = 240,240,240` dark /
  `10,10,10` light):
  - `radial-gradient(125% 85% at 50% -12%, …0.08, transparent 58%)` — top-center light
  - `radial-gradient(85% 75% at 12% 108%, …0.055, transparent 55%)` — bottom-left grounding
  - `radial-gradient(70% 70% at 100% 45%, …0.035, transparent 60%)` — right mid
- **`.aurora__grain`** — filmic noise: inline SVG `feTurbulence`
  `type="fractalNoise" baseFrequency="0.9" numOctaves="2"`, at `opacity: 0.05`.

> There is **no** cursive signature, no click-to-toggle, and no random-lit
> tiles. Those were removed. The only colour on the mesh is the top/bottom band.

### B) `.aurora-scroll` — the jittered quad mesh

A fixed viewport clip holding an SVG (`.aurora__tess`) whose
`<g class="aurora__cells">` is filled by JS with an **irregular quadrilateral
mesh** (4 quads meet at each vertex). The SVG is `translate3d(0,-scrollY,0)` so
it scrolls with the page without inflating page height.

**Geometry (exact):**
- Grid unit `--cell: 78px`; jitter `jit = cell * 0.36 = 28.08px`.
- `cols = ceil((vw + 2·cell)/cell)`, `originX = -cell`. One overflow column per side.
- Rows are made **commensurate with page height** so both `y=0` and `y=docH`
  land on grid lines (even top/bottom bands): `rowsN = round(docH/cell)`,
  `cellY = docH/rowsN`, `originY = -cellY`, `rows = rowsN + 2`.
- Each point `P[i][j] = (originX + i·cell ± jit, originY + j·cellY ± jit)` with
  fresh `Math.random` jitter → the mesh **re-randomizes on every load/resize**.

**Colour / band:**
- `.aurora__tess polygon` defaults to `stroke: rgba(var(--aurora-tint),0.15)`,
  `stroke-width:1`, and `fill: url(#tessPop) #ff4d3a` with **`fill-opacity:0`**
  (so most tiles show only their faint stroke).
- **`#tessPop`** linear gradient (top-left → bottom-right):
  `#c1121f` @0 → `#ff4d3a` @0.5 → `#ff6a4a` @1.
- **Band rule:** a tile is lit to `fill-opacity: 0.5` (`MAXO`) only when its
  centroid is within `DEPTH = cellY` (one row) of the top **or** bottom edge:
  `min(cy, docH − cy) < DEPTH`. No left/right sides. So the visible red is the
  `#tessPop` ramp at 50% over black; darker patches are tiles sampling the deep
  `#c1121f` end. Fade transition: `fill-opacity 340ms ease`.

**Pinned logo cell:**
- Derived from the measured `.brand` box → columns `cA…cB`, row `lj`. Those
  boundary points are overwritten with a deterministic `sin`-hash `fs(n)`, so
  the merged shape is **identical every load** yet shares points with (tiles
  cleanly into) its neighbours. The cells are merged into one `<polygon>` (no
  internal divider), lit at `0.5`. The wordmark is centred on that polygon's
  centroid via `transform`, nudged `8px` left (`nudgeX`).

**Rebuild triggers:** initial load, `document.fonts.ready`, `resize`, and a
`ResizeObserver` on `body` — debounced 250ms.

### Tunables (in `Aurora.astro`)

| Want to change | Where |
|---|---|
| Tile size | `--cell` on `.aurora` (currently `78px`) — JS reads it |
| Irregularity | `jit = cell * 0.36` in `build()` |
| Band depth | `DEPTH = cellY` (one row) in `build()` |
| Band opacity | `MAXO = 0.5` in `build()` |
| Band colours | `#tessPop` gradient stops in the SVG `<defs>` |
| Logo cell shape | the `fs(n)` hash + `sideX`/`padX` math in the logo-pin block |
| Wordmark offset | `nudgeX = 8` in `build()` |
| Tile stroke visibility | `.aurora__tess polygon { stroke: rgba(var(--aurora-tint),0.15) }` in the **`is:global`** block |
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
