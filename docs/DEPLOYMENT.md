# Deployment

How the site gets from a `git push` to live at https://www.cyberkunju.com.

> **Secrets policy:** the deploy host address, SSH key, PIN, and gate token are
> **not** in this repo. They live as **GitHub Actions secrets** and in a
> server-only `~/portfolio/.env`. Never hardcode them anywhere committed.

## 1. Topology

```
 developer ──push──▶ GitHub (cyberkunju/cyberkunju.com)
                        │
                        ▼  GitHub Actions (on push to main)
             quality gate ─▶ lighthouse
                        │
                        ▼ (deploy job, main only)
        ssh ──▶ reticule server
                  ~/portfolio (git checkout)
                  docker compose up -d --build
                        │
                        ▼
          container "portfolio" (nginx) on 127.0.0.1:8092
                        ▲
        host nginx reverse proxy  (vhost: www.cyberkunju.com → 127.0.0.1:8092)
                        ▲
                  Cloudflare (proxied DNS, TLS at edge; certbot at origin)
                        ▲
                     visitors
```

- **`reticule`** is a separate server (reachable by the owner as `ssh reticule`;
  its address is the `DEPLOY_HOST` GitHub secret). It runs multiple projects, so
  this one is deliberately isolated (own container, own localhost port, own
  vhost) with **no conflicts**.
- The **control box** (where development/tooling happens) is *not* the deploy
  target.

## 2. The container

`docker-compose.yml`:
- Service `web`, image `portfolio:latest`, container name `portfolio`.
- Published **`127.0.0.1:8092:8080`** — localhost only; the host nginx proxies
  to it. (8092 is this project's dedicated host port; other projects use others.)
- `env_file: .env` + `NGINX_ENVSUBST_FILTER: "^GATE_"` — only `GATE_*` vars are
  substituted into the nginx template at container start.
- Hardening: `no-new-privileges`, non-root nginx image (`nginx-unprivileged`,
  uid 101, listens on 8080), resource limits (128M RAM, 0.5 CPU), log rotation,
  healthcheck.

`Dockerfile` (2 stages):
1. **build** — `oven/bun:1-alpine`: `bun install --frozen-lockfile` then
   `bun run build` → `dist/`.
2. **runtime** — `nginxinc/nginx-unprivileged`: copies the nginx template,
   `maintenance/`, and `dist/`. Healthcheck hits `/`.

## 3. The host reverse proxy

On the server, a host nginx vhost at
`/etc/nginx/conf.d/www.cyberkunju.com.conf`:
- Proxies `www.cyberkunju.com` → `127.0.0.1:8092`.
- Redirects the apex (`cyberkunju.com`) → `www`.
- Terminates TLS (Let's Encrypt via `certbot --nginx`; HTTP-01 works through the
  Cloudflare proxy).

> When editing the container nginx template that carries the long gate token,
> ensure `map_hash_bucket_size 128;` is present (already in the template) — the
> token is long and the default bucket is too small.

## 4. The container nginx = the maintenance gate

`docker/default.conf.template` implements the gate (see
`docs/MAINTENANCE-GATE.md`). `${GATE_PIN}` and `${GATE_TOKEN}` are substituted
at container start from `~/portfolio/.env` on the server.

## 5. CI/CD pipeline — `.github/workflows/ci.yml`

Runs on push/PR to `main`, with `concurrency` cancelling superseded runs.

- **quality** (always): checkout → setup Bun → `bun install --frozen-lockfile`
  → `bun run check` → `bun run lint` → `bun run build`.
- **lighthouse** (needs quality): build → `bunx lhci autorun` against the budget.
- **deploy** (needs quality; only `push` to `main`):
  1. writes the SSH key from `secrets.DEPLOY_SSH_KEY`, `ssh-keyscan`s the host,
  2. SSHes and runs:
     ```bash
     cd ~/portfolio \
       && git fetch --all --prune \
       && git reset --hard origin/main \
       && sudo docker compose up -d --build \
       && sudo docker image prune -f
     ```

### Required GitHub Actions secrets

| Secret | Purpose |
|---|---|
| `DEPLOY_SSH_KEY` | private ed25519 key authorized on the server for the deploy user |
| `DEPLOY_HOST` | the server's address/hostname |
| `DEPLOY_USER` | the deploy user (has passwordless sudo for `docker`) |

Note deploy runs **after quality only** (not lighthouse), so a perf *warning*
won't block a deploy, but a quality (types/lint/build) failure will.

## 6. First-time server setup (one-time)

On `reticule`, as the deploy user:

```bash
# 1. clone the repo
git clone https://github.com/cyberkunju/cyberkunju.com ~/portfolio
cd ~/portfolio

# 2. create the gate secrets (NOT committed)
cp .env.example .env
# edit .env: set GATE_PIN (6 digits) and GATE_TOKEN (openssl rand -hex 32)
chmod 600 .env

# 3. first build/run
sudo docker compose up -d --build

# 4. host nginx vhost → proxy www.cyberkunju.com to 127.0.0.1:8092
#    (create /etc/nginx/conf.d/www.cyberkunju.com.conf, apex→www redirect)
sudo nginx -t && sudo systemctl reload nginx

# 5. TLS
sudo certbot --nginx -d www.cyberkunju.com -d cyberkunju.com
```

Also: authorize the CI deploy key (`DEPLOY_SSH_KEY`'s public half) in
`~/.ssh/authorized_keys`, and ensure the deploy user can run `docker` via sudo.

## 7. Routine deploys

Just **push to `main`**. CI builds, gates, and redeploys automatically.
Manual (from the server) if ever needed:

```bash
cd ~/portfolio && git pull && sudo docker compose up -d --build
```

## 8. Rollback

```bash
cd ~/portfolio
git reset --hard <previous-good-sha>   # or: git revert <bad-sha> && push
sudo docker compose up -d --build
```

(Or push a revert commit to `main` and let CI redeploy.)

## 9. DNS / Cloudflare

- The domain is on **Cloudflare** (proxied). Cloudflare provides edge TLS/CDN;
  the origin also has its own Let's Encrypt cert (full/strict TLS).
- Enable **Speed Brain** and **Early Hints** in Cloudflare for the prefetch
  benefits described in `docs/ARCHITECTURE.md`.

## 10. Verifying a deploy is live

See `docs/OPERATIONS.md` §"Verify a deploy" for the exact `gh run view` and
`curl` (through the Cloudflare edge, with the unlock cookie) commands.
