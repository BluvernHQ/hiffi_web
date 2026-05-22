# Changelog

All notable web releases are documented here. Tags use the format `web-vMAJOR.MINOR.PATCH`.

## [2.0.0] - Unreleased

### Added
- Guest conversion: local watch history and liked preview for signed-out users (no `/login` redirect)
- Passive signup nudges on watch (after ~60s, when recommendations are ready) and on engagement (like, follow)
- Pending like/follow intents stored locally and replayed after sign-in

### Changed
- UI revamp (in progress on `hiffi_dev_v2`)

### Fixed
- Save to playlist: uncheck removes saved playlist on confirm; footer labeled “Save to playlist”; “Add” only counts new playlist adds

## [1.0.1] - 2026-05-16

Tag `web-v1.0.1` on `release/1.0.0`. Patch-only: save-to-playlist pending count and Add-button semantics.

### Fixed
- Correct pending count when toggling playlists in save-to-playlist dialog
- “Add” button only counts new playlist adds (not rows already saved)

## [1.0.0] - 2026-05-16

Frozen at tag `web-v1.0.0` / branch `release/1.0.0`. Use these to roll back dev or prod to pre-revamp behavior.

### Added
- Save to playlist flow (popover on desktop, bottom sheet on mobile) with search, multi-select, and new playlist creation
- Web release versioning (`package.json`, `/api/version`, release docs)

### Changed
- Playlist picker UI: bookmark icons for saved state, single sorted list (no section headers)
- Auth and general UX improvements

### Fixed
- Playlist name suggestion chips no longer show false “Title is required” on first click
- Save-to-playlist list scrolling in popover and mobile sheet
- Caching and connectivity-related issues
- Create-playlist emoji picker layout (portaled Popover)

[2.0.0]: https://github.com/BluvernHQ/hiffi_web/compare/web-v1.0.0...hiffi_dev_v2
[1.0.1]: https://github.com/BluvernHQ/hiffi_web/releases/tag/web-v1.0.1
[1.0.0]: https://github.com/BluvernHQ/hiffi_web/releases/tag/web-v1.0.0
