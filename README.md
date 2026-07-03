# Portfolio — public layer

The public-facing half of a personal platform: a static, edge-delivered site
engineered to sit at the performance ceiling for a content site. Zero JS by
default, prerendered navigation, type-safe content, enforced quality budgets.

## Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Astro 7** (static output) | Zero-JS-by-default, Vite 8 + Rolldown (Rust) builds |
| Islands | **Svelte 5** (runes) | Smallest interactive footprint; only the theme toggle ships JS |
| Language | **TypeScript** (strict) | End-to-end type safety |
| Content | **Content Layer API + Zod** | Schema-validated frontmatter; malformed content fails the build |
| Images | **`astro:assets` + Sharp** | AVIF/responsive, zero layout shift |
| Styling | **Vanilla CSS** (`@layer` + tokens) | No framework runtime; full control; tiny payload |
| Navigation | **Native cross-document View Transitions** | Smooth transitions with no client router (zero JS) |
| Prefetch | **Speculation Rules** + **Cloudflare Speed Brain** | Prerender likely next page → instant nav |
| Delivery | **Cloudflare Pages** (edge CDN) | Sub-50ms global TTFB; `_headers` for security + caching |
| Offline | **Service worker** | Instant repeat visits; network-first HTML avoids staleness |
| SEO | **Meta + OG + JSON-LD + sitemap** | Discoverable, rich social cards |
| Quality gates | **Biome + `astro check` + Lighthouse CI** | Lint/format/type-check + a performance budget that fails the build |

## Commands

```bash
bun install        # install dependencies
bun run dev        # local dev server
bun run build      # production build → dist/
bun run preview    # preview the production build
bun run check      # astro + TypeScript type-check
bun run lint       # Biome lint + format check
bun run lint:fix   # Biome autofix
bun run og         # regenerate public/og-default.png
```

## Project structure

```
src/
  config/site.ts          # identity, nav, socials (drives SEO + JSON-LD)
  content.config.ts       # projects collection schema (Zod)
  content/projects/*.md   # project entries
  layouts/BaseLayout.astro # head, theme, chrome, SW registration
  components/             # SEO, JsonLd, SpeculationRules, Header, Footer, ThemeToggle
  pages/                  # index, projects/, about, 404
  styles/                 # tokens, reset, base, prose (cascade layers)
public/
  _headers                # Cloudflare security headers + immutable caching
  sw.js                   # service worker
  robots.txt, favicon.svg, og-default.png
```

## Authoring a project

Add a Markdown file under `src/content/projects/`. Frontmatter is validated
against the schema in `src/content.config.ts`:

```yaml
---
title: Project Name
summary: One-line description (max 200 chars).
date: 2026-06-01
tags: ['rust', 'systems']
stack: ['Rust', 'Axum']
featured: true          # shows on the home page
order: 1                # manual sort (lower first)
links:
  repo: https://github.com/...
  live: https://...
---
```

## Deploy (Cloudflare Pages)

1. Push to GitHub, connect the repo in Cloudflare Pages.
2. Build command: `bun run build` — output directory: `dist`.
3. Enable **Speed Brain** and **Early Hints** in the Pages/Speed settings.
4. `public/_headers` is applied automatically (security + caching).

## Performance notes

- Speculation Rules and cross-document View Transitions are Chromium-forward;
  Safari/Firefox degrade gracefully to normal (still fast) navigation.
- The service worker uses network-first for HTML to avoid stale content, and
  cache-first only for immutable `/_astro/*` assets.
- CI enforces: performance ≥ 0.95, accessibility/best-practices/SEO = 1.0, and
  CLS ≤ 0.02. Regressions fail the build.

## Owner checklist (search for `TODO(owner)`)

- [ ] `src/config/site.ts` — real name, title, email, socials, domain
- [ ] `astro.config.mjs` — set `SITE` to the production origin
- [ ] `public/robots.txt` — update sitemap origin
- [ ] `scripts/generate-og.mjs` — update text, then `bun run og`
- [ ] `src/pages/about.astro` — write the About content
- [ ] Replace placeholder projects in `src/content/projects/`

## Related

This is Layer 1. Layer 2 (Rust + Axum backend, personal tools, custom
signals-based WASM UI behind auth) is a separate, quarantined codebase so it can
never affect this site's performance.
