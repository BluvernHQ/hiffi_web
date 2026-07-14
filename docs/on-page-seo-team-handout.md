# Hiffi On-Page SEO — Team Reference

**Site:** [https://www.hiffi.com](https://www.hiffi.com)  
**Last updated:** July 2026  
---

## How page titles work

- Most pages show as: **`{Page title} | Hiffi`**
- A few pages (app download, mood pages) use a **fixed full title** with only one “| Hiffi”
- **Meta descriptions** are the short blurbs Google and social apps show under the title
- **Dynamic pages** (videos, artist profiles) auto-fill from live content
- **Artist Index counts** in descriptions update automatically from inventory (not hardcoded)

**Brand line used across the site:**  
*Hiffi is a hip-hop-first platform for independent rap artists and fans — discover music videos, follow creators, and stream in high quality.*

**Atlanta positioning (2026):** Artist Index pages lead with **Atlanta hip-hop & rap** as the flagship market.

---

## Sitewide (every page)

| What | Value |
|------|--------|
| **Default title** (fallback) | Hiffi — Hip-Hop Music Videos & Streaming for Independent Artists |
| **Default description** | Hiffi is a hip-hop-first music and video streaming platform for independent rap artists and fans. Discover music videos, follow creators, and stream in high quality — no algorithmic interference. |
| **Schemas on all pages** | **WebSite** (includes site search box) + **Organization** (Hiffi brand, social links: @officialhiffi on Instagram, X, YouTube) |

---

## Core product & discovery pages

| Page URL | Browser title (what users see in Google) | Meta description | Structured data (schemas) |
|----------|------------------------------------------|------------------|---------------------------|
| **/** (Homepage) | Discover Hip-Hop & Rap — Music Videos from Independent Artists \| Hiffi | Discover independent hip-hop and rap artists on Hiffi. Watch music videos, stream drill, trap, conscious rap, and boom bap — no algorithms, just creator-first content. | WebPage + ItemList (featured videos) |
| **/hip-hop** | Hip-Hop Music Videos & Streaming — Discover Independent Rap Artists \| Hiffi | Hiffi is the hip-hop-first platform for independent rap artists and fans. Watch official music videos, discover drill, trap, conscious rap, boom bap, and more. | WebPage + FAQPage (8 Q&As) + ItemList (mood hubs) |
| **/search** | Search Hip-Hop Artists & Rap Music Videos \| Hiffi | Search Hiffi for independent hip-hop and rap artists, music videos, drill, trap, conscious rap, and creator profiles. | WebPage + BreadcrumbList |
| **/app** | Download Hiffi App — Hip-Hop Music Videos & Creator Streaming | Download Hiffi for iOS and Android. Discover independent hip-hop artists, watch music videos, follow creators, build playlists, and stream high-quality music. | SoftwareApplication + FAQPage |
| **/faq** | FAQ \| Hiffi | Frequently asked questions about Hiffi — the hip-hop-first streaming platform for independent rap artists and fans. Account setup, discovery, playback, creator tools, and support. | WebPage + FAQPage |
| **/creator/apply** | Upload Rap & Hip-Hop Music Videos — Become a Creator \| Hiffi | Apply to publish on Hiffi as an independent hip-hop or rap artist. Upload music videos, grow your audience, and keep creative control — no label required. | WebPage + BreadcrumbList |
| **/watch/{videoId}** | {Artist} — {Track title} \| Hiffi | Video description, or: *Watch {title} by {artist} on Hiffi — hip-hop and rap music video streaming for independent artists.* | VideoObject (or MusicVideoObject) + BreadcrumbList + timestamp seek support |
| **/profile/{username}** | @{username} — {Display name} \| Hiffi | Profile bio, or: *Hip-hop music videos and profile of @{username} on Hiffi — independent rap artist streaming platform.* | ProfilePage + Person + BreadcrumbList |

---

## Hip-hop mood pages (subgenre / vibe landing pages)

**Description template (all moods):**  
*Discover {vibe} music videos from independent hip-hop artists on Hiffi. {tagline} Stream {subgenre cluster} rap — official videos, underground drops, and creator-first discovery.*

| Page URL | Browser title | Schemas |
|----------|---------------|---------|
| **/hip-hop/mood/on-sight** | On Sight — Drill, trap bangers, rage \| Hiffi | WebPage + FAQPage + MusicPlaylist + BreadcrumbList |
| **/hip-hop/mood/soul-search** | Soul Search — J. Cole mode, conscious rap \| Hiffi | Same |
| **/hip-hop/mood/money-talk** | Money Talk — Celebration, flexing, wins \| Hiffi | Same |
| **/hip-hop/mood/blue-hours** | Blue Hours — Heartbreak, late night \| Hiffi | Same |
| **/hip-hop/mood/low-rider** | Low Rider — Lo-fi hip-hop, boom bap \| Hiffi | Same |
| **/hip-hop/mood/turn-up** | Turn Up — Workout, turn up \| Hiffi | Same |
| **/hip-hop/mood/god's-plan** | God's Plan — Faith, legacy, purpose \| Hiffi | Same |

**Campaign tip:** Match social hashtags and ad creative to the relevant mood URL.

---

## Artist Index (Atlanta-first directory)

### Hub — `/artist-index`

| Field | Copy |
|-------|------|
| **Title** | Atlanta Hip-Hop & Rap Artists \| Hiffi |
| **Description** | Search the Hiffi Artist Index — claimable hip-hop and rap profiles by city and genre. **{N}+ artists indexed, Atlanta first.** Find, claim, or suggest edits. *(N = live count)* |
| **Visible headline (H1)** | Discover Atlanta's emerging hip-hop & rap artists |
| **Schemas** | WebPage + FAQPage (7 Q&As) + ItemList |

**FAQ topics in schema (for Google / AI):**

1. What is the Hiffi Artist Index?
2. How many artists are listed?
3. How do I find Atlanta rap artists?
4. How do I claim my profile?
5. Is it only for Atlanta?
6. Can fans suggest corrections?
7. Does claiming auto-upload music?

> **Note:** Filter/search URLs like `?q=`, `?f=`, `?page=2` are **hidden from Google** (noindex).

---

### Claim landing — `/artist-index/claim`

| Field | Copy |
|-------|------|
| **Title** | Claim Your Artist Profile on Hiffi \| Hiffi |
| **Description** | Find your Hiffi Artist Index listing, verify your identity, and take control of your bio, links, and music videos. Free for independent hip-hop and rap artists — review in 24–48 hours. |
| **Schemas** | WebPage + FAQPage + **HowTo** (step-by-step claim flow) |

**Primary URL for artist outreach and claim campaigns.**

---

### City pages — `/artist-index/city/{city}`

**Atlanta (primary):** `/artist-index/city/atlanta`

| Field | Copy |
|-------|------|
| **Title** | Atlanta hip-hop & rap artists \| Hiffi |
| **Description** | Atlanta hip-hop and rap artists on Hiffi — the definitive ATL scene directory. Browse **{N}+** ATL trap, drill, and underground profiles. Claim your listing or explore emerging talent. |
| **Schemas** | CollectionPage + ItemList + FAQPage + BreadcrumbList |

**Other cities** (when indexed): `{City} hip-hop & rap artists | Hiffi`

---

### Atlanta scene guide — `/artist-index/city/atlanta/scene`

| Field | Copy |
|-------|------|
| **Title** | Atlanta Hip-Hop Scene — Trap, Drill & Underground Rap \| Hiffi |
| **Description** | Guide to the Atlanta hip-hop scene on Hiffi — trap, drill, melodic rap, and underground ATL talent. Browse **{N}+** indexed artist profiles in the directory. |
| **Schemas** | WebPage + BreadcrumbList |

**Use for editorial PR, scene guides, and Atlanta culture backlinks.**

---

### Genre pages — `/artist-index/genre/{genre}`

| Field | Copy |
|-------|------|
| **Title** | Atlanta {genre} artists \| Hiffi *(e.g. Atlanta rap artists)* |
| **Description** | Browse **{N}+** Atlanta {genre} artists on the Hiffi Artist Index. Search by artist name. |
| **Schemas** | CollectionPage + ItemList + BreadcrumbList |

---

### Individual artist profiles — `/artist-index/{slug}`

| Field | Copy |
|-------|------|
| **Title** | {Artist name} — {City} {Genre} Artist \| Hiffi |
| **Description** | Artist bio (trimmed), or fallback: *{Name} is an emerging {genre} artist from {city} indexed on Hiffi…* |
| **Social preview image** | Artist photo when available |
| **Schemas** | ProfilePage + **MusicGroup** (genre, city, Spotify/IG/YouTube links via sameAs) |

**Hidden from Google:** claim flow, edit/suggest-edit pages.

---

## Marketing & trust pages

All include **WebPage + BreadcrumbList** unless noted.

| Page URL | Browser title | Meta description |
|----------|---------------|------------------|
| **/about** | About Hiffi \| Hiffi | Hiffi is the artist-first hip-hop streaming platform for rappers, producers, DJs, and fans — starting with Atlanta's rap scene and built for independent artist discovery. |
| **/what-is-hiffi** | What Is Hiffi? \| Hiffi | Hiffi is a hip-hop-first streaming platform for independent artists at hiffi.com — building from Atlanta's rap scene outward. Not affiliated with other HIFFI brands. *(Also has FAQPage schema)* |
| **/how-it-works** | How Hiffi Works \| Hiffi | Learn how Hiffi works for fans and creators — sign up, discover hip-hop, upload music videos, grow your audience, and engage with the community. |
| **/artists** | Hiffi Artists \| Hiffi | Independent rappers, producers, and DJs: upload music videos, grow your fanbase, and reach hip-hop audiences on Hiffi. |
| **/creator-playbook** | Creator Playbook \| Hiffi | Hiffi Creator Playbook — plan your content, optimize uploads, get discovered, and grow as an independent hip-hop artist on Hiffi. |
| **/collaborate** | Hip-Hop Brand Collaborations & Artist Partnerships \| Hiffi | Partner with Hiffi to reach independent hip-hop and rap audiences. Sponsored drops, artist collabs, exclusive content, and more. |
| **/advertising** | Hiffi Advertising \| Hiffi | Reach engaged hip-hop and rap audiences on Hiffi. Sponsored content, artist partnerships, and brand campaigns built for music culture. |
| **/press** | Press Kit \| Hiffi | Hiffi press resources — company overview, brand assets, media contact, and facts for journalists covering hip-hop streaming and independent artists. |
| **/creators-for-change** | Creators for Change \| Hiffi | Hiffi's commitment to amplifying hip-hop creators who use their platform for community impact, mentorship, and positive culture. |
| **/support** | Support \| Hiffi | Get help with your Hiffi hip-hop streaming account, payments, creator tools, and playback. Contact care@hiffi.com for assistance. |
| **/community-guidelines** | Community Guidelines \| Hiffi | Hiffi is built on respect for artists, fans, and hip-hop culture. These guidelines explain what we expect from everyone on the hip-hop streaming platform. |
| **/privacy-policy** | Privacy Policy \| Hiffi | How Hiffi and Kinimi Corporation collect, use, and protect your personal information across the platform. |
| **/terms-of-use** | Terms of Use \| Hiffi | Terms governing your use of the Hiffi streaming platform, accounts, content, and services. |
| **/copyright** | Copyright & DMCA \| Hiffi | How Hiffi handles copyright, intellectual property, and DMCA takedown requests for music and video on the platform. |
| **/payment-terms** | Payment Terms \| Hiffi | Payment terms for tips, subscriptions, and creator payouts on the Hiffi platform. |

---

## What “structured data / schemas” means (plain English)

These are invisible tags that help Google, Bing, and AI tools understand each page:

| Schema type | What it does for Hiffi |
|-------------|------------------------|
| **Organization** | Defines Hiffi as a brand; links social profiles |
| **WebSite** | Enables sitelinks search box in Google |
| **FAQPage** | Eligible for FAQ rich results (expandable Q&A in search) |
| **HowTo** | Step-by-step claim instructions on `/artist-index/claim` |
| **VideoObject** | Video rich results, indexing, timestamp deep links |
| **MusicPlaylist** | Mood pages described as curated hip-hop playlists |
| **ItemList / CollectionPage** | Directory and feed pages listed as browsable collections |
| **ProfilePage + MusicGroup** | Artist Index profiles as music entities with genre + city |
| **Person** | Creator profiles on `/profile/{username}` |
| **SoftwareApplication** | App download page treated as a mobile app |
| **BreadcrumbList** | Navigation trail (Home → section → page) in search |

---

## Social link previews (when sharing URLs)

| Page type | What shows in Slack / iMessage / X |
|-----------|-------------------------------------|
| **Watch pages** | Dynamic 1200×630 image — thumbnail + artist + track title |
| **Artist Index profiles** | Artist photo (when available) |
| **Most other pages** | Hiffi logo |

**Test any URL:** [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) or paste into Slack.

---

## Pages intentionally hidden from Google

Login, signup, watch history, liked videos, playlists, studio, admin — these are **noindex** (account-only, not for search).

---

## Campaign URL cheat sheet

| Goal | URL to use |
|------|------------|
| General brand | hiffi.com or hiffi.com/hip-hop |
| Drill / trap | hiffi.com/hip-hop/mood/on-sight |
| Conscious rap | hiffi.com/hip-hop/mood/soul-search |
| Lo-fi / boom bap | hiffi.com/hip-hop/mood/low-rider |
| Artist signup | hiffi.com/creator/apply |
| App install | hiffi.com/app |
| **Atlanta scene** | **hiffi.com/artist-index/city/atlanta** |
| **Claim profile** | **hiffi.com/artist-index/claim** |
| Share a track | hiffi.com/watch/{videoId} |
| Share an artist listing | hiffi.com/artist-index/{slug} |
| Press / “What is Hiffi?” | hiffi.com/what-is-hiffi or hiffi.com/faq |

---

## Recent SEO updates (2026) — summary for stakeholders

- **Artist Index** repositioned as **Atlanta-first** with dynamic profile counts
- **Dedicated meta** added for community guidelines, support reports, mood pages (title fix)
- **FAQ / fan-out copy** expanded across hub, Atlanta, hip-hop, and mood pages
- **robots.txt** fixed so all major crawlers (Google, GPTBot, Perplexity, etc.) can access public pages in production
- **Watch pages** optimized for Google video indexing (MP4 contentUrl, SeekToAction timestamps)
- **AI discovery** via `hiffi.com/llms.txt` and `.md` mirrors (e.g. `/faq.md`, `/artist-index.md`)

---

## Full technical references

| Doc | Purpose |
|-----|---------|
| [on-page-seo-marketing.md](on-page-seo-marketing.md) | Strategy, keywords, campaigns, expectations |
| [on-page-seo-meta-inventory.md](on-page-seo-meta-inventory.md) | Exact title/description ground truth for engineering audits |
