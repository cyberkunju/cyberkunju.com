# Operations runbook

Concrete recipes for common tasks, verifying deploys, and troubleshooting.

## Golden rules

- Always run **`bun run check` and `bun run lint`** before pushing (CI fails on
  either). `bun run build` is the final check.
- **Push to `main` = deploy.** There is no separate release step.
- Never commit `.env`, secrets, or the server address.

---

## Common tasks

### Change identity (name, title, email, socials)
1. Edit `src/config/site.ts`.
2. Edit the text in `scripts/generate-og.mjs`, then `bun run og`.
3. `bun run build`, commit, push.

### Add / edit a project
Add a Markdown file in `src/content/projects/` following the schema in
`docs/CONTENT.md`. `featured: true` puts it on the home page. Push.

### Change the brand font
Pally is set in `src/styles/tokens.css` (`--font-sans`) and loaded in
`BaseLayout.astro`. To swap fonts, change the `<link>` + `preconnect` and the
`--font-sans` stack, and update the CSP in `public/_headers` if the provider
changes. See `docs/CONFIGURATION.md` §6.

### Tune the background
All knobs are in `src/components/Aurora.astro` — see the table in
`docs/DESIGN-SYSTEM.md` §5 (tile size `--cell`, jitter, number of pre-lit tiles,
wordmark anchor, stroke/pop, signature, wash, grain). **Remember the polygon CSS
must stay in the `is:global` block** or the background goes black.

### Change the accent color
Edit `--acc-1/2/3` (and optionally `--accent`/`--focus`/`--selection`) in all
three theme blocks of `src/styles/tokens.css`, plus the signature `<stop>`s and
the `tessPop` gradient stops in `Aurora.astro`.

### Re-add a nav or theme toggle (both were removed)
- Nav: render `site.nav` in `Header.astro` and add `.nav` styles in `base.css`.
- Theme toggle: recreate a small Svelte island that toggles `light`/`dark` on
  `<html>` and persists to `localStorage.theme`, and mount it (e.g. in the
  header) with `client:idle`. The no-flash script already reads `localStorage.theme`.

### Regenerate the OG card
`bun run og` → commit `public/og-default.png`.

---

## Verify a deploy

After pushing:

```bash
# 1. watch the pipeline
gh run list --branch main --limit 1
gh run view <run-id>          # confirm "Deploy to reticule (Docker)" is ✓

# 2. confirm it's live through the Cloudflare edge (local DNS may cache)
#    find the current edge IP: dig www.cyberkunju.com +short
curl -s -c /tmp/jar -o /dev/null --resolve www.cyberkunju.com:443:<edge-ip> \
  "https://www.cyberkunju.com/__unlock/<PIN>"        # unlock → 204, sets cookie
curl -s -b /tmp/jar --resolve www.cyberkunju.com:443:<edge-ip> \
  "https://www.cyberkunju.com/" | grep -o 'aurora-scroll'   # real site markup
```

(The `<PIN>` is the server gate PIN; don't paste it anywhere committed.)

---

## Troubleshooting

### The background is all black
The tessellation polygons are created in JS and don't get Astro's scoped-style
attribute. Their styles **must** be in the `is:global` `<style>` block in
`Aurora.astro`. If moved into the scoped block, polygons default to SVG black
fill → black page. Confirm the built CSS has an **unscoped**
`.aurora__tess polygon{...fill-opacity:0...}` rule.

### CI fails at "Lint + format check"
Biome found an issue in a non-ignored file (`.css`/`.ts`/`.js`/`.json`).
`.astro`/`.svelte` are ignored, but standalone CSS is not. Run `bun run lint`
locally (or `bun run lint:fix`) and recommit.

### The font isn't loading / text looks like the system font
Pally loads from `cdn.fontshare.com`. Check: the `<link>` and `preconnect` are
present, the CSP (`public/_headers` / any nginx CSP) allows `api.fontshare.com`
and `cdn.fontshare.com`, and the network can reach the CDN. The build/control
box **cannot** reach `cdn.fontshare.com` (firewall) — this only affects local
rendering, not real visitors.

### The gate won't unlock / shows maintenance after entering the PIN
- Confirm `~/portfolio/.env` has the right `GATE_PIN`/`GATE_TOKEN` and the
  container was recreated after editing it (`docker compose up -d --build`).
- The cookie is `Secure` — must be over HTTPS.
- Check the container nginx has `map_hash_bucket_size 128;` (long token).

### Lighthouse budget fails in CI
Something regressed perf/a11y/SEO/CLS below the thresholds in
`lighthouserc.json`. Inspect the LHCI report link in the Actions log; fix the
regression (or adjust the threshold deliberately, with justification).

### Container won't start / site 502s
On the server:
```bash
cd ~/portfolio
sudo docker compose ps
sudo docker compose logs --tail=100 web
sudo docker compose up -d --build
sudo nginx -t && sudo systemctl reload nginx   # host proxy
```

---

## Useful commands

```bash
# local
bun run dev / build / preview / check / lint / lint:fix / og

# server (reticule)
cd ~/portfolio
sudo docker compose ps
sudo docker compose logs -f web
sudo docker compose up -d --build      # rebuild + restart
sudo docker image prune -f             # clean old images

# CI
gh run list --branch main
gh run view <id> [--log-failed]
```

---

## Environment facts

- Node ≥ 22, **Bun 1.x** (package manager + build runtime), TypeScript strict.
- Reproducible installs via `bun.lock` + `--frozen-lockfile` (CI and Docker).
- Static output only; no server runtime for the public site.
- Repo is **public** — treat everything committed as world-readable.
