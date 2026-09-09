# Admin Creators dashboard — what we shipped

A **Creators** area in the admin panel for watching how artists behave after they become creators: who has uploaded, who has gone quiet, and who needs a follow-up.

**Where to open it:** Admin sidebar → **Community** → **Creators**  
(or the **Creators** snapshot cards on the main admin home).

---

## Who can use it

| Role | What they can do |
| --- | --- |
| Super admin | See everything and **pause / restore uploads** |
| Read-only | See everything, cannot pause uploads |
| Curator | **No access** (this is not part of curation) |

---

## Two populations (do not mix)

| Dashboard | Who |
| --- | --- |
| **Organic** | Self-serve creators (`users.source = organic`) |
| **Claimed** | Inventory artists with an **admin-approved** claim |

Toggle **Organic | Claimed** on Overview. Directory follows the same population. Numbers from one side are never added into the other.

---

## 1. Snapshot on the main dashboard

Home admin shows a **Creators** card with two separate blocks:

- **Organic** — self-serve creators
- **Claimed** — inventory artists with an approved claim

Each block has upload conversion plus the headline KPIs (creators, uploaded, never uploaded, active 7d/30d, new this week / new claims). Numbers are never merged across populations. Links open the matching Directory or Overview population.

---

## 2. Overview tab

**As of (UTC)** — end date for KPIs (optional **from** date for range windows). Pending claims / OTP stay live.

**Population** — Organic or Claimed.

**Metrics sub-nav** — Growth, Acquisition, Activation, Engagement, Retention, Content, Quality, Ops, Cohorts.

### Growth
KPI cards drill into Directory for that population.

- Creators / Claimed creators
- Have uploaded / Never uploaded
- New this week (organic: approvals; claimed: claim approves)
- Active 7d / 30d

Funnel (organic): Applied queues stay separate → Creators → First upload → Active uploader → Retained.

Funnel (claimed): Pending claims + claim onboarding → Claimed → First upload → Active uploader → Retained.

**Do not** treat Applied claim + OTP as one conversion.

### Needs attention / Trends / other sections
Same segment ideas as before, scoped to the selected population’s API (`/admin/creators/…` or `/admin/creators/claimed/…`).

---

## 3. Directory tab

Lists **organic** or **claimed** creators (matches Overview population).

**Filters:** account status, uploads, ready-made queues, claim status, city, genre.

Rows may show Organic / Inventory badges when `source` is present. Click a row for detail.

---

## 4. Creator profile

Profile, activity, videos, OTP history (organic upgrades), flags, and **Suspend uploads** (super admin) — same for both populations. Suspend is not account disable.

---

## Words we use on purpose

- **Creators** on screens, not “Approved,” for organic.
- **Claimed** for the claim-approved inventory dashboard.
- **Activity** = latest of login, session, or upload.
- Claims and OTP are two different queues.

---

## What this is for (in one line)

Ops and product can see organic and claimed creator health separately, open the exact list, look at one artist, and pause uploads without taking the account down.
