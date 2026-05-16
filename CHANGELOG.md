# Changelog

All notable web releases are documented here. Tags use the format `web-vMAJOR.MINOR.PATCH`.

## [2.0.0] - Unreleased

### Changed
- UI revamp (in progress on `hiffi_dev_v2`)

### Fixed
- Save to playlist: “Add” button only enables for new playlist adds; unchecking already-saved rows no longer shows a false count

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
[1.0.0]: https://github.com/BluvernHQ/hiffi_web/releases/tag/web-v1.0.0
