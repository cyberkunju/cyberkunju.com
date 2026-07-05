# Architecture

How the site is built, how a request is served, and why each piece exists.

## 1. Rendering model

The site is **100% static** (`output: "static"`, the Astro default). At build
time Astro renders every route to plain HTML in `dist/`. There is **no server
runtime** for the public site — nginx just serves files.

- **Zero JS by default.** Astro ships no client JavaScript unless a component
  opts in. The only client scripts are:
  - three tiny inline scripts in `BaseLayout.astro` (no-flash theme apply, the
    user-font override — now minimal, and service-worker registration),
  - the inline script in `Aurora.astro` (the background tessellation + signature),
  - Speculation Rules and JSON-LD (inline `<script type=...>` data blocks, not executable app code).
- **Islands.** Interactive components use Astro islands via `@astrojs/svelte`.
  Currently there are **no hydrated islands** on the public pages (the theme
  toggle and font switcher were removed); the Svelte integration remains wired
  in case an island is needed later.

## 2. Request lifecycle

The container's nginx (`docker/default.conf.template`) implements a
**maintenance gate**. Every request is one of:

```
                     ┌─────────────────────────────────────────┐
 request ──▶ nginx ──┤ has valid `cku_access` cookie (=token)?  │
                     └───────────────┬──────────────┬───────────┘
                                     │ no           │ yes
                                     ▼              ▼
                        maintenance/index.html   dist/ (the real site)
```

- **Locked** (no/invalid cookie): any path returns the maintenance page
  (`maintenance/index.html`); `/_astro/*` and `/sw.js` return 404.
- **Unlock**: `GET /__unlock/<PIN>` (only the exact correct PIN path exists)
  sets an `HttpOnly`, `Secure`, 1-year `cku_access` cookie carrying the secret
  token, and returns `204`.
- **Unlocked**: the cookie matches the token → the real static site is served.

The PIN and token are injected into the nginx template at container start from
a server-only `.env` (see `docs/MAINTENANCE-GATE.md`). Locally (dev/preview)
there is no gate — you always see the real site.

## 3. The `<head>` and no-flash logic (`BaseLayout.astro`)

Order matters for avoiding flashes of unstyled/unthemed content:

1. **Theme no-flash script** (inline, before paint): reads `localStorage.theme`
   and adds `light`/`dark` to `<html>` before the first paint, so there's no
   flash. (There is no theme *toggle* UI anymore; theme follows the system
   preference unless a value was previously stored.)
2. **Font**: `preconnect` to Fontshare + a `<link>` for **Pally**. A tiny inline
   script applies a user-chosen font override from `localStorage` if one exists
   (legacy; the switcher is gone, so this is effectively inert).
3. **`SEO.astro`** — title, description, canonical, OpenGraph, Twitter tags.
4. **`JsonLd.astro`** — `Person` + `WebSite` structured data (schema.org).
5. **`SpeculationRules.astro`** — prerender-on-intent rules.
6. **Service worker registration** (inline, at end of body, on `load`).

## 4. Component responsibilities

| File | Responsibility |
|---|---|
| `layouts/BaseLayout.astro` | The HTML shell: head, no-flash theme/font, `Aurora`, `Header`, `<main>`, `Footer`, SW registration. Every page wraps this. |
| `components/Aurora.astro` | The fixed, behind-content background: grayscale wash + grain + cursive signature (fixed layers) and the scroll-linked interactive quad tessellation (separate scrolling layer). See `docs/DESIGN-SYSTEM.md`. |
| `components/Header.astro` | Just the top-left `cyberkunju` wordmark (a link to `/`). No bar, no nav, no theme toggle. Its position is nudged by `Aurora` to sit centered on a top-left tessellation tile. |
| `components/Footer.astro` | Copyright + social links (from `site.social`). |
| `components/SEO.astro` | All `<title>`/meta/OG/Twitter tags, canonical URL, `noindex` support. |
| `components/JsonLd.astro` | JSON-LD graph (`Person`, `WebSite`, plus optional per-page `extra`). |
| `components/SpeculationRules.astro` | Speculation Rules: prerender same-origin links on `moderate` intent; opt out with `data-no-prerender`. |

## 5. Styling: cascade layers

`src/styles/global.css` declares the layer order once, so ordering is
deterministic regardless of bundling:

```css
@layer reset, tokens, base, components;
```

- **reset** (`reset.css`) — modern minimal reset + global reduced-motion rule
  (this globally neutralizes animations, which is why component animations don't
  need their own reduced-motion guards for *duration*).
- **tokens** (`tokens.css`) — all design tokens (color, type scale, spacing,
  radii, motion) and the three theme blocks (light `:root`, `:root.dark`, and
  system-dark via media query).
- **base** (`base.css`) — element defaults, layout primitives (`.container`,
  `.stack`, `.cluster`, `.grid-cards`), site chrome, components (`.card`,
  `.button`, `.tag`), the accent gradient rules, and view-transition tuning.
- **components** (`prose.css`) — long-form article styling + Shiki dual-theme
  code blocks.

## 6. Content pipeline

- `src/content.config.ts` defines the `projects` collection with the **Content
  Layer API** (`glob` loader) and a **Zod** schema. Malformed frontmatter
  **fails the build** — content can never ship broken.
- Pages query content with `getCollection('projects', ...)` and render it.
- The correct Zod import in Astro 7 is **`astro/zod`** (not `astro:content` or
  `astro:schema`).

## 7. Performance strategy

- **Static + CDN**: HTML is prebuilt and served from nginx behind Cloudflare.
- **`inlineStylesheets: 'auto'`** + `compressHTML: true` in `astro.config.mjs`:
  small CSS is inlined to cut render-blocking requests; large CSS stays external
  and cacheable.
- **Speculation Rules** prerender the likely next page on hover/pointerdown
  (Chromium). Cloudflare **Speed Brain** complements at the edge.
- **Native cross-document View Transitions** (`@view-transition` in `base.css`)
  give smooth transitions with **no client router**.
- **Service worker** (`public/sw.js`): network-first for HTML (fresh content),
  cache-first for immutable `/_astro/*` and static assets.
- **`content-visibility: auto`** (`.cv-auto`) skips off-screen layout/paint.
- **System-font fallback** while Pally loads (`font-display: swap`), zero CLS.

## 8. Browser support & graceful degradation

- Speculation Rules + View Transitions are Chromium-forward. Safari/Firefox
  simply do normal (still fast) navigation — no breakage.
- The background uses `@property`-free techniques for the tessellation and SVG
  SMIL for the signature flow; both degrade to static if unsupported.
- Everything critical (content, layout, links) works with **JS disabled** — the
  background just doesn't animate.

## 9. Quality gates (CI)

`.github/workflows/ci.yml` runs on every push/PR to `main`:

1. **quality** — `bun run check` (types), `bun run lint` (Biome), `bun run build`.
2. **lighthouse** — builds and runs Lighthouse CI against `dist/` with the
   budget in `lighthouserc.json` (perf ≥ 0.95, a11y/best-practices/SEO = 1.0,
   CLS ≤ 0.02). Regressions fail the build.
3. **deploy** — only on push to `main`: SSH to the server and rebuild the
   container (see `docs/DEPLOYMENT.md`).
