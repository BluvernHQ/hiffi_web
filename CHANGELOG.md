# Changelog

All notable product changes to the web app are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/). Release versions match `package.json` and git tags `web-v*`.

## [Unreleased]

### Notes

- Track next work here after **v2.3.3** ships

## [2.3.3] — 2026-09-01

Release notes: [docs/releases/web-v2.3.3.md](docs/releases/web-v2.3.3.md) (business-friendly summary; **shipped September 1, 2026**)

### Fixed

- Watch player **Next** no longer stalls after the first skip — Up Next queue excludes the current video and session history so recommendations do not ping-pong between the same two clips
- Watch **Up Next** list refreshes correctly on in-place navigation (player stays mounted; related fetch no longer treats the previous video’s list as the new video’s seed)
- Recommendation cache clears when advancing with Next so a fresh seed is not blocked by stale prefetch data
- End-of-video autoplay uses in-place navigation (same as the player Next button) instead of a full route change
- Video.js `MEDIA_ERR_SRC_NOT_SUPPORTED` during source switches — removed empty `src` teardown that triggered console errors; tightened error handling during in-flight source changes
- Feed card hover preview no longer calls `flushSync` from mouse handlers (fixes React lifecycle warning on navigation)
- **Turnstile** disabled on `localhost` / `127.0.0.1` so local login and signup are not blocked when a site key is configured



## [2.3.2] — 2026-08-31

Release notes: [docs/releases/web-v2.3.2.md](docs/releases/web-v2.3.2.md) (business-friendly summary; **shipped August 31, 2026**)

### Added

- **Discovery source** on Artist Index claims — required dropdown on the claim form (search, email, Instagram, ChatGPT, other); stored on submit and visible in the admin inventory claims table



## [2.3.1] — 2026-08-15

Release notes: [docs/releases/web-v2.3.1.md](docs/releases/web-v2.3.1.md) (business-friendly summary; **ready to ship August 15, 2026**)

### Added

- Homepage **SSR discover snapshot** — streamed real video titles, thumbnails, and `/watch/` links for crawlers/cold loads; interactive `HomeFeedClient` (scroll restore, infinite scroll) unchanged
- **Send Feedback** entry in the main sidebar (same dialog as navbar / profile)
- Hiffi `/profile`: Artist Index link in About when the artist is listed in the Artist Index (opens in a new tab)



### Changed

- Production **robots.txt** simplified to YouTube-style single `User-agent: `* (Allow + Disallows + Sitemap); removed per-bot duplicates and non-standard `Host:`; added Disallow for `/maintenance`, `/test-hls`, `/support/reports/`
- Artist Index: hide **Watch on Hiffi** on unclaimed profiles
- Removed Next.js `/hiffi-500` route family (engineering cleanup; **do not ship/announce latest** `/top-artists`)



### Notes

- Latest `/top-artists` (Hip-Hop 500) remains out of scope for communications — hold for a dedicated ranking release



## [2.3.0] — 2026-08-13

Release notes: [docs/releases/web-v2.3.0.md](docs/releases/web-v2.3.0.md) (business-friendly summary; **shipped August 13, 2026**)

### Added

- **Feedback module** — user dialog with screenshot capture (navbar/profile), submit via `/proxy/feedback`; admin Feedback list + detail under `/proxy/admin-feedback`
- **Atlanta** editorial hubs: `/atlanta` plus genres, eras, best-of, venues, and studios (list + detail + OG images)
- Cloudflare **Turnstile** on auth flows (widget + token on auth endpoints)
- Sitemap routing: `sitemap.xml`, `sitemaps/[id]`, `video-sitemap.xml`, and related `lib/seo` helpers
- Session analytics proxies under `/proxy/analytics/sessions`



### Changed

- Artist Index: claim CTA / hero copy tweaks; verified badge repositioned on artist detail hero
- **Share** is a top-level action on home video cards and the watch page (moved out of the ⋯ menu); Report/Delete remain under more-actions



### Fixed

- Additional watch audio mute preference fix beyond the 2.2.3 Next/Previous mute behavior
- Feedback dialog responsive layout across screen sizes



### Notes

- **Not announced in this release:** latest `/top-artists` / Hip-Hop 500 (separate ranking launch)
- Out of scope: multi-platform HPS expansion, API/data licensing, index report, paid analytics
- Follow-up: **[v2.3.1 — August 15, 2026](docs/releases/web-v2.3.1.md)**



## [2.2.4] — 2026-07-16

Release notes: [docs/releases/web-v2.2.4.md](docs/releases/web-v2.2.4.md) (business-friendly summary)

### Added

- YouTube-style home navigation: navbar logo hard-reloads the discover feed (new shuffle seed, scroll to top, mood cleared)



### Fixed

- Home feed scroll and loaded videos are restored when returning from watch (and other routes) instead of resetting to the top
- Soft navigation back to home no longer shows a blocking “Loading…” state while the SSR feed refetch runs
- Home scroll no longer gets overwritten when opening watch (shorter page was clamping `#main-content` and saving that lower value)
- Home feed shows card skeletons while the first page loads instead of flashing “No videos yet”
- Watch **Up Next** loads faster: smaller related fetch (16 vs 50), instant seed from the home feed when opening a video, and hover prefetch from feed cards
- Home scroll is captured before the watch page zeroes the shared `#main-content` scroller (fixes Back restoring at top)



## [2.2.3] — 2026-07-14



### Fixed

- Watch player Next/Previous no longer forces mute after switching videos (preserves audio preference across in-place source changes)



## [2.2.2] — 2026-07-07



### Added

- Admin Artist Inventory detail sheet — click a row to view full description, social links, and profile metadata
- Artist Index social links now include TikTok and Facebook when available



### Fixed

- Artist Index profiles display inventory `bio` when provided, with the existing fallback copy when absent
- Admin inventory table lists all social platforms (Instagram, YouTube, TikTok, Facebook)



## [2.2.1] — 2026-07-06



### Fixed

- Send `signup_flow: "instant"` on `POST /auth/register` for instant creator signup



## [2.2.0] — 2026-06-29

Release notes: [docs/releases/web-v2.2.0.md](docs/releases/web-v2.2.0.md) (business-friendly summary)

### Added

- **Artist Index** at `/artist-index` — searchable directory hub, profile pages, claim flow, and community edit suggestions (`?edit=1`)
- Artist Index fed by gateway `GET /inventory` (live `artist_inventory` rows) instead of a static JSON seed
- Artist Index landing pages: `/artist-index/claim`, `/artist-index/city/[citySlug]`, `/artist-index/genre/[genreSlug]`
- Atlanta scene editorial guide at `/artist-index/city/atlanta/scene` (long-form SEO page separate from the city directory)
- Profile claim submission via `POST /inventory/claims` (BFF at `/api/inventory/claims`)
- Admin **Artist Inventory** (`/admin/dashboard?section=artist_inventory`) — browse, CSV/Excel upload with progress, template download, CSV export, and claims review queue
- Home feed hover video preview — muted card previews with user audio preference and preview URL warming
- HiFFi-branded default profile cover banner (`ProfileCoverBanner`) — unique gradient art per creator (username + display name)
- Watch page crawler-visible video + poster in initial HTML (`WatchCrawlerVideo`) for richer indexing signals
- Artist Index JSON-LD, expanded sitemap coverage, and `content/llms/artist-index` discovery docs
- Optional first-party API analytics (`/proxy/tracker.js`, gated by `NEXT_PUBLIC_API_ANALYTICS`)
- `HIFFI_SERVER_READ_BEARER` for server-side profile OG/schema enrichment
- Admin sidebar **View site** link (opens the public site using the current deployment host)
- Playlist picker prefetch cache — warms the signed-in user’s playlist list before opening Save to playlist
- Video profile resolution (`original_profile` + `profiles`) for quality menus and playback fallbacks
- Internal docs: analytics journey tracking spec and on-page SEO marketing runbook
- **Batch analytics playback attribution** — session-scoped context for open source, navigate trigger (Up Next, playlist queue, player next, overlay autoplay), and click vs autoplay on `conversion_play_started`
- Stable video analytics UI names (`lib/analytics/video-analytics-names.ts`) for watch player, Up Next sidebar, playlist queue, and overlay controls
- Activity Logs context tags (`autoplay`, `source:*`, `nav:*`, `start:*`) and clearer human titles for playback and video-open events



### Changed

- Artist Index route renamed from `/artistindex` to `/artist-index` (redirects in `next.config.mjs`)
- Artist Index hub uses filter pills, intro copy, FAQ, and a curved card grid directory (no hero carousel or rankings table)
- Artist directory cards no longer show link count or `0 Videos` stats bar
- Artist detail pages hide empty total reach, `0 Hiffi Videos`, and the public “Suggest an edit” CTA (edit mode remains via `?edit=1`)
- Default profile cover shows personalized banner art when the creator has not uploaded a custom image
- Watch page actions: **Save to playlist** is a top-level button; **Share** moved into the more (⋯) menu
- Save to playlist on watch uses a popover anchored to the save button (not a full-screen dialog)
- Watch Up Next sidebar uses dedicated analytics tag `up-next-sidebar-click` (distinct from generic recommendations)
- Video player control analytics standardized (`played-video`, `paused-video`, `player-next-recommended`, `player-previous`)
- Creator Playbook expanded with YouTube-style guidance; removed monetization/sample-work steps
- Studio YouTube migration no longer requires Google channel verification (simplified migrate form)
- Marketing copy: instant creator access for hip-hop/rap artists (no application wait) on Artists, FAQ, How it Works, and What is Hiffi
- Hip-hop hub and Artists pages: removed algorithm gatekeeping and monetization claims
- Advertising page section title: “Brand safety & transparency” (fixed `&` entity)
- What is Hiffi: removed outdated Kinimi Corporation reference
- `ConversionSource` extended for mood mix, liked, history, feed preview, and unknown attribution paths



### Fixed

- Save to playlist picker on watch: popover no longer pins to the viewport corner; header and footer stay visible while the playlist list scrolls (Radix available-height constraint)
- Login and signup **Skip** no longer loops back to login when the redirect target requires auth (e.g. My reports → Support)
- Video player infinite React update loop when resolving playback profiles
- Video playback and SEO fetch aligned with gateway `video_url`, stable paths, and `original_profile` transcodes
- Admin inventory search field stays mounted while results load (spinner in field + table overlay)
- Admin inventory upload: staged file review before import, upload progress, and leave/cancel warnings during active imports



### Removed

- Static `lib/data/artists.json` artist seed (replaced by inventory API)
- Artist Index hero carousel, rankings table, similar-profiles spotlight, and suggest-edit sidebar bar
- YouTube Google OAuth channel verification utilities from Studio migration
- Hip-hop hub “No Algorithmic Gatekeeping” card and related copy
- Monetization promises from Artists page and creator onboarding copy



## [2.1.0] — 2026-06-23



### Added

- Hiffi Studio (`/studio`) — creator hub with drag-and-drop upload and YouTube content migration
- Brand collaboration intake at `/collaborate` wired to backend API (`POST /collaboration/`)
- Hip-hop SEO hub at `/hip-hop` and seven mood subgenre landing pages
- Marketing pages: About, What is Hiffi, How it Works, Advertising, Artists, Creator Playbook, Creators for Change, Press, Copyright, Community Guidelines
- Separate admin authentication (`POST /admin/auth/login`) with isolated `hiffi_admin_token` storage
- Admin roles: `super_admin`, `curator`, `read_only` with permission-gated dashboard navigation
- Curated playlists admin UI (`/admin/dashboard?section=curated_playlists`) — create, edit, reorder, delete
- Admin account management (`/admin/dashboard?section=admins`) — invite + list admins
- Admin password reset (`/admin/forgot-password`) and invite verification (`/admin/verify-invite`)
- Admin collaboration inquiries table (`GET /admin/collaboration-inquiries`)
- Admin RBAC with permission-gated sidebar and sections: Followers, Searches, Migration Requests
- AI/GEO discovery: expanded `llms.txt`, markdown registry, citation bot rules, hip-hop-first site metadata



### Changed

- Upload flow moved from `/upload` to `/studio/tools/upload` (permanent redirects)
- Site footer reorganized with Discover, Business, and Creators columns
- Homepage, search, FAQ, creator apply, and profile metadata aligned to hip-hop positioning
- Third-party analytics (Clarity, GA, Umami) excluded from admin surfaces
- **Breaking:** Admin dashboard no longer uses consumer `POST /auth/login` or `user.role === "admin"`
- Admin API calls use `adminApiClient` with admin JWT only; consumer `apiClient` unchanged
- Public curated playlists no longer expose `owner_uid` in API mappers
- User playlists page copy clarified as personal playlists (not curated editorial)
- YouTube migration form simplified — removed Google OAuth channel verification step



### Removed

- Legacy `/api/collab` route and email-based collaboration intake
- `forceAdminDashboardRedirect` from consumer auth flow
- Admin role from creator upload/studio permissions (admins are a separate principal)



## [2.0.2] — 2026-06-16



### Added

- App versioning: `/api/version` endpoint, build ID injection, deploy stale guard, and `RELEASES.md` runbook



### Changed

- Comment input avatar alignment; view counts hidden below 10k
- Active mood bar close control replaced with back button



## [2.0.1] — 2026-06-16



### Added

- Guest conversion: local watch history and liked preview for signed-out users
- Passive signup nudges on watch and engagement (like, follow)
- Pending like/follow intents replayed after sign-in
- Admin activity logs date range filters
- Mood-based playlists and active mood bar



### Changed

- Save to playlist flow improvements (popover / bottom sheet)
- Comment section and flag/report UX updates



### Fixed

- Save to playlist uncheck/removal semantics
- Playlist picker scrolling and emoji picker layout
- Connectivity and caching issues



## [1.0.1] — 2026-05-22



### Fixed

- Save to playlist: uncheck removes saved playlist on confirm
- Footer labeled “Save to playlist”; “Add” only counts new playlist adds



## [1.0.0] — 2026-05-16



### Added

- Save to playlist flow with search, multi-select, and new playlist creation



### Changed

- Playlist picker UI: bookmark icons, single sorted list
- Auth and general UX improvements



### Fixed

- Playlist name suggestion chips false validation
- Create-playlist emoji picker layout

