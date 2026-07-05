# cyberkunju.com — personal portfolio (public layer)

The public-facing half of a personal platform for **Navaneeth K** (`cyberkunju`,
`hi@cyberkunju.com`), served at **https://www.cyberkunju.com**.

It is a **static, edge-delivered site** engineered to sit at the performance
ceiling for a content site: zero JavaScript by default, prerendered navigation,
type-safe content, a distinctive interactive background, and a CI performance
budget that fails the build on regressions. It ships behind a server-side
**maintenance gate** during development — the public sees an "under maintenance"
page; the owner unlocks the real site with a PIN.

---

## The aim

- **Purely operational, zero-fluff.** The site exists so recruiters, peers, and
  visitors can understand the work fast. No dark patterns, no bloat.
- **Mind-blowing performance.** Static HTML on a CDN, no client router, no
  framework runtime on the critical path. Interactive bits are tiny, deferred,
  and never block the page.
- **Exceptional, personal craft.** A monochrome (pure black & white) identity
  with a single red→rose accent, an animated irregular-quadrilateral background,
  and a hand-generated cursive signature — none of the "generic template" look.
- **Layer 1 of a bigger platform.** This repo is the public site. A future
  **Layer 2** (Rust + Axum backend, personal tools, custom WASM UI behind auth)
  is intentionally a *separate, quarantined* codebase so it can never affect
  this site's performance or attack surface.

---

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Astro 7** (static output) | Zero-JS-by-default; Vite 8 + Rolldown (Rust) builds |
| Islands | **Svelte 5** (runes) | Smallest interactive footprint (used only where needed) |
| Language | **TypeScript** (strict) | End-to-end type safety |
| Package manager / runtime | **Bun 1.x** | Fast installs and builds; used in CI and Docker |
| Content | **Content Layer API + Zod** | Schema-validated frontmatter; bad content fails the build |
| Images | **`astro:assets` + Sharp** | AVIF/responsive, zero layout shift |
| Styling | **Vanilla CSS** (`@layer` + design tokens) | No framework runtime; full control; tiny payload |
| Typeface | **Pally** (Fontshare), served via `<link>` | Distinctive brand font; system stack fallback |
| Navigation | **Native cross-document View Transitions** | Smooth transitions, zero client router |
| Prefetch | **Speculation Rules** (+ Cloudflare Speed Brain) | Prerender likely next page → instant nav |
| Delivery | **Docker (nginx) on the `reticule` server, behind Cloudflare** | Full control of headers, gate, caching |
| Offline | **Service worker** | Instant repeat visits; network-first HTML avoids staleness |
| SEO | **Meta + OpenGraph + JSON-LD + sitemap** | Discoverable, rich social cards |
| Quality gates | **Biome + `astro check` + Lighthouse CI** | Lint/format/type-check + perf budget that fails the build |
| CI/CD | **GitHub Actions** → SSH deploy to `reticule` | Push to `main` → quality gate → rebuild container |

---

## Quick start (local)

```bash
bun install          # install dependencies (uses bun.lock)
bun run dev          # dev server at http://localhost:4321
bun run build        # production build → dist/
bun run preview      # serve the production build locally
bun run check        # astro + TypeScript type-check
bun run lint         # Biome lint + format check (CI runs this)
bun run lint:fix     # Biome autofix
bun run format       # Biome format only
bun run og           # regenerate public/og-default.png
```

> **Before pushing:** run `bun run check` **and** `bun run lint` — CI fails on
> either. `bun run build` is the final safety check.

---

## Repository map

```
.
├── README.md                     # you are here
├── docs/                         # deep-dive documentation (start below)
├── astro.config.mjs              # Astro config: site origin, integrations, markdown, build
├── biome.json                    # lint + format config (CI gate)
├── tsconfig.json                 # strict TypeScript
├── lighthouserc.json             # Lighthouse CI performance budget
├── package.json                  # scripts + dependencies (Bun)
├── bun.lock                      # locked dependency graph (reproducible builds)
├── Dockerfile                    # 2-stage build (Bun→Astro) + nginx runtime
├── docker-compose.yml            # container on 127.0.0.1:8092, gate env, limits
├── docker/default.conf.template  # container nginx: the maintenance gate
├── .github/workflows/ci.yml      # quality → lighthouse → deploy pipeline
├── .env.example                  # documents the server-only gate secrets
├── maintenance/index.html        # the "under maintenance" + PIN-unlock page
├── design-backups/               # rejected maintenance-page designs (reference)
├── scripts/generate-og.mjs       # OG image generator (Sharp)
├── public/                       # static assets served as-is
│   ├── _headers                  # security + caching headers (Cloudflare-format)
│   ├── sw.js                     # service worker
│   ├── favicon.svg, og-default.png, robots.txt
└── src/
    ├── config/site.ts            # identity, nav, socials (drives SEO + JSON-LD)
    ├── content.config.ts         # projects collection schema (Zod)
    ├── content/projects/*.md     # project entries (content)
    ├── layouts/BaseLayout.astro  # <head>, no-flash theme+font, chrome, SW reg
    ├── components/
    │   ├── Aurora.astro          # the animated tessellation background
    │   ├── Header.astro          # top-left wordmark (no nav/bar)
    │   ├── Footer.astro          # copyright + social links
    │   ├── SEO.astro             # title/meta/OG/Twitter tags
    │   ├── JsonLd.astro          # Person + WebSite structured data
    │   └── SpeculationRules.astro# prerender-on-intent rules
    ├── pages/
    │   ├── index.astro           # home / hero + selected work
    │   ├── about.astro           # about page
    │   ├── projects/index.astro  # all projects
    │   ├── projects/[...slug].astro # a project detail page
    │   ├── design.astro          # internal style guide (noindex, sitemap-excluded)
    │   └── 404.astro
    └── styles/                   # tokens.css, reset.css, base.css, prose.css, global.css
```

---

## Documentation index

Read these in `docs/` for the full picture:

1. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — how the site renders, the
   request lifecycle (locked vs. unlocked), the cascade layers, every component,
   and the performance strategy.
2. **[docs/CONFIGURATION.md](docs/CONFIGURATION.md)** — every config file and
   knob: identity, Astro, Biome, TypeScript, the Lighthouse budget, fonts, env.
3. **[docs/CONTENT.md](docs/CONTENT.md)** — authoring projects and pages, the
   frontmatter schema field-by-field, images, and the OG card.
4. **[docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md)** — tokens, theme, the
   red→rose accent, and the interactive background (every tunable).
5. **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — server topology, Docker, the
   host reverse proxy, the CI/CD pipeline, secrets, TLS, DNS, and rollback.
6. **[docs/MAINTENANCE-GATE.md](docs/MAINTENANCE-GATE.md)** — how the gate works,
   changing the PIN, and going fully public.
7. **[docs/OPERATIONS.md](docs/OPERATIONS.md)** — a runbook of common tasks,
   live-verification commands, and troubleshooting.

---

## Owner checklist (search the code for `TODO(owner)`)

- [ ] `src/config/site.ts` — name, title, email, socials, domain
- [ ] `astro.config.mjs` — `SITE` = production origin
- [ ] `public/robots.txt` — sitemap origin
- [ ] `scripts/generate-og.mjs` — card text, then `bun run og`
- [ ] `src/pages/about.astro` — write the About content
- [ ] Replace the placeholder projects in `src/content/projects/`
- [ ] Server `~/portfolio/.env` — set `GATE_PIN` and `GATE_TOKEN` (never commit)

---

## Secrets & safety (read before touching deploy)

- **Never commit** `.env`, the gate PIN, the gate token, SSH keys, or the server
  address. They live only on the server (`~/portfolio/.env`) or as GitHub
  Actions secrets. This repo is **public**.
- The gate PIN and token are documented *by name* only (see
  `docs/MAINTENANCE-GATE.md`); their values are not in the repo.
- Deploy is non-interactive and idempotent; see `docs/DEPLOYMENT.md` before
  changing the pipeline or the server.
