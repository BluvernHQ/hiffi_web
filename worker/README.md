# Hiffi API Gateway (Cloudflare Worker)

Edge API Gateway for **Hiffi** that authenticates incoming browser requests using **Better Auth** and securely forwards verified identities to the **Go backend** via a cryptographically signed service-to-service token (`X-Gateway-Token`).

---

## 1. Architecture & Trust Boundary

```
Browser / Client
      │
      ▼  (HTTPS + Cookies: better-auth.session_token)
┌───────────────────────────────────────────────┐
│ Cloudflare Worker (API Gateway)              │
│ - Strips spoofed client identity headers      │
│ - Calls Better Auth /api/auth/get-session    │
│ - Fails closed on auth errors (503 / 504)     │
│ - Signs X-Gateway-Token (HMAC, 60s + jti)    │
└───────────────────────┬───────────────────────┘
                        │ (HTTPS + X-Gateway-Token)
                        ▼
┌───────────────────────────────────────────────┐
│ Go Backend (Chi router)                       │
│ - BetterAuthMiddleware verifies gateway token │
│ - Resolves user mapping (better_auth_id)     │
│ - Injects verified *Token into r.Context()   │
│ - Enforces resource-level authorization       │
└───────────────────────────────────────────────┘
```

---

## 2. Environment Variables & Bindings

### Non-secret Variables (`wrangler.jsonc` `vars`):

| Variable | Description | Example |
|----------|-------------|---------|
| `ENVIRONMENT` | Deployment environment name | `production` / `staging` |
| `BETTER_AUTH_URL` | Base URL of Better Auth instance (Next.js or dedicated) | `https://hiffi.com` |
| `GO_BACKEND_URL` | Base URL of the Go REST backend | `https://api.hiffi.com` |

### Secrets (Configured via Cloudflare Dashboard or CLI):

| Secret | Description | Where to Set |
|--------|-------------|--------------|
| `GATEWAY_SECRET` | 256-bit secret for signing `X-Gateway-Token` | Worker Secrets & Go `.env` |

---

## 3. Secret Setup Commands

To store secrets in Cloudflare without committing them to git:

```bash
# Set GATEWAY_SECRET in Cloudflare Worker
npx wrangler secret put GATEWAY_SECRET

# For local development with secrets:
echo "GATEWAY_SECRET=your-secure-random-256bit-secret-here" > .dev.vars
```

> **Note**: Ensure the exact same `GATEWAY_SECRET` value is placed in the Go backend's `.env`:
> ```env
> GATEWAY_SECRET=your-secure-random-256bit-secret-here
> ```

---

## 4. Local Development

Run the gateway locally with hot-reloading:

```bash
# Inside worker/ directory:
npm install
npm run dev

# Or with specific port:
npx wrangler dev --port 8787
```

---

## 5. Build, Typecheck, and Deployment Commands

```bash
# 1. Typecheck the Worker code:
npm run typecheck

# 2. Deploy to Cloudflare:
npm run deploy

# 3. View live production logs / tail:
npx wrangler tail
```

---

## 6. Custom Domain Routing

To map `api.hiffi.com` directly to this Worker:

1. In `wrangler.jsonc`, add your custom domain route:
   ```jsonc
   "routes": [
     {
       "pattern": "api.hiffi.com/*",
       "custom_domain": true
     }
   ]
   ```
2. Run `npx wrangler deploy`.
3. Cloudflare automatically issues and manages the SSL/TLS certificate for `api.hiffi.com`.

---

## 7. Safe Rollback Procedure

If a deployed version experiences unexpected behavior:

```bash
# List previous deployments:
npx wrangler deployments list

# Rollback to the previous stable deployment ID:
npx wrangler rollback <DEPLOYMENT_ID>
```

Alternatively, if the Worker gateway needs to be temporarily bypassed:
1. Point your DNS / frontend `NEXT_PUBLIC_API_URL` directly to the origin VPS (`https://origin-api.hiffi.com`).
2. The Go backend's `BetterAuthMiddleware` validates Better Auth sessions against `BETTER_AUTH_URL` (HTTP `get-session` only; it does **not** fall open to a database lookup if that service is down). Direct clients can still use a legacy JWT while `ALLOW_LEGACY_JWT` is not `false`.

## 8. Token lifetime and replay

- Gateway tokens expire in **60 seconds** (`exp = iat + 60`). Go rejects a longer lifetime.
- Each token has a unique `jti`. Go stores used ids in Valkey (`gw:jti:*`) so every replica sees replays. If Valkey is down, that process uses an in-memory cache only (replays against another replica or after restart can succeed until expiry).
- A short-lived token is not a substitute for locking down the origin. Keep `GATEWAY_SECRET` only on the Worker and Go origin. Do not reuse `AUTH_BRIDGE_SECRET`. Prefer Cloudflare authenticated origin pulls / firewall so the public internet cannot hit Go with a stolen header.

Do not deploy this Worker just because it exists. Prefer: Go middleware + migration in staging, then Next.js cookies, then the Worker as an optional edge path.
