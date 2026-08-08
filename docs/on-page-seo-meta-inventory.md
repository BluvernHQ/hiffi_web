# Hiffi On-Page SEO — Meta Tag Inventory

**Audience:** SEO experts, marketing, engineering  
**Last updated:** July 1, 2026  
**Canonical site:** [https://www.hiffi.com](https://www.hiffi.com)  
**Related:** [Marketing reference](on-page-seo-marketing.md) · [AI visibility ops](ai-search-visibility-ops.md)

Ground-truth inventory of `<title>`, meta description, robots/indexing, and key on-page SEO implementation. Values reflect the codebase at this revision.

---

## Title rules

| Rule | Detail |
|------|--------|
| **Default template** | Root `app/layout.tsx`: `%s \| Hiffi` |
| **Rendered title** | Most pages: `{segment} \| Hiffi` |
| **Absolute titles** | `{ absolute: "..." }` — no template suffix (`/app`, mood pages, `/referrar/*`, support report) |
| **OG/Twitter title** | `routeMetadata()` sets `{title} \| Hiffi`; absolute-title routes use full string |
| **Description cap** | Dynamic bios/descriptions use `truncateMetaDescription()` (155 chars) in Artist Index pipeline |

### Root fallback (pages without route metadata)

| Field | Value |
|-------|-------|
| **`<title>`** | `Hiffi — Hip-Hop Music Videos & Streaming for Independent Artists` |
| **Meta description** | Hiffi is a hip-hop-first music and video streaming platform for independent rap artists and fans. Discover music videos, follow creators, and stream in high quality — no algorithmic interference. |
| **Source** | `app/layout.tsx` |

---

## Indexable static pages

| URL | Rendered `<title>` | Meta description | Index | Source |
|-----|-------------------|------------------|-------|--------|
| `/` | Discover Hip-Hop & Rap — Music Videos from Independent Artists \| Hiffi | Discover independent hip-hop and rap artists on Hiffi. Watch music videos, stream drill, trap, conscious rap, and boom bap — no algorithms, just creator-first content. | yes | `app/(main)/page.tsx` |
| `/hip-hop` | Hip-Hop Music Videos & Streaming — Discover Independent Rap Artists \| Hiffi | Hiffi is the hip-hop-first platform for independent rap artists and fans. Watch official music videos, discover drill, trap, conscious rap, boom bap, and more. | yes | `app/(main)/hip-hop/page.tsx` |
| `/app` | Download Hiffi App — Hip-Hop Music Videos & Creator Streaming | Download Hiffi for iOS and Android. Discover independent hip-hop artists, watch music videos, follow creators, build playlists, and stream high-quality music. | yes | `app/(main)/app/page.tsx` |
| `/faq` | FAQ \| Hiffi | Frequently asked questions about Hiffi — the hip-hop-first streaming platform for independent rap artists and fans. Account setup, discovery, playback, creator tools, and support. | yes | `app/(main)/faq/page.tsx` |
| `/search` | Search Hip-Hop Artists & Rap Music Videos \| Hiffi | Search Hiffi for independent hip-hop and rap artists, music videos, drill, trap, conscious rap, and creator profiles. | yes | `app/(main)/search/layout.tsx` |
| `/about` | About Hiffi \| Hiffi | Hiffi is the artist-first hip-hop streaming platform for rappers, producers, DJs, and fans — starting with Atlanta's rap scene and built for independent artist discovery. | yes | `app/(main)/about/layout.tsx` |
| `/what-is-hiffi` | What Is Hiffi? \| Hiffi | Hiffi is a hip-hop-first streaming platform for independent artists at hiffi.com — building from Atlanta's rap scene outward. Not affiliated with other HIFFI brands. | yes | `app/(main)/what-is-hiffi/layout.tsx` |
| `/how-it-works` | How Hiffi Works \| Hiffi | Learn how Hiffi works for fans and creators — sign up, discover hip-hop, upload music videos, grow your audience, and engage with the community. | yes | `app/(main)/how-it-works/layout.tsx` |
| `/artists` | Hiffi Artists \| Hiffi | Independent rappers, producers, and DJs: upload music videos, grow your fanbase, and reach hip-hop audiences on Hiffi. | yes | `app/(main)/artists/layout.tsx` |
| `/creator/apply` | Upload Rap & Hip-Hop Music Videos — Become a Creator \| Hiffi | Apply to publish on Hiffi as an independent hip-hop or rap artist. Upload music videos, grow your audience, and keep creative control — no label required. | yes | `app/(main)/creator/apply/layout.tsx` |
| `/creator-playbook` | Creator Playbook \| Hiffi | Hiffi Creator Playbook — plan your content, optimize uploads, get discovered, and grow as an independent hip-hop artist on Hiffi. | yes | `app/(main)/creator-playbook/layout.tsx` |
| `/creators-for-change` | Creators for Change \| Hiffi | Hiffi's commitment to amplifying hip-hop creators who use their platform for community impact, mentorship, and positive culture. | yes | `app/(main)/creators-for-change/layout.tsx` |
| `/collaborate` | Hip-Hop Brand Collaborations & Artist Partnerships \| Hiffi | Partner with Hiffi to reach independent hip-hop and rap audiences. Sponsored drops, artist collabs, exclusive content, and more. | yes | `app/(main)/collaborate/layout.tsx` |
| `/advertising` | Hiffi Advertising \| Hiffi | Reach engaged hip-hop and rap audiences on Hiffi. Sponsored content, artist partnerships, and brand campaigns built for music culture. | yes | `app/(main)/advertising/layout.tsx` |
| `/press` | Press Kit \| Hiffi | Hiffi press resources — company overview, brand assets, media contact, and facts for journalists covering hip-hop streaming and independent artists. | yes | `app/(main)/press/layout.tsx` |
| `/support` | Support \| Hiffi | Get help with your Hiffi hip-hop streaming account, payments, creator tools, and playback. Contact care@hiffi.com for assistance. | yes | `app/(main)/support/layout.tsx` |
| `/community-guidelines` | Community Guidelines \| Hiffi | Hiffi is built on respect for artists, fans, and hip-hop culture. These guidelines explain what we expect from everyone on the hip-hop streaming platform. | yes | `app/(main)/community-guidelines/layout.tsx` |
| `/privacy-policy` | Privacy Policy \| Hiffi | How Hiffi and Kinimi Corporation collect, use, and protect your personal information across the platform. | yes | `app/(main)/privacy-policy/layout.tsx` |
| `/terms-of-use` | Terms of Use \| Hiffi | Terms governing your use of the Hiffi streaming platform, accounts, content, and services. | yes | `app/(main)/terms-of-use/layout.tsx` |
| `/copyright` | Copyright & DMCA \| Hiffi | How Hiffi handles copyright, intellectual property, and DMCA takedown requests for music and video on the platform. | yes | `app/(main)/copyright/layout.tsx` |
| `/payment-terms` | Payment Terms \| Hiffi | Payment terms for tips, subscriptions, and creator payouts on the Hiffi platform. | yes | `app/(main)/payment-terms/layout.tsx` |

---

## Hip-hop mood pages (`/hip-hop/mood/[slug]`)

Uses **`title: { absolute: "..." }`** — exactly one `| Hiffi` in rendered title.

Description template:  
`Discover {vibe} music videos from independent hip-hop artists on Hiffi. {tagline} Stream {cluster} rap — official videos, underground drops, and creator-first discovery.`

| URL | Rendered `<title>` |
|-----|-------------------|
| `/hip-hop/mood/on-sight` | On Sight — Drill, trap bangers, rage \| Hiffi |
| `/hip-hop/mood/soul-search` | Soul Search — J. Cole mode, conscious rap \| Hiffi |
| `/hip-hop/mood/money-talk` | Money Talk — Celebration, flexing, wins \| Hiffi |
| `/hip-hop/mood/blue-hours` | Blue Hours — Heartbreak, late night \| Hiffi |
| `/hip-hop/mood/low-rider` | Low Rider — Lo-fi hip-hop, boom bap \| Hiffi |
| `/hip-hop/mood/turn-up` | Turn Up — Workout, turn up \| Hiffi |
| `/hip-hop/mood/god's-plan` | God's Plan — Faith, legacy, purpose \| Hiffi |

**Source:** `app/(main)/hip-hop/mood/[slug]/page.tsx` · **JSON-LD:** `WebPage` + `FAQPage` + `MusicPlaylist`

---

## Artist Index

### Hub `/artist-index` (clean — no query/filter/pagination)

| Field | Value |
|-------|-------|
| **Title segment** | Atlanta Hip-Hop & Rap Artists |
| **Rendered `<title>`** | Atlanta Hip-Hop & Rap Artists \| Hiffi |
| **Description** | Dynamic via `buildArtistIndexHubDescription(count)` — e.g. *Search the Hiffi Artist Index — claimable hip-hop and rap profiles by city and genre. {N}+ artists indexed, Atlanta first. Find, claim, or suggest edits.* |
| **Fallback (no count)** | Search the Hiffi Artist Index — claimable hip-hop and rap profiles by city and genre. Atlanta is our first indexed market. Find, claim, or suggest edits. |
| **Visible H1** | Discover Atlanta's emerging hip-hop & rap artists |
| **Index** | yes |
| **Source** | `lib/artist-directory-seo.ts` · `app/(main)/artist-index/page.tsx` |

### Hub with `?q=`, `?f=`, or `?page=2+`

| Field | Value |
|-------|-------|
| **Title** | `{filters/query} — Artist Index` (+ ` — Page N` if paginated) \| Hiffi |
| **Description** | Browse {filters} on the Hiffi Artist Index. {N} profiles match. Claim your profile or suggest edits to keep listings accurate. |
| **Index** | **noindex** |
| **Source** | `buildArtistIndexHubMetadata()` filtered branch |

### Claim landing `/artist-index/claim`

| Field | Value |
|-------|-------|
| **Title** | Claim Your Artist Profile on Hiffi \| Hiffi |
| **Description** | Find your Hiffi Artist Index listing, verify your identity, and take control of your bio, links, and music videos. Free for independent hip-hop and rap artists — review in 24–48 hours. |
| **Index** | yes |
| **Source** | `lib/artist-index/claim-landing-seo.ts` |

### City `/artist-index/city/{citySlug}`

| Field | Atlanta (`atlanta`) | Other cities |
|-------|---------------------|--------------|
| **Title segment** | Atlanta hip-hop & rap artists | `{City} hip-hop & rap artists` |
| **Description** | `buildAtlantaCityPageDescription(count)` — leads with *Atlanta hip-hop and rap artists on Hiffi — the definitive ATL scene directory.* + live count | Discover emerging hip-hop and rap artists from {City}… |
| **Index** | yes (page 1); paginated titles append ` — Page N` | yes when city exists in inventory |
| **Source** | `lib/artist-directory-seo.ts` · `lib/artist-index/city-seo-content.ts` |

### Scene guide `/artist-index/city/atlanta/scene`

| Field | Value |
|-------|-------|
| **Title** | Atlanta Hip-Hop Scene — Trap, Drill & Underground Rap \| Hiffi |
| **Description** | Dynamic: *Guide to the Atlanta hip-hop scene on Hiffi — trap, drill, melodic rap, and underground ATL talent. Browse {N}+ indexed artist profiles in the directory.* |
| **Index** | yes (Atlanta only) |
| **Source** | `lib/artist-index/city-seo-content.ts` |

### Genre `/artist-index/genre/{genreSlug}`

| Field | Value |
|-------|-------|
| **Title segment** | Atlanta {genre} artists *(hardcoded Atlanta while inventory is flagship-market scoped)* |
| **Description** | Browse {count}+ Atlanta {genre} artists on the Hiffi Artist Index. Search by artist name. |
| **Index** | yes |
| **Source** | `lib/artist-directory-seo.ts` (`TODO(city-expand)` when second city launches) |

### Artist profile `/artist-index/{slug}`

| Field | Value |
|-------|-------|
| **Title segment** | `{Artist name} — {City} {Genres} Artist` |
| **Description** | Artist bio (≤155 chars) or fallback: *{Name} is a {genres} artist from {city} on the Hiffi Artist Index…* |
| **OG image** | Artist photo when available |
| **Index** | yes; `?edit=1` → noindex |
| **Source** | `buildArtistProfileMetadata()` |

### Per-artist claim `/artist-index/{slug}/claim` · edit `/artist-index/{slug}/edit`

| Route | Title | Index |
|-------|-------|-------|
| Claim | `Claim {Artist name}` \| Hiffi | noindex |
| Edit | `Suggest edit — {Artist name}` \| Hiffi | noindex |

---

## Dynamic user content

### Watch `/watch/{videoId}`

| Field | Template |
|-------|----------|
| **Title segment** | `{Artist} — {Track}` or track only |
| **Description** | Video description, or *Watch {title} by {artist} on Hiffi — hip-hop and rap music video streaming for independent artists.* |
| **OG** | Video thumbnail; `video.other`; optional `contentUrl` MP4 |
| **Not found** | Title: Video not found · noindex |
| **Source** | `lib/seo/watch-meta.ts` · `app/(main)/watch/[videoId]/layout.tsx` |

### Creator profile `/profile/{username}`

| Field | Template |
|-------|----------|
| **Title segment** | `@{username} — {display name}` |
| **Description** | Profile bio, or *Hip-hop music videos and profile of @{username} on Hiffi — independent rap artist streaming platform.* |
| **OG** | Profile image when available |
| **Source** | `app/(main)/profile/[username]/layout.tsx` |

---

## Noindex / utility routes

| URL | Rendered `<title>` | Meta description | Robots |
|-----|-------------------|------------------|--------|
| `/login` | Log in \| Hiffi | Sign in to your Hiffi account to watch lossless audio and high-fidelity videos from independent creators. | noindex |
| `/signup` | Sign up \| Hiffi | Create a free Hiffi account to follow creators, save playlists, and stream high-fidelity music and video. | noindex |
| `/forgot-password` | Forgot password \| Hiffi | Reset your Hiffi account password securely using email verification. | noindex |
| `/following` | Following \| Hiffi | Videos from creators you follow on Hiffi (signed-in users). | noindex |
| `/history` | Watch history \| Hiffi | Your recently watched videos on Hiffi (signed-in users). | noindex |
| `/liked` | Liked videos \| Hiffi | Videos you have liked on Hiffi (signed-in users). | noindex |
| `/playlists` | Playlists \| Hiffi | Create and manage your Hiffi playlists (signed-in users). | noindex |
| `/studio` | Hiffi Studio \| Hiffi | Your space to publish, refine, and manage your presence on Hiffi. | noindex |
| `/studio/tools/upload` | Upload video \| Hiffi | Upload high-fidelity video and metadata for your Hiffi creator channel. | noindex |
| `/studio/tools/migrate` | Migrate content \| Hiffi | Request migration of your YouTube channel or playlist to Hiffi. | noindex |
| `/referrar/{username}` | `@{username} Referral \| Hiffi` (absolute) | Join Hiffi through a creator referral link and start discovering independent hip-hop artists. | noindex, nofollow |
| `/admin` | Admin \| Hiffi | Hiffi administrator sign-in. | noindex |
| `/admin/dashboard` | Admin Dashboard \| Hiffi | Monitor analytics, users, content, and platform activity in the Hiffi admin dashboard. | noindex |
| `/maintenance` | Maintenance \| Hiffi | Hiffi is temporarily unavailable. Please try again shortly. | noindex |
| `/test-hls` | HLS playback test \| Hiffi | Internal Hiffi streaming test page. | noindex |
| `/support/reports/{id}` | Support Report \| Hiffi (absolute) | View the status of your Hiffi content report. Signed-in users only — this page is not indexed in search. | noindex, nofollow |

**Note:** `/referrar/` is intentional (product path for referral deep links) — also in `robots.txt` Disallow.

---

## Crawl & discovery infrastructure

### robots.txt

| Environment | Behavior |
|-------------|----------|
| **Non-prod** (`NEXT_PUBLIC_ENV` ≠ `prod`) | `User-agent: *` · `Disallow: /` (search engines blocked); named AI bots (`GPTBot`, `ClaudeBot`, `PerplexityBot`, etc.) get `Allow: /` |
| **Production** | Wildcard + every named bot (`Googlebot`, `GPTBot`, `PerplexityBot`, `ClaudeBot`, …) get `Allow: /` **and** full `DISALLOW_PATHS` list |

**Disallowed paths:** `/admin/`, `/api/`, `/studio`, `/login`, `/signup`, `/forgot-password`, `/history`, `/following`, `/liked`, `/playlists`, `/referrar/`

**Source:** `lib/seo/robots-txt-core.ts` · `app/robots.txt/route.ts` · Tests: `npm run test:robots`

### Sitemap

`app/sitemap.ts` — home, marketing pages, `/hip-hop`, moods, Artist Index hub/city/scene/genre, profiles, watch URLs (chunked). Filtered hub URLs and noindex routes excluded.

### llms.txt & markdown mirrors

| Asset | URL | Notes |
|-------|-----|-------|
| llms.txt | `/llms.txt` | AI discovery index; Atlanta directory citation guidance |
| Markdown mirrors | `/*.md` → `content/llms/` | e.g. `/faq.md`, `/artist-index.md`, `/artist-index/city/atlanta.md`, mood `.md` files |
| Genre pages | — | **Not yet** in llms.txt |

---

## Structured data (JSON-LD) by route type

| Route | Schema types |
|-------|----------------|
| All pages (root layout) | `WebSite` (sitelinks searchbox) + `Organization` (`sameAs`: `@officialhiffi` IG/X/YouTube) |
| `/` | `WebPage` + `ItemList` (feed preview) |
| `/hip-hop` | `WebPage` + `FAQPage` + `ItemList` (moods) |
| `/hip-hop/mood/*` | `WebPage` + `FAQPage` + `MusicPlaylist` + `BreadcrumbList` |
| `/faq` | `WebPage` + `FAQPage` |
| `/app` | `SoftwareApplication` + `FAQPage` |
| `/artist-index` | `WebPage` + `FAQPage` + `ItemList` |
| `/artist-index/city/atlanta` | `CollectionPage` + `ItemList` + `FAQPage` + `BreadcrumbList` |
| `/artist-index/claim` | `WebPage` + `FAQPage` + `HowTo` |
| `/artist-index/{slug}` | `ProfilePage` + `MusicGroup` (`genre`, `foundingLocation`, `sameAs`) |
| `/watch/{id}` | `VideoObject` or `MusicVideoObject` + `SeekToAction` (plain URL template) + `BreadcrumbList` |
| `/profile/{user}` | `ProfilePage` + `Person` + `BreadcrumbList` |

**SeekToAction shape:** `target: "{pageUrl}?t={seek_to_second_number}"` (string, not `EntryPoint`).

---

## Recent SEO fixes (2026)

| Fix | Status |
|-----|--------|
| robots.txt named-bot Disallow parity | Done — verify prod after deploy |
| Hub vs Atlanta city meta descriptions differentiated | Done |
| Mood + referrar double `\| Hiffi` title bug | Fixed via absolute titles |
| `/community-guidelines` dedicated metadata | Done |
| `/support/reports/{id}` noindex metadata | Done |
| Atlanta flagship clause on `/about`, `/what-is-hiffi` | Done |
| Fan-out FAQ copy (hub, Atlanta, `/hip-hop`, moods) | Done |
| `contentUrl` MP4-only guard for watch SEO | Done |

---

## Known gaps & copy debt

| Item | Notes |
|------|-------|
| `public/llms.txt` + `content/llms/*.md` | Still contain “algorithmic gatekeeping” / “no algorithms” in places — HTML mood/hip-hop pages updated; AI mirrors pending alignment |
| Root layout + homepage meta | Still mention “no algorithmic interference” / “no algorithms” |
| `/faq` body + `content/llms/faq.md` | Same algorithm messaging |
| Genre pages in llms.txt | Not listed |
| Default OG image | Logo (`/hiffi_logo.png`) on most static pages — not 1200×630 campaign art |
| Static “800+” in FAQ/llms | Marketing copy; live Artist Index meta uses dynamic counts |

---

## Code reference map

| Concern | Primary files |
|---------|----------------|
| Route metadata helper | `lib/seo/route-metadata.ts` |
| Artist Index SEO | `lib/artist-directory-seo.ts` |
| Atlanta scene copy | `lib/artist-index/city-seo-content.ts` |
| Watch meta | `lib/seo/watch-meta.ts` · `lib/seo/schema.ts` |
| robots.txt | `lib/seo/robots-txt-core.ts` |
| Sitemap | `app/sitemap.ts` |
| llms.txt | `public/llms.txt` |
| AI ops playbook | `docs/ai-search-visibility-ops.md` |

---

*Generated from codebase inventory. Re-audit after major metadata or Artist Index copy changes.*
