# Hiffi Web — Release notes (v2.3.0)

**Version:** 2.3.0 (follows v2.2.4 from July 16)  
**Shipped:** August 13, 2026  
**Notes updated:** August 14, 2026

> **Do not announce:** Latest **`/top-artists`** (Hip-Hop 500) — ranking launch remains a later release.  
> **Next cut:** [v2.3.1 — August 15, 2026](./web-v2.3.1.md)

---

## In one sentence

We expanded **Atlanta** scene pages, added in-product **Feedback** (profile / navbar), hardened signup with **Turnstile**, polished **Share** and Artist Index, and improved crawl/SEO hygiene.

---

## Why this release matters

| Goal | What we shipped |
| ---- | --------------- |
| **Grow discovery & local SEO** | Atlanta hubs; richer sitemaps |
| **Listen to the community** | Feedback with screenshot capture; admin review queue |
| **Trust & safety** | Cloudflare Turnstile on auth flows |
| **Clearer everyday actions** | Share as a top-level button on home cards and watch; Artist Index claim/verified polish |

---

## For listeners & fans

### Send feedback from anywhere

- **Send feedback** from the profile / navbar menu — screenshot of the current page so the team sees what you saw.

### Explore the Atlanta scene

- **Atlanta** editorial hubs at [hiffi.com/atlanta](https://www.hiffi.com/atlanta) — genres, eras, best-of, venues, and studios.

### Better experience on home and watch

- **Share** is a main icon on home video cards and the watch page.
- Report and Delete stay under more-actions.
- Watch keeps your sound on/off choice when moving to the next video.

### Small fixes you might notice

- Artist Index claim CTA and hero copy are clearer; verified badge placement on artist detail improved.
- Feedback dialog works cleanly across phone and desktop.

---

## For artists & creators

### Look intentional on Artist Index

- Claim CTA / hero text polish and verified badge repositioning.

### Safer signup

- Auth flows use **Cloudflare Turnstile** to reduce bot signups.

---

## For marketing, partnerships & growth

### SEO & shareability

- Sitemap routing upgrades (`sitemap.xml`, split sitemaps, `video-sitemap.xml`).
- Expanded **Atlanta** content for local discovery.

---

## For operations & admin team

### Manage user feedback

- **Feedback** in the admin sidebar — list, filters, detail with screenshot/metadata.

### Auth ops note

- Turnstile env vars must be set on each environment (see `.env.example`).
- Production must keep **`NEXT_PUBLIC_ENV=prod`** so robots.txt allows crawling.

---

## For product & leadership

**Shipped August 13, 2026 (v2.3.0)**

| Theme | What shipped |
| ----- | ------------ |
| **Share** | Top-level Share on home/watch |
| **Feedback loop** | User submit (profile / navbar) → admin review |
| **Content** | Atlanta hubs |
| **Artist Index** | Claim CTA / hero polish; verified badge placement |

**Not part of this cut (do not announce)**

- Latest **`/top-artists`** / Hip-Hop 500 product
- Full multi-platform HPS ranking
- Ranking in primary sidebar/footer
- API/data licensing, index report, paid analytics

**Why it matters:** Stronger local content, a real feedback loop, and clearer day-to-day actions — without bundling an unfinished ranking launch.

---

## Bug fixes & polish

| Area | Fix |
| ---- | --- |
| **Share on home & watch** | Share is a top-level icon; Report/Delete remain under more-actions. |
| **Watch mute** | Watch keeps your sound on/off choice when moving to the next video. |
| **Feedback UI** | Dialog responsive across screen sizes. |
| **Artist Index** | Claim CTA / hero text; verified badge on artist detail. |

*Engineering detail:* see [CHANGELOG.md](../../CHANGELOG.md#230--2026-08-13).  
*Next release:* [v2.3.1 — August 15, 2026](./web-v2.3.1.md)

---
