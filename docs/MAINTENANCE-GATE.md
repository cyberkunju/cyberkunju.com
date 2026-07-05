# The maintenance gate

While the site is in development it is public (real domain) but should only be
viewable by the owner. The gate makes locked visitors see an "under maintenance"
page; the owner unlocks the real site with a PIN, once per device.

> **Secrets:** the real PIN and token are **not** in this repo. They live only
> in `~/portfolio/.env` on the server. This document describes the mechanism.

## 1. How it works (server-side, nginx)

`docker/default.conf.template` (the container nginx):

```nginx
map $cookie_cku_access $cku_unlocked {
    default 0;
    "${GATE_TOKEN}" 1;   # cookie value must equal the secret token
}
```

- **Unlock endpoint** — only the exact correct PIN path exists:
  ```nginx
  location = /__unlock/${GATE_PIN} {
      add_header Set-Cookie "cku_access=${GATE_TOKEN}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax" always;
      return 204;
  }
  ```
  Any other `/__unlock/*` path just 404s (no PIN oracle).
- **Locked** (`$cku_unlocked = 0`): every route returns the maintenance page
  (via `error_page 418 = @maintenance`), and `/_astro/*` + `/sw.js` return 404 —
  so the real site's assets aren't even fetchable while locked.
- **Unlocked** (cookie matches token): the real static site is served.

`${GATE_PIN}` and `${GATE_TOKEN}` are substituted at container start from
`.env`, filtered by `NGINX_ENVSUBST_FILTER: "^GATE_"` (so nginx's own `$vars`
are left intact).

## 2. The unlock UX (client-side, maintenance page)

`maintenance/index.html`:

1. Visitor sees the maintenance page.
2. **Tap/click the `cyberkunju` wordmark 3 times** (within ~1.2s) → a 6-digit
   PIN pad dialog opens.
3. Entering 6 digits (typing or paste) auto-submits:
   `fetch('/__unlock/<PIN>')`.
4. On `204` → `location.replace('/')` and the device is now unlocked (the cookie
   persists for 1 year). Wrong PIN → shake + "Incorrect PIN", inputs clear.

The cookie is `HttpOnly` (JS can't read it) and `Secure` (HTTPS only). Because
matching is done by nginx against the token, brute-forcing the PIN only yields a
204 on the exact correct value; there's no per-digit feedback.

## 3. The secrets — `.env` on the server

```dotenv
GATE_PIN=<your 6-digit PIN>
GATE_TOKEN=<long random secret, e.g. openssl rand -hex 32>
```

- `.env` is **gitignored**; `.env.example` documents the shape only.
- After editing `.env`, recreate the container so nginx re-substitutes:
  ```bash
  cd ~/portfolio && sudo docker compose up -d --build
  ```

## 4. Changing the PIN

1. On the server, edit `~/portfolio/.env` → new `GATE_PIN`.
2. `sudo docker compose up -d --build`.
3. Already-unlocked devices stay unlocked (the cookie carries the *token*, not
   the PIN). To also invalidate existing devices, rotate `GATE_TOKEN` too.

## 5. Going fully public (removing the gate)

When ready to launch:

**Option A — quick (keep the mechanism, always unlock):** simplest is to remove
the gate logic from `docker/default.conf.template` so all routes serve `dist/`
directly:
- Delete the `map`, the `/__unlock/...` location, the `@maintenance` location,
  and the `if ($cku_unlocked = 0)` guards; serve `try_files` for everything.
- Remove the `maintenance/` copy from the `Dockerfile` (optional).
- Remove `env_file`/`NGINX_ENVSUBST_FILTER` from `docker-compose.yml` (optional).
- Redeploy.

**Option B — clean removal:** as above, plus delete `maintenance/`,
`.env`/`.env.example`, and the gate references, and simplify the template to a
plain static server.

Keep a backup of the template before editing. After launch, also drop the
`noindex` from any pages you want indexed and confirm `robots.txt`/sitemap.

## 6. Security notes

- The gate is **obscurity + a shared secret**, appropriate for "hide WIP from
  the public," not for protecting sensitive data. It's fine here (the content is
  a portfolio).
- The token is long and random; the PIN is short but only yields access on an
  exact match with no oracle. Don't reuse the token elsewhere.
- Never commit `.env`, the PIN, or the token. This repo is public.
