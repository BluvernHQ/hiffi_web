# Hiffi Web — Release notes (v2.2.0)

**Release date:** June 29, 2026  
**Version:** 2.2.0 (follows v2.1.0 from June 23)

---

## In one sentence

We launched a **public Artist Directory**, made **discovering music faster and richer** on the home feed, improved how **artists look on the platform**, and gave the team **clearer insight into how people actually watch videos**.

---

## Why this release matters


| Goal                                 | What we shipped                                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| **Grow discovery & SEO**             | A searchable artist directory, city/genre pages, and better visibility for videos on Google     |
| **Improve the listening experience** | Preview videos on hover before you click; smoother save-to-playlist on watch                    |
| **Support artists at scale**         | Claim-your-profile flow, admin tools to manage the artist list, polished default profile covers |
| **Honest marketing**                 | Site copy updated to match what the product actually offers today                               |
| **Smarter decisions**                | Activity tracking now shows *how* someone started a video (search, Up Next, autoplay, etc.)     |


---

## For listeners & fans

### Browse artists like a real directory

- New **Artist Index** at [hiffi.com/artist-index](https://www.hiffi.com/artist-index) — search artists, filter by city or genre, open full profile pages.
- **Atlanta scene page** — editorial content for one of our anchor cities (more cities can follow the same pattern).
- Old links to `/artistindex` still work; they redirect to the new address.

### Discover videos faster on the home feed

- **Hover to preview** — pass your mouse over a video card to see a short clip before opening it (starts muted; you can turn sound on and we remember your choice).

### Better experience while watching

- **Save to playlist** is now a main button on the watch page (easier to find).
- **Share** moved under the ⋯ menu to reduce clutter.
- Saving to a playlist opens a compact panel attached to the button — easier to scroll through your playlists without the window jumping around.

### Small fixes you might notice

- Skipping login/signup no longer traps you in a login loop when you were trying to reach support or reports.
- Videos should play more reliably across different quality options.

---

## For artists & creators

### Get found in the Artist Index

- If you’re listed, fans can find you through search and genre/city browsing.
- **Claim your profile** — artists can submit a claim if they see their name in the directory.
- Fans and community members can **suggest corrections** to a profile (bios, links, etc.) when edit mode is enabled.

### Look professional even before you customize

- Every creator gets a **unique default profile banner** (HiFFi-branded colors based on their name) until they upload their own cover image.

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

### Brand & trust

- Advertising page copy fixed (proper “Brand safety & transparency” wording).
- Removed outdated corporate references on “What is Hiffi.”
- Profile and artist pages hide empty stats (e.g. “0 videos”) so listings look intentional, not broken.

---

## For operations & admin team

### Manage the artist list in one place

- New **Artist Inventory** section in the admin dashboard:
  - Upload artist lists from **CSV or Excel**
  - Review and search the directory
  - Export data
  - Review **profile claim requests** from artists

### Quality-of-life for admins

- **View site** button in the admin sidebar — jump to the live public site in one click.
- Upload flow shows **progress and review steps** before data goes live; warnings if you leave during an import.

---

## For product & leadership (data, without the jargon)

We improved **Activity Logs** so sessions are easier to read:

- See whether playback **started automatically** or after a **click**
- Tell apart videos opened from **search**, **home**, **Up Next**, **playlists**, or **recommendations**
- Clearer labels in the log (e.g. “Opened Up Next video” instead of generic “Watch page action”)

**Why it matters:** You can answer questions like “Do people finish mood mixes?”, “Does search lead to watches?”, and “Do users click Up Next or let autoplay run?” — without guessing from raw click dumps.

*Engineering detail:* see [CHANGELOG.md](../../CHANGELOG.md#220--2026-06-29).

---

