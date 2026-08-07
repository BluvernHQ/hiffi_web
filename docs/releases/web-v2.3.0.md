# Hiffi Web — Release notes (v2.3.0)

**Release date:** July 30, 2026  
**Version:** 2.3.0 (follows v2.2.4 from July 16)

---

## In one sentence

We launched a public **Top Artist** ranking at [hiffi.com/top-artists](https://www.hiffi.com/top-artists), made it easy to **share your rank** and explore **risers, fallers, and Breakout 100**, redesigned **About** and expanded **Atlanta** scene pages, added in-product **Feedback**, hardened signup with **Turnstile**, and shipped **Share** and Artist Index polish across home and watch.

---

## Why this release matters

| Goal | What we shipped |
| ---- | --------------- |
| **Own the ranking conversation** | Top Artist at `/top-artists` — YouTube-based Top 500, methodology, city lists, movement lists, and image share cards |
| **Grow discovery & local SEO** | Redesigned About; Atlanta hubs (genres, eras, best-of, venues, studios); richer sitemaps |
| **Listen to the community** | Feedback with screenshot capture for fans; admin review queue for the team |
| **Trust & safety** | Cloudflare Turnstile on auth flows |
| **Clearer everyday actions** | Share as a top-level button on home cards and watch; Artist Index claim/verified polish |

---

## For listeners & fans

### Explore Top Artist rankings

- New **Top Artist** experience at [hiffi.com/top-artists](https://www.hiffi.com/top-artists) — browse the global Top 500 ranked from **YouTube public data**, with featured #1, searchable list, tiers, and social handles.
- **How it works** at [hiffi.com/top-artists/how-it-works](https://www.hiffi.com/top-artists/how-it-works) — clear methodology for how artists are ranked (YouTube-only for this release).
- **Biggest risers / fallers**, **new entries**, **Breakout 100**, and related categories when the ranking APIs provide movement data.
- **City Top 50** — Atlanta live; other city hubs ready as more artists fill in.
- **Share cards** — auto-generated image cards for ranks (e.g. position on the list, riser moments), not text-only links. Share routes: `/top-artists/share/[username]`.
- Related Next.js pages also available under `/hiffi-500` (methodology, city, risers/fallers, Breakout 100, share).

### Send feedback from anywhere

- **Send feedback** from the profile / navbar menu — YouTube-style flow with a screenshot of the current page so the team sees what you saw.

### Learn about Hiffi and the Atlanta scene

- Redesigned **About** at [hiffi.com/about](https://www.hiffi.com/about) — hero, benefits, creators and fans, reviews, and clearer CTAs.
- New **Atlanta** editorial hubs at [hiffi.com/atlanta](https://www.hiffi.com/atlanta) — genres, eras, best-of lists, venues, and studios (list + detail pages).

### Better experience on home and watch

- **Share** is a main icon on home video cards and the watch page — no longer buried under the ⋯ menu.
- Report and Delete stay under more-actions where they belong.
- Additional **mute preference** fix so audio choice is preserved more reliably while watching.

### Small fixes you might notice

- Artist Index claim CTA and hero copy are clearer; verified badge sits in a better place on artist detail.
- Feedback dialog works cleanly across phone and desktop screen sizes.

---

## For artists & creators

### Get found on the Top Artist list

- If you’re in the ranking, fans can find you on `/top-artists`, open your ranking detail, and follow social handles where available.
- **Claim your profile** from the ranking experience when you see your name (same claim path as Artist Index).
- **Share your rank** with image cards built for social — useful for “#86 on Hiffi Top Artist” style posts.

### Look intentional on Artist Index

- Claim CTA / hero text polish and verified badge repositioning on artist detail pages.

### Safer signup

- Auth flows use **Cloudflare Turnstile** to reduce bot signups without changing the one-step creator join story from earlier releases.

---

## For marketing, partnerships & growth

### SEO & shareability

- Top Artist and Hiffi 500 pages are built for **search and share** (sitemap entries, OG images for share cards, methodology for transparency).
- Expanded **Atlanta** content for local discovery alongside existing Artist Index city/genre pages.
- Redesigned **About** strengthens brand story for press, partners, and organic search.
- Sitemap routing upgrades (`sitemap.xml`, split sitemaps, `video-sitemap.xml`) for cleaner crawl coverage.

### Brand & trust

- Ranking discloses **YouTube public data only** for this cut — honest scope vs full multi-platform HPS (still later).
- About page replaces the older lighter layout with a full marketing experience.

---

## For operations & admin team

### Review ranking quality

- New **Score anomalies** panel in admin — spot ranking outliers for QA before they confuse the public list.

### Manage user feedback in one place

- New **Feedback** section in the admin sidebar:
  - List submissions with filters and pagination
  - Open a detail view with screenshot and metadata
  - Follow up on what users reported from web (and mobile, where shipped)

### Auth ops note

- Turnstile env vars must be set on each environment before cutover (documented in `.env.example`).

---

## For product & leadership (scope, without the jargon)

**In this MVP**

| Theme | What shipped |
| ----- | ------------ |
| **Ranking** | Global Top 500 from authentic YouTube metrics; methodology page; city Top 50; risers/fallers/Breakout when data is ready |
| **Share** | Image share cards + top-level Share on home/watch |
| **Feedback loop** | User submit → admin review |
| **Content** | About redesign; Atlanta hubs |

**Explicitly not in this release**

- Full multi-platform HPS (Instagram and other socials as primary ranking inputs)
- API/data licensing, index report, paid analytics

**Why it matters:** You can point partners and artists to a single URL — `/top-artists` — with a clear “how we rank” story, shareable cards, and a feedback channel, without waiting for the full SOW.

*Engineering detail:* see [CHANGELOG.md](../../CHANGELOG.md#230--2026-07-30).

---

## Bug fixes & polish (July 2026)

| Area | Fix |
| ---- | --- |
| **Share on home & watch** | Share is a top-level icon; no longer only inside the ⋯ popup. Report/Delete remain under more-actions. |
| **Watch mute** | Additional mute preference fix beyond the earlier Next/Previous mute ship (v2.2.3). |
| **Feedback UI** | Dialog is responsive across screen sizes. |
| **Artist Index** | Claim CTA / hero text; verified badge repositioned on artist detail. |
| **About** | Responsive and image polish on the redesigned page. |

---
