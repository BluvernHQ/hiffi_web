# Changelog

All notable product changes to the web app are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/). Release versions match `package.json` and git tags `web-v*`.

## [Unreleased]

### Added

- Separate admin authentication (`POST /admin/auth/login`) with isolated `hiffi_admin_token` storage
- Admin roles: `super_admin`, `curator`, `read_only` with permission-gated dashboard navigation
- Curated playlists admin UI (`/admin/dashboard?section=curated_playlists`) — create, edit, reorder, delete
- Admin account management (`/admin/dashboard?section=admins`) — invite + list admins
- Admin password reset (`/admin/forgot-password`) and invite verification (`/admin/verify-invite`)
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

### Changed

- **Breaking:** Admin dashboard no longer uses consumer `POST /auth/login` or `user.role === "admin"`
- Admin API calls use `adminApiClient` with admin JWT only; consumer `apiClient` unchanged
- Artist Index route renamed from `/artistindex` to `/artist-index` (redirects in `next.config.mjs`)
- Artist Index hub uses filter pills, intro copy, FAQ, and a curved card grid directory (no hero carousel or rankings table)
- Artist directory cards no longer show link count or `0 Videos` stats bar
- Artist detail pages hide empty total reach, `0 Hiffi Videos`, and the public “Suggest an edit” CTA (edit mode remains via `?edit=1`)
- Default profile cover shows personalized banner art when the creator has not uploaded a custom image
- Public curated playlists no longer expose `owner_uid` in API mappers
- User playlists page copy clarified as personal playlists (not curated editorial)
- Watch page actions: **Save to playlist** is a top-level button; **Share** moved into the more (⋯) menu
- Save to playlist on watch uses a popover anchored to the save button (not a full-screen dialog)
- Creator Playbook expanded with YouTube-style guidance; removed monetization/sample-work steps
- Studio YouTube migration no longer requires Google channel verification (simplified migrate form)
- Marketing copy: instant creator access for hip-hop/rap artists (no application wait) on Artists, FAQ, How it Works, and What is Hiffi
- Hip-hop hub and Artists pages: removed algorithm gatekeeping and monetization claims
- Advertising page section title: “Brand safety & transparency” (fixed `&amp;` entity)
- What is Hiffi: removed outdated Kinimi Corporation reference

### Fixed

- Save to playlist picker on watch: popover no longer pins to the viewport corner; header and footer stay visible while the playlist list scrolls (Radix available-height constraint)
- Login and signup **Skip** no longer loops back to login when the redirect target requires auth (e.g. My reports → Support)
- Video player infinite React update loop when resolving playback profiles
- Video playback and SEO fetch aligned with gateway `video_url`, stable paths, and `original_profile` transcodes
- Admin inventory search field stays mounted while results load (spinner in field + table overlay)
- Admin inventory upload: staged file review before import, upload progress, and leave/cancel warnings during active imports

### Removed

- `forceAdminDashboardRedirect` from consumer auth flow
- Admin role from creator upload/studio permissions (admins are a separate principal)
- Static `lib/data/artists.json` artist seed (replaced by inventory API)
- Artist Index hero carousel, rankings table, similar-profiles spotlight, and suggest-edit sidebar bar
- YouTube Google OAuth channel verification utilities from Studio migration
- Hip-hop hub “No Algorithmic Gatekeeping” card and related copy
- Monetization promises from Artists page and creator onboarding copy

## [2.1.0] — 2026-06-22

### Added

- Hiffi Studio (`/studio`) — creator hub with drag-and-drop upload and YouTube content migration
- Brand collaboration intake at `/collaborate` with email notifications
- Hip-hop SEO hub at `/hip-hop` and seven mood subgenre landing pages
- Marketing pages: About, What is Hiffi, How it Works, Advertising, Artists, Creator Playbook, Creators for Change, Press, Copyright, Community Guidelines
- Admin RBAC with permission-gated sidebar and new sections: Followers, Searches, Migration Requests
- AI/GEO discovery: expanded `llms.txt`, citation bot rules, hip-hop-first site metadata

### Changed

- Upload flow moved from `/upload` to `/studio/tools/upload` (permanent redirects)
- Site footer reorganized with Discover, Business, and Creators columns
- Homepage, search, FAQ, creator apply, and profile metadata aligned to hip-hop positioning
- Third-party analytics (Clarity, GA, Umami) excluded from admin surfaces

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

