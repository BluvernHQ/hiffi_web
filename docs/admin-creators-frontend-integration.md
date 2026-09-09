# Creator Admin API — Frontend integration guide

Contract for the **admin Creator Dashboard**. Share this with the dashboard frontend.

Envelope:

```ts
{ success: true, data: T }
{ success: false, error: string }
```

**Auth:** admin JWT only (`Authorization: Bearer <admin_jwt>`).

| Role | Access |
|------|--------|
| `super_admin` | All creator routes |
| `read_only` | GET only |
| `curator` | No access (`403`) |

---

## Two dashboards (do not mix)

| Surface | Population | Paths |
|---------|------------|-------|
| **Organic** | `users.source = organic` | `/admin/creators/*` |
| **Claimed** | Inventory artists with an **admin-approved** claim | `/admin/creators/claimed/*` |

- Responses use **plain ints / floats** (not SplitInt).
- Do **not** add organic + claimed into one total.
- Claimed ≠ every `source=inventory` row — only approved claims joined to users.

Frontend query: `creators_pop=organic|claimed` (default organic). Metrics tabs: `creators_metrics`. Calendar: `as_of` / `to_date` + optional `from_date`.

---

## Product rules

**Two Applied metrics, not one conversion.** Pending inventory claims and pending OTP upgrades stay separate. Do not compute Applied → Approved as one rate.

**Suspend ≠ DisableUser.** Suspend blocks uploads; login and existing videos remain.

**Activity:** `last_activity_at = GREATEST(last_login_at, last_session_at, last_upload_at)`.

---

## Calendar params

| Param | Format | Default |
|-------|--------|---------|
| `to_date` | `YYYY-MM-DD` UTC | today |
| `as_of` | alias for `to_date` | — |
| `from_date` | inclusive start | unset |

Responses echo `as_of` / `to_date` (and `from_date` when set).

---

## Organic routes

| Method | Path |
|--------|------|
| GET | `/admin/creators/overview` |
| GET | `/admin/creators/funnel` |
| GET | `/admin/creators/attention` |
| GET | `/admin/creators/trends` |
| GET | `/admin/creators/acquisition` … `/cohorts` |
| GET | `/admin/creators` |
| GET | `/admin/creators/{username}` |
| POST | `/admin/creators/{username}/suspend` |
| POST | `/admin/creators/{username}/unsuspend` |

Overview KPIs (plain ints): `total_creators`, `creators_with_uploads`, `upload_rate`, `new_creators_this_week`, `never_uploaded`, `active_7d`, `active_30d`, `median_days_to_first_upload`.

Funnel: `applied` (live) → `approved` → `first_upload` → `active_uploader` → `retained` (+ optional `claim_onboarding`).

Trends `daily` is a flat row per day; weekly series are `{ week, count }`.

Directory default population: organic creators only.

---

## Claimed routes

| Method | Path |
|--------|------|
| GET | `/admin/creators/claimed/overview` |
| GET | `/admin/creators/claimed/funnel` |
| GET | `/admin/creators/claimed/attention` |
| GET | `/admin/creators/claimed/trends` |
| GET | `/admin/creators/claimed/acquisition` … `/cohorts` |
| GET | `/admin/creators/claimed` |

Overview includes `population: "claimed"` and `new_claims_this_week` (claim approve time).

Funnel: pending claims + `claim_onboarding` → `claimed` → `first_upload` → `active_uploader` → `retained`.

Detail / suspend still use `/admin/creators/{username}`.

---

## Frontend map

| UI | Organic | Claimed |
|----|---------|---------|
| Growth KPIs | `…/overview` | `…/claimed/overview` |
| Funnel / attention / trends | `…/{section}` | `…/claimed/{section}` |
| Metrics tabs | same pattern | same pattern |
| Directory | `GET /admin/creators` | `GET /admin/creators/claimed` |

Types and normalizers: `lib/types/admin-creators.ts`. Client: `lib/api/admin-creators.ts`.

---

## Related

- Claims queue: inventory claims admin UI
- Permissions: `creators.dashboard:read`, `creators.moderation:write`
