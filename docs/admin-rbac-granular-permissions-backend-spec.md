# Admin RBAC — Granular permissions (backend spec)

**Audience:** Backend developers  
**Frontend source of truth:** `lib/auth/admin-permissions.ts`, `lib/auth/admin-permission-catalog.ts`  
**Related:** Admin RBAC v2 integration guide (migration `064`), `Events/Admin/permissions.go`

---

## 1. Problem

The admin dashboard role editor supports **module-level** permissions (e.g. assign Journeys without Dashboard). When the frontend saves a custom role with granular keys, the backend rejects the request:

```json
{
  "success": false,
  "error": "unknown permission dashboard:read"
}
```

**Root cause:** `POST /admin/roles` and `PATCH /admin/roles/{role_key}` validate `permissions[]` against a fixed allowlist of **22 coarse keys** only. Granular module keys are not registered in `permissions.go` and are not enforced on individual routes.

**Current frontend workaround:** Before save, granular selections are compressed into legacy umbrellas (e.g. `dashboard:read` → `analytics:read`). This avoids API errors but **cannot persist partial group access** — selecting only Journeys still stores `analytics:read`, which grants all Insights modules.

---

## 2. Goal

1. Register granular permission constants in the backend.
2. Accept them on role CRUD and return them in login / `GET /admin/roles`.
3. Enforce granular permissions on `/admin/*` (and admin proxy) routes.
4. Keep **legacy umbrella keys working** for existing roles and system seeds.

Once shipped, the frontend will stop compressing on role save and send granular keys directly.

---

## 3. Permission catalog

### 3.1 Existing keys (keep — backward compatible)

These 22 keys must continue to work unchanged:

```
analytics:read
analytics:write
users:read
users:write
creators:read
creators:write
curated:read
curated:write
inventory:read
inventory:write
flags:read
flags:write
migration:read
migration:write
youtube_keys:read
youtube_keys:write
feedback:read
collaboration:read
admins:read
admins:write
roles:write
```

### 3.2 New granular keys (add)

#### Insights — split from `analytics:*`

```
dashboard:read
dashboard:write
journeys:read
journeys:write
searches:read
utm:read
utm:write
```

#### Community — split from `users:*`

```
videos:read
videos:write
comments:read
comments:write
replies:read
replies:write
followers:read
referrals:read
```

`users:read` / `users:write` remain for **user account** actions (list users, disable/enable, delete user). Content moderation lists/actions use the granular keys above.

#### Inventory — split from `inventory:*`

```
inventory_claims:read
inventory_claims:write
ranking_anomalies:read
ranking_anomalies:write
```

`inventory:read` / `inventory:write` remain for core artist inventory (list, CRUD, upload, export, template).

#### Inbox — new (discovery survey admin panel)

```
discovery-source:read
discovery-source:write
```

---

## 4. Legacy → granular compatibility

When checking whether an admin has permission `X`, the backend should treat **either** the granular key **or** its legacy umbrella as sufficient.

Implement this in one shared helper (e.g. `AdminHasPermission(admin, perm)`), not per-handler ad hoc logic.

| Legacy umbrella | Also grants |
|-----------------|-------------|
| `analytics:read` | `dashboard:read`, `journeys:read`, `searches:read`, `utm:read` |
| `analytics:write` | `dashboard:write`, `journeys:write`, `utm:write` |
| `users:read` | `videos:read`, `comments:read`, `replies:read`, `followers:read`, `referrals:read` |
| `users:write` | `videos:write`, `comments:write`, `replies:write` |
| `inventory:read` | `inventory_claims:read`, `ranking_anomalies:read` |
| `inventory:write` | `inventory_claims:write`, `ranking_anomalies:write` |

**Inverse (optional but recommended):** If a role has **all** granular modules in a group, treat it as having the umbrella for display/migration purposes. Not required for v1.

**Do not remove legacy keys** from existing system roles until all consumers migrate.

---

## 5. Route → permission mapping

Suggested enforcement per admin API area. Adjust handler paths to match your router; permission names must match §3.

### Insights

| Feature | HTTP routes (representative) | Read | Write |
|---------|------------------------------|------|-------|
| Dashboard counters | `GET /admin/counters` | `dashboard:read` | — |
| Resync counters | `POST /admin/counters/resync` | — | `dashboard:write` |
| Journey funnels / sessions | `/proxy/analytics/journeys*`, `/proxy/analytics/journey-chains`, `/proxy/analytics/sessions*` | `journeys:read` | `journeys:write` |
| Search logs | `GET /admin/searches` | `searches:read` | — |
| UTM polls / analyze | `GET /admin/utm_polls`, `GET /admin/utm_polls/analyze` | `utm:read` | — |
| UTM generated URLs | `GET /admin/utm_generated_urls`, `POST /admin/utm_generated_urls` | `utm:read` | `utm:write` |

### Community

| Feature | HTTP routes | Read | Write |
|---------|-------------|------|-------|
| Users list | `GET /admin/users` | `users:read` | — |
| Disable / enable user | `POST /admin/users/{username}/disable`, `.../enable` | — | `users:write` |
| Videos list | `GET /admin/videos` | `videos:read` | — |
| Delete video | `DELETE /admin/videos/{id}` (or equivalent) | — | `videos:write` |
| Comments | `GET /admin/comments` | `comments:read` | — |
| Delete comment | `DELETE /admin/comments/{id}` | — | `comments:write` |
| Replies | `GET /admin/replies` | `replies:read` | — |
| Delete reply | `DELETE /admin/replies/{id}` | — | `replies:write` |
| Followers | `GET /admin/followers` | `followers:read` | — |
| Referrals | `GET /admin/referals` (or `/referrals`) | `referrals:read` | — |

### Creators, editorial, moderation, tools

| Feature | Routes | Read | Write |
|---------|--------|------|-------|
| Creators | `/admin/creators/*` | `creators:read` | `creators:write` |
| Curated playlists | `/admin/curated-playlists/*` | `curated:read` | `curated:write` |
| Content flags | `/admin/flags/*` | `flags:read` | `flags:write` |
| Migration requests | `/admin/migration-requests/*` | `migration:read` | `migration:write` |
| YouTube API keys | `/admin/youtube-api-keys/*` | `youtube_keys:read` | `youtube_keys:write` |

### Inventory

| Feature | Routes | Read | Write |
|---------|--------|------|-------|
| Artist inventory | `GET /admin/inventory`, upload, export, template | `inventory:read` | `inventory:write` |
| Inventory claims | `GET /admin/inventory/claims`, approve | `inventory_claims:read` | `inventory_claims:write` |
| Ranking anomalies | `/admin/inventory/ranking-anomalies/*`, scan, close | `ranking_anomalies:read` | `ranking_anomalies:write` |

### Inbox

| Feature | Routes | Read | Write |
|---------|--------|------|-------|
| Feedback | `GET /admin/feedback`, `GET /admin/feedback/{id}` | `feedback:read` | — |
| Collaboration | `GET /admin/collaboration-inquiries` | `collaboration:read` | — |
| Discovery survey | `GET /admin/discovery-source`, `DELETE /admin/discovery-source/{id}` | `discovery-source:read` | `discovery-source:write` |

### Access management

| Feature | Routes | Read | Write |
|---------|--------|------|-------|
| Team list | `GET /admin/admins` | `admins:read` | — |
| Invite / edit admin | `POST /admin/admins/invite`, `PATCH /admin/admins/{id}` | — | `admins:write` |
| Roles list | `GET /admin/roles` | `admins:read` | — |
| Role CRUD | `POST/PATCH/DELETE /admin/roles` | — | `roles:write` |

---

## 6. API changes

### Role create — `POST /admin/roles`

**Before:** Rejects unknown permission strings.  
**After:** Accept any key from §3.1 + §3.2. Store exactly what the client sends (prefer granular for new custom roles).

Example valid body:

```json
{
  "role_key": "journey_analyst",
  "display_name": "Journey Analyst",
  "permissions": ["journeys:read", "journeys:write", "searches:read"]
}
```

### Role update — `PATCH /admin/roles/{role_key}`

Same validation as create.

### Login — `POST /admin/auth/login`

Return resolved `admin.permissions[]` from the admin's role. Include granular keys when stored on the role; legacy umbrellas still valid for older roles.

### List roles — `GET /admin/roles`

Return stored `permissions[]` as-is (no silent expansion required; frontend expands legacy umbrellas for the role editor UI).

---

## 7. System role seeds (recommended)

After adding constants, consider updating seeded roles to use granular keys where it improves clarity. **Not blocking** — legacy keys + §4 compatibility is enough for rollout.

| Role | Suggested granular set |
|------|------------------------|
| `read_only` | All `*:read` keys from §3.1 + §3.2 |
| `support` | `users:read`, `videos:read`, `comments:read`, `replies:read`, `followers:read`, `referrals:read`, `creators:read`, `feedback:read`, `collaboration:read`, `flags:read`, `migration:read` |
| `inventory_ops` | All inventory granular read + write |
| `platform_ops` | Insights + community write modules + creators + flags + migration (match current intent) |
| `curator` | `curated:read`, `curated:write` (unchanged) |
| `super_admin` | All permissions |

---

## 8. Validation rules

- Reject empty `permissions[]` on role create/update.
- Reject duplicate entries in `permissions[]`.
- Reject strings not in the union of §3.1 + §3.2.
- Error message should use the exact key: `unknown permission: dashboard:read` (keep colon format).

---

## 9. Frontend follow-up (after backend deploy)

Once granular keys are accepted and enforced:

1. Remove `compressPermissionsForBackend()` usage in `components/admin/admin-roles-panel.tsx` — send UI selections directly.
2. Keep `expandLegacyPermissions()` on role load so roles with `analytics:read` still show all Insights modules checked.
3. Keep `LEGACY_GRANTS` in `hasPermission()` so login sessions with umbrella keys still gate the UI correctly.

Frontend files to update:

- `lib/auth/admin-permissions.ts` — extend `BACKEND_PERMISSIONS` to full granular set
- `components/admin/admin-roles-panel.tsx` — stop compressing on save

---

## 10. Acceptance checklist

- [ ] All keys in §3.2 registered in `permissions.go`
- [ ] `POST/PATCH /admin/roles` accept granular keys without error
- [ ] `GET /admin/roles` and login return stored granular permissions
- [ ] Route middleware uses granular keys per §5
- [ ] Legacy umbrellas still satisfy granular checks (§4)
- [ ] Role with only `journeys:read` can access journey APIs but **not** `GET /admin/counters` or `GET /admin/searches`
- [ ] Role with only `dashboard:read` can access counters but **not** journey/search/UTM routes
- [ ] Integration guide §12 updated with full permission list

---

## 11. Copy-paste: full permission union (TypeScript / Go)

Use as the allowlist for role validation:

```
analytics:read
analytics:write
dashboard:read
dashboard:write
journeys:read
journeys:write
searches:read
utm:read
utm:write
users:read
users:write
videos:read
videos:write
comments:read
comments:write
replies:read
replies:write
followers:read
referrals:read
creators:read
creators:write
curated:read
curated:write
inventory:read
inventory:write
inventory_claims:read
inventory_claims:write
ranking_anomalies:read
ranking_anomalies:write
flags:read
flags:write
migration:read
migration:write
youtube_keys:read
youtube_keys:write
feedback:read
collaboration:read
discovery-source:read
discovery-source:write
admins:read
admins:write
roles:write
```

**Total:** 44 permission strings (22 legacy + 22 granular additions).

---

## Questions?

Frontend contact: admin dashboard team  
Backend source of truth today: `Events/Admin/permissions.go`  
API reference: `Events/Admin/ADMIN_API.md`
