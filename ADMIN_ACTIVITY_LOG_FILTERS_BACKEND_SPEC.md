# Admin Activity Logs — Backend Filter Spec

Source of truth: frontend implementation in `components/admin/activity-logs-table.tsx` (`ActivityLogFilter`, `matchesActivityLogFilter`, plus admin/noise exclusions).

## Expected input fields (per event)

- `event` (string): e.g. `conversion_play_started`, `$pageview`, `$click`
- `path` (string | null): preferred for route matching
- `url` (string | null): fallback; if `path` missing, derive `pathname` from URL
- `properties` (object):
  - `element_ui_name` (string | null) (may also exist on root as `element_ui_name`)
  - `element_text` (string | null)
  - `element_tag` (string | null)
  - `element_chain` (string | null)
  - `source_path` (string | null)

Normalization used by frontend:

- `eventName = (event || "").toLowerCase()`
- `uiName = String(root.element_ui_name || properties.element_ui_name || "").toLowerCase()`
- `pathLower = (path || pathnameFromUrl(url) || "").toLowerCase()`
- `sourcePathLower = String(properties.source_path || "").toLowerCase()`

## Always-applied exclusions (noise removal)

These filters are applied **before** the user-selected filter in the UI.

### 1) Admin surface / admin login noise (`isAdminLoginEvent`)

Exclude event if **any** are true:

- `pathLower` starts with `/admin`
- `sourcePathLower` starts with `/admin`
- `pathLower` is exactly `/admin` (or starts with `/admin?`)
- `eventName` contains `login` OR contains `auth`, AND (`pathLower` starts with `/admin` OR `sourcePathLower` starts with `/admin`)

### 2) Low-signal autocapture clicks (`isLowSignalAutocaptureClick`)

Exclude event if:

- `eventName === "$click"`
- AND `ui_name` is empty AND `element_text` is empty
- AND NOT actionable by heuristics:
  - keep if `element_tag` is `button` or `a`
  - keep if `element_chain` contains `button` OR contains `> a`
- AND (any):
  - `element_tag` is `div` or `span`
  - OR `pathLower` starts with `/watch/`

## User-selectable filter keys

Backend should accept `filter` as one of:

`all`, `conversions`, `play`, `next`, `like`, `unlike`, `signup`, `pageview`, `share`, `follow`, `playlist`, `comment`, `login`, `search`, `upload`, `player`

If an unknown filter is provided, frontend currently falls back to **include** (`return true`) — recommended backend behavior: treat unknown as `all`.

## Matching rules (exact frontend behavior)

### `all`

- include all events (after exclusions)

### `conversions`

- include if `eventName` starts with `"conversion_"`

### `pageview`

- include if `eventName === "$pageview"`

### `share`

- include if `uiName === "shared-video"`

### `follow`

- include if `uiName === "followed_creator"` OR `uiName === "unfollowed_creator"`

### `playlist`

- include if `uiName === "added-to-playlist"` OR `uiName` contains `"opened-video-from-playlist"`

### `comment`

- include if `uiName === "opened-comments"`

### `login`

Include if any:

- `uiName` contains `"login-"`
- `uiName` contains `"navbar-login"`
- `uiName === "login-submit-button"`
- OR (`eventName === "$click"` AND `uiName` ends with `"login-button"` AND NOT `uiName` contains `"signup"`)

### `search`

Include if any:

- `uiName` starts with `"search-overlay"`
- OR (`eventName === "$click"` AND `uiName` contains `"search-overlay"`)

### `upload`

Include if any:

- `uiName` contains `"upload-"`
- `uiName` contains `"creator-studio"`
- `uiName` contains `"creator-become"`
- `uiName` contains `"navbar-open-hiffi-studio"`
- `uiName` contains `"navbar-open-become-creator"`
- `uiName` contains `"navbar-user-menu-hiffi-studio"`
- `uiName` contains `"navbar-user-menu-become-creator"`

### `player`

Include if:

- `eventName === "$click"`
- AND (`uiName` is one of the following OR starts with `"opened-quality"`)

Allowed player `uiName` values:

- `backward`
- `fast-forward`
- `next`
- `played_video`
- `paused_video`
- `played-video`
- `unmuted-video`
- `muted_video`
- `unmuted_video`
- `entered_fullscreen`
- `exited_fullscreen`
- `opened-quality-settings`

### `play`

Include if any:

- `eventName === "conversion_play_started"`
- `eventName === "opened-video"`
- `uiName === "played_video"`
- `uiName === "played-video"`

### `next`

Include if any:

- `eventName === "conversion_next_clicked"`
- `uiName === "fast-forward"`
- `uiName === "next"`

### `like`

Include if any:

- `eventName === "conversion_like_success"`
- `uiName === "liked"`
- `uiName === "like"`

### `unlike`

- include if `eventName === "conversion_unlike_success"` OR `uiName === "unliked"`

### `signup`

- include if `eventName === "conversion_signup_completed"` OR `uiName` contains `"signup"`

## Notes for backend implementation

- Filtering is intended to run on **raw events** before pagination if you want accurate counts.
- Frontend currently applies search & filter only to the **current page**, but backend can improve this by applying it server-side.
- When both `path` and `url` exist, prefer `path`; otherwise use `new URL(url).pathname` when parseable.

