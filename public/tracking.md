# tracker.js in Next.js

This document explains how to use `webStatic/tracker.js` from a Next.js app and what keys are sent/accepted.

## 1) Include tracker.js in Next.js

Use `next/script` in your root layout so the tracker is loaded on the client.

```tsx
// app/layout.tsx (App Router)
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://api.dev.hiffi.com/tracker.js"
          strategy="afterInteractive"
          onLoad={() => {
            // @ts-ignore
            window.HifiAnalytics?.init({
              baseUrl: "https://api.dev.hiffi.com",
              ingestKey: process.env.NEXT_PUBLIC_ANALYTICS_INGEST_KEY || null,
              appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "web-nextjs",
              autocapture: false,
              flushIntervalMs: 5000,
              maxBatch: 25,
              captureNameAttributes: ["data-analytics-name", "data-track"],
            });
          }}
        />
      </body>
    </html>
  );
}
```

Notes:

- `init()` must run in browser only (not server components).
- If backend has `ANALYTICS_INGEST_KEY`, pass the same key via `ingestKey`.
- `baseUrl` should point to your API origin.

## 2) Capture custom events

```tsx
"use client";

export function BuyButton() {
  const onClick = () => {
    // @ts-ignore
    window.HifiAnalytics?.capture("checkout_started", {
      screen_name: "pricing",
      plan: "pro_monthly", // custom -> goes into properties
      event_id: crypto.randomUUID(), // known top-level key
    });
  };

  return (
    <button data-analytics-name="checkout-buy-button" onClick={onClick}>
      Buy now
    </button>
  );
}
```

## 3) Identify user

```tsx
// after login
// @ts-ignore
window.HifiAnalytics?.identify(user.id);

// after logout (back to anonymous)
// @ts-ignore
window.HifiAnalytics?.identify(null);
```

## 4) Named UI elements (autocapture)

When autocapture is enabled, click events are sent as `$click`.

To set stable names for UI controls, add one of configured attributes:

```html
<button data-analytics-name="settings-save-button">Save</button>
<button data-track="hero-primary-cta">Start free</button>
```

The first matching attribute found on target/ancestor becomes `element_ui_name`.

---

## What tracker.js sends by default

Every event includes:

- `event`
- `distinct_id`
- `session_id`
- `platform` (always `web`)
- `sdk_version`
- `device_type`
- `url`
- `path`
- `referrer`
- `properties` (object; may be empty)

Also included when configured/present:

- `app_version` (if `init({ appVersion })`)
- `element_ui_name` (for `$click` when named attribute exists)
- `$click` fields: `element_chain`, `element_tag`, `element_text`, `element_id`

Important:

- In `capture(event, props)`, keys recognized as top-level event keys are promoted to top-level.
- Unknown keys are stored under `properties`.

## Top-level keys recognized by tracker.js

These keys in `capture(..., props)` are sent as top-level event fields:

- `element_chain`
- `element_tag`
- `element_text`
- `element_id`
- `element_ui_name`
- `url`
- `path`
- `referrer`
- `device_type`
- `video_id`
- `video_title`
- `current_time`
- `duration`
- `playback_rate`
- `quality`
- `is_fullscreen`
- `screen_name`
- `device_model`
- `os_name`
- `country`
- `city`
- `event_id`
- `timestamp`
- `app_version`

Everything else in `props` is sent inside `properties`.

---

## All acceptable keys in ingest API

Backend accepts these event fields (`POST /analytics/events` or `/analytics/events/batch`):

- `timestamp`
- `event` (required)
- `distinct_id` (required)
- `session_id` (required)
- `platform` (required)
- `app_version`
- `sdk_version`
- `video_id`
- `video_title`
- `current_time`
- `duration`
- `playback_rate`
- `quality`
- `is_fullscreen`
- `element_chain`
- `element_tag`
- `element_text`
- `element_id`
- `element_ui_name`
- `screen_name`
- `url`
- `path`
- `referrer`
- `device_type`
- `device_model`
- `os_name`
- `country`
- `city`
- `properties` (JSON object)
- `event_id`

Additionally, backend enriches `properties` with:

- `_ingest_ip`

## Minimal valid event example

```json
{
  "event": "checkout_started",
  "distinct_id": "user_123",
  "session_id": "sess_abc",
  "platform": "web",
  "properties": {
    "plan": "pro_monthly"
  }
}
```

## Troubleshooting

- If no requests appear in Network:
  - ensure `init()` is called on client,
  - ensure `tracker.js` is loaded from reachable URL.
- If requests return `401`:
  - set correct `ingestKey`.
- If `element_ui_name` is null in events:
  - ensure ClickHouse Kafka queue + MV schema include `element_ui_name` (stale queue table is a common cause).

---

## Event naming index (user-facing)

These are the primary `data-analytics-name` values currently used in the app.

### Auth
- `login-skip-button`
- `login-toggle-password-visibility-button`
- `login-submit-button`
- `signup-skip-button`
- `signup-toggle-password-visibility-button`
- `signup-create-account-button`
- `signup-verify-otp-button`
- `signup-resend-otp-button`
- `signup-back-to-registration-button`
- `auth-dialog-signup-button`
- `auth-dialog-login-button`

### Upload and creator
- `upload-select-files-button`
- `upload-submit-video-button`
- `upload-cancel-draft-button`
- `upload-custom-thumbnail-button`
- `upload-remove-thumbnail-button`
- `upload-progress-watch-video-button`
- `upload-success-watch-video-button`
- `upload-another-video-button`
- `creator-become-creator-button`
- `creator-studio-upload-new-video-button`
- `creator-studio-manage-profile-button`

### Watch and player
- `liked`
- `unliked`
- `shared-video`
- `added-to-playlist`
- `followed-creator`
- `unfollowed-creator`
- `opened-comments`
- `played-video`
- `paused-video`
- `fast-forward`
- `backward`
- `muted-video`
- `unmuted-video`
- `entered-fullscreen`
- `exited-fullscreen`
- `opened-quality-settings`

### Comments and share dialog
- `video-comment-submit-button`
- `video-comment-load-more-button`
- `video-comment-reply-toggle-button`
- `video-comment-reply-submit-button`
- `video-comment-reply-cancel-button`
- `video-comment-show-replies-button`
- `video-comment-hide-replies-button`
- `video-comment-delete-prompt-button`
- `video-comment-delete-confirm-button`
- `share-video-copy-link-button`
- `share-video-native-share-button`
- `share-video-platform-whatsapp-button`
- `share-video-platform-facebook-button`
- `share-video-platform-x-button`
- `share-video-platform-email-button`
- `share-video-platform-reddit-button`

### Navigation and discovery
- `navbar-home-logo-link`
- `navbar-open-search-button`
- `navbar-profile-link`
- `navbar-login-button`
- `navbar-logout-confirm-button`
- `sidebar-home-button`
- `sidebar-history-link`
- `sidebar-liked-videos-link`
- `sidebar-playlists-link`
- `sidebar-following-link`
- `search-overlay-trending-search-button`
- `search-overlay-user-result-link`
- `search-overlay-video-result-link`
- `search-overlay-view-all-results-button`
- `opened-video-from-home`
- `opened-video-from-liked`
- `opened-video-from-playlist`
- `opened-video-from-recommended`
- `video-card-add-to-playlist-button`
- `global-player-expand-button`

Note:
- Keep names stable once live; changing names breaks historical trend continuity.
- Preferred pattern: `<surface>-<action>-<target>-button` (or `-link` for links).

