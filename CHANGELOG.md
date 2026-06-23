# Changelog

All notable product changes to the web app are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/). Release versions match `package.json` and git tags `web-v*`.

## [Unreleased]

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

