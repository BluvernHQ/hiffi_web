# Hiffi Web — Release notes (v2.2.0)

**Release date:** July 3, 2026  
**Version:** 2.2.0 (follows v2.1.0 from June 23)

---

## In one sentence

We launched a **public Artist Directory**, made **discovering music faster and richer** on the home feed, improved how **artists and profiles look on the platform**, gave the team **clearer insight into how people actually watch videos**, and shipped **smoother signup/creator flows** plus **polish fixes** across the Artist Index and Hip-Hop hub.

---

## Why this release matters

| Goal | What we shipped |
| ---- | --------------- |
| **Grow discovery & SEO** | Searchable artist directory, city/genre pages, richer video indexing, and SEO docs for marketing |
| **Improve the listening experience** | Hover previews on the home feed; save-to-playlist on watch; ⋮ menu always visible on home and profile feeds |
| **Support artists at scale** | Claim-your-profile flow, admin artist inventory, polished default profile covers |
| **Lower friction to join** | One-step signup; email OTP to become a creator; referral on register |
| **Honest, trustworthy UI** | Hide low view counts and sub-10k follower/following stats so profiles look intentional |
| **Smarter decisions** | Activity tracking plus journey funnel events for search, moods, playlists, and engagement |

---

## For listeners & fans

### Browse artists like a real directory

- New **Artist Index** at [hiffi.com/artist-index](https://www.hiffi.com/artist-index) — search artists, filter by city or genre, open full profile pages.
- **Filter pills work reliably** — tap Rap, Trap, Atlanta, etc. to load filtered results immediately; tap again to clear; single-genre filters open dedicated pages like `/artist-index/genre/rap`.
- **Atlanta scene page** — editorial content for one of our anchor cities (more cities can follow the same pattern).
- Old links to `/artistindex` still work; they redirect to the new address.

### Discover videos faster on the home feed

- **Hover to preview** — pass your mouse over a video card to see a short clip before opening it (starts muted; you can turn sound on and we remember your choice).
- **⋮ (more) menu always visible** on home and profile video cards — Share and other actions no longer require hovering the card first.

### Better experience while watching

- **Save to playlist** is now a main button on the watch page (easier to find).
- **Share** moved under the ⋯ menu to reduce clutter.
- Saving to a playlist opens a compact panel attached to the button — easier to scroll through your playlists without the window jumping around.
- **View counts** stay hidden until a video reaches 10,000 views (same threshold as before).

### Small fixes you might notice

- Skipping login/signup no longer traps you in a login loop when you were trying to reach support or reports.
- Videos should play more reliably across different quality options.
- On the **Hip-Hop hub** (`/hip-hop`), using **Back** after visiting Become a Creator, Download App, Creator Studio, or a subgenre search returns you to the same scroll position — not the top of the page.

---

## For artists & creators

### Get found in the Artist Index

- If you’re listed, fans can find you through search and genre/city browsing.
- **Claim your profile** — artists can submit a claim if they see their name in the directory (improved search and claim landing UX).
- Fans and community members can **suggest corrections** to a profile (bios, links, etc.) when edit mode is enabled.

### Look professional even before you customize

- Every creator gets a **unique default profile banner** (HiFFi-branded colors based on their name) until they upload their own cover image.
- **Follower, following, and view counts** below 10,000 are hidden on public profiles and watch pages — so early-stage creators aren’t shown as “0 followers.”

### Easier signup and creator upgrade

- **Sign up in one step** — no separate email OTP screen after register; you’re signed in as soon as you create your account.
- **Become a Creator** uses **email OTP verification** on the apply page (with a 60-second resend cooldown).
- **Referrals** work via `/signup?ref=` or a referrer profile link — referral is sent when you register.

### Easier studio setup

- **YouTube migration** is simpler — no extra Google channel verification step.
- **Creator Playbook** updated with practical tips (closer to how creators already think about YouTube).

### Messaging that matches reality

- Site copy now says creators can **join and upload without waiting on an application** — aligned with how the product works today.
- We removed promises about monetization and “no algorithm” that weren’t accurate for the current product.

---

## For marketing, partnerships & growth

### SEO & shareability

- Artist pages and the directory are built for **search engines** (structured data, sitemap, discovery docs for AI/search tools).
- **Video watch pages** show richer previews when shared or indexed — better titles, images, and signals for Google.
- Expanded **hip-hop and artist-index** content for organic and AI-assisted discovery.
- **On-page SEO team handout** (`docs/on-page-seo-team-handout.md`) — non-technical reference for titles, descriptions, and schemas on every major page.
- **Atlanta-first** positioning on Artist Index hub and city pages; live artist counts in meta descriptions.

### Brand & trust

- Advertising page copy fixed (proper “Brand safety & transparency” wording).
- Removed outdated corporate references on “What is Hiffi.”
- Profile and artist pages hide empty or very low stats so listings look intentional, not broken.

---

## For operations & admin team

### Manage the artist list in one place

- New **Artist Inventory** section in the admin dashboard:
  - Upload artist lists from **CSV or Excel**
  - Review and search the directory
  - Export data
  - Review **profile claim requests** from artists (improved claims table UX)

### Quality-of-life for admins

- **View site** button in the admin sidebar — jump to the live public site in one click.
- Upload flow shows **progress and review steps** before data goes live; warnings if you leave during an import.

---

## For product & leadership (data, without the jargon)

We improved **Activity Logs** so sessions are easier to read:

- See whether playback **started automatically** or after a **click**
- Tell apart videos opened from **search**, **home**, **Up Next**, **playlists**, or **recommendations**
- Clearer labels in the log (e.g. “Opened Up Next video” instead of generic “Watch page action”)

**New journey funnel events** (live in v2.2.0) help answer product questions end-to-end:

| Journey | What we can now see |
| ------- | ------------------- |
| **Search** | Overlay open → query submit → results click → watch |
| **Mood** | Mood tab pick → feed load → video click |
| **Playlist** | Open playlist → play video → Up Next / queue behavior |
| **Feed preview** | Hover preview start/end on home cards |
| **Engagement** | Like, comment, and follow with attribution back to the journey that led there |

**Why it matters:** You can answer questions like “Do people finish mood mixes?”, “Does search lead to watches?”, and “Do users click Up Next or let autoplay run?” — without guessing from raw click dumps.

*Engineering detail:* see [CHANGELOG.md](../../CHANGELOG.md#220--2026-06-29) and [hiffi-activity-analytics-tags.md](../hiffi-activity-analytics-tags.md).

---

## Bug fixes & polish (July 2026)

Shipped after the initial v2.2.0 cut:

| Area | Fix |
| ---- | --- |
| **Artist Index filters** | Genre/city pills toggle on and off correctly; filtered grid updates without a page refresh; single filters navigate to SEO pages (e.g. `/artist-index/genre/rap`). |
| **Hip-Hop hub scroll** | Browser **Back** restores your position on `/hip-hop` after leaving via Become a Creator, Download App, Creator Studio, or subgenre links. |
| **Signup & creator** | Single-step registration; creator upgrade via email OTP; referral on register. |
| **Artist Index UX** | Claim search, claim landing, and directory grid layout improvements. |
| **Home & profile feeds** | ⋮ more menu always visible on video cards (not hover-only). |
| **Profile stats** | Follower and following counts hidden until 10,000 (matches view-count threshold). |
| **SEO / GEO** | Metadata and schema refinements across hip-hop, artist-index, and support pages; AI search visibility ops doc. |

---
