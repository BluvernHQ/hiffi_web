# Hiffi On-Page SEO — Marketing Reference

**Audience:** Marketing & growth team  
**Last updated:** June 30, 2026  
**Site:** [https://www.hiffi.com](https://www.hiffi.com)

This document summarizes every on-page SEO optimization currently live in the Hiffi web app. Use it when planning campaigns, writing social copy, briefing agencies, or aligning off-site content with what search engines and AI assistants see on each URL.

For engineering details, see `SEO_GEO_IMPLEMENTATION.md` and `SEO_GEO_CHECKLIST.md` in the repo root.

---

## Executive summary

Hiffi is positioned consistently as a **hip-hop-first music and video streaming platform for independent rap artists and fans**. That positioning is reflected in:

- Page titles and meta descriptions on every major indexable URL
- Visible headings (H1/H2) and body copy on landing pages
- FAQ sections written to answer real search queries (including statistics for AI citation)
- Structured data (JSON-LD) for rich results and accurate AI citations
- Per-video social preview images on watch URLs; artist photos on Artist Index profiles
- Internal links between hub pages, mood pages, the **Artist Index** (inventory-backed, Atlanta-first), and core product flows

**Core message used everywhere:**  
*"Hiffi is a hip-hop-first platform for independent rap artists and fans — discover music videos, follow creators, and stream in high quality."*

**Artist Index positioning (2026):** The directory hub is **Atlanta-first** — titles, H1, and descriptions lead with Atlanta hip-hop and rap artists. Profile counts in meta descriptions are **dynamic** from live inventory (not a fixed number in code).

---

## How on-page SEO is implemented (technical overview)

| Layer | Where it lives | What it does |
|---|---|---|
| **Global metadata** | `app/layout.tsx` | Title template (`%s \| Hiffi`), default description, OG/Twitter defaults, sitewide `WebSite` + `Organization` JSON-LD |
| **Static routes** | `app/**/layout.tsx` + `lib/seo/route-metadata.ts` | Title, description, canonical, robots, OG/Twitter per path |
| **Dynamic routes** | `generateMetadata()` on watch, profile, artist-index pages | Server-fetched titles/descriptions from `lib/seo/fetch-public.ts` and `lib/artist-directory-seo.ts` |
| **Visible HTML** | Page components + `ContentPageShell` | H1, intro copy, FAQs, breadcrumbs — not meta-only |
| **Crawler HTML** | `WatchCrawlerVideo`, `WatchNoscriptSeo`, server-rendered home feed | Content visible without JavaScript |
| **JSON-LD** | `lib/seo/schema.ts`, `lib/seo/artist-index-schema.ts` + `<JsonLd />` | VideoObject, Person, CollectionPage, FAQPage, etc. |
| **Discovery** | `app/sitemap.ts`, `app/robots.txt/route.ts`, `public/llms.txt` | Crawl + AI discovery |
| **AI markdown** | `content/llms/*.md` → `/*.md` rewrite | Machine-readable mirrors (e.g. `/faq.md`, `/artist-index.md`) |
| **Canonical host** | `middleware.ts` | Apex → `www.hiffi.com` 308 redirect |

**Production requirement:** `NEXT_PUBLIC_ENV=prod` — non-prod environments serve `robots.txt` with `Disallow: /`.

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
| Atlanta hip-hop and rap artists | `/artist-index`, `/artist-index/city/atlanta` |
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
| Atlanta rap scene guide | `/artist-index/city/atlanta/scene` |

### Long-tail & AI-style queries (Tier 3)

| Query people ask | Best Hiffi page to link |
|---|---|
| "Where can I watch independent rap music videos?" | `/hip-hop` |
| "Best platform for underground rappers" | `/hip-hop`, `/creator/apply` |
| "Hip hop streaming app for iPhone / Android" | `/app` |
| "YouTube alternative for hip hop artists" | `/hip-hop` |
| "How do I claim my artist profile?" | `/artist-index/claim` |
| "Atlanta rap artists directory" | `/artist-index/city/atlanta` |
| "How many Atlanta rappers are on Hiffi?" | `/artist-index` (FAQ in JSON-LD; count is dynamic) |
| "{Artist name} Atlanta rapper" | `/artist-index/[slug]` |

---

## Site-wide on-page foundations

These apply to **every public page** unless noted.

| Element | What we did | Why it matters |
|---|---|---|
| **Site title template** | `%s \| Hiffi` — each page gets a unique title without repeating "Hiffi" twice | Clean SERP display |
| **Root title** | "Hiffi — Hip-Hop Music Videos & Streaming for Independent Artists" | Sets genre identity for the whole domain |
| **Meta description** | Hip-hop-first copy naming rap artists and fans | Google snippets; click-through |
| **Keywords** | 14+ terms including drill, trap, conscious rap, boom bap, underground rap | Topical alignment for teams and tools |
| **Canonical URLs** | Every indexable page declares its canonical URL | Prevents duplicate-content from filters and query params |
| **Open Graph + Twitter cards** | Title, description, and image on public routes | Social previews (Slack, X, iMessage, etc.) |
| **Google image preview** | `max-image-preview: large` on indexed pages | Large thumbnails in Google results |
| **Server-rendered content** | Homepage feed, directory pages, watch crawler HTML | Crawlers see real content, not spinners |
| **Private pages hidden** | `/history`, `/following`, `/liked`, `/playlists`, login, admin, studio — `noindex` | Account-only pages stay out of search |

### Entity consistency (important for AI search)

| Property | Value |
|---|---|
| **Name** | Hiffi |
| **Category** | Hip-hop-first music and video streaming platform |
| **Audience** | Independent rap/hip-hop artists and fans |
| **Canonical domain** | `https://www.hiffi.com` |
| **Social handles** | `@officialhiffi` on Instagram and X; YouTube `@officialhiffi` (Organization `sameAs` in [`lib/seo/social.ts`](../lib/seo/social.ts)) |
| **Support email** | care@hiffi.com |

---

## Page-by-page breakdown

### Homepage — `/`

| On-page element | Content |
|---|---|
| **Title** | Discover Hip-Hop & Rap — Music Videos from Independent Artists |
| **Description** | Names drill, trap, conscious rap, and boom bap; emphasizes creator-first, no algorithms |
| **H1 (visible)** | Discover feed with latest hip-hop and rap music videos |
| **Structured data** | `WebPage` + `ItemList` listing current feed videos |
| **OG image** | Root `opengraph-image.png` (file convention) + metadata fallback to logo |

**Marketing angle:** Default landing for broad "discover hip-hop" campaigns. Feed is server-rendered (`force-dynamic`) so crawlers see current videos.

---

### Hip-Hop Hub — `/hip-hop`

Our **primary genre landing page** — highest-priority marketing URL after the homepage.

| On-page element | Content |
|---|---|
| **Title** | Hip-Hop Music Videos & Streaming — Discover Independent Rap Artists |
| **H1** | Hip-Hop Music Videos & Streaming — Discover Independent Rap Artists |
| **Page sections** | Hero + CTAs, 7-mood discovery grid, "Why Hip-Hop Artists Choose Hiffi", subgenre tag cloud, 8-question FAQ |
| **Structured data** | `WebPage`, `FAQPage` (8 Q&As), `ItemList` (mood hubs) |
| **Sitemap priority** | 0.95 |
| **Internal links** | All mood pages, `/creator/apply`, `/app`, homepage |

**FAQ questions optimized for search & AI:**

1. What is the best platform for independent hip-hop artists?
2. Where can I watch independent rap music videos online?
3. Does Hiffi have drill and trap music?
4. Is there a hip-hop streaming app for iPhone and Android?
5. How is Hiffi different from YouTube or Spotify for rap artists?
6. What hip-hop subgenres are on Hiffi?
7. Can underground rappers upload music videos to Hiffi?
8. Is Hiffi free to use?

**Marketing angle:** Use in genre-level campaigns, press, and "what is Hiffi" posts. Anchor text: "hip-hop streaming", "independent rap platform", "watch rap music videos".

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
- AI markdown mirror: `/hip-hop/mood/[slug].md` (generated)

**Marketing angle:** Match social hashtags and ad creative to the relevant mood page.

---

### Artist Index — `/artist-index`

A **claimable directory of emerging hip-hop and rap artists**, **Atlanta-first**, powered by live inventory. Built to rank for local-scene, artist-directory, and long-tail artist-name queries.

#### Hub — `/artist-index`

| On-page element | Content |
|---|---|
| **Title** | Atlanta Hip-Hop & Rap Artists |
| **Description** | Dynamic: *"Browse {N}+ Atlanta hip-hop and rap artists on the Hiffi Artist Index. Search by artist name or filter by genre."* (`N` = live inventory count) |
| **H1** | Discover **Atlanta's emerging** hip-hop & rap artists |
| **Subcopy** | Same Atlanta-first description as meta (visible under H1) |
| **Search** | Name search with autocomplete suggestions; **Enter** runs directory search (no page reload per keystroke) |
| **Filter bar** | City/genre pills link to SEO URLs (`/artist-index/city/atlanta`, `/artist-index/genre/rap`) |
| **Grid section** | H2: "Featured artists" (clean hub) with subtitle on verified/emerging ATL artists |
| **FAQ (visible)** | Not on hub UI — FAQ lives in JSON-LD and on Atlanta city page |
| **Structured data** | `WebPage`, `FAQPage` (7 Q&As in schema), `ItemList` (page artists + total catalog count) |
| **Sitemap priority** | 0.92 |
| **Claim CTA** | Header "Claim Now" → `/artist-index/claim` |

**Hub FAQ (JSON-LD + Atlanta city page UI):**

1. What is the Hiffi Artist Index?
2. How many artists are listed in the Hiffi Artist Index?
3. How do I find Atlanta rap artists on Hiffi?
4. How do I claim my artist profile?
5. Is the Artist Index only for Atlanta artists?
6. Can fans suggest corrections to a profile?
7. Does claiming a profile upload my music automatically?

**Duplicate URL handling:**

- Hub search/filter/pagination URLs (`?q=`, `?f=`, `?page=`) are **`noindex`**
- Single city/genre filter on hub → **redirect** to canonical landing (e.g. `?f=city:atlanta` → `/artist-index/city/atlanta`)

#### Claim landing — `/artist-index/claim`

| On-page element | Content |
|---|---|
| **Title** | Claim Your Artist Profile on Hiffi |
| **Description** | Find listing, verify identity, control bio/links/videos; 24–48h review |
| **Structured data** | `WebPage` + `FAQPage` + `HowTo` (claim steps) |
| **Sitemap priority** | 0.88 |
| **AI doc** | `/artist-index/claim.md` |

**Marketing angle:** Primary URL for claim campaigns and artist outreach emails.

#### City landing pages — `/artist-index/city/[citySlug]`

Primary Atlanta URL: **`/artist-index/city/atlanta`**

| On-page element | Content |
|---|---|
| **Title** | Atlanta hip-hop & rap artists |
| **Description** | Atlanta scene copy + dynamic profile count from inventory |
| **Keywords (Atlanta)** | Atlanta rap artists, Atlanta hip-hop artists, Atlanta rapper directory, Atlanta hip-hop scene, ATL rap artists, underground Atlanta rap |
| **H1** | Atlanta hip-hop & rap artists |
| **Visible FAQ** | 7 questions on Atlanta page only |
| **Structured data** | `CollectionPage`, `ItemList`, `FAQPage`, `BreadcrumbList` |
| **Sitemap priority** | 0.90 |
| **Pagination** | Self-canonical per page; crawlable pagination nav |
| **Spotlight (Atlanta)** | "New in Atlanta this month" row when data available |
| **Scene teaser** | Link block to `/artist-index/city/atlanta/scene` |

No redundant "Browse Atlanta artists" H2 — intro H1 + grid go directly to cards.

#### Atlanta scene guide — `/artist-index/city/atlanta/scene`

| On-page element | Content |
|---|---|
| **Title** | Atlanta Hip-Hop Scene — Trap, Drill & Underground Rap |
| **Description** | Editorial guide to ATL trap, drill, melodic rap, underground; dynamic profile count |
| **Structured data** | `WebPage` + `BreadcrumbList` |
| **Sitemap priority** | 0.86 |

**Marketing angle:** Use for scene/editorial outreach and backlinks about Atlanta hip-hop culture.

#### Genre landing pages — `/artist-index/genre/[genreSlug]`

Auto-generated for genres with indexed artists (e.g. Rap).

| On-page element | Content |
|---|---|
| **Title** | Atlanta {genre} artists (e.g. "Atlanta hip-hop & rap artists" as H1) |
| **Description** | Dynamic: *"Browse {N}+ Atlanta {genre} artists… Search by artist name."* |
| **Structured data** | `CollectionPage`, `ItemList`, `BreadcrumbList` |
| **Sitemap priority** | 0.88 |
| **AI markdown** | Not yet — HTML + schema only |

#### Individual artist profiles — `/artist-index/[slug]`

| On-page element | Content |
|---|---|
| **Title** | {Artist Name} — {City} {Genre} Artist |
| **Description** | Bio (when set) or fallback with city, genre, claim status |
| **Keywords** | Artist name, genres, city, "Hiffi artist", "claim artist profile", "{city} rap artist" |
| **H1** | Artist name |
| **City display** | Title case city + state (e.g. "Atlanta, GA") |
| **Social links** | "Listen and follow" — Spotify, YouTube, Instagram, etc. |
| **Related artists** | "Similar artists in {City}" — city + genre matching |
| **Structured data** | `ProfilePage` + `MusicGroup` with `genre`, `foundingLocation`, **`sameAs`** |
| **Breadcrumbs** | Artist Index → City → Genre → Artist (UI + `BreadcrumbList`) |
| **OG image** | Artist photo when available; Hiffi logo fallback |
| **Sitemap priority** | 0.75 (monthly refresh from `added_date`) |

**Pages excluded from search:**

| URL | Reason |
|---|---|
| `/artist-index/[slug]/claim` | Transactional claim flow (`noindex`) |
| `/artist-index/[slug]/edit` | Redirects to `?edit=1` (`noindex`) |
| `/artist-index/[slug]?edit=1` | Edit suggestion mode (`noindex`) |
| `/artist-index?q=…` / `?f=…` / `?page=…` | Utility/filter views (`noindex`) |

**Marketing angle:**

- Atlanta scene outreach → **`/artist-index/city/atlanta`**
- Claim campaigns → **`/artist-index/claim`** or individual **`/artist-index/[slug]`**
- Anchor text: "Atlanta rap artist directory", "claim your Hiffi profile", "Hiffi Artist Index"

---

### Watch pages — `/watch/[videoId]`

| On-page element | Content |
|---|---|
| **Title** | {Artist Name} — {Track Title} |
| **Description** | Video description when set; hip-hop fallback otherwise |
| **Structured data** | `VideoObject` + `MusicVideoObject` + `BreadcrumbList` |
| **Crawler HTML** | Hidden `<video>` + poster in initial HTML (`WatchCrawlerVideo`, noscript block) |
| **OG image** | **Dynamic 1200×630** — `opengraph-image.tsx` (thumbnail + title overlay) |
| **OG type** | `video.other` |
| **contentUrl** | Proxied progressive MP4 on `hiffi.com` for Google video indexing |

**Marketing angle:** Share `/watch/[videoId]` directly — previews show artist + track.

---

### Creator profiles — `/profile/[username]`

| On-page element | Content |
|---|---|
| **Title** | @{handle} — {Display Name} |
| **Description** | Bio or hip-hop fallback |
| **Structured data** | `Person` + `sameAs` + `BreadcrumbList` |
| **OG image** | Profile picture when available |

---

### Search — `/search`

| On-page element | Content |
|---|---|
| **Title** | Search Hip-Hop Artists & Rap Music Videos |
| **Index** | Indexable (in sitemap) — utility/discovery page |

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
| **AI doc** | `/faq.md` |

---

### Other marketing & content pages

Shared SEO pattern: title, description, canonical, OG/Twitter, `WebPage` + `BreadcrumbList` JSON-LD via `ContentPageShell`.

| Page | SEO role | Dedicated layout metadata |
|---|---|---|
| `/about` | Brand story | ✅ |
| `/what-is-hiffi` | Entity disambiguation for AI | ✅ + `/what-is-hiffi.md` |
| `/how-it-works` | Onboarding explainer | ✅ + `/how-it-works.md` |
| `/artists` | Creator program | ✅ |
| `/creator-playbook` | Creator education | ✅ |
| `/press` | Press kit | ✅ |
| `/advertising` | Ad sales | ✅ |
| `/creators-for-change` | Program landing | ✅ |
| `/support` | Help & contact | ✅ + `/support.md` |
| `/community-guidelines` | House rules, trust | ⚠️ In sitemap + JSON-LD; **no dedicated meta layout yet** (inherits root) |
| Legal (`/terms-of-use`, `/privacy-policy`, etc.) | Trust signals | ✅ + `.md` mirrors |

All listed in `sitemap.xml` except where `noindex`.

---

## Social sharing & preview images

| Surface | What shows when a link is shared |
|---|---|
| **Watch pages** | **Dynamic 1200×630** — thumbnail, artist, track title |
| **Artist Index profiles** | **Artist photo** when available |
| **Root / default** | `app/opengraph-image.png` where file convention applies |
| **Most other pages** | `/hiffi_logo.png` in metadata (square logo — acceptable but not ideal 1200×630) |
| **Artist Index hub / city / genre** | Hiffi logo ("Hiffi Artist Index") |

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
| Artist Index hub | `WebPage` + `FAQPage` + `ItemList` | FAQ rich results |
| Artist Index city | `CollectionPage` + `ItemList` + `FAQPage` + `BreadcrumbList` | FAQ rich results |
| Artist Index genre | `CollectionPage` + `ItemList` + `BreadcrumbList` | — |
| Artist Index profiles | `ProfilePage` + `MusicGroup` (`sameAs`, `genre`, `foundingLocation`) | Entity disambiguation |
| `/artist-index/claim` | `WebPage` + `FAQPage` + `HowTo` | FAQ / how-to |
| `/app` | `SoftwareApplication` + `FAQPage` | App rich results |
| `/faq` | `WebPage` + `FAQPage` | FAQ rich results |

**Organization `knowsAbout`:** Hip hop music, Rap music, Drill music, Trap music, Conscious rap, Boom bap, Lo-fi hip-hop, Independent music, Music video streaming, Lossless audio streaming.

---

## Internal linking map

```
Homepage (/)
├── /hip-hop (genre hub)
│   └── /hip-hop/mood/[slug] (7 mood pages)
├── /artist-index (Atlanta-first directory hub)
│   ├── /artist-index/claim  ← claim campaigns
│   ├── /artist-index/city/atlanta  ← primary Atlanta URL
│   │   └── /artist-index/city/atlanta/scene  ← editorial ATL guide
│   ├── /artist-index/genre/[genre]
│   └── /artist-index/[artist-slug] (all inventory profiles)
├── /search
├── /creator/apply
├── /app
└── /faq

Site footer DISCOVER → Hip-Hop, Artist Index, Claim your profile
Hub filter pills → crawlable /city/ and /genre/ pages
Artist profiles → breadcrumbs to city + genre + related artists
Mood pages → cross-link + back to /hip-hop
```

---

## AI search (GEO) on-page optimizations

| Tactic | Implementation |
|---|---|
| **Answer-first FAQs** | Direct answers in first sentence; stats where relevant |
| **Statistics** | IFPI 25% hip-hop streams (`/faq`); dynamic artist counts (Artist Index meta + FAQ) |
| **Subgenre vocabulary** | Drill, trap, boom bap, conscious rap, lo-fi hip-hop throughout |
| **Short paragraphs** | 2–3 sentences; H1 → H2 → H3 hierarchy |
| **FAQPage schema** | Hub (JSON-LD), moods, FAQ, app, claim, Atlanta city page |
| **Entity `sameAs`** | Organization (Hiffi socials) + artist profiles (Spotify/IG/YT) |
| **llms.txt** | `https://www.hiffi.com/llms.txt` — discovery index + citation guidance |
| **Markdown mirrors** | `/*.md` rewrite → `content/llms/` + generated mood docs |

**llms.txt — key Artist Index entries:**

- `https://www.hiffi.com/artist-index` — directory hub
- `https://www.hiffi.com/artist-index.md` — AI citation doc
- `https://www.hiffi.com/artist-index/claim` + `/artist-index/claim.md` — claim flow
- `https://www.hiffi.com/artist-index/city/atlanta` + `/artist-index/city/atlanta.md`
- `https://www.hiffi.com/artist-index/city/atlanta/scene` — scene guide (HTML)
- `https://www.hiffi.com/artist-index/[slug]` — individual profiles

**Not yet in llms.txt / `.md`:** Genre hub pages (`/artist-index/genre/rap`, etc.).

---

## Sitemap coverage

`https://www.hiffi.com/sitemap.xml` — revalidates hourly.

| URL group | Priority | Notes |
|---|---|---|
| Homepage | 1.0 | Highest |
| `/hip-hop` | 0.95 | Genre hub |
| `/artist-index` | 0.92 | Directory hub (clean URL) |
| `/app` | 0.90 | App download |
| City pages | 0.90 | e.g. `/artist-index/city/atlanta` |
| Atlanta scene | 0.86 | `/artist-index/city/atlanta/scene` |
| `/artist-index/claim` | 0.88 | Claim landing |
| Genre pages | 0.88 | Per-genre listings |
| Mood pages | 0.85 | All 7 vibes |
| Watch pages | 0.80 | Chunked for large catalogs |
| Artist Index profiles | 0.75 | All inventory profiles |
| Creator profiles | 0.70 | `/profile/[username]` |
| Marketing / legal | 0.55–0.88 | About, artists, playbook, etc. |

*Paginated city/genre pages (`?page=2+`) are discovered via crawlable pagination, not listed individually in the sitemap.*

---

## Known gaps & backlog (SEO engineering)

| Item | Status | Impact |
|---|---|---|
| robots.txt named-bot Disallow parity | **Fixed** (`lib/seo/robots-txt-core.ts`) — verify prod after deploy | Critical (crawl) |
| `/community-guidelines` dedicated meta title/description | **Done** (`app/(main)/community-guidelines/layout.tsx`) | Low–medium |
| GA4 AI assistant referral channel group | **Ops** — see [`docs/ai-search-visibility-ops.md`](ai-search-visibility-ops.md) | Medium (measurement) |
| Default OG image 1200×630 for non-watch pages | Logo used in most `routeMetadata` calls | Medium (social CTR) |
| Genre pages in `llms.txt` + `.md` | Not added | Low (AI discovery) |
| `llms.txt` / FAQ copy still says "800+" in places | Static marketing copy; live counts are dynamic in app meta | Low (align copy when count changes) |
| Explicit `viewport` export in root layout | Not set (Next.js defaults apply) | Low |

---

## Realistic expectations (Artist Index & AI visibility)

On-page SEO is strong; **rankings and AI citation still need time, Google visibility, and off-site signals**. LLM answers are primarily **downstream of traditional search ranking and query fan-out** — not a parallel track driven by FAQ schema or `llms.txt` alone.

| Milestone | Timeline | Notes |
|---|---|---|
| Hub + Atlanta city page indexed | 1–4 weeks | Submit sitemap; confirm `NEXT_PUBLIC_ENV=prod`; verify robots.txt on prod |
| Profile pages appearing in Google | 4–12 weeks | Large URL set crawls gradually |
| Long-tail artist name impressions | 2–6 months | `{artist name} Atlanta rapper` |
| Scene-level terms ("Atlanta rap artists") | 6–12 months | Competitive; needs backlinks + PR |
| AI citation for directory queries | 3–12 months | **Contingent on ranking for fan-out query variants + topical authority**; FAQ + `llms.txt` support clarity only |

**Highest-confidence wins:** artist-name long-tail, claim campaigns, Atlanta scene links to `/artist-index/city/atlanta`, GSC-driven fan-out copy updates ([ops playbook](ai-search-visibility-ops.md)).

**Do not expect:** fast AI citation immediately after a single reindex — validate with the reindex log in the ops playbook before scaling GEO process.

---

## What marketing should do next

### Immediate (post-deploy)

- [ ] Submit `https://www.hiffi.com/sitemap.xml` in **Google Search Console** and **Bing Webmaster Tools**
- [ ] Request indexing for `/artist-index`, **`/artist-index/city/atlanta`**, and **`/artist-index/claim`**
- [ ] Validate in [Rich Results Test](https://search.google.com/test/rich-results): hub + sample profile + sample watch URL
- [ ] Confirm **`NEXT_PUBLIC_ENV=prod`** on production hosting

### Ongoing campaigns

- [ ] Atlanta outreach → **`/artist-index/city/atlanta`** (not generic hub with filters)
- [ ] Artist claim emails → **`/artist-index/claim`** or individual **`/artist-index/[slug]`**
- [ ] Subgenre campaigns → matching `/hip-hop/mood/[slug]` page
- [ ] Press / "what is Hiffi" → `/hip-hop` or `/what-is-hiffi`
- [ ] Creators share `/watch/[videoId]` for dynamic OG cards
- [ ] Scene/editorial PR → `/artist-index/city/atlanta/scene`

### Measurement (monthly)

- [ ] Search Console impressions: `Atlanta rap artists`, `artist directory`, `hip hop`, `drill music` — export long-tail variants per [`docs/ai-search-visibility-ops.md`](ai-search-visibility-ops.md)
- [ ] GA4: AI assistant referral exploration (ChatGPT, Perplexity, Claude, Gemini) — configure per ops playbook
- [ ] `site:hiffi.com/artist-index` — indexed profile count climbing
- [ ] AI spot-check (secondary): same query in Perplexity / ChatGPT — **compare to GSC rank/impressions**, not in isolation
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
| **Claim flow (search + verify)** | **`hiffi.com/artist-index/claim`** |
| Artist Index overview | `hiffi.com/artist-index` |
| Atlanta scene editorial | `hiffi.com/artist-index/city/atlanta/scene` |
| Share a specific artist listing | `hiffi.com/artist-index/[slug]` |
| Share a specific track | `hiffi.com/watch/[videoId]` |
| Press / "what is Hiffi" | `hiffi.com/what-is-hiffi` or `hiffi.com/faq` |

---

*Technical implementation: `lib/seo/`, `lib/artist-directory-seo.ts`, `app/sitemap.ts`, `public/llms.txt`, `content/llms/`.*
