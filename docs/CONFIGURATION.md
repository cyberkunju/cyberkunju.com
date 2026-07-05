# Configuration

Every configuration surface, what it controls, and how to change it safely.

## 1. Identity & navigation — `src/config/site.ts`

The single source of truth for who the site is. Drives SEO, JSON-LD, the footer,
and page titles.

```ts
export const site = {
  name: 'Navaneeth K',          // full name (titles, JSON-LD Person)
  handle: 'cyberkunju',         // wordmark + alternateName
  title: 'Navaneeth K — cyberkunju', // default <title>
  description: '...',           // default meta description + OG
  url: 'https://www.cyberkunju.com', // MUST match astro.config `SITE`
  locale: 'en',                 // <html lang> + og:locale
  jobTitle: 'Software Engineer',// JSON-LD + hero eyebrow
  email: 'hi@cyberkunju.com',   // footer/contact + JSON-LD
  nav: [ { label, href } ],     // primary nav items (currently NOT rendered — header has no nav)
  social: [ { label, href, sameAs } ], // footer links; `sameAs:true` → JSON-LD sameAs
};
```

Notes:
- `nav` still exists but the header no longer renders navigation (the top bar
  was removed). Re-add a nav if desired (see `docs/OPERATIONS.md`).
- After changing identity, also update the OG card text in
  `scripts/generate-og.mjs` and run `bun run og`.

## 2. Astro — `astro.config.mjs`

```js
const SITE = 'https://www.cyberkunju.com'; // canonical origin — keep in sync with site.ts
export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  integrations: [
    svelte(),
    sitemap({ filter: (page) => !page.includes('/design') }), // /design excluded
  ],
  markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, wrap: true } },
  build: { inlineStylesheets: 'auto' },
  compressHTML: true,
});
```

- **`site`** — used for canonical URLs, sitemap, OG, JSON-LD. Change this if the
  domain changes (and update `site.ts` `url` + `public/robots.txt`).
- **`trailingSlash: 'never'`** — URLs have no trailing slash; the host nginx and
  links must agree.
- **sitemap filter** — keeps the internal `/design` style guide out of the
  sitemap. `/design` is also `noindex`.
- **markdown** — dual-theme Shiki highlighting (light default, dark via CSS in
  `prose.css`). Add remark/rehype plugins here if needed.

## 3. Lint & format — `biome.json`

Biome is the single lint+format tool. **CI runs `biome check .` and fails on any
issue**, so always run `bun run lint` (or `bun run lint:fix`) before pushing.

Key settings:
- **Ignored paths**: `dist`, `.astro`, `node_modules`, **`*.astro`**,
  **`*.svelte`**, `maintenance`, `design-backups`. So Astro/Svelte files are
  *not* linted/formatted by Biome — only plain `.ts`/`.js`/`.css`/`.json`.
- Formatter: 2-space indent, width 100, single quotes, semicolons, trailing
  commas.
- Linter preset: `recommended`, with `complexity.noImportantStyles: off` (we use
  `!important` deliberately for Shiki dark-mode overrides).

> Because `.astro` is ignored by Biome, CSS/JS **inside** `Aurora.astro` etc. is
> not format-checked — but standalone `.css` files (like `base.css`) **are**.
> A past CI failure came from `base.css` formatting; run `bun run lint` first.

## 4. TypeScript — `tsconfig.json`

Extends `astro/tsconfigs/strict` with `strict: true`,
`verbatimModuleSyntax: true`, `allowJs: true`, `checkJs: false`. Type-checking
runs via `bun run check` (`astro check`), also enforced in CI.

## 5. Performance budget — `lighthouserc.json`

Lighthouse CI builds `dist/`, runs 3 times, and asserts:

| Metric | Threshold |
|---|---|
| performance | ≥ 0.95 (error) |
| accessibility | = 1.0 (error) |
| best-practices | = 1.0 (error) |
| seo | = 1.0 (error, non-404 pages) |
| total-byte-weight | ≤ 150 KB (warn) |
| cumulative-layout-shift | ≤ 0.02 (error) |

The 404 page has a separate matrix entry (no SEO assertion). If a change trips
these, either fix the regression or (deliberately, with justification) adjust
the threshold.

## 6. Fonts

- The brand typeface is **Pally** (Fontshare). It's set as the default
  `--font-sans` in `src/styles/tokens.css` and loaded via a `<link>` +
  `preconnect` in `BaseLayout.astro`.
- Loaded from Fontshare's CDN at runtime (the build box couldn't reach the CDN
  to self-host). To self-host later, download the Pally `woff2` files (weights
  400/500/700) from a machine that can reach `cdn.fontshare.com`, put them in
  `public/fonts/`, add `@font-face` rules, and drop the Fontshare `<link>`.
- The **Content-Security-Policy** in `public/_headers` already allows
  `api.fontshare.com` (styles) and `cdn.fontshare.com` (fonts). If you change
  font providers, update the CSP.

## 7. Environment variables — `.env` (server only)

Only the **maintenance gate** needs env vars, and only on the server. See
`.env.example` and `docs/MAINTENANCE-GATE.md`:

```dotenv
GATE_PIN=<6-digit PIN>          # unlocks the site
GATE_TOKEN=<long random secret> # openssl rand -hex 32
```

`.env` is gitignored and must never be committed. `docker-compose.yml` reads it
via `env_file` and only substitutes `^GATE_` vars into the nginx template
(`NGINX_ENVSUBST_FILTER: "^GATE_"`).

## 8. Security & caching headers — `public/_headers`

Cloudflare-format headers file (also a reference for the host nginx). Sets
`X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
`Permissions-Policy`, HSTS, and a **CSP**. Immutable caching for `/_astro/*`;
`sw.js` is `must-revalidate`.

> Note: the live site is served by the host **nginx** on the server, not
> Cloudflare Pages, so `_headers` is not auto-applied there. The container nginx
> sets a subset of headers; the host vhost / Cloudflare can add the rest. There
> is currently **no CSP enforced at the nginx layer** (see
> `docker/default.conf.template`), so the Fontshare font loads fine.
