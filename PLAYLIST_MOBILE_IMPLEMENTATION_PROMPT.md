# Mobile Playlist Feature Parity - Implementation Prompt

You are implementing **Playlist** support in the mobile app with feature parity to the current web implementation.

## Objective

Deliver a production-ready mobile playlist experience that supports:

1. Playlist management screen (`My Playlists` + playlist detail).
2. Add-to-playlist flow from watch page.
3. Playback continuity for playlist sessions (next/previous/autoplay/up-next within a playlist).
4. Full CRUD operations and item-level management.
5. Robust loading, empty, error, and auth states.

Do not ship a subset. Match the behavior and edge-case handling described below.

---

## Existing Backend/API Contract (Use Exactly)

Use these endpoints already wired in web:

- `GET /playlists/list/self` -> list current user playlists
- `GET /playlists/{playlistId}` -> playlist metadata + ordered items
- `POST /playlists/create` with `{ title, description?, video_id }` -> create + seed first item
- `PUT /playlists/{playlistId}` with `{ title?, description? }` -> update metadata
- `DELETE /playlists/{playlistId}` -> delete playlist
- `POST /playlists/{playlistId}/items/add` with `{ video_id }` -> add video to playlist
- `DELETE /playlists/{playlistId}/items/{videoId}` -> remove item

Notes:

- All endpoints are authenticated user scope (owner-only behavior).
- Handle non-uniform success payloads defensively (web normalizes success using either `success` or `status === "success"` patterns).
- Playlist items must be shown in ascending `position` order.

---

## Data Model Requirements

Implement/align these client-side types:

- `PlaylistSummary`
  - `playlist_id: string`
  - `title: string`
  - `description?: string`
  - `item_count?: number`
  - `updated_at?: string`

- `PlaylistItem`
  - `video_id: string`
  - `position: number`

- `PlaylistSession` (persist in session-scoped storage)
  - `playlistId: string`
  - `title?: string`
  - `videoIds: string[]`
  - `currentIndex: number`
  - `autoplay: boolean`

Storage behavior:

- Persist active playlist session under one stable key (web uses `hiffi_playlist_session`).
- Read/write failures should not crash app.
- Validate shape before using persisted session.

---

## Feature Requirements

## 1) My Playlists (Overview Screen)

Build a screen showing all user playlists with:

- Header/title: `My playlists`.
- Card/list item per playlist:
  - Title
  - Description fallback if empty
  - Video count
  - Last updated relative time
  - Thumbnail stack preview from representative videos (up to 4; if >4 total, show 3 + count affordance style)
- Tap playlist card -> open playlist detail.
- Quick play affordance on each playlist card:
  - Loads playlist
  - Starts playback from first item
  - Seeds playlist session and navigates to watch player with playlist context.

Required states:

- Loading skeleton.
- Empty state: `No playlists yet` + guidance to add from watch page.
- Error toast/snackbar on fetch failure.
- 401/unauthenticated -> route to login (or auth gate).

Data behavior:

- Fetch playlist list on entry.
- Fetch lightweight preview data per playlist by loading playlist detail once and extracting first representative `video_id`s.
- Fetch video metadata/thumbnails for preview IDs.

---

## 2) Playlist Detail Screen

When a playlist is selected:

- Show detail hero/header:
  - Title
  - Description
  - Video count
  - Updated time
  - Play button
  - Edit playlist action
  - Overflow action for delete
- Show ordered list of playlist items:
  - Row index (1-based)
  - Thumbnail
  - Video title (resolved via video lookup fallback to `video_id`)
  - Subtitle:
    - Item 1: `Start of playlist`
    - Else: `Track X of N`
  - Row actions:
    - Play from this video (start session at that index)
    - Remove from playlist

Required actions:

- **Play playlist** -> start from first video.
- **Play from item** -> start from tapped item index.
- **Edit metadata**:
  - Update title (required)
  - Update description (optional)
  - Prevent empty title submit
  - On save success update detail + overview list state
- **Delete playlist**:
  - Confirmation dialog
  - On success:
    - close detail
    - refresh playlist list
    - show success feedback
- **Remove item**:
  - Disable duplicate remove while pending per item
  - On success update item list and decrement playlist count in overview state
  - Show success/error feedback

Required states:

- Detail loading state.
- Not-found state (playlist deleted/missing).
- Empty playlist detail state with CTA back to discover/watch videos.

---

## 3) Add To Playlist Flow (From Watch Page)

From watch screen actions, provide `Add to playlist` entry point.

Entry behavior:

- Opens modal/bottom sheet based on device idiom.
- Receives current `videoId`, optional `videoTitle`, optional `thumbnailUrl`.

Default step: **Pick existing playlist**

- Fetch user playlists when opened.
- Search field with debounce (about 250-300ms).
- Filter by playlist title case-insensitively.
- Virtualized/perf-friendly list for large playlist counts.
- Each row supports:
  - add action
  - in-progress indicator for selected target
  - temporary success checkmark state (`Added`) after completion

Secondary step: **Create new playlist**

- Form fields:
  - Title (required)
  - Description (optional)
- Submit calls create endpoint with current `video_id`.
- On success show confirmation and close flow.
- On failure show error feedback.

Navigation/actions inside dialog:

- `Manage playlists` link routes to playlists management screen.
- `Done/Cancel` close behavior.

Required empty/error/auth states:

- No playlists yet: encourage create-first flow.
- No search matches: show explicit filtered-empty message.
- 401 on list fetch: show sign-in-required feedback and close dialog.
- Add/create failures show contextual error messages.

---

## 4) Playlist Session + Watch Player Integration

Playlist behavior on watch screen must match parity:

- If URL/route has playlist context (`playlist` + optional `pindex`) or equivalent navigation params:
  - Resolve session from storage if matching playlist and valid IDs.
  - Otherwise fetch playlist, build ordered `videoIds`, and seed session.
- Keep session `currentIndex` in sync with current video.
- Ensure player next/previous buttons honor playlist queue before generic recommendations.
- On video end:
  - If playlist has next item and `autoplay=true`, advance to next playlist video.
  - Else fallback to normal recommendation autoplay behavior.
- Render active playlist module in sidebar/below player:
  - Playlist title
  - Position badge (`currentIndex + 1 / total`)
  - Tap any item to jump to that index
  - Status tags: `Now playing`, `Played`, `Up next`
- Prefetch metadata (title/thumb) for current + next few playlist items to avoid blank queue rows.

Navigation requirements:

- Deep links into watch with playlist context should restore playlist queue.
- In-session navigation updates route params so state is shareable/restorable.

---

## 5) UX/State Management Standards

Implement optimistic/reactive updates where web does:

- After metadata save -> update both detail and overview representations.
- After remove item -> update counts and `updated_at`.
- After playlist changes -> bump updated playlist to top of overview list.

Global handling:

- Prevent duplicate submissions (create/add/remove/edit/delete).
- Use per-action loading states, not one global blocker.
- Preserve usability when one network call fails (localized failure).
- Show concise success toasts and descriptive destructive toasts.

---

## 6) Performance/Scalability Requirements

- Virtualize large playlist lists in add-to-playlist picker.
- Batch or chunk video metadata enrichment requests (web uses small chunks).
- Cache lightweight video metadata in-memory keyed by `video_id`.
- Avoid redundant playlist refetch loops.
- Debounce text search input in picker.

---

## 7) Accessibility + Product Quality

- All icon-only actions need accessibility labels.
- Dialogs/sheets must have proper titles/descriptions for screen readers.
- Touch targets should be mobile-friendly (min ~44pt).
- Preserve keyboard/focus behavior where platform allows.
- Avoid layout shift during async state transitions.

---

## 8) Analytics/Tracking (If Mobile App Has Existing Analytics)

Emit events for at least:

- `playlist_list_viewed`
- `playlist_detail_viewed`
- `playlist_play_started`
- `playlist_item_play_started`
- `playlist_created`
- `playlist_deleted`
- `playlist_item_added`
- `playlist_item_removed`
- `playlist_metadata_updated`
- `add_to_playlist_opened`
- `add_to_playlist_search`

Include `playlist_id`, `video_id`, position, and source surface where available.

---

## 9) Implementation Deliverables

1. Playlist list + detail screens with all actions.
2. Add-to-playlist modal/sheet flow in watch screen.
3. Playlist session persistence and watch-player integration.
4. API client methods wired to existing endpoints.
5. Loading/empty/error/auth states for every major action.
6. Unit/integration tests for core reducers/state helpers and API behavior.
7. QA checklist and demo notes.

---

## 10) Definition of Done (Must Pass)

- Feature parity with current web playlist behavior (no missing core flow).
- User can:
  - Create playlist with first video from watch.
  - Add video to existing playlist.
  - Manage playlists (view/edit/delete).
  - Remove specific items.
  - Start playback from playlist start or arbitrary item.
  - Continue playlist with next/previous/autoplay logic.
- Session survives within app session and correctly restores queue/index.
- All edge states handled (auth, empty, not found, network failure).
- No critical regressions in watch page playback UX.

---

## Suggested Build Order

1. API + type layer.
2. Playlist session storage helper.
3. Playlist overview/detail screens.
4. Add-to-playlist flow from watch.
5. Watch player playlist queue integration.
6. Optimistic updates, polish, accessibility.
7. Tests + QA.

---

## Important Parity Notes

- Preserve the distinction between:
  - Playlist-specific queue/autoplay
  - General recommendation queue/autoplay
- Keep playlist item ordering deterministic by `position`.
- Do not fail hard if playlist context hydration fails; watch page must still work without playlist context.
- Creating playlist from add flow must automatically add the current video as first item.

