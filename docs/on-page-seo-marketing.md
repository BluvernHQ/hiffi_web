# Hiffi On-Page SEO — Marketing Reference

**Audience:** Marketing & growth team  
**Last updated:** June 2026  
**Site:** [https://www.hiffi.com](https://www.hiffi.com)

This document summarizes every on-page SEO optimization currently live in the Hiffi web app. Use it when planning campaigns, writing social copy, briefing agencies, or aligning off-site content with what search engines and AI assistants see on each URL.

---

## Executive summary

Hiffi is positioned consistently as a **hip-hop-first music and video streaming platform for independent rap artists and fans**. That positioning is reflected in:

- Page titles and meta descriptions on every indexable URL
- Visible headings (H1/H2) and body copy on landing pages
- FAQ sections written to answer real search queries (including statistics for AI citation)
- Structured data (JSON-LD) that helps Google show rich results and helps AI tools cite Hiffi accurately
- Branded and per-video social preview images when links are shared
- Internal links between hub pages, mood pages, the **Artist Index** (800+ Atlanta profiles), and core product flows

**Core message used everywhere:**  
*"Hiffi is a hip-hop-first platform for independent rap artists and fans — discover music videos, follow creators, and stream in high quality."*

---

## Brand & keyword positioning

### Primary keywords (Tier 1)

| Keyword / phrase | Primary target URL |
|---|---|
| hip hop streaming platform | `/hip-hop` |
| rap music video platform | `/hip-hop`, `/` |
| independent hip hop artists | `/`, `/creator/apply`, `/artist-index` |
| hip hop music videos online | `/hip-hop`, `/watch/[videoId]` |
| underground rap streaming | `/hip-hop` |
| Atlanta rap artists | `/artist-index/city/atlanta` |
| hip-hop artist directory | `/artist-index` |

### Subgenre keywords (Tier 2)

| Keyword / phrase | Target URL |
|---|---|
| drill music streaming | `/hip-hop/mood/on-sight` |
| conscious rap playlist | `/hip-hop/mood/soul-search` |
| lo-fi hip hop / boom bap | `/hip-hop/mood/low-rider` |
| workout / hype rap | `/hip-hop/mood/turn-up` |
| sad rap / late night | `/hip-hop/mood/blue-hours` |
| ATL rap directory | `/artist-index/city/atlanta` |
| underground Atlanta rap | `/artist-index/city/atlanta` |

### Long-tail & AI-style queries (Tier 3)

| Query people ask | Best Hiffi page to link |
|---|---|
| "Where can I watch independent rap music videos?" | `/hip-hop` |
| "Best platform for underground rappers" | `/hip-hop`, `/creator/apply` |
| "Hip hop streaming app for iPhone / Android" | `/app` |
| "YouTube alternative for hip hop artists" | `/hip-hop` |
| "How do I claim my artist profile?" | `/artist-index` |
| "Atlanta rap artists directory" | `/artist-index/city/atlanta` |
| "How many Atlanta rappers are on Hiffi?" | `/artist-index` (FAQ answers 800+) |
| "{Artist name} Atlanta rapper" | `/artist-index/[slug]` |

---

## Site-wide on-page foundations

These apply to **every public page** unless noted.

| Element | What we did | Why it matters |
|---|---|---|
| **Site title template** | `%s \| Hiffi` — each page gets a unique title without repeating "Hiffi" twice | Clean SERP display; avoids duplicate title penalties |
| **Root title** | "Hiffi — Hip-Hop Music Videos & Streaming for Independent Artists" | Sets genre identity for the whole domain |
| **Meta description** | Hip-hop-first copy naming rap artists and fans | Appears in Google snippets; drives click-through |
| **Keywords** | 14 terms including drill, trap, conscious rap, boom bap, underground rap | Reinforces topical relevance (minor direct ranking factor; useful for internal alignment) |
| **Canonical URLs** | Every indexable page declares its canonical URL | Prevents duplicate-content issues from filters, pagination, or query params |
| **Open Graph + Twitter cards** | Title, description, and image on all public routes | Controls how links look on Instagram, X, Slack, iMessage, etc. |
| **Google image preview** | `max-image-preview: large` on indexed pages | Allows large thumbnails in Google search results |
| **Server-rendered content** | Homepage feed and directory pages render real HTML for crawlers | Search engines see actual videos/artists, not a loading spinner |
| **Private pages hidden** | `/history`, `/following`, `/liked`, `/playlists`, login, admin, artist claim/edit flows use `noindex` | Keeps account-only and utility pages out of search results |

### Entity consistency (important for AI search)

The same facts appear across titles, descriptions, FAQs, and structured data:

| Property | Value |
|---|---|
| **Name** | Hiffi |
| **Category** | Hip-hop-first music and video streaming platform |
| **Audience** | Independent rap/hip-hop artists and fans |
| **Canonical domain** | `https://www.hiffi.com` |
| **Social handles** | `@hiffi` on Instagram, X, TikTok (in Organization schema) |

---

## Page-by-page breakdown

### Homepage — `/`

| On-page element | Content |
|---|---|
| **Title** | Discover Hip-Hop & Rap — Music Videos from Independent Artists |
| **Description** | Names drill, trap, conscious rap, and boom bap; emphasizes creator-first, no algorithms |
| **H1 (visible)** | Discover feed with latest hip-hop and rap music videos |
| **Structured data** | `WebPage` + `ItemList` listing current feed videos |
| **OG image** | Branded 1200×630 card (HIFFI wordmark, "Hip-Hop First Streaming") |

**Marketing angle:** Default landing page for broad "discover hip-hop" campaigns. Feed content updates dynamically but is server-rendered for SEO.

---

### Hip-Hop Hub — `/hip-hop`

Our **primary genre landing page** — highest-priority marketing URL after the homepage.

| On-page element | Content |
|---|---|
| **Title** | Hip-Hop Music Videos & Streaming — Discover Independent Rap Artists |
| **H1** | Hip-Hop Music Videos & Streaming — Discover Independent Rap Artists |
| **Page sections** | Hero + CTAs, 7-mood discovery grid, "Why Hip-Hop Artists Choose Hiffi", 14-subgenre tag cloud, 8-question FAQ |
| **Structured data** | `WebPage`, `FAQPage` (8 Q&As), `ItemList` (mood hubs) |
| **Sitemap priority** | 0.95 (second only to homepage) |
| **Internal links** | Links to all mood pages, `/creator/apply`, `/app`, homepage |

**FAQ questions optimized for search & AI:**

1. What is the best platform for independent hip-hop artists?
2. Where can I watch independent rap music videos online?
3. Does Hiffi have drill and trap music?
4. Is there a hip-hop streaming app for iPhone and Android?
5. How is Hiffi different from YouTube or Spotify for rap artists?
6. What hip-hop subgenres are on Hiffi?
7. Can underground rappers upload music videos to Hiffi?
8. Is Hiffi free to use?

**Marketing angle:** Use this URL in all genre-level campaigns, press mentions, and "what is Hiffi" social posts. Anchor text: "hip-hop streaming", "independent rap platform", "watch rap music videos".

---

### Mood landing pages — `/hip-hop/mood/[slug]`

Seven subgenre/vibe pages, each with unique title, description, keywords, on-page copy, FAQ, and structured data.

| URL | Mood name | Vibe / subgenre |
|---|---|---|
| `/hip-hop/mood/on-sight` | On Sight | Drill, trap bangers, rage |
| `/hip-hop/mood/soul-search` | Soul Search | Conscious rap, introspective |
| `/hip-hop/mood/money-talk` | Money Talk | Celebration, flexing, wins |
| `/hip-hop/mood/blue-hours` | Blue Hours | Heartbreak, late night |
| `/hip-hop/mood/low-rider` | Low Rider | Lo-fi hip-hop, boom bap |
| `/hip-hop/mood/turn-up` | Turn Up | Workout, hype, turn up |
| `/hip-hop/mood/gods-plan` | God's Plan | Spiritual, legacy, purpose |

**Each mood page includes:**

- Unique meta title, description, and keyword set
- On-page H1, vibe description, and tagline
- Cross-links to other mood pages and back to `/hip-hop`
- CTAs to search, creator apply, and app download
- Structured data: `FAQPage`, `MusicPlaylist`, `BreadcrumbList`

**Marketing angle:** Match social hashtags and ad creative to the relevant mood page. Drill content → `/hip-hop/mood/on-sight`; lo-fi/chill → `/hip-hop/mood/low-rider`.

---

### Artist Index — `/artist-index`

A **city-by-city directory of emerging hip-hop and rap artists**. Currently **800+ profiles indexed**, starting with Atlanta. Built to rank for local-scene, artist-directory, and long-tail artist-name queries.

#### Hub — `/artist-index`

| On-page element | Content |
|---|---|
| **Title** | Discover Emerging Hip-Hop & Rap Artists by City |
| **Description** | Dynamic: *"Browse 800+ hip-hop and rap artists on the Hiffi Artist Index — starting with Atlanta…"* (count updates from inventory) |
| **H1** | Discover emerging hip-hop & rap artists by city |
| **Eyebrow** | "Hiffi Artist Index" |
| **Filter bar** | City/genre pills link to SEO landing URLs (`/city/atlanta`, `/genre/rap`) — crawlable for Google |
| **FAQ section** | 7 questions (see below) |
| **Structured data** | `WebPage`, `FAQPage`, `ItemList` (page artists + **total catalog count**), `BreadcrumbList` |
| **Sitemap priority** | 0.92 |

**Hub FAQ (visible + JSON-LD):**

1. What is the Hiffi Artist Index?
2. How many artists are listed in the Hiffi Artist Index? *(answers: 800+, Atlanta first)*
3. How do I find Atlanta rap artists on Hiffi? *(links to `/artist-index/city/atlanta`)*
4. How do I claim my artist profile?
5. Is the Artist Index only for Atlanta artists?
6. Can fans suggest corrections to a profile?
7. Does claiming a profile upload my music automatically?

**Duplicate URL handling:**

- Hub search/filter/pagination URLs (`?q=`, `?f=`, `?page=`) are **`noindex`** — only the clean hub is indexed
- Single city/genre filter URLs redirect to canonical landing pages (e.g. `?f=city:atlanta` → `/artist-index/city/atlanta`)

#### City landing pages — `/artist-index/city/[citySlug]`

Primary Atlanta URL: **`/artist-index/city/atlanta`**

| On-page element | Content |
|---|---|
| **Title** | Atlanta hip-hop & rap artists |
| **Description** | City scene copy + dynamic profile count (e.g. *"800+ indexed Atlanta rap and hip-hop profiles"*) |
| **Keywords (Atlanta)** | Atlanta rap artists, Atlanta hip-hop artists, Atlanta rapper directory, Atlanta hip-hop scene, ATL rap artists, underground Atlanta rap |
| **H1** | Atlanta hip-hop & rap artists |
| **Structured data** | `CollectionPage`, `ItemList`, `BreadcrumbList`; FAQ on Atlanta page only |
| **Sitemap priority** | 0.90 |
| **Pagination** | Self-canonical per page (`?page=2`, etc.); crawlable pagination nav |

#### Genre landing pages — `/artist-index/genre/[genreSlug]`

Auto-generated for genres with indexed artists (e.g. Rap, Hip-Hop).

| On-page element | Content |
|---|---|
| **Title** | {Genre} artists |
| **Description** | Genre + city discovery; claim CTA |
| **Structured data** | `CollectionPage`, `ItemList`, `BreadcrumbList` |
| **Sitemap priority** | 0.88 |

#### Individual artist profiles — `/artist-index/[slug]` (800+ URLs)

| On-page element | Content |
|---|---|
| **Title** | {Artist Name} — {City} {Genre} Artist |
| **Description** | Bio (when set) or fallback with city, genre, claim status |
| **Keywords** | Artist name, genres, city, "Hiffi artist", "claim artist profile", "{city} rap artist" |
| **H1** | Artist name |
| **Social links** | Visible "Listen and follow" section (Spotify, YouTube, Instagram) |
| **Related artists** | "Similar artists in {City}" — matched by city + genre (not alphabetical) |
| **Structured data** | `ProfilePage` + `MusicGroup` with `genre`, `foundingLocation`, **`sameAs`** (official social URLs) |
| **Breadcrumbs** | Artist Index → City → Genre → Artist (UI + `BreadcrumbList` JSON-LD) |
| **OG image** | **Artist photo** when available; Hiffi logo fallback |
| **Image alt text** | Descriptive alts on profile photos and directory cards |
| **Sitemap priority** | 0.75 (monthly refresh from `added_date`) |

**Social links & SEO:** Outbound Spotify/IG/YouTube links don't directly rank Hiffi, but `sameAs` in schema helps Google and AI tools confirm the artist is a real entity — important for directory trust and disambiguation.

**Pages excluded from search:**

| URL | Reason |
|---|---|
| `/artist-index/[slug]/claim` | Transactional claim flow |
| `/artist-index/[slug]/edit` | Redirects to `?edit=1` |
| `/artist-index/[slug]?edit=1` | Edit suggestion mode (`noindex`) |
| `/artist-index?q=…` / `?f=…` / `?page=…` | Utility/filter views (`noindex`) |

**Marketing angle:**

- Atlanta scene outreach → **`/artist-index/city/atlanta`** (not generic hub)
- Artist claim emails → individual **`/artist-index/[slug]`** (dynamic OG when photo exists)
- Anchor text: "Atlanta rap artist directory", "claim your Hiffi profile", "Hiffi Artist Index"
- Each claimed artist sharing their profile = 1 indexed URL + potential branded search

---

### Watch pages — `/watch/[videoId]`

| On-page element | Content |
|---|---|
| **Title** | {Artist Name} — {Track Title} |
| **Description** | Video description when set; hip-hop fallback otherwise |
| **Structured data** | `VideoObject` + `MusicVideoObject` + `BreadcrumbList` |
| **Default genre** | "Hip hop" when video has no genre tags |
| **OG image** | Dynamic per-video card — thumbnail + artist/title overlay |
| **OG type** | `video.other` |

**Marketing angle:** Share `/watch/[videoId]` URLs directly — previews show artist + track, not just the logo.

---

### Creator profiles — `/profile/[username]`

| On-page element | Content |
|---|---|
| **Title** | @{handle} — {Display Name} |
| **Description** | Bio or hip-hop fallback mentioning independent rap platform |
| **Structured data** | `Person` + `sameAs` social links + `BreadcrumbList` |
| **OG image** | Profile picture when available |

---

### Search — `/search`

| On-page element | Content |
|---|---|
| **Title** | Search Hip-Hop Artists & Rap Music Videos |

---

### Creator apply — `/creator/apply`

| On-page element | Content |
|---|---|
| **Title** | Upload Rap & Hip-Hop Music Videos — Become a Creator |

**Marketing angle:** Primary CTA for artist acquisition campaigns.

---

### Collaborate — `/collaborate`

| On-page element | Content |
|---|---|
| **Title** | Hip-Hop Brand Collaborations & Artist Partnerships |

---

### App download — `/app`

| On-page element | Content |
|---|---|
| **Title** | Download Hiffi App — Hip-Hop Music Videos & Creator Streaming |
| **Structured data** | `SoftwareApplication` + `FAQPage` |

---

### FAQ — `/faq`

| On-page element | Content |
|---|---|
| **Description** | Hip-hop-first; names drill, trap, conscious rap |
| **Content highlights** | IFPI stat: *"Hip-hop accounts for roughly 25% of global music streams"* |
| **FAQ items** | Hip-hop-specific questions + links to `/hip-hop`, `/creator/apply`, `/app` |
| **Structured data** | `WebPage` + `FAQPage` |

**Marketing angle:** Cite the IFPI statistic in press and social. FAQ format increases AI citation rates.

---

### Other marketing & content pages

Shared SEO pattern: title, description, canonical, OG/Twitter, `WebPage` + `BreadcrumbList` JSON-LD.

| Page | SEO role |
|---|---|
| `/about` | Brand story, mission |
| `/what-is-hiffi` | Entity disambiguation for AI/search |
| `/how-it-works` | Onboarding explainer |
| `/artists` | Creator program marketing |
| `/creator-playbook` | Creator education |
| `/press` | Press kit |
| `/advertising` | Ad sales |
| `/creators-for-change` | Program landing |
| `/support` | Help & contact |
| Legal pages | Trust signals; lower sitemap priority |

All included in `sitemap.xml`.

---

## Social sharing & preview images

| Surface | What shows when a link is shared |
|---|---|
| **Most pages** | Branded 1200×630 — HIFFI wordmark, "Hip-Hop First Streaming" |
| **Watch pages** | Per-video card — thumbnail, artist name, track title |
| **Creator profiles** | Profile picture when available |
| **Artist Index hub** | Hiffi logo ("Hiffi Artist Index") |
| **Artist Index profiles** | **Artist photo** when available |

**How to test:** Paste URL into Slack, iMessage, or [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/).

---

## Structured data (rich results eligibility)

| Page type | Schema types | Rich result potential |
|---|---|---|
| All pages (root) | `WebSite` (sitelinks searchbox) + `Organization` | Sitelinks search box |
| Homepage | `WebPage` + `ItemList` | — |
| `/hip-hop` | `WebPage` + `FAQPage` + `ItemList` | FAQ rich results |
| Mood pages | `WebPage` + `FAQPage` + `MusicPlaylist` + `BreadcrumbList` | FAQ rich results |
| Watch pages | `VideoObject` + `MusicVideoObject` + `BreadcrumbList` | Video rich results |
| `/profile/[username]` | `Person` + `BreadcrumbList` | — |
| Artist Index hub | `WebPage` + `FAQPage` + `ItemList` + `BreadcrumbList` | FAQ rich results |
| Artist Index city/genre | `CollectionPage` + `ItemList` + `BreadcrumbList` | — |
| Artist Index profiles | `ProfilePage` + `MusicGroup` (`sameAs`, `genre`, `foundingLocation`) | Entity disambiguation |
| `/app` | `SoftwareApplication` + `FAQPage` | App rich results |
| `/faq` | `WebPage` + `FAQPage` | FAQ rich results |

**Organization `knowsAbout`:** Hip hop music, Rap music, Drill music, Trap music, Conscious rap, Boom bap, Lo-fi hip-hop, Independent music, Music video streaming, Lossless audio streaming.

---

## Internal linking map

```
Homepage (/)
├── /hip-hop (genre hub)
│   └── /hip-hop/mood/[slug] (7 mood pages)
├── /artist-index (directory hub — 800+ artists)
│   ├── /artist-index/city/atlanta  ← primary Atlanta URL
│   ├── /artist-index/genre/[genre]
│   └── /artist-index/[artist-slug] (800+ profiles)
├── /search
├── /creator/apply
├── /app
└── /faq

Site footer DISCOVER column → Hip-Hop, Artist Index, Search
Hub filter pills → crawlable links to /city/ and /genre/ pages
Artist profiles → breadcrumbs to city + genre + related artists in same scene
Mood pages → cross-link each other + back to /hip-hop
```

---

## AI search (GEO) on-page optimizations

| Tactic | Implementation |
|---|---|
| **Answer-first FAQs** | Direct answers in first sentence; stats where relevant |
| **Statistics** | IFPI 25% hip-hop streams (`/faq`); 800+ artists (`/artist-index` FAQ) |
| **Subgenre vocabulary** | Drill, trap, boom bap, conscious rap, lo-fi hip-hop throughout |
| **Short paragraphs** | 2–3 sentences; H1 → H2 → H3 hierarchy |
| **FAQPage schema** | Hub, moods, FAQ, app, Artist Index (and Atlanta city page) |
| **Entity `sameAs`** | Organization (Hiffi socials) + artist profiles (Spotify/IG/YT) |
| **llms.txt** | `/llms.txt` — includes Artist Index, Atlanta directory, profile URL pattern |
| **Markdown mirrors** | Key pages as `.md` (e.g. `/hip-hop.md`, `/faq.md`) |

**llms.txt Artist Index entries:**

- `https://www.hiffi.com/artist-index` — 800+ artist directory
- `https://www.hiffi.com/artist-index/city/atlanta` — Atlanta scene
- `https://www.hiffi.com/artist-index/[slug]` — individual claimable profiles

---

## Sitemap coverage

`https://www.hiffi.com/sitemap.xml` — refreshes every hour.

| URL group | Priority | Notes |
|---|---|---|
| Homepage | 1.0 | Highest |
| `/hip-hop` | 0.95 | Genre hub |
| `/artist-index` | 0.92 | Directory hub (page 1 only) |
| `/app` | 0.90 | App download |
| City pages | 0.90 | e.g. `/artist-index/city/atlanta` |
| Genre pages | 0.88 | Per-genre listings |
| Mood pages | 0.85 | All 7 vibes |
| Watch pages | 0.80 | Chunked for large catalogs |
| Artist Index profiles | 0.75 | All 800+ inventory profiles |
| Creator profiles | 0.70 | `/profile/[username]` |
| Marketing pages | 0.65–0.88 | About, artists, playbook, etc. |

*Paginated city/genre pages (`?page=2+`) are discovered via crawlable pagination links, not listed individually in the sitemap.*

---

## Realistic expectations (Artist Index)

On-page SEO is strong; **rankings still need time and off-site signals**.

| Milestone | Timeline | Notes |
|---|---|---|
| Hub + Atlanta city page indexed | 1–4 weeks | Submit sitemap; confirm `NEXT_PUBLIC_ENV=prod` |
| Profile pages appearing in Google | 4–12 weeks | 800 URLs crawl gradually |
| Long-tail artist name impressions | 2–6 months | `{artist name} Atlanta rapper` |
| Scene-level terms ("Atlanta rap artists") | 6–12 months | Competitive; needs backlinks + PR |
| AI citation for directory queries | 3–12 months | FAQ + `llms.txt` + authority building |

**Highest-confidence wins:** artist-name long-tail, claim campaigns, Atlanta scene links to `/artist-index/city/atlanta`.

---

## What marketing should do next

### Immediate (post-deploy)

- [ ] Submit `https://www.hiffi.com/sitemap.xml` in **Google Search Console** and **Bing Webmaster Tools**
- [ ] Request indexing for `/artist-index` and **`/artist-index/city/atlanta`**
- [ ] Validate in [Rich Results Test](https://search.google.com/test/rich-results): hub + sample profile
- [ ] Confirm **`NEXT_PUBLIC_ENV=prod`** on hosting (otherwise robots blocks crawlers)

### Ongoing campaigns

- [ ] Atlanta outreach → **`/artist-index/city/atlanta`** (not generic hub)
- [ ] Artist claim emails → individual **`/artist-index/[slug]`** URLs
- [ ] Subgenre campaigns → matching `/hip-hop/mood/[slug]` page
- [ ] Press / "what is Hiffi" → `/hip-hop` or `/what-is-hiffi`
- [ ] Creators share `/watch/[videoId]` for dynamic OG cards
- [ ] App store copy: mirror hip-hop keywords (drill, trap, independent artists, music videos)

### Measurement (monthly)

- [ ] Search Console impressions: `Atlanta rap artists`, `artist directory`, `hip hop`, `drill music`
- [ ] `site:hiffi.com/artist-index` — indexed profile count climbing
- [ ] AI check: *"Atlanta hip-hop artist directory"* in Perplexity / ChatGPT
- [ ] PageSpeed Insights on `/hip-hop` and `/artist-index` — LCP < 2.5s, INP < 200ms, CLS < 0.1

---

## Quick reference: share the right URL

| Campaign goal | URL to use |
|---|---|
| General brand awareness | `hiffi.com` or `hiffi.com/hip-hop` |
| Drill / trap content | `hiffi.com/hip-hop/mood/on-sight` |
| Conscious / introspective rap | `hiffi.com/hip-hop/mood/soul-search` |
| Lo-fi / chill / boom bap | `hiffi.com/hip-hop/mood/low-rider` |
| Artist signup | `hiffi.com/creator/apply` |
| App install | `hiffi.com/app` |
| **Atlanta scene / artist claims** | **`hiffi.com/artist-index/city/atlanta`** |
| Artist Index overview | `hiffi.com/artist-index` |
| Share a specific artist listing | `hiffi.com/artist-index/[slug]` |
| Share a specific track | `hiffi.com/watch/[videoId]` |
| Press / "what is Hiffi" | `hiffi.com/what-is-hiffi` or `hiffi.com/faq` |

---

*For technical implementation details, see `SEO_GEO_IMPLEMENTATION.md` and `SEO_GEO_CHECKLIST.md` in the repo root.*
