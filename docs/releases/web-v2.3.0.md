# Hiffi Web — Release notes (v2.3.0)

**Release date:** July 30, 2026 (notes updated August 14, 2026)  
**Version:** 2.3.0 (follows v2.2.4 from July 16)

> **Not in this release:** The latest **`/top-artists`** (Hip-Hop 500) experience is **not** part of this cut — do not announce or promote it. Ranking product launch remains a later release.

---

## In one sentence

We redesigned **About** and expanded **Atlanta** scene pages, added in-product **Feedback**, hardened signup with **Turnstile**, polished **Share** and Artist Index on home and watch, and improved crawl/SEO hygiene (robots.txt + crawlable home feed).

---

## Why this release matters

| Goal | What we shipped |
| ---- | --------------- |
| **Grow discovery & local SEO** | Redesigned About; Atlanta hubs; richer sitemaps; crawlable home feed snapshot |
| **Listen to the community** | Feedback with screenshot capture; admin review queue |
| **Trust & safety** | Cloudflare Turnstile on auth flows |
| **Clearer everyday actions** | Share as a top-level button on home cards and watch; Artist Index claim/verified polish |

---

## For listeners & fans

### Send feedback from anywhere

- **Send feedback** from the profile / navbar menu — screenshot of the current page so the team sees what you saw.

### Learn about Hiffi and the Atlanta scene

- Redesigned **About** at [hiffi.com/about](https://www.hiffi.com/about).
- **Atlanta** editorial hubs at [hiffi.com/atlanta](https://www.hiffi.com/atlanta) — genres, eras, best-of, venues, and studios.

### Better experience on home and watch

- **Share** is a main icon on home video cards and the watch page.
- Report and Delete stay under more-actions.
- Additional **mute preference** fix while watching.
- Home discover HTML includes a **streamed snapshot** of real video titles and `/watch/` links for crawlers and cold loads (interactive infinite scroll unchanged).

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
- Production **robots.txt** simplified (YouTube-style single `User-agent: *` + Disallows + Sitemap).
- Homepage JSON-LD ItemList plus **visible SSR video links** so discover isn’t empty shells in view-source.
- Expanded **Atlanta** content and redesigned **About** for brand and local discovery.

---

## For operations & admin team

### Manage user feedback

- **Feedback** in the admin sidebar — list, filters, detail with screenshot/metadata.

### Auth ops note

- Turnstile env vars must be set on each environment (see `.env.example`).
- Production must keep **`NEXT_PUBLIC_ENV=prod`** so robots.txt allows crawling.

---

## For product & leadership

**In this cut**

| Theme | What shipped |
| ----- | ------------ |
| **Share** | Top-level Share on home/watch |
| **Feedback loop** | User submit → admin review |
| **Content** | About redesign; Atlanta hubs |
| **Crawl** | Lean robots.txt; crawlable home feed snapshot |

**Explicitly not in this release**

- Latest **`/top-artists`** / Hip-Hop 500 product (hold for a dedicated ranking launch)
- Full multi-platform HPS ranking
- Ranking promoted in primary sidebar/footer
- API/data licensing, index report, paid analytics

**Why it matters:** Stronger brand and local content, a real feedback loop, and healthier crawl signals — without bundling an unfinished ranking launch.

*Engineering detail:* see [CHANGELOG.md](../../CHANGELOG.md#230--2026-07-30).

---

## Bug fixes & polish

| Area | Fix |
| ---- | --- |
| **Share on home & watch** | Share is a top-level icon; Report/Delete remain under more-actions. |
| **Watch mute** | Additional mute preference fix beyond v2.2.3. |
| **Feedback UI** | Dialog responsive across screen sizes. |
| **Artist Index** | Claim CTA / hero text; verified badge on artist detail. |
| **About** | Responsive and image polish. |
| **Home SEO** | SSR snapshot of discover videos for crawlers; client feed/scroll restore preserved. |
| **robots.txt** | Single wildcard group; private paths disallowed; Host directive removed. |

---
