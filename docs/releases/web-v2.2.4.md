# Hiffi Web — Release notes (v2.2.4)

**Release date:** July 16, 2026  
**Version:** 2.2.4

---

## In one sentence
YouTube-style home navigation plus fixed scroll/state restoration across Watch-related routes, with a faster **Up Next** experience.

---

## Why this release matters
- **Less “where am I?” confusion**: returning from Watch restores the feed position and loaded videos instead of resetting to the top.
- **Smoother navigation**: soft navigation back to home no longer shows a blocking loading state during the SSR refetch.
- **Snappier replay flow**: **Up Next** loads faster with smaller related fetches and better pre-seeding.

---

## Added
- YouTube-style home navigation: navbar logo hard-reloads the discover feed (new shuffle seed, scroll to top, mood cleared)

---

## Fixed
- Home feed scroll and loaded videos are restored when returning from watch (and other routes) instead of resetting to the top
- Soft navigation back to home no longer shows a blocking “Loading…” state while the SSR feed refetch runs
- Home scroll no longer gets overwritten when opening watch (shorter page was clamping `#main-content` and saving that lower value)
- Home feed shows card skeletons while the first page loads instead of flashing “No videos yet”
- Watch **Up Next** loads faster: smaller related fetch (16 vs 50), instant seed from the home feed when opening a video, and hover prefetch from feed cards
- Home scroll is captured before the watch page zeroes the shared `#main-content` scroller (fixes Back restoring at top)

