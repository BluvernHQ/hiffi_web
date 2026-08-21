# Hiffi Web — Release notes (v2.3.1)

**Version:** 2.3.1 (follows v2.3.0 from August 13, 2026)  
**Target ship date:** August 21, 2026  
**Notes updated:** August 20, 2026  
**Status:** Ready to go live

Prior release: [v2.3.0 — August 13, 2026](./web-v2.3.0.md)

---

## In one sentence

A follow-up after v2.3.0: public **Hip-Hop 500** at `/top-artists` with Hiffi branding and the app sidebar, a **home hero player** on discover, **Creators analytics** in admin, easier feedback from the sidebar, clearer Artist Index links on profiles, and better crawl-friendly homepage content.

---

## Why this release matters

| Goal | What we ship |
| ---- | ------------ |
| **Launch Hip-Hop 500** | Live ranking at [hiffi.com/top-artists](https://www.hiffi.com/top-artists) with the Hiffi logo and in-page app sidebar |
| **Richer home discover** | Homepage **hero player** — featured videos play on the home feed before you open Watch |
| **Creator health in admin** | New **Creators** analytics — who uploaded, who went quiet, who needs follow-up; pause uploads without disabling the account |
| **Easier feedback** | Send Feedback from the main sidebar, not only profile / navbar |
| **Clearer Artist Index** | Link from Hiffi profiles to Artist Index listings; hide Watch on Hiffi when a profile is unclaimed |
| **Healthier discovery** | Cleaner production crawl rules + homepage content search engines can read |

---

## What’s included

| Item | What changes |
| ---- | ------------ |
| **Hip-Hop 500 (`/top-artists`)** | Public live YouTube Hip-Hop 500 ranking (leaderboard, movers, how it works, share) |
| **Hiffi logo on Hip-Hop 500** | Page header uses the Hiffi logo (logo goes home); **HIP-HOP 500** stays with the ranking |
| **App sidebar on Hip-Hop 500** | Menu toggle beside the logo; sidebar opens **only under the header** so branding stays full width |
| **Home hero player** | Featured video carousel on the homepage — preview playback, mute/unmute, share, and continue into Watch from the same spot |
| **Admin Creators analytics** | Overview KPIs, growth funnel, needs-attention queues, trends, searchable directory, per-creator detail, and **Suspend uploads** (super admin) |
| **Feedback in the sidebar** | **Send Feedback** in the main sidebar (logged-out and logged-in), same dialog as profile / navbar |
| **Artist Index — unclaimed** | Hide **Watch on Hiffi** on unclaimed Artist Index profiles (claim CTA stays) |
| **Hiffi profile → Artist Index** | If an artist is listed in the Artist Index, their Hiffi profile About section shows a link to that listing (opens in a new tab) |
| **Crawl hygiene** | Cleaner production crawl rules + homepage discover content that search engines can read (real video titles and watch links) |

---

## For listeners & fans

### Browse Hip-Hop 500

- Open [hiffi.com/top-artists](https://www.hiffi.com/top-artists) for the live **500** moving hip-hop on YouTube.
- Use the **Hiffi logo** to jump home; use **HIP-HOP 500** / page nav for Leaderboard, Movers, and How it works.
- Open the **app sidebar** from the hamburger next to the logo without losing the full-width ranking header.

### Watch featured videos on home

- The homepage now has a **hero player** — featured clips play on discover.
- Mute/unmute and share from the hero; open Watch and pick up from where the preview left off.

### Send feedback & Artist Index polish

- **Send Feedback** from the main sidebar (same flow as profile / navbar).
- Unclaimed Artist Index profiles no longer show **Watch on Hiffi**.
- Listed artists get a clear link from their Hiffi profile to their Artist Index page.

---

## For operations & admin team

### Creators analytics (new)

Open **Admin → Community → Creators** (also snapshot cards on the main admin home).

- **Overview** — creators count, have uploaded / never uploaded, new this week, active 7d / 30d, upload conversion, growth funnel (vs 7d or 30d), needs-attention lists (stale, at risk, never returned), and trend charts
- **Directory** — filterable creator list (account status, uploads, queues, claim, city/genre); click a row for detail
- **Creator detail** — profile, activity, weekly/monthly uploads, recent videos with thumbnails, OTP history, reports
- **Suspend uploads** (super admin) — blocks new uploads only; login still works and existing videos stay up (not the same as disabling the account)
- **Roles** — super admin (full + suspend); read-only (view); curator has no access

Inventory claims and OTP upgrades stay as **two separate waiting lists** — they are not mixed into one “applied → creator” conversion.

---

## For product & leadership

Green light to ship **v2.3.1** as the cut that **announces Hip-Hop 500**, the **home hero player**, and **admin Creators analytics**, on top of the small Artist Index / feedback / crawl follow-ups after August 13 (v2.3.0).

**Still not announced**

- Full multi-platform HPS ranking (beyond YouTube-first Hip-Hop 500)
- Paid analytics / index report / API licensing

*Engineering detail:* see [CHANGELOG.md](../../CHANGELOG.md#231--2026-08-15).  
*Ops handout:* [admin Creators feature](../admin-creators-feature.md).

---
