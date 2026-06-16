# Changelog

All notable product changes to the web app are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/). Release versions match `package.json` and git tags `web-v*`.

## [Unreleased]

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
