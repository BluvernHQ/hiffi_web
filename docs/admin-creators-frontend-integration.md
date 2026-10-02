# Creator Admin API — Frontend integration guide

Contract for the **admin Creator Dashboard**. Share this with the dashboard frontend.

This backend ships **HTTP endpoints only** (no admin UI). JSON is `snake_case`. Envelope:

```ts
{ success: true, data: T }
{ success: false, error: string }
```

**Base URL:** your API host. Paths are relative to that host.

**Auth:** admin JWT only (not a user JWT).

```http
Authorization: Bearer <admin_jwt>
```

Get the token from `POST /admin/auth/login`. See `lib/ADMIN_API.md` for admin auth and role definitions.

| Role | Access |
|------|--------|
| `super_admin` | All creator routes below |
| `read_only` | GET only |
| `curator` | No access (`403`) |

**Do not** send a consumer-app user JWT. That returns `401`.

**Population:** the entire creator dashboard — overview, funnel (Approved onward), attention, trends, directory, detail, suspend — uses `users.source = organic` only. Inventory-seeded artists are excluded. `pending_claims` in the funnel still reflects the inventory claim queue.

---

## Screen -> endpoint map

| UI | Endpoint |
|----|----------|
| Growth KPI cards | `GET /admin/creators/overview` |
| KPI card click -> list | `GET /admin/creators?segment=...` |
| Growth funnel | `GET /admin/creators/funnel` |
| Funnel period comparison | `GET /admin/creators/funnel?compare=7d` or `compare=30d` |
| Needs attention | `GET /admin/creators/attention` |
| Attention -> View creators | `GET /admin/creators?segment=...` |
| Growth trend charts | `GET /admin/creators/trends` |
| Creator directory | `GET /admin/creators` |
| Creator detail | `GET /admin/creators/{username}` |
| Suspend / unsuspend | `POST .../suspend` and `POST .../unsuspend` |

---

## Product rules (read these)

**Two Applied metrics, not one funnel conversion.** Inventory claims and organic OTP upgrades are different queues. Do not add them together or compute Applied -> Approved conversion.

| Metric | Field | Meaning |
|--------|-------|---------|
| Pending claims | `applied.pending_claims` | Open inventory claims. Stay until an admin acts. |
| Pending OTP upgrades | `applied.pending_upgrades` | Users with `creator_status=applied`. Live only while the OTP is valid (~1 hour). |

Approved onward is user-based and does include conversion from the previous stage.

**Suspend is not DisableUser.** Suspend sets `creator_status=suspended`, drops the user from Approved KPIs, and blocks uploads. Login still works. Existing videos are not hidden. Unsuspend restores upload access. Disable remains the account kill-switch.

**Activity** used in KPIs / attention / retained:

`last_activity_at = GREATEST(last_login_at, last_session_at, last_upload_at)`

**Windows**

| Metric | Window |
|--------|--------|
| Active Uploader (funnel) | last upload <= 30 days |
| Retained (funnel) | has first upload and activity <= 30 days |
| Stale uploaders | last upload older than 14 days (override with `stale_days`) |
| At risk | has uploaded; no activity for 30 / 60 / 90 days |
| Active 7d / 30d (overview) | `last_activity_at` in that window |

**Genre** is free-text (trimmed, lowercased). Filter with `ILIKE`.

**Never Returned** is `last_login_at IS NULL OR last_login_at <= approved_at`. Verifying a creator OTP does not set `last_login_at`. Login timestamps start at deploy time, so this segment can over-count until people log in again.

**Trends `daily`** is empty until the UTC snapshot job has written rows (`CREATOR_DAILY_STATS_ENABLED`; default on). Weekly series on trends and detail are live from source tables.

---

## Routes

| Method | Path | Role |
|--------|------|------|
| `GET` | `/admin/creators/overview` | `super_admin`, `read_only` |
| `GET` | `/admin/creators/funnel` | same |
| `GET` | `/admin/creators/attention` | same |
| `GET` | `/admin/creators/trends` | same |
| `GET` | `/admin/creators` | same |
| `GET` | `/admin/creators/{username}` | same |
| `POST` | `/admin/creators/{username}/suspend` | `super_admin` |
| `POST` | `/admin/creators/{username}/unsuspend` | `super_admin` |

`{username}` is matched case-insensitively (server lowercases it).

Common errors:

| HTTP | error |
|------|-------|
| `401` | Unauthorized |
| `403` | Forbidden: insufficient permissions (or disabled admin) |
| `500` | handler-specific message |

---

## Common parameter: `as_of`

All four analytics endpoints (`overview`, `funnel`, `attention`, `trends`) share one calendar:

| Param | Format | Default | Notes |
|-------|--------|---------|-------|
| `as_of` | `YYYY-MM-DD` (UTC) | today | Future dates are clamped to today. Invalid → `400`. |

Every response includes `"as_of": "YYYY-MM-DD"` echoing the effective date.

The Creators **Overview** tab has one date picker that passes the same `as_of` to all four calls. Applied queues remain live (not historical). Directory / detail / suspend do not take `as_of`.

---

## 1. Overview (KPI cards)

`GET /admin/creators/overview`

Population: `creator_status = approved`, `source = organic`, not deleted.

### Success - 200 OK

```json
{
  "success": true,
  "data": {
    "total_creators": 1240,
    "creators_with_uploads": 680,
    "upload_rate": 54.83870967741935,
    "new_creators_this_week": 18,
    "never_uploaded": 560,
    "active_7d": 210,
    "active_30d": 410,
    "median_days_to_first_upload": 4.2
  }
}
```

| Field | Type | Definition |
|-------|------|------------|
| `total_creators` | int | Approved creators |
| `creators_with_uploads` | int | First upload exists |
| `upload_rate` | number | `creators_with_uploads / total_creators * 100`, or `0` |
| `new_creators_this_week` | int | `approved_at` in last 7 days |
| `never_uploaded` | int | First upload is missing |
| `active_7d` / `active_30d` | int | last_activity_at in window |
| `median_days_to_first_upload` | number | Median of `first_upload_at - approved_at` in days; `null` if none |

Render rule: `upload_rate` and conversions are raw floats. Round in UI (e.g. 1 decimal).

---

## KPI click-through

| Card | Directory query |
|------|-------------------|
| Total Creators | `?status=approved` |
| Creators with Uploads | `?segment=has_uploads` |
| Never Uploaded | `?segment=never_uploaded` |
| New Creators This Week | `?segment=new_this_week` |
| Active 7 Days | `?segment=active_7d` |
| Active 30 Days | `?segment=active_30d` |

---

## 2. Funnel

```http
GET /admin/creators/funnel
GET /admin/creators/funnel?compare=7d
GET /admin/creators/funnel?compare=30d
```

`compare` is optional. Invalid values are ignored.

### Success - 200 OK

```json
{
  "success": true,
  "data": {
    "applied": {
      "pending_claims": 12,
      "pending_upgrades": 3
    },
    "approved": { "count": 1240, "conversion": null },
    "first_upload": { "count": 680, "conversion": 54.83870967741935 },
    "active_uploader": { "count": 420, "conversion": 61.76470588235294, "window_days": 30 },
    "retained": { "count": 290, "conversion": 69.04761904761905, "window_days": 30 },
    "compare": {
      "period": "7d",
      "as_of": "2026-08-12",
      "approved": 1200,
      "first_upload": 650,
      "active_30d": 400,
      "retained_30d": 270
    }
  }
}
```

Render rule: show **two Applied counts** and **do not** compute Applied conversion.

Stage conversion:

| Stage | conversion |
|--------|------------|
| Approved | always `null` |
| First upload | vs Approved |
| Active uploader | vs First upload |
| Retained | vs Active uploader |

`conversion` is `current / previous * 100`, or `null` when previous is 0.

`compare.as_of` is UTC `YYYY-MM-DD`.

---

## 3. Needs attention

```http
GET /admin/creators/attention
GET /admin/creators/attention?stale_days=14
```

`stale_days`: integer 1-365. Default 14.

Percentages are of approved creators (`total_creators`).

### Success - 200 OK

```json
{
  "success": true,
  "data": {
    "total_creators": 1240,
    "stale_days": 14,
    "segments": {
      "never_uploaded": { "count": 560, "percentage": 45.16 },
      "never_returned": { "count": 80, "percentage": 6.45 },
      "stale_uploaders": { "count": 40, "percentage": 3.23 },
      "at_risk_30": { "count": 90, "percentage": 7.26 },
      "at_risk_60": { "count": 50, "percentage": 4.03 },
      "at_risk_90": { "count": 20, "percentage": 1.61 },
      "new_creators_without_upload": { "count": 5, "percentage": 0.4 }
    }
  }
}
```

List with:

| Segment key | Directory query |
|-------------|-------------------|
| `never_uploaded` | `?segment=never_uploaded` |
| `never_returned` | `?segment=never_returned` |
| `stale_uploaders` | `?segment=stale&stale_days=` |
| `at_risk_30/60/90` | `?segment=at_risk_30` (etc.) |
| `new_creators_without_upload` | `?segment=new_without_upload` |

At-risk nesting (90 in 60 in 30) is expected.

---

## 4. Trends

```http
GET /admin/creators/trends
```

### Success - 200 OK

```json
{
  "success": true,
  "data": {
    "daily": [],
    "new_creators_weekly": [{ "week": "2026-08-17", "count": 12 }],
    "first_uploads_weekly": [{ "week": "2026-08-17", "count": 8 }],
    "total_uploads_weekly": [{ "week": "2026-08-17", "count": 95 }]
  }
}
```

Chart guidance:

- `daily` is from snapshot rows (UTC, oldest first, up to last 90 days).
- Weekly series are live and omitted values are allowed.

---

## 5. Directory

```http
GET /admin/creators
```

Query population: organic creator users only.

Common query params:

| Param | Notes |
|-------|-------|
| `limit` | max 100 |
| `offset` | >= 0 |
| `status` | `applied` | `approved` | `suspended` |
| `upload_status` | `has_uploads` | `never_uploaded` |
| `segment` | see segment mapping in code |
| `city` | `ILIKE` on `location` |
| `genre` | `ILIKE` on `genre` |
| `claim_status` | `pending` | `approved` | `rejected` | `none` |
| `stale_days` | only when `segment=stale` |

Directory page can combine filters; if they conflict, the intersection can be empty.

---

## 6. Creator detail

```http
GET /admin/creators/{username}
```

Returns:

- `profile`
- `activity_summary` (last upload/activity/login and day deltas)
- `upload_activity` (timeline + recent videos + encoding videos)
- `applications` (organic OTP history only)
- `flags` (existing flag objects, if present)

---

## 7. Suspend / unsuspend

Empty body. `super_admin` only.

```http
POST /admin/creators/{username}/suspend
POST /admin/creators/{username}/unsuspend
```

Success:

```json
{ "success": true, "data": { "message": "Creator suspended" } }
```

```json
{ "success": true, "data": { "message": "Creator unsuspended" } }
```

Errors:

| HTTP | error |
|------|-------|
| `409` | wrong state (not approved / not suspended) |
| `403` | Forbidden: insufficient permissions |

---

## Suggested TypeScript types

```ts
type Envelope<T> = { success: true; data: T } | { success: false; error: string }

type FunnelStage = {
  count: number
  conversion: number | null
  window_days?: number
}

type CreatorOverview = {
  total_creators: number
  creators_with_uploads: number
  upload_rate: number
  new_creators_this_week: number
  never_uploaded: number
  active_7d: number
  active_30d: number
  median_days_to_first_upload: number | null
}

type CreatorFunnel = {
  applied: { pending_claims: number; pending_upgrades: number }
  approved: FunnelStage
  first_upload: FunnelStage
  active_uploader: FunnelStage
  retained: FunnelStage
  compare?: {
    period: "7d" | "30d"
    as_of: string
    approved: number
    first_upload: number
    active_30d: number
    retained_30d: number
  }
}

type AttentionSegment = { count: number; percentage: number }

type CreatorAttention = {
  total_creators: number
  stale_days: number
  segments: {
    never_uploaded: AttentionSegment
    never_returned: AttentionSegment
    stale_uploaders: AttentionSegment
    at_risk_30: AttentionSegment
    at_risk_60: AttentionSegment
    at_risk_90: AttentionSegment
    new_creators_without_upload: AttentionSegment
  }
}
```

---

## Related

- Admin API + auth/roles: [`lib/ADMIN_API.md`](../lib/ADMIN_API.md)
- Admin flags UI + proxy routes: [`lib/FLAGS_API.md`](../lib/FLAGS_API.md)
- Creators feature overview: [`docs/admin-creators-feature.md`](admin-creators-feature.md)
