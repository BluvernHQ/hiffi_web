# Tracking IDs, journeys and feature adoption

How to make a button or link measurable, and how to read who uses it in the admin panel.

## How tracking works

- Every tracked control has an ID from one registry: [`lib/analytics/tracking-ids.ts`](../lib/analytics/tracking-ids.ts).
- The element carries it as `data-analytics-id`. When it's clicked, the tracker ([`lib/analytics/vendor/tracker.js`](../lib/analytics/vendor/tracker.js)) sends an event whose **tag is the ID**. Clicks on untagged elements are sent as `$click` and are left out of journeys and features.
- Page views are sent as `$pageview`. In journeys they appear as `page:<page type>`, for example `page:/watch/:id`.
- Programmatic events, such as `search_query_submitted` from [`lib/analytics/journey-tracking.ts`](../lib/analytics/journey-tracking.ts) and the `conversion_*` events, are tags too, and they show up in the same views.
- Every event carries:
  - a client timestamp, used to order the steps;
  - a lasting `visitor_id`, kept in `localStorage` as `hifi_analytics_visitor_id`;
  - for logged-in users, their `uid` and `username`.
- Logging out forgets the user but keeps the visitor ID, so a guest stays one person across sessions.

## Add a tracked feature

1. **Add an entry to `TRACKING_IDS`:**

   ```ts
   "playlist-share-button": { feature: "playlists", label: "Playlist: share", since: "2026-11-03" },
   ```

   - `feature` groups the rows in the Features tab.
   - `label` is what admins read.
   - `since` is the launch date, so adoption can be read from launch. Use it for every new ID.
2. **Spread `trackId` onto the element:**

   ```tsx
   <Button {...trackId("playlist-share-button")}>Share</Button>
   ```

   If part of the action varies (a mood, a report type, a username), keep the ID fixed and pass the variable part as `detail`: `trackId("mood-mix-select", slug)`. It's stored in `properties.detail`. Don't build IDs from strings at runtime.
3. **Run `npm run typecheck` and `npm run lint:tracking`:**
   - TypeScript rejects IDs that aren't in the registry.
   - The lint script rejects raw `data-analytics-*` attributes and malformed `since` dates.

**Rules**

- Never rename or reuse an ID. Event history is keyed by it, so retire the old one and add a new one.
- IDs that existed before the registry kept their original names, for example `sidebar_home_button` and `watch-like-video`, so older data still lines up.
- Some names used to be built at runtime. They now have fixed IDs, and the variable part has moved into `detail`. Events from before the change keep the old names:

  | Old name (before the change) | Fixed ID now | `detail` holds |
  | --- | --- | --- |
  | `viewed-profile-of-<username>` | `video-card-open-profile` | the username |
  | `mood-mix-select-<slug>` | `mood-mix-select` | the mood slug |
  | `mood-mix-run-<slug>` | `mood-mix-run` | the mood slug |
  | `report-<type>-submitted` | `report-submitted` | the report type |

## Read it in the admin panel

Go to **Admin → Journeys**. You need the `analytics.journeys:read` permission.

### All journeys

- **What a journey is:** the pages and tracked actions of one session, in order.
  - Repeats in a row are merged.
  - Only the first N steps count (8 by default; change it with **Steps**).
  - Sessions with the same steps form one journey.
- **Columns:** sessions, logged-in users, guests, share of sessions, and when it was last seen.
- **Contains step** shows only journeys that include an ID or page, for example `comment-post`.
- **Click a journey** to see who took it:
  - users by username;
  - guests as "Guest #abc123", with the number of sessions;
  - an **Open session** link to that person's full timeline.

### Features

- **One row per registered ID.** Each row shows users, guests, sessions, **adoption** (people who used it ÷ everyone active in the period) and the launch date. Registered IDs that nobody used still appear, at the bottom.
- **"Show unregistered tags"** lists other tags seen in the period, such as programmatic events and legacy names.
- **Click a row** to see:
  - people using it each day, with the adoption percentage;
  - the people who used it;
  - **Journeys including this**, which opens All journeys filtered to that ID.

**Checking how a new feature is doing**

1. Register its ID with a `since` date and ship it.
2. In **Features**, set the period to start at the launch date and look at its adoption and trend.
3. Open **Journeys including this** to see where people come from before using it, and what they do after.

## Notes and limits

- **Time window:** periods are capped at 90 days, and the default is 7.
- **Guests:** "Include guests" off counts logged-in users only.
- **Old sessions:** sessions recorded before this change may hold a username in place of the uid. They show as is.
- **Clock checks:** if a device clock is more than a day off, the server time is used for that event.
- **API:** the admin endpoints are `GET /analytics/journey-paths`, `/analytics/journey-paths/{journey_id}/users`, `/analytics/features`, `/analytics/features/{id}/trend` and `/analytics/features/{id}/users`. They require an admin login; the ingest key isn't accepted.
