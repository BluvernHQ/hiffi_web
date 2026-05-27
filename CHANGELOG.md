# Changelog

All notable product changes to the web app are documented here.

## [Unreleased]

### Changed
- UI revamp (in progress on `hiffi_dev_v2`)

## [2026-05-22]

### Added
- Guest conversion: local watch history and liked preview for signed-out users (no `/login` redirect)
- Passive signup nudges on watch (after ~60s, when recommendations are ready) and on engagement (like, follow)
- Pending like/follow intents stored locally and replayed after sign-in
- Admin activity logs: From/To date range (`timestamp_after` / `timestamp_before` on `GET /analytics/events`)

### Fixed
- Save to playlist: uncheck removes saved playlist on confirm; footer labeled “Save to playlist”; “Add” only counts new playlist adds

## [2026-05-16]

### Added
- Save to playlist flow (popover on desktop, bottom sheet on mobile) with search, multi-select, and new playlist creation

### Changed
- Playlist picker UI: bookmark icons for saved state, single sorted list (no section headers)
- Auth and general UX improvements

### Fixed
- Playlist name suggestion chips no longer show false “Title is required” on first click
- Save-to-playlist list scrolling in popover and mobile sheet
- Caching and connectivity-related issues
- Create-playlist emoji picker layout (portaled Popover)
- Save-to-playlist pending count and Add-button semantics
