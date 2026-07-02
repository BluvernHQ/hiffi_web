# Hiffi Activity Analytics — Tag & Event Name Inventory

Reference list of analytics identifiers **implemented in hiffi_web** today. These appear in admin **Activity Logs** (`GET /analytics/events`), are sent via **HifiAnalytics** (`tracker.js`), or fire as parallel **Umami** goals.

**Scope:** Live web instrumentation. Journey funnel events are in [§8](#8-journey-funnel-events-live).

**Naming convention:** UI controls use `data-analytics-name` (stored as `element_ui_name` on `$click` events). Preferred pattern: `<surface>-<action>-<target>-button` or `-link`.

**Sources:** `lib/analytics/`, `lib/conversion-tracking.ts`, `lib/umami.ts`, `components/admin/activity-logs-table.tsx`, `public/tracking.md`, and `data-analytics-name` usage across components.

---

## 1. System event names (`event` field)

Top-level event names sent through `HifiAnalytics.capture()` or autocapture.

### Autocapture & navigation

| Event | Description |
|-------|-------------|
| `$click` | Autocapture click; `element_ui_name` carries the UI tag when present |
| `$pageview` | Page view |

### Programmatic video / feed events

| Event | Description |
|-------|-------------|
| `opened-video` | User opened a video from a feed/card (play intent) |
| `feed-preview-started` | Hover feed preview playback started |
| `feed-preview-ended` | Hover feed preview playback ended |

**Programmatic `element_ui_name` on feed preview captures** (not `data-analytics-name` on a DOM node):

| `element_ui_name` | Used on |
|-------------------|---------|
| `feed-hover-preview` | `feed-preview-started`, `feed-preview-ended` |

### Conversion funnel events (`conversion_*`)

Defined in [`lib/conversion-tracking.ts`](../lib/conversion-tracking.ts).

| Event | Description |
|-------|-------------|
| `conversion_play_started` | Playback started (click or autoplay) |
| `conversion_next_clicked` | User advanced to next video/track |
| `conversion_like_success` | Video liked |
| `conversion_unlike_success` | Video unliked |
| `conversion_dislike_success` | Video disliked |
| `conversion_signup_completed` | Signup completed |
| `conversion_auth_prompt_shown` | Auth dialog / prompt shown to guest |
| `conversion_auth_prompt_dismissed` | Auth prompt dismissed |
| `conversion_passive_nudge_shown` | Passive guest conversion nudge shown |
| `conversion_passive_nudge_dismissed` | Passive guest conversion nudge dismissed |

**Common properties on conversion events** (top-level or in `properties`):

| Property | Examples |
|----------|----------|
| `video_id` | Watch target |
| `source` / `open_source` | `home`, `playlist`, `search`, … |
| `open_ui_name` | Tag that opened the watch journey |
| `navigate_trigger` | How user reached the next watch page |
| `playback_start_trigger` | How playback actually started |
| `is_autoplay` / `is_click` | Boolean play mode |
| `playlist_id` / `playlist_track_index` | Playlist context |
| `source_path` | `window.location.pathname` at capture time |

### Umami goal events (third-party, parallel tracking)

Defined in [`lib/umami.ts`](../lib/umami.ts). Separate pipeline from Activity Logs.

| Event |
|-------|
| `Sign Up Completed` |
| `Playlist Song Added` |
| `Creator Account Created` |
| `Video Uploaded` |

### User identity (merged into events)

| System | Mechanism | Fields |
|--------|-----------|--------|
| HifiAnalytics | `identify(username)` after login ([`lib/auth-context.tsx`](../lib/auth-context.tsx)) | Username on session |
| Umami | `setUmamiUser()` + `identify()` ([`lib/umami.ts`](../lib/umami.ts)) | `user_id`, `user_name`, `user_email` merged into every `trackUmami()` call |

---

## 2. UI tag names (`data-analytics-name` / `element_ui_name`)

Stable string tags on interactive elements. On click → `element_ui_name` on `$click`. On video card open → `element_ui_name` on `opened-video`.

### Auth — login

| Tag |
|-----|
| `login-skip-button` |
| `login-toggle-password-visibility-button` |
| `login-submit-button` |

### Auth — signup

| Tag |
|-----|
| `signup-skip-button` |
| `signup-toggle-password-visibility-button` |
| `signup-create-account-button` |
| `signup-verify-otp-button` |
| `signup-resend-otp-button` |
| `signup-back-to-registration-button` |

### Navigation — app bar & sidebar

| Tag |
|-----|
| `appbar-logo` |
| `navbar-open-search-button` |
| `navbar-open-search-button-mobile` |
| `navbar-open-hiffi-studio-button` |
| `navbar-open-become-creator-button` |
| `navbar-profile-link` |
| `navbar-user-menu-hiffi-studio-link` |
| `navbar-user-menu-become-creator-link` |
| `navbar-my-reports-link` |
| `navbar-login-button` |
| `navbar-signup-button` |
| `navbar-logout-confirm-button` |
| `sidebar_home_button` |
| `sidebar_history_link` |
| `sidebar_liked_videos_link` |
| `sidebar_playlists_link` |
| `sidebar_following_link` |

> Sidebar tags are generated as `sidebar_{label}_link` or `sidebar_{label}_button` where `label` is lowercased with spaces replaced by `_`.

### Search overlay

| Tag |
|-----|
| `search-overlay-recent-search-button` |
| `search-overlay-trending-search-button` |
| `search-overlay-user-result-link` |
| `search-overlay-processing-video-result-button` |
| `search-overlay-video-result-link` |
| `search-overlay-view-all-results-button` |

### Video open sources

From [`lib/analytics/video-analytics-names.ts`](../lib/analytics/video-analytics-names.ts).

| Tag |
|-----|
| `opened-video` |
| `opened-video-from-home` |
| `opened-video-from-search` |
| `opened-video-from-mood` |
| `opened-video-from-playlist` |
| `opened-video-from-recommended` |
| `opened-video-from-liked` |
| `opened-video-from-profile` |
| `opened-video-from-history` |
| `opened-video-from-feed-preview` |
| `opened_video` *(legacy default in `video-grid.tsx` — underscore variant; prefer hyphenated names)* |

### Watch page & player

| Tag |
|-----|
| `watch-like-video` |
| `watch-unlike-video` |
| `watch-save-to-playlist` |
| `watch-more-actions` |
| `shared-video` |
| `report-video` |
| `followed_creator` |
| `unfollowed_creator` |
| `opened-comments` |
| `played-video` |
| `paused-video` |
| `player-previous` |
| `player-next-recommended` |
| `player-seek-backward` *(constant defined; not yet wired in player UI)* |
| `player-seek-forward` *(constant defined; not yet wired in player UI)* |
| `muted_video` |
| `unmuted_video` |
| `unmuted-video` |
| `entered_fullscreen` |
| `exited_fullscreen` |
| `opened-quality-settings` |
| `playlist-queue-click` |
| `up-next-sidebar-click` |
| `up-next-overlay-play` |
| `up-next-overlay-cancel` |
| `global-player-expand-button` |
| `player-next-playlist` *(playback context `openUiName` only — not on a DOM element)* |

### Video cards & feed preview

| Tag |
|-----|
| `video-card-add-to-playlist-button` |
| `video-card-share` |
| `feed-preview-mute` |
| `feed-preview-unmute` |
| `feed-hover-preview` *(programmatic only — see [§1](#programmatic-video--feed-events))* |

**Dynamic profile tags:** `viewed-profile-of-{username}` (e.g. `viewed-profile-of-jaxson-kaine`)

### Engagement (legacy / alias names still recognized in Activity Logs)

| Tag | Notes |
|-----|-------|
| `liked` | Alias for like actions |
| `unliked` | Alias for unlike |
| `dislike` / `disliked` | Dislike actions |
| `played_video` / `paused_video` | Underscore variants of player tags |
| `added-to-playlist` | Playlist add |
| `followed-creator` / `unfollowed-creator` | Hyphenated follow variants |

### Comments & guest prompts

| Tag |
|-----|
| `guest-comment-signup-link` |
| `guest-comment-login-link` |
| `report-comment` |

### Reports

| Tag |
|-----|
| `report-video` |
| `report-comment` |
| `report-profile` |
| `report-video-submitted` |
| `report-comment-submitted` |
| `report-user-submitted` |
| `report-creator-submitted` |

> Submit tags use `report-{type}-submitted` where `type` is `video`, `comment`, `user`, or `creator` ([`Phase1ReportType`](../lib/types/content-flag.ts)).

### Upload & creator studio

| Tag |
|-----|
| `upload-custom-thumbnail-button` |
| `upload-remove-thumbnail-button` |
| `upload-cancel-draft-button` |
| `upload-submit-video-button` |
| `upload-progress-watch-video-button` |
| `upload-success-watch-video-button` |
| `upload-another-video-button` |
| `creator-become-creator-button` |
| `creator-apply-sign-in` |
| `creator-apply-sign-up` |
| `creator-studio-upload-new-video-button` |
| `creator-studio-start-migration-button` |
| `creator-studio-start-migration-submit-button` |
| `brand-collaboration-submit-button` |

### Guest conversion nudges

| Tag |
|-----|
| `guest-watch-60s-signup` |
| `guest-third-track-signup` |
| `guest-rec-ready-signup` |
| `guest-history-signup` |
| `guest-liked-signup` |
| `guest-following-signup` |
| `guest-following-login` |

### Mood mix

From [`lib/analytics/mood-mix-analytics.ts`](../lib/analytics/mood-mix-analytics.ts).

| Tag |
|-----|
| `mood-mix-full-feed` |
| `mood-mix-open-picker` *(defined; admin label mapping only — not yet on a UI element)* |
| `mood-mix-dismiss-picker` *(defined; admin label mapping only)* |
| `mood-mix-switch-vibe` *(defined; admin label mapping only)* |

**Per-mood dynamic tags** (slug from mood query via `moodAnalyticsSlug()`):

| Pattern | Example |
|---------|---------|
| `mood-mix-select-{slug}` | `mood-mix-select-on-sight` |
| `mood-mix-run-{slug}` | `mood-mix-run-blue-hours` |

**Current mood slugs** ([`lib/mood-tabs.ts`](../lib/mood-tabs.ts)):

| Mood | Slug |
|------|------|
| On Sight | `on-sight` |
| Soul Search | `soul-search` |
| Money Talk | `money-talk` |
| Blue Hours | `blue-hours` |
| Low Rider | `low-rider` |
| Turn Up | `turn-up` |
| God's Plan | `gods-plan` |

---

## 3. Filtered / deduped tags (not ingested)

[`lib/analytics/dedupe-click-capture.ts`](../lib/analytics/dedupe-click-capture.ts) drops or collapses some `$click` events before batch ingest:

| Pattern / rule | Behavior |
|----------------|----------|
| `report-dialog-*` | Dropped — report dialog chrome noise |
| Duplicate clicks within 500ms | Same `element_ui_name` (or path+tag+id+text) deduped |
| Ghost clicks after report open | Unnamed button/svg/a clicks on same path within 500ms of `report-video`, `report-comment`, or `report-profile` suppressed |

**Report open entry points** (dedupe-aware): `report-video`, `report-comment`, `report-profile`

---

## 4. Activity Logs context tags

Derived in admin UI from event properties ([`getEventContextTags`](../components/admin/activity-logs-table.tsx)). Shown as chips on log rows.

| Tag pattern | When set |
|-------------|----------|
| `autoplay` | `is_autoplay === true` |
| `click-play` | `conversion_play_started` with `is_autoplay === false` |
| `click` | `is_click === true` |
| `source:{value}` | From `open_source` / `source` (e.g. `source:home`, `source:mood_mix`) |
| `nav:{value}` | From `navigate_trigger` |
| `start:{value}` | From `playback_start_trigger` |
| `playlist:{id}` | First 8 chars of `playlist_id` |
| `track:{n}` | 1-based `playlist_track_index` |

### `navigate_trigger` values

From [`lib/analytics/video-playback-context.ts`](../lib/analytics/video-playback-context.ts):

| Value |
|-------|
| `card_click` |
| `player_next` |
| `playlist_queue` |
| `up_next_sidebar` |
| `up_next_overlay_click` |
| `up_next_overlay_autoplay` |
| `playlist_autoplay` |
| `video_end_autoplay` |

### `playback_start_trigger` values

| Value |
|-------|
| `autoplay_page_load` |
| `player_play_click` |
| `replay_after_end_click` |

### `open_source` / conversion source values

From [`normalizeConversionSource`](../lib/conversion-tracking.ts):

| Value |
|-------|
| `home` |
| `recommended` |
| `playlist` |
| `search` |
| `profile` |
| `mood_mix` |
| `liked` |
| `history` |
| `feed_preview` |
| `unknown` |

> `mapOpenUiNameToSource()` also maps `feed-hover-preview` and any `mood-mix-*` prefix to `feed_preview` / `mood_mix`.

---

## 5. Admin Activity Logs filter presets

Server-side `filter` param for `GET /analytics/events` ([`ActivityLogFilter`](../components/admin/activity-logs-table.tsx)):

| Filter | Matches |
|--------|---------|
| `all` | All events |
| `conversions` | All `conversion_*` events |
| `play` | `conversion_play_started` |
| `next` | `conversion_next_clicked` |
| `like` | `conversion_like_success` |
| `unlike` | `conversion_unlike_success` / unlike UI |
| `signup` | `conversion_signup_completed` / signup UI |
| `pageview` | `$pageview` |
| `share` | Share interactions |
| `follow` | Follow / unfollow |
| `playlist` | Playlist interactions |
| `comment` | Comment interactions |
| `login` | Login-related UI |
| `search` | Search interactions |
| `upload` | Upload / creator flows |
| `player` | Player controls |

---

## 6. Documented but not yet implemented in code

Listed in [`public/tracking.md`](../public/tracking.md) but **no `data-analytics-name` in the current codebase**:

- `upload-select-files-button`
- `creator-studio-manage-profile-button`
- `auth-dialog-signup-button`, `auth-dialog-login-button`
- `video-comment-submit-button`, `video-comment-load-more-button`, `video-comment-reply-*`, `video-comment-delete-*`
- `share-video-copy-link-button`, `share-video-native-share-button`, `share-video-platform-*`
- `fast-forward`, `backward` *(player constants use `player-seek-*` instead)*

### Surfaces without analytics tags yet

No `data-analytics-name` or semantic capture events found for:

- Share video dialog controls
- Auth dialog signup/login buttons *(only `conversion_auth_prompt_*` events)*
- Comment submit, reply, load-more, delete controls
- Sidebar curated playlist items
- Artist Index / claim flows

---

## 7. Capture configuration & out-of-scope systems

### HifiAnalytics DOM attributes

Initialized in [`api-analytics-tracker.tsx`](../components/analytics/api-analytics-tracker.tsx):

- `data-analytics-name` (primary)
- `data-track` (fallback)

### Third-party analytics (not in this inventory)

| System | What it tracks |
|--------|----------------|
| Google Analytics (`NEXT_PUBLIC_GA_ID`) | Page views via `gtag('config', …)` |
| Microsoft Clarity (`NEXT_PUBLIC_CLARITY_ID`) | Session replay / `trackPageview` |
| Umami | Custom goals listed in [§1](#umami-goal-events-third-party-parallel-tracking) |

These do not use the Hiffi `data-analytics-name` catalog.

---

## 8. Journey funnel events (live)

Implemented in `lib/analytics/journey-tracking.ts` per the **[Analytics Journey Tracking spec](./analytics-journey-tracking-spec.md)**. These use semantic `event` names (underscores) and include `journey_id`, `surface`, and attribution context where applicable.

| Event | When fired | Wired in |
|-------|------------|----------|
| `search_session_started` | Search overlay opens or search page session begins | `search-overlay.tsx`, `search-client.tsx` |
| `search_query_submitted` | User commits a query | `search-overlay.tsx`, `search-client.tsx` |
| `search_result_selected` | User picks a result (with `result_position`) | `search-overlay.tsx` |
| `search_session_ended` | Overlay closes without navigation | `search-overlay.tsx` |
| `mood_mix_started` | User starts a mood mix | `home-feed-client.tsx` |
| `playlist_session_started` | Watch enters playlist mode | `watch-client.tsx` |
| `playlist_track_advanced` | Next/prev/autoplay/queue pick | `watch-client.tsx` |
| `playlist_session_ended` | Leave watch playlist or dismiss mood bar | `watch-client.tsx`, `home-feed-client.tsx` |
| `feed_preview_started` / `feed_preview_ended` | Hover preview lifecycle | `feed-video-preview-provider.tsx` |
| `video_liked` / `video_commented` / `artist_followed` | Engagement with journey attribution | `watch-client.tsx`, `comment-section.tsx` |

Legacy hyphenated preview events (`feed-preview-started`, `feed-preview-ended`) still fire alongside the journey spec names for backward compatibility.

---

## Maintenance notes

- **Do not rename live tags** without a migration plan — Activity Logs and dashboards rely on historical continuity.
- Prefer `data-analytics-name` on elements; autocapture attaches them to `$click` automatically.
- For funnel steps, use explicit `capture("conversion_*", …)` rather than inferring from click chains.
- Umami goal names are separate from HifiAnalytics event names; both may fire for the same user action.
- Unnamed `$click` events still appear in Activity Logs with heuristic labels (element text, path, DOM chain).
