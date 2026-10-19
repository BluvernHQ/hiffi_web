# Better Auth on Hiffi

How web (Next.js) and the Go API authenticate users.

**Do not put a Cloudflare Worker in front of the API.** The same Go origin (`api.dev.hiffi.com` / `api.hiffi.com`) must serve **web and mobile**. Mobile sends `Authorization: Bearer` and cannot rely on browser cookies or an edge gateway. The Worker under `worker/` is unused; leave it undeployed.

## Architecture (why this one)

Better Auth runs **on the existing Next.js VPS process** and uses the **same PostgreSQL** as Go. That avoids a second Node service.

The browser talks to Next (Better Auth cookie) and to Go with a Bearer JWT. Mobile talks **only** to Go with the same JWT. Cookies stay on the web origin, so Go identifies callers from the JWT (`uid` + `session_version`), not from a Worker header.

```
Browser
  ├─ Next.js  (Better Auth cookie, /api/auth/*)
  │     └─ loopback HIFFI_API_INTERNAL_URL → Go /auth/login and /auth/bridge/exchange
  └─ Go API   (Authorization: Bearer <JWT>)
                └─ BetterAuthMiddleware → uid in context → existing GetClaims / ownership checks
```

No Worker in this architecture. Gateway-token verification remains in Go so a future Worker cannot be enabled by accident without `GATEWAY_SECRET`; web and mobile do not send that header.

## Login

1. Email/username: Better Auth `signIn`, then `POST /api/auth/hiffi-token`.
2. `hiffi-token` reads the Better Auth session and calls Go `/auth/bridge/exchange` (`X-Auth-Bridge-Secret`). Go links or creates `users` and returns a JWT. `better_auth_id` is stored.
3. If Better Auth has no account: `POST /api/auth/legacy-signin` → Go `/auth/login`, then silent copy into Better Auth with the same password.
4. Web Google/Apple: Better Auth social (admin switch in `auth_provider_settings`) → same `hiffi-token` exchange.
5. **Mobile Google/Apple:** native SDK → ID token → Go `POST /auth/google` or `POST /auth/apple` `{ "id_token": "..." }` (Apple also accepts `identity_token` + first-login `name`). Same JWT as password login. Set `GOOGLE_OAUTH_CLIENT_IDS` / `APPLE_OAUTH_CLIENT_IDS` to the iOS and Android (and optional web) audiences. Provider must be enabled in `auth_provider_settings`.
6. Public Better Auth email signup is forbidden; signup stays on Go.

Client stores the JWT in `localStorage` (`hiffi_auth_token`). Passwords are not stored in cookies.

## Go middleware (`BetterAuthMiddleware` on every Chi route)

1. Delete spoofed `X-User-ID` / `X-User-UID` / similar.
2. If `X-Gateway-Token` is present: HMAC-SHA256, `iss`/`aud`/`exp`/`jti` (max 60s). Map Better Auth id → `users.uid`. Fail closed on bad signature. Replay ids stored in Valkey (`gw:jti:*`).
3. If a Better Auth session cookie is present: `GET {BETTER_AUTH_URL}/api/auth/get-session` (5s timeout, request context). 5xx → 502/503. Invalid/expired → **401**, never JWT fallback. DB cookie lookup is only when `BETTER_AUTH_URL` is empty (not a downtime fallback).
4. Else legacy JWT if `ALLOW_LEGACY_JWT` is not `false`. Claim `sv` must equal `users.session_version`.
5. Unauthenticated requests continue (public routes). Handlers call `GetClaims`; missing uid → 401.

Resource authorization is unchanged: compare `claims.UID` to the resource owner; roles stay on Go.

## Identity mapping

Migration `078_add_better_auth_id_to_users.sql` adds unique `users.better_auth_id`. Linking by email requires `emailVerified`. Duplicate emails refuse auto-link. Not a destructive rewrite of `uid`.

## Logout and revocation

- `POST /auth/logout` (JWT): increment `session_version`; delete Better Auth `session` rows for that `better_auth_id`.
- Browser: `authClient.signOut()` then always clear local token/UI.
- Stolen JWT after a successful Go logout is rejected (`sv` mismatch).

## Failure behavior

| Case | Result |
|------|--------|
| No cookie, no JWT | Public OK; protected 401 |
| Bad/expired cookie | 401 (no JWT fallback) |
| Auth service timeout/5xx | 503 / 502 (fail closed) |
| Bad gateway token | 401 |
| Direct Go without Worker | JWT or cookie validation; forged gateway token rejected without `GATEWAY_SECRET` |
| Ownership mismatch | existing 403 |

Do not log cookies, session tokens, passwords, or secrets.

## Environment

### Next.js (`.env.local` on the VPS)

| Variable | Purpose |
|----------|---------|
| `BETTER_AUTH_SECRET` | Better Auth cookie signing |
| `BETTER_AUTH_URL` | Public origin of this Next app |
| `DATABASE_URL` | Same Postgres as Go |
| `AUTH_BRIDGE_SECRET` | Must match Go |
| `HIFFI_API_INTERNAL_URL` | Loopback Go, e.g. `http://127.0.0.1:5001` |
| `GOOGLE_*` / `APPLE_*` | Optional social |

### Go

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | User/admin JWTs |
| `BETTER_AUTH_URL` | Next origin for `get-session` |
| `AUTH_BRIDGE_SECRET` | Bridge only |
| `GATEWAY_SECRET` | Worker HMAC only; do not reuse the bridge secret |
| `ALLOW_LEGACY_JWT` | Default on; `false` after all clients migrate |
| `RUN_MIGRATIONS` | Includes `078` |

### Worker (only if deployed)

`BETTER_AUTH_URL`, `GO_BACKEND_URL` in `worker/wrangler.jsonc`. `GATEWAY_SECRET` via `npx wrangler secret put GATEWAY_SECRET`. See `worker/README.md`.

Placeholders: `web/.env.example`, `hiffi-backend/.env.example`. Never commit real secrets.

## Commands

```bash
# Web
npm ci && npm run typecheck && npm run build
# Go
go test ./Services/Auth/
go build -o HIFFI-API .
```

Dev (`dev.hiffi.com`): PM2 `HIFFI-WEB` (`scripts/start-standalone.sh`, port 3002) and `HIFFI-API` (`/root/hifi_backend`, port 5001). Pull `fix/betterauth`, build, `pm2 restart`. Worker: do not deploy until Go + Next are verified.

Rollback: previous PM2 binary / previous standalone `.next`; DNS still points at origin. Worker: `npx wrangler rollback`.

## Tests that were run

- `go test ./Services/Auth/` — pass (gateway HMAC, expiry, jti, no `AUTH_BRIDGE_SECRET` as gateway secret, cookie+JWT no fallback, CSRF, HTTP fail-closed, RequireAuth).
- On HiffiDev: `/health` 200, `/videos/recommend` returns catalog videos after Qdrant-empty fallback, `/api/auth/legacy-signin` with dummy creds returns JSON `401 invalid credentials` (not Cloudflare HTML).

Not automated here: full browser OAuth, password-reset email, production cookie flags on `www.hiffi.com`, Worker signed-token path (Worker not live).

## Remaining

- Do not set `ALLOW_LEGACY_JWT=false` until mobile is on Better Auth.
- Gateway `jti` is process-local if Valkey is down (60s window).
- Origin still needs Cloudflare authenticated origin pulls if the Worker is enabled.
- Qdrant embeddings empty → catalog fallback (home feed).
- `GATEWAY_SECRET` rotation is a dual Worker+Go replace; no automated rotation yet.
