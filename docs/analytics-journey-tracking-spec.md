# Analytics Journey Tracking — Product & Engineering Spec

**Status:** Draft for team review  
**Audience:** Frontend, backend, data/analytics, product  
**Scope:** Search, mood-based playlists, home-feed hover preview, and downstream engagement (like, comment, follow artist)

---

## 1. Purpose

Today we ingest many raw click and pageview events into a general **Activity Logs** stream. That is useful for debugging but **not sufficient** for product questions such as:

- Which search queries lead to plays, likes, comments, or follows?
- At which result position do users drop off?
- Do users finish a mood mix playlist, or leave after track 2?
- Does the home-feed hover preview drive full watches and engagement?

This spec defines a **journey-based analytics model**: structured events tied together by a shared session identifier, analyzed in **dedicated admin views** (separate from Activity Logs).

---

## 2. Goals & non-goals

### Goals

- Track full funnels for **search** and **mood playlists** end-to-end.
- Attribute **like**, **comment**, and **follow artist** actions back to the surface and session that led to the watch page.
- Measure **hover preview** usage and its conversion to watch + engagement.
- Give backend a clear **event catalog**, **property schema**, and **read APIs / queries** for dashboards.

### Non-goals (v1)

- Replacing existing server-side search query logging (keep it; extend with joins).
- Real-time sub-second dashboards (batch / near-real-time is fine).
- Mobile app implementation details (same event contract applies cross-platform).
- Replacing autocapture `$click` events (they remain for debugging).

---

## 3. Architecture overview

```
┌─────────────┐     semantic events      ┌──────────────────┐
│  Web client │ ───────────────────────► │  Ingest API      │
│  (tracker)  │   journey_id + props     │  POST /events/*  │
└─────────────┘                          └────────┬─────────┘
                                                  │
                                                  ▼
                                         ┌──────────────────┐
                                         │  Event store     │
                                         │  (e.g. CH)       │
                                         └────────┬─────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    ▼                             ▼                             ▼
           Activity Logs (debug)        Search funnel admin          Mood mix admin
           Feed preview admin            Engagement attribution       (future BI export)
```

### Design principles

1. **Semantic events over clicks** — Funnel steps use explicit event names (`search_result_selected`), not inferred `$click` chains.
2. **One journey ID per intent** — A UUID created when the user starts search or enters a playlist session; propagated to all downstream events until the journey ends.
3. **Stable property names** — Same keys across web (and future mobile); documented below.
4. **Separate admin surfaces** — Funnel dashboards are not mixed into Activity Logs filters.
5. **Idempotency-friendly** — Clients may retry; backend should dedupe on `(event_id)` when provided.

---

## 4. Shared identifiers & context

Every journey event SHOULD include:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event` | string | yes | Event name (see catalogs below) |
| `distinct_id` | string | yes | Anonymous or logged-in user id |
| `session_id` | string | yes | Browser session (existing tracker session) |
| `platform` | string | yes | `web`, `ios`, `android`, etc. |
| `timestamp` | ISO8601 | yes | Client or server time |
| `event_id` | UUID | recommended | Client-generated id for dedupe |
| `journey_id` | UUID | yes* | Ties funnel steps together (*except global events) |
| `surface` | enum | yes | Where the journey started (see below) |
| `path` | string | yes | Current URL path |
| `app_version` | string | recommended | Client release label |

### `surface` enum (v1)

| Value | Meaning |
|-------|---------|
| `search_overlay` | Full-screen / modal search before results page |
| `search_page` | Dedicated search results page |
| `mood_mix` | Mood-based playlist flow |
| `home_feed` | Default home feed (incl. hover preview) |
| `playlist` | Non-mood playlist (user or curated) |
| `recommended` | Watch recommendations / unrelated entry |

### `journey_id` lifecycle

| Surface | Created when | Cleared when |
|---------|--------------|--------------|
| Search | Search overlay opens OR user lands on search page with a query | Journey end event, tab close, or new search replaces id |
| Mood mix | User selects a mood / starts mood mix playback | User exits playlist mode, dismisses mood bar, or leaves watch without playlist context |
| Home feed preview | Optional lightweight id when preview starts | Cleared after watch open or 30 min idle |

**Rule:** When user opens a video from search or mood mix, **copy `journey_id` + `surface` + context props** into watch-page events (play, progress, like, comment, follow).

---

## 5. Engagement attribution (like, comment, follow)

These actions MUST be trackable as part of search and mood journeys—not only as isolated clicks.

### Required engagement events

| Event | When fired | Required properties |
|-------|------------|---------------------|
| `video_liked` | User likes/saves a video | `video_id`, `journey_id`, `surface`, `action: like \| unlike` |
| `video_commented` | User successfully posts a comment | `video_id`, `journey_id`, `surface`, `comment_id` (if available) |
| `artist_followed` | User follows creator from watch (or profile opened from that watch) | `artist_username`, `video_id`, `journey_id`, `surface`, `action: follow \| unfollow` |

### Context props (include when available)

| Property | Description |
|----------|-------------|
| `search_query` | Normalized query text if journey started from search |
| `search_result_position` | 0-based index of chosen result |
| `search_result_type` | `video` \| `user` |
| `playlist_id` | Mood or other playlist id |
| `playlist_type` | `mood` \| `user` \| `curated` |
| `playlist_track_index` | 0-based index of current video in queue |
| `playlist_queue_length` | Total videos in session queue |
| `mood_slug` | Stable slug for mood (e.g. `blue-hours`) |
| `entry_video_id` | First video that opened the journey |

### Attribution rules

1. If watch page was opened from search → all engagement events on that watch carry `surface: search_overlay` or `search_page` and `search_query`.
2. If watch page was opened from mood mix → engagement events carry `surface: mood_mix`, `playlist_type: mood`, `playlist_id`, `playlist_track_index`.
3. If user likes/comments/follows **after** navigating to a unrelated video (no journey context) → emit without `journey_id` or with `surface: recommended`.
4. **Unlike / unfollow** should emit the same event with `action: unlike` / `action: unfollow` for funnel integrity.

---

## 6. Search funnel — event catalog

### 6.1 Session & query

| Event | Description | Key properties |
|-------|-------------|----------------|
| `search_session_started` | User opens search UI | `entry_point: navbar \| keyboard_shortcut`, `journey_id` |
| `search_query_submitted` | User commits a query (Enter, tap suggestion, view all) | `query`, `via: enter \| suggestion \| recent \| trending \| view_all` |
| `search_results_shown` | Results rendered | `query`, `video_count`, `user_count`, `latency_ms` |

*Note: Server-side search logging (existing) continues to record API-level searches. Client events add **UI choice** and **downstream behavior**.*

### 6.2 Result selection

| Event | Description | Key properties |
|-------|-------------|----------------|
| `search_result_selected` | User picks one result | `query`, `result_type: video \| user`, `result_id`, **`result_position`** (0-based), `results_shown`, `from: overlay \| search_page` |

### 6.3 Watch & playback

| Event | Description | Key properties |
|-------|-------------|----------------|
| `video_opened` | Navigation to watch page | `video_id`, `journey_id`, `surface`, `search_query`, `search_result_position`, `search_result_type` |
| `video_play_started` | First play per video per session | Same as above + `is_autoplay: bool` |
| `video_progress` | Milestone reached (once each) | `video_id`, `percent: 25 \| 50 \| 75 \| 90`, `journey_id`, search/mood context |
| `video_completed` | ≥90% watched or natural end | `video_id`, `watch_percent`, `watch_seconds`, journey context |

### 6.4 Session end

| Event | Description | Key properties |
|-------|-------------|----------------|
| `search_session_ended` | Overlay closed or user leaves without selecting | `reason: dismissed \| timeout \| navigated_away`, `duration_ms`, `had_selection: bool` |

### 6.5 Search funnel metrics (for dashboards)

| Metric | Definition |
|--------|------------|
| Search → select rate | `search_result_selected` / `search_query_submitted` |
| Select → play rate | `video_play_started` / `search_result_selected` (same `journey_id`) |
| Play → like rate | `video_liked` (action=like) / `video_play_started` |
| Play → comment rate | `video_commented` / `video_play_started` |
| Play → follow rate | `artist_followed` (action=follow) / `video_play_started` |
| Position CTR | `search_result_selected` grouped by `result_position` |
| Zero-result rate | Server search logs where `result_count = 0` |

---

## 7. Mood-based playlist funnel — event catalog

### 7.1 Discovery & start

| Event | Description | Key properties |
|-------|-------------|----------------|
| `mood_picker_opened` | Mood selection UI shown | `journey_id` (optional pre-session) |
| `mood_mix_started` | User selects a mood | `mood_slug`, `mood_label`, `video_count`, `journey_id` |
| `mood_mix_play_clicked` | User taps Play on active mood bar | `mood_slug`, `first_video_id`, `journey_id` |

### 7.2 Playlist session (watch queue)

| Event | Description | Key properties |
|-------|-------------|----------------|
| `playlist_session_started` | Watch enters playlist mode | `playlist_id`, `playlist_type: mood`, `mood_slug`, `queue_length`, `entry_track_index`, `entry_video_id`, `journey_id` |
| `playlist_track_started` | A track begins (incl. autoplay) | `playlist_id`, `playlist_type`, `track_index`, `video_id`, `autoplay: bool`, `journey_id` |
| `playlist_track_advanced` | User moves to next/prev or autoplay | `from_index`, `to_index`, `reason: next_button \| prev_button \| autoplay \| manual_pick`, `journey_id` |
| `playlist_track_completed` | Single track ≥90% or end | `track_index`, `video_id`, `watch_percent`, `journey_id` |
| `playlist_session_ended` | User leaves playlist context | `last_track_index`, `tracks_started`, `tracks_completed`, `exit_reason: left_watch \| mood_dismissed \| tab_closed`, `journey_id` |

### 7.3 Engagement on mood journey

Same events as §5 (`video_liked`, `video_commented`, `artist_followed`) with:

- `surface: mood_mix`
- `playlist_type: mood`
- `playlist_id`, `playlist_track_index`, `mood_slug`

### 7.4 Mood funnel metrics

| Metric | Definition |
|--------|------------|
| Mood start → play rate | `playlist_session_started` / `mood_mix_started` |
| Avg tracks before exit | `avg(last_track_index)` at `playlist_session_ended` |
| Full playlist completion | `playlist_session_ended` where `last_track_index = queue_length - 1` |
| Like/comment/follow per mood | Engagement events grouped by `mood_slug` |
| Drop-off curve | Histogram of `last_track_index` at session end |

---

## 8. Home-feed hover preview

### Events

| Event | Description | Key properties |
|-------|-------------|----------------|
| `feed_preview_started` | Hover preview begins | `video_id`, `card_position`, `audio_enabled: bool`, `path` |
| `feed_preview_ended` | Preview stops | `video_id`, `watched_seconds`, `audio_enabled`, `card_position` |
| `feed_preview_unmute` | User unmutes preview | `video_id` |

### Attribution to watch & engagement

When user clicks through to watch within **30 minutes** of preview on the **same video**:

- `video_opened` should include `surface: home_feed`, `preview_attributed: true`, `preview_watched_seconds`
- Subsequent like / comment / follow include the same flags

### Preview metrics

| Metric | Definition |
|--------|------------|
| Preview adoption | Unique users with `feed_preview_started` / DAU |
| Avg preview duration | `avg(watched_seconds)` on `feed_preview_ended` |
| Preview → watch CTR | `video_opened` with `preview_attributed` / `feed_preview_started` |
| Preview → engagement | Like/comment/follow rate among preview-attributed watches |

---

## 9. Backend requirements

### 9.1 Ingest

- Accept all events listed above via existing batch ingest (`POST /analytics/events/batch`).
- Store **`journey_id`** and engagement context fields (`search_query`, `result_position`, `playlist_track_index`, etc.) — either as top-level columns or inside `properties` with consistent keys.
- Recommend promoting high-cardinality funnel fields to indexed columns for query performance:
  - `journey_id`, `surface`, `event`, `video_id`, `search_query`, `playlist_id`, `mood_slug`, `result_position`

### 9.2 Deduplication

- If client sends `event_id`, use it to ignore duplicate inserts within a 24h window.

### 9.3 Read APIs (new or extended)

Suggested admin endpoints (names illustrative):

| Endpoint | Purpose |
|----------|---------|
| `GET /admin/analytics/search-funnel` | Aggregated search funnel metrics (date range, filters) |
| `GET /admin/analytics/mood-funnel` | Mood playlist completion & drop-off |
| `GET /admin/analytics/engagement-by-surface` | Like / comment / follow broken down by `surface` |
| `GET /admin/analytics/feed-preview` | Preview usage & conversion |
| `GET /admin/analytics/journey/{journey_id}` | Debug: full event timeline for one journey |

Query parameters (common): `from`, `to`, `platform`, `distinct_id` (support), `mood_slug`, `search_query` prefix.

### 9.4 Joining with existing search logs

Existing server-side search records (`query`, `result_count`, `source`) should be joinable to client journeys on:

- `distinct_id` + time window (± few seconds), or
- explicit `search_request_id` if backend adds one to API responses (recommended enhancement).

### 9.5 Suggested materialized views (ClickHouse example)

- `search_funnel_daily` — submits, selects, plays, likes, comments, follows by day
- `mood_dropoff_by_track` — count of session ends at each `last_track_index`
- `engagement_attribution_daily` — likes/comments/follows by `surface` and `playlist_type`

---

## 10. Admin UI (product-facing)

Separate sections from **Activity Logs**:

| Section | Primary questions |
|---------|-------------------|
| **Search funnel** | Top queries, CTR by position, play & engagement rates |
| **Mood mix** | Starts, completion %, drop-off by track, engagement by mood |
| **Feed preview** | Usage, duration, conversion to watch & engagement |
| **Engagement attribution** | Likes, comments, follows split by search vs mood vs home |

Activity Logs remains for engineering debug (`$click`, raw payloads).

---

## 11. Client implementation phases

### Phase 1 — Journey foundation (1–2 sprints)

- Generate `journey_id` (UUID) per search session and mood playlist session.
- Persist in session storage until journey ends; attach to navigation to watch.
- Emit `search_session_started`, `search_query_submitted`, `search_result_selected` with **position**.
- Emit `mood_mix_started`, `playlist_session_started`, `playlist_session_ended`.

### Phase 2 — Playback depth (1 sprint)

- `video_play_started`, `video_progress` (25/50/75/90), `video_completed`.
- Propagate journey context on all playback events.

### Phase 3 — Engagement (1 sprint) **Priority**

- `video_liked`, `video_commented`, `artist_followed` with full search/mood attribution.
- Ensure unlike/unfollow and failed actions are handled consistently.

### Phase 4 — Hover preview attribution (0.5 sprint)

- Link preview → watch within 30 min; set `preview_attributed` on downstream events.

### Phase 5 — Admin dashboards (backend + frontend)

- Wire new read APIs to admin UI.
- Validate funnel numbers against manual journey tests.

---

## 12. Example event payloads

### Search: result selected → play → like → comment → follow

```json
{ "event": "search_result_selected", "journey_id": "a1b2...", "surface": "search_overlay", "properties": { "query": "trap beats", "result_type": "video", "result_id": "vid_123", "result_position": 2, "results_shown": 5 } }
```

```json
{ "event": "video_play_started", "journey_id": "a1b2...", "surface": "search_overlay", "video_id": "vid_123", "properties": { "search_query": "trap beats", "search_result_position": 2, "is_autoplay": false } }
```

```json
{ "event": "video_liked", "journey_id": "a1b2...", "surface": "search_overlay", "video_id": "vid_123", "properties": { "action": "like", "search_query": "trap beats", "search_result_position": 2 } }
```

```json
{ "event": "video_commented", "journey_id": "a1b2...", "surface": "search_overlay", "video_id": "vid_123", "properties": { "comment_id": "cmt_456", "search_query": "trap beats" } }
```

```json
{ "event": "artist_followed", "journey_id": "a1b2...", "surface": "search_overlay", "video_id": "vid_123", "properties": { "artist_username": "creator_x", "action": "follow", "search_query": "trap beats" } }
```

### Mood mix: track 2 drop-off with follow

```json
{ "event": "playlist_session_started", "journey_id": "c3d4...", "surface": "mood_mix", "properties": { "playlist_id": "mood:blue-hours", "playlist_type": "mood", "mood_slug": "blue-hours", "queue_length": 24, "entry_track_index": 0, "entry_video_id": "vid_aaa" } }
```

```json
{ "event": "artist_followed", "journey_id": "c3d4...", "surface": "mood_mix", "video_id": "vid_bbb", "properties": { "artist_username": "creator_y", "action": "follow", "playlist_id": "mood:blue-hours", "playlist_track_index": 1, "mood_slug": "blue-hours" } }
```

```json
{ "event": "playlist_session_ended", "journey_id": "c3d4...", "surface": "mood_mix", "properties": { "last_track_index": 1, "tracks_started": 2, "tracks_completed": 1, "exit_reason": "left_watch", "playlist_id": "mood:blue-hours", "mood_slug": "blue-hours" } }
```

---

## 13. QA & acceptance criteria

| # | Test | Pass criteria |
|---|------|----------------|
| 1 | Search overlay → pick result #3 → play | Same `journey_id` on select, open, play events; `result_position = 2` |
| 2 | Search → like on watch | `video_liked` includes `search_query` + `journey_id` |
| 3 | Search → comment | `video_commented` includes search context |
| 4 | Search → follow artist | `artist_followed` includes search context |
| 5 | Mood mix → autoplay through 3 tracks → exit | `playlist_track_started` indices 0,1,2; `playlist_session_ended` with correct `last_track_index` |
| 6 | Mood → follow on track 2 | `artist_followed` has `playlist_track_index: 1`, `mood_slug` |
| 7 | Unrelated watch → like | No `journey_id` or `surface: recommended` only |
| 8 | Hover preview → click same video → like | `preview_attributed: true` on open and like |
| 9 | Admin funnel API | Aggregates match manual count for test journey |
| 10 | Duplicate retry | Same `event_id` not double-counted in store |

---

## 14. Open questions for team review

1. **Retention window:** How long should `journey_id` remain valid if user returns to the same watch tab later?
2. **Guest users:** Confirm engagement events fire for anonymous users (likes may gate behind auth—track attempts vs successes?).
3. **Search request id:** Should search API return an id for deterministic server/client join?
4. **Comment drafts / failed posts:** Emit attempted vs succeeded events?
5. **Cross-device:** Journey ids are per-tab; acceptable for v1?

---

## 15. Document history

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 0.1 | 2026-06-28 | — | Initial spec: search, mood, preview, engagement attribution |

---

*For questions or changes, comment in the team channel and update the version table above.*
