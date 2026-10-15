# HIFFI PLATFORM KNOWLEDGE TRANSFER (KT) & QA TESTING GUIDE

> **Platform Version:** Web v2.3.2+ / Mobile v1.0.8+ (Build 60)  
> **Documentation Target:** QA Engineers, Test Leads, Product Managers, and New Developers  
> **Source Branches Inspected:** `new-main` (Home Page & Recommendation Engine) & `hiffi_dev_v2` (Core Web Platform, Creator Studio, Admin RBAC & APIs), with mobile parity validated against `flutter/hiffi`.

---

## 1. Platform Overview

### 1.1 Purpose of the Platform
**Hiffi** is a high-fidelity video streaming and discovery ecosystem dedicated to independent hip-hop and rap artists, producers, and their fans worldwide. Unlike traditional algorithmic platforms that bury independent creators under major-label promotions, Hiffi provides:
- Fair, transparent discovery powered by deterministic random shuffles and curated editorial spotlights.
- Direct creator-to-fan connection through user profiles, social engagement (upvotes, downvotes, comments, replies, and following), and personalized playlist curation.
- Professional **Creator Studio** tools enabling independent musicians to self-publish music videos, automatically generate high-definition video thumbnails in-browser, and import their existing catalogs from YouTube.
- An **Unclaimed Artist Inventory** and **Claim Portal** allowing artists discovered through regional directories (e.g., Atlanta scene, Top 500) to claim and verify their official profiles.
- An enterprise-grade, role-based **Admin Portal** featuring 22 specialized operational modules (user moderation, content flag triage, YouTube migration orchestration, analytics funnels, and granular RBAC).

---

### 1.2 Main User Types

```
               ┌────────────────────────────────────────────────────────┐
               │                      VISITOR GUEST                     │
               │  - Browse Discover & Moods    - Play Videos (Ad-free)  │
               │  - Search Creators & Titles   - View Public Profiles   │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                               Sign up / Instant Login
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │                  REGISTERED FAN / USER                 │
               │  - Like / Upvote / Downvote   - Post Comments & Replies│
               │  - Follow Artists             - Create Custom Playlist │
               │  - Watch History & Liked Feed - Report Content / Bugs  │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                             Email OTP Verification
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │                     CREATOR / ARTIST                   │
               │  - Access Hiffi Studio        - Publish Music Videos   │
               │  - In-Browser Frame Extractor - Request YouTube Import │
               │  - Customize Banner & Avatar  - Receive Brand Inquiries│
               └────────────────────────────────────────────────────────┘

               ┌────────────────────────────────────────────────────────┐
               │               ADMINISTRATOR / TEAM MEMBER              │
               │  - Access /admin/dashboard    - User & Content Triage  │
               │  - YouTube Migration Approvals- Curated Hero Playlists │
               │  - UTM Campaigns & Funnels    - Custom RBAC Role Setup │
               └────────────────────────────────────────────────────────┘
```

1. **Guest / Unauthenticated Visitor:**
   - Can freely browse the discover home feed, filter by mood mixes, search for creators/videos, view public profiles, and stream videos.
   - Interactive actions (liking, commenting, saving to playlist, following, or uploading) trigger the non-intrusive **Guest Conversion Modal** (`AuthDialog`). Intended actions are remembered and replayed automatically once authenticated.

2. **Registered Fan / User (`role: "user"`):**
   - Standard registered account.
   - Enjoys full social engagement: upvote/downvote videos, post comments and replies, follow favorite artists, manage private playlists, and access personalized "Liked Videos" and "Watch History" libraries.
   - Can upgrade to a Creator at any time via email OTP verification.

3. **Creator / Artist (`role: "creator"`):**
   - Verified artist or content creator account.
   - Accesses **Hiffi Studio** (`/studio`) to upload and publish music videos with client-side thumbnail extraction.
   - Can submit YouTube migration requests to mirror existing music catalogs.
   - Manages an extended artist profile featuring custom banners, avatar crop, social links, bio, and collaboration settings.

4. **Administrator / Team Member (`role: "admin"` / custom roles):**
   - Team members accessing the protected Admin Dashboard (`/admin/dashboard`).
   - Access is managed via a **Granular Role-Based Access Control (RBAC v2)** system with 30 fine-grained read/write permission scopes.

---

### 1.3 High-Level Architecture & Tech Stack

| Layer | Technologies & Infrastructure | Primary Responsibility |
| :--- | :--- | :--- |
| **Web Frontend** | Next.js 14+ (App Router), React 18, Tailwind CSS, Radix UI, Video.js | Responsive consumer web app, Creator Studio, and Admin Portal. |
| **Mobile Frontend** | Flutter 3.29+ (Dart 3.9+), GoRouter, Provider, JustAudio, Chewie | Cross-platform iOS and Android mobile app with background audio and native PiP. |
| **Backend REST API** | Go Microservices / REST API (`https://api.hiffi.com` / `api.dev.hiffi.com`) | Auth, users, videos, social, flags, playlists, migrations, analytics, and admin endpoints. |
| **Media Delivery** | Cloudflare Workers (`black-paper-83cf.hiffi.workers.dev`), HLS Proxy, S3/R2 | Edge video streaming proxy, adaptive HLS bitrate delivery, 20-minute presigned upload URLs. |
| **Bot Protection** | Cloudflare Turnstile | Captcha-free bot mitigation on registration, login, and profile claiming. |
| **Telemetry & Tracking**| Umami Analytics, First-Party Signals (`/signals/watchhours`), Firebase Analytics | Privacy-focused journey funnels, drop-off tracking, and playback duration accounting. |

---

### 1.4 Major Modules Breakdown

- **Authentication & Security:** Instant JWT issuance, password reset OTPs, session storage hydration, and Turnstile challenge validation.
- **Home Discover & Recommendations (`new-main`):** SSR discover feed, Hero Curated Carousel, Mood Mix chips, deterministic seed shuffling, prefetching, and seamless back-navigation scroll restoration.
- **Watch & Playback Engine:** Video.js / HLS player, multi-resolution profiles (original, 720p, 480p), persistent audio preferences, Google SeekToAction deep links (`?t=`), and background watch-time beacons.
- **Social Engagement:** Optimistic likes/upvotes, downvotes, comments, nested replies, user follow network, and native URL sharing with referral codes.
- **Guest Conversion Engine:** Passive nudge banners, intent queueing (`pending-intents`), and automated post-auth action replay.
- **Playlists:** Private user playlists, Curated Admin playlists, dynamic Mood mixes, reordering, and uninterrupted playback queues.
- **Hiffi Studio & Video Upload:** Creator route gating, multi-step upload wizard, in-browser canvas video frame extraction, chunked S3/R2 upload, ACK completion, and upload navigation guards.
- **Content Migration:** Creator-submitted YouTube/Vimeo channel migration requests, status tracking, and admin triage with quota controls.
- **Moderation & Flagging:** Contextual reporting dialogs for videos, comments, and profiles; dedicated Admin review triage queue.
- **Artist Directory & Claim Portal:** Regional artist indexing (Atlanta scene, genres, Top 500), CSV inventory ingest, and tokenized claim activation.
- **Profiles & Customization:** Public fan view, creator inventory view, avatar/banner image crop and upload, and protected email-reveal dialog.
- **Search & Discovery:** Debounced search overlay, `@username` handle search, video title search, and SQL injection sanitization.
- **Feedback & Bug Reporting:** In-app floating feedback trigger, client environment capture (OS, browser, app version), screenshot upload to R2, and admin feedback inbox.
- **Admin Dashboard (22 Sections):** Complete platform management suite with fine-grained RBAC.

---

## 2. User Roles & Permissions

### 2.1 Role Access Matrix

| Capability / Module | Guest / Visitor | Registered User | Creator / Artist | Admin / Moderator |
| :--- | :---: | :---: | :---: | :---: |
| **Browse Discover & Moods** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Play Videos (Full Quality)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Search (Videos & Users)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **View Public Profiles** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Upvote / Downvote Videos** | ❌ (Auth Prompt) | ✅ Yes | ✅ Yes | ✅ Yes |
| **Post Comments & Replies** | ❌ (Auth Prompt) | ✅ Yes | ✅ Yes | ✅ Yes |
| **Delete Own Comments/Replies** | ❌ N/A | ✅ Yes | ✅ Yes | ✅ Yes |
| **Follow / Unfollow Artists** | ❌ (Auth Prompt) | ✅ Yes | ✅ Yes | ✅ Yes |
| **Create & Manage Playlists** | ❌ (Auth Prompt) | ✅ Yes | ✅ Yes | ✅ Yes |
| **Access Liked & History Pages** | ❌ (Local only) | ✅ Yes (Cloud sync) | ✅ Yes (Cloud sync) | ✅ Yes (Cloud sync) |
| **Report Content (Flags)** | ❌ (Auth Prompt) | ✅ Yes | ✅ Yes | ✅ Yes |
| **Submit Feedback & Screenshots** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Upgrade to Creator via OTP** | ❌ (Must register)| ✅ Yes | ❌ (Already Creator)| ❌ N/A |
| **Access Hiffi Studio (`/studio`)**| ❌ Blocked | ❌ Redirects to Apply| ✅ Yes | ✅ Yes |
| **Upload Videos & Extract Frames** | ❌ Blocked | ❌ Blocked | ✅ Yes | ✅ Yes |
| **Request YouTube Migration** | ❌ Blocked | ❌ Blocked | ✅ Yes | ✅ Yes |
| **Edit Artist Banner & Bio** | ❌ Blocked | ❌ (Basic profile) | ✅ Full Artist Profile| ✅ Admin override |
| **Claim Unclaimed Artist Profile** | ✅ Via Token Link | ✅ Via Token Link | ✅ Via Token Link | ❌ N/A |
| **Access Admin Dashboard** | ❌ Blocked (401/404)| ❌ Blocked (403) | ❌ Blocked (403) | ✅ Yes (Gated by RBAC)|

---

### 2.2 Granular Admin RBAC Permissions (`module.subfeature:action`)

In the Admin Dashboard, access is decoupled from broad role titles. Each admin account is granted specific string permissions:

```
┌────────────────────────────┬────────────────────────────┬────────────────────────────┐
│      ADMIN & ROLES         │      USERS & CREATORS      │     CONTENT & PLAYLISTS    │
├────────────────────────────┼────────────────────────────┼────────────────────────────┤
│ admins.accounts:read       │ users.browse:read          │ curated.playlists:read     │
│ admins.accounts:write      │ users.moderation:write     │ curated.playlists:write    │
│ roles.management:read      │ creators.dashboard:read    │ migration.requests:read    │
│ roles.management:write     │ creators.moderation:write  │ migration.requests:write   │
├────────────────────────────┼────────────────────────────┼────────────────────────────┤
│   MODERATION & FEEDBACK    │    ANALYTICS & MARKETING   │    INVENTORY & SYSTEM      │
├────────────────────────────┼────────────────────────────┼────────────────────────────┤
│ flags.review:read          │ analytics.counters:read    │ inventory.artists:read     │
│ flags.review:write         │ analytics.counters:write   │ inventory.artists:write    │
│ feedback.inbox:read        │ analytics.journeys:read    │ inventory.claims:read      │
│ collaboration.inquiries:read│ analytics.journeys:write  │ inventory.claims:write     │
│                            │ analytics.utm:read         │ inventory.ranking:read     │
│                            │ analytics.utm:write        │ inventory.ranking:write    │
│                            │ analytics.searches:read    │ youtube_keys.manage:read   │
│                            │                            │ youtube_keys.manage:write  │
└────────────────────────────┴────────────────────────────┴────────────────────────────┘
```

- **Legacy Role Fallbacks:** Existing accounts with legacy roles automatically receive corresponding permissions:
  - `superadmin`: Unrestricted wildcard access (`*`).
  - `editor`: Access to curated playlists, inventory, and creator reviews.
  - `moderator`: Access to content flags, user enable/disable, and comment moderation.
  - `viewer`: Read-only access across platform analytics and user lists.

---

## 3. Feature & Module Documentation

---

### Module 1: Authentication & Authorization

#### 1.1 User Registration (`/signup`)
- **Purpose:** Allows new fans and artists to create an account with instant session hydration.
- **Access:** Unauthenticated guests.
- **Location:** Web route `/signup` or modal auth trigger.
- **Preconditions:** None.
- **Workflow:**
  1. User enters Full Name, Username, Email, and Password.
  2. If referred, referral code is auto-populated from cookie `hiffi_ref` or URL parameter.
  3. Cloudflare Turnstile bot challenge verifies automatically.
  4. User clicks "Create Account".
  5. System issues JWT token immediately (`signup_flow: "instant"`).
- **Validations & Business Rules:**
  - **Username:** 3–30 characters, lowercase alphanumeric and underscores only (`^[a-z0-9_]{3,30}$`). Trims spaces and forces lowercase. Must be unique.
  - **Name:** 1–30 characters, non-empty after trim.
  - **Email:** Must conform to standard email regex.
  - **Password:** Minimum 6 characters. Must not contain whitespace.
- **Success State:** Instant redirect to home discover feed or previously intended destination (e.g. video watch, creator apply). Welcome toast appears.
- **Error States:**
  - Username already taken: Inline red alert `409 Conflict`.
  - Password contains whitespace: Immediate validation error before network call.
  - Turnstile failure: Prompts user to complete the verification challenge.
- **Edge Cases:** User signs up with trailing/leading spaces in username or email (must be auto-trimmed).
- **Dependencies:** `POST /auth/register`, `POST /users/availability/{username}`, Cloudflare Turnstile.
- **Tester Considerations:** Verify that registering with an active referral code stores the referral record in the database (`admin/dashboard?section=referrals`).

---

#### 1.2 User Login & Forgot Password (`/login`, `/forgot-password`)
- **Purpose:** Authenticates returning users and enables self-service password recovery.
- **Access:** Unauthenticated users.
- **Location:** `/login` and `/forgot-password`.
- **Preconditions:** Existing account.
- **Workflow:**
  - **Login:** Enter Username or Email + Password → Submit → JWT stored in local storage and auth context hydrated.
  - **Forgot Password:** Enter registered email → System dispatches 6-digit OTP → Enter OTP + New Password on verify step → Password updated.
- **Validations & Rules:**
  - Login identifier can be either username or email.
  - Password recovery OTP expires in 10 minutes.
- **Success State:** Redirect to return URL (`?redirect=...`) or home feed.
- **Error States:**
  - `401 Unauthorized`: "Invalid username/email or password".
  - Account disabled: Admin has disabled the user (message: "Your account has been deactivated").
- **Tester Considerations:** Test logging in with uppercase characters in the username to verify case-insensitivity. Test expired OTP entry on password reset.

---

### Module 2: Home Discover & Recommendation Engine (`new-main` implementation)

#### 2.1 Home Discover Feed
- **Purpose:** Primary landing page showcasing independent music videos with zero algorithmic bias.
- **Access:** Public.
- **Location:** `/`.
- **Preconditions:** None.
- **Workflow:**
  1. Server SSR pre-fetches the first 10 videos with a stable seed (`hiffi_home_v1`) to generate crawler-friendly JSON-LD schemas (`ItemList` & `WebPage`).
  2. Client hydrates into interactive `HomeFeedClient`.
  3. User scrolls down: Infinite scroll fetches the next 10 videos via `POST /videos/list` using the session's deterministic random seed.
  4. Hovering over a video card initiates video preview playback and warms up recommendation cache in the background.
- **Business Rules & Shuffling:**
  - Shuffling is **deterministic**: The backend uses PostgreSQL `hashtext(seed, video_id)` so the user never sees duplicates or missing videos as they scroll through pagination pages.
  - The seed persists in `sessionStorage` (`hiffi_video_seed`) across client navigation.
  - **Hard Reload / Logo Click:** Clicking the Hiffi Logo triggers `requestHomeFeedHardReload()`, generating a fresh random seed, resetting the scroll position to 0, clearing mood mix, and fetching a completely new video order.
- **Soft Navigation Scroll Persistence:**
  - When opening a video `/watch/{id}` and clicking back, the home feed restores the exact scroll position (`#main-content`) and pre-loaded video list from `sessionStorage` (`hiffi_home_feed_state`) without re-shuffling.
- **Success State:** Smooth video card grid, thumbnail images load cleanly, and infinite scroll spinner triggers near bottom.
- **Error States:** Connectivity drop displays `OfflineState` banner with retry button.
- **Tester Considerations:** Verify that clicking back from a watch page lands on the exact video position previously viewed. Verify that clicking the top-left Hiffi logo always scrolls to top and shuffles the feed.

---

#### 2.2 Curated Hero Carousel & Mood Mix Chips
- **Purpose:** Editorial highlight banner at the top of Home and quick mood-based filtering.
- **Access:** Public.
- **Location:** Top of `/`.
- **Preconditions:** Curated playlists configured by admin.
- **Workflow:**
  - **Hero Carousel:** Automatically rotates through top editorial playlists/tracks. Clicking "Play" launches the video in playlist mode.
  - **Mood Mix Chips:** Displays vibe categories: `Chill`, `Energetic`, `Focus`, `Late Night`, `Party`, `Workout`, etc.
  - Clicking a mood chip filters the feed to `GET /playlist/mood/{vibe}` with animated smooth transitions (`MoodFeedAnimated`).
- **Validations & Rules:** Selecting "All" or re-clicking the active mood returns the user to the full discover shuffle.
- **Tester Considerations:** Ensure mood mix transitions do not cause layout shifts or flickering skeletons.

---

#### 2.3 "Up Next" Recommendation Engine (`lib/related-videos.ts`)
- **Purpose:** Supplies contextual recommendations on the watch page sidebar.
- **Access:** Public.
- **Location:** Watch page right sidebar (desktop) or bottom drawer (mobile).
- **Implementation Highlights on `new-main`:**
  - **Instant Home Feed Seeding (`getInstantRelatedFromHomeFeed`):** When navigating from Home to Watch, the watch sidebar immediately populates with videos from the user's active home session. Zero loading spinner.
  - **Hover Prefetching (`prefetchRelatedVideos`):** Hovering over any feed card initiates a background request for recommendations.
  - **Endpoint Priority:** Queries `GET /videos/recommend` (limit 16, displays top 12). If empty or failing, smoothly falls back to `POST /videos/list` with seed.
  - **Exclusion:** The currently playing video is strictly excluded from recommendations.
- **Tester Considerations:** Open a video from Home. Confirm the "Up Next" list renders instantly without a skeleton loader. Verify that the playing video never appears in the Up Next list.

---

### Module 3: Watch Page & Playback Experience

#### 3.1 Video Player (`components/video/video-player.tsx`)
- **Purpose:** High-definition video player supporting multi-bitrate HLS and MP4 streams.
- **Access:** Public.
- **Location:** `/watch/[videoId]`.
- **Key Features:**
  - Resolution selector: Supports switching between `original`, `720p`, and `480p` profiles.
  - Audio focus and persistent volume: Volume and mute settings persist across video sessions in `localStorage` (`hiffi_player_volume`, `hiffi_player_muted`).
  - Google SeekToAction deep linking: Navigating with URL param `?t=45` automatically seeks to 45 seconds once metadata loads.
  - Next-Up Overlay: At the end of playback, a 5-second countdown overlay appears before auto-advancing to the next recommended video.
  - Fullscreen persistence: Advancing to next/previous video does not unmount the player, maintaining fullscreen mode.
  - Watch Time Signals: Every 10 seconds of active playback, the player pings `POST /signals/watchhours` to record platform watch metrics.
- **Edge Cases:** Video transcode in progress displays a friendly "Video is still processing" banner.
- **Tester Considerations:** Test playback on poor network throttling (Fast 3G). Verify resolution switching does not freeze playback. Test `?t=90` URL param.

---

#### 3.2 Social Interactions & Guest Conversion
- **Purpose:** Enables fans to upvote, downvote, comment, reply, follow artists, and share videos.
- **Access:** Authenticated users (guests receive conversion prompt).
- **Location:** `/watch/[videoId]` action bar & comment section.
- **Behavior:**
  - **Upvote/Downvote:** Mutually exclusive. Upvoting an already upvoted video removes the upvote (toggle behavior). Upvoting a downvoted video clears the downvote and sets upvote.
  - **Comments & Replies:** Supports multi-line comments and nested replies. Displays relative timestamps ("2 hours ago"). Users can delete their own comments/replies.
  - **Follow/Unfollow:** Toggles relationship immediately in UI. Updates artist follower counter.
  - **Share Dialog:** Generates referral-attributed link (`?ref=username`). Native mobile share trigger if supported.
  - **Guest Intent Replay:** When a guest clicks Like or Follow, the `AuthDialog` opens. Upon successful login/signup, the system automatically executes the liked/followed action without requiring a second click.
- **Tester Considerations:** Log out, click Like on a video, complete login, and verify that the video is now liked and visible on `/liked`.

---

### Module 4: Playlist Management

#### 4.1 Custom User Playlists
- **Purpose:** Allows users to group and sequence their favorite tracks.
- **Access:** Authenticated users.
- **Location:** `/playlists` and "Save to Playlist" modal on watch page.
- **Preconditions:** Logged in.
- **Workflow:**
  1. User clicks "Save" on watch page.
  2. Dialog lists user's playlists (`GET /playlists/list/self`).
  3. User checks/unchecks boxes to add/remove video.
  4. User can create a new playlist by typing a name and clicking "Create".
  5. On `/playlists`, users can edit playlist title, description, drag-and-drop reorder items, and delete playlists.
  6. Clicking "Play All" opens `/watch/{firstVideoId}` in continuous playlist mode.
- **Validations & Rules:**
  - Playlist title: 1–100 characters. Trims whitespace.
  - Duplicate playlist names for the same user are rejected.
  - Creating a playlist requires an initial video ID.
- **Tester Considerations:** Verify that deleting a video from a playlist does not delete the video from the platform. Verify continuous autoplay from track 1 to track 2 in playlist mode.

---

### Module 5: Creator Studio & Video Upload

#### 5.1 Creator Upgrade & Verification (`/creator/apply`)
- **Purpose:** Upgrades standard user accounts to Creator status.
- **Access:** Registered users (`role: "user"`).
- **Location:** `/creator/apply`.
- **Preconditions:** User must have a registered email address on profile.
- **Workflow:**
  1. User clicks "Become a Creator".
  2. System calls `POST /users/self/request-creator-upgrade`.
  3. A 6-digit OTP is sent to the user's email. Resend cooldown timer (60s) activates.
  4. User enters 6-digit OTP and submits.
  5. System verifies OTP via `POST /users/self/verify-creator-upgrade`.
  6. Account role changes to `creator`. User receives welcome toast and access to `/studio`.
- **Validations & Rules:** Direct `PUT /users/self` with `role: "creator"` is blocked by the backend (`400 Bad Request`). Upgrade MUST go through email OTP.
- **Tester Considerations:** Test entering an invalid OTP. Verify that resend button is disabled during the 60-second cooldown.

---

#### 5.2 Video Publishing Wizard (`/studio/tools/upload`)
- **Purpose:** Enables creators to upload and publish music videos.
- **Access:** Creators only (`role: "creator"`). Non-creators are redirected to `/creator/apply`.
- **Location:** `/studio/tools/upload`.
- **Upload Lifecycle:**
  1. **File Selection:** Creator selects local video file (must be `video/*`).
  2. **In-Browser Thumbnail Extraction:** Video is rendered into a hidden off-screen HTML5 canvas element (`extractMultipleVideoThumbnails`). 3 high-quality frame captures are automatically generated.
  3. **Metadata Entry:** Title (prefilled from filename), Description, Tags (comma-separated), and Thumbnail choice (select from 3 extracted frames or upload custom image).
  4. **Phase 1 (Bridge Initiation):** Client sends `POST /videos/upload`. Backend creates a pending record in `video_on_upload` and returns `bridge_id`, `gateway_url` (presigned video PUT), and `gateway_url_thumbnail` (presigned image PUT).
  5. **Phase 2 (Direct Storage PUT):** Client streams video binary to `gateway_url` and image binary to `gateway_url_thumbnail`. Progress bar updates in real time.
  6. **Phase 3 (Acknowledgment):** Client calls `POST /videos/upload/ack/{bridge_id}`. Backend confirms files exist in storage, updates ACL, increments creator's `total_videos`, and publishes to the global feed.
- **Navigation Guard:** If a creator attempts to close the tab or navigate away during active upload, a browser warning dialog blocks accidental cancellation.
- **Tester Considerations:** Upload a video and test navigating away mid-upload to verify the navigation guard modal. Check that the published video appears immediately on the creator's profile page.

---

### Module 6: YouTube Content Migration

#### 6.1 Creator Migration Request (`/studio/tools/migrate`)
- **Purpose:** Allows creators to request automated migration of their existing YouTube music video catalog to Hiffi.
- **Access:** Creators only.
- **Location:** `/studio/tools/migrate`.
- **Workflow:**
  1. Creator enters their official YouTube Channel or Playlist URL.
  2. Selects content type: `Music Videos`, `Audio Tracks`, `Music Videos and Audio`, or `Other`.
  3. Adds optional notes and verified Google channel email.
  4. Submits request via `POST /migration-requests`.
  5. Status updates to `pending`. Creator can monitor progress on their migration requests table.
- **Validations & Rules:** Channel URL must match valid YouTube format (`youtube.com/channel/...`, `youtube.com/@handle`, or `youtube.com/playlist?list=...`).
- **Status Lifecycle:** `pending` → `under_review` → `approved` → `completed` (or `rejected`).
- **Tester Considerations:** Submit a migration request and verify it appears in the Admin Dashboard under the Migrations section.

---

### Module 7: Moderation & Content Reporting

#### 7.1 Content Flagging (`ContentReportDialog`)
- **Purpose:** Community moderation tool allowing users to flag inappropriate videos, abusive comments, or impersonated accounts.
- **Access:** Authenticated users.
- **Location:** Watch page more menu ("Report"), Comment action menu ("Report"), Profile page ("Report User").
- **Workflow:**
  1. User clicks "Report".
  2. Dialog fetches report categories from `GET /flags/config`.
  3. User selects reason code: `inappropriate`, `copyright`, `spam`, `harassment`, `hate_speech`, `violence`, `other`.
  4. Enters description notes (minimum 10 characters).
  5. Submits via `POST /flags`. A reference ID (UUID) is generated.
  6. User can track their filed cases on `/support/reports`.
- **Tester Considerations:** Check that a user cannot report their own video or profile (ownership guard). Verify the submission appears in the Admin Flags review queue.

---

### Module 8: Unclaimed Artist Directory & Profile Claiming

#### 8.1 Artist Directory & Top 500 (`/artist-index`, `/top-artists`)
- **Purpose:** Public directory of independent artists categorized by city (e.g. Atlanta, Chicago, NYC) and genre.
- **Unclaimed vs. Claimed Profiles:**
  - Profiles ingested by the platform display an "Unclaimed Artist" banner with a "Claim This Profile" button.
  - Verified profiles show a blue verified checkmark icon.

#### 8.2 Profile Claim Onboarding (`/claim/onboard?ident=...`)
- **Purpose:** Allows the legitimate artist to activate an unclaimed profile created during catalog ingestion.
- **Access:** Recipient of an official onboarding link with an activation token (`ident`).
- **Workflow:**
  1. Artist receives invite link: `https://hiffi.com/claim/onboard?ident={secure_token}`.
  2. Page verifies the token via `GET /api/inventory/claims/verify?ident=...`.
  3. Form displays the artist's name and pre-filled details.
  4. Artist sets a new password (min 6 chars, no spaces) and confirms it.
  5. Cloudflare Turnstile validates human interaction.
  6. Artist clicks "Activate Profile".
  7. Backend transfers ownership, assigns `role: "creator"`, issues session JWT, and redirects directly to Hiffi Studio (`/studio`).
- **Tester Considerations:** Test entering mismatched passwords. Test accessing the claim page with an expired or tampered `ident` token.

---

### Module 9: User & Artist Profiles

#### 9.1 Profile Views & Customization (`/profile/[username]`)
- **Purpose:** Public portfolio and identity management for fans and creators.
- **Sub-Views:**
  - **Public View:** Video catalog grid, artist bio, follower/following count, social media icon links (Instagram, Twitter/X, YouTube, Spotify, TikTok), follow button.
  - **Personal Member View:** Edit display name, upload avatar, request email change via OTP, view liked videos shortcut.
  - **Creator Studio View:** Custom banner upload and positioning, profile picture cropper, inventory verification badge.
  - **Email Reveal Protection:** Email addresses are masked on public profiles. Clicking "Reveal Email" triggers rate-limited modal verification (`/api/profile/reveal-email`).
- **Tester Considerations:** Test uploading an oversized profile banner (>10MB). Test updating social media links with invalid URLs.

---

### Module 10: In-App Feedback & Bug Reporting

#### 10.1 Feedback Form (`/feedback` / Bottom Sheet)
- **Purpose:** Seamless bug and feature reporting with automated technical diagnostic capture.
- **Access:** Public (guests and registered users).
- **Workflow:**
  1. User opens feedback trigger.
  2. Automatically captures client context: Current Page URL, User Agent, App Version, Platform (`web`, `ios`, `android`).
  3. User types description of issue.
  4. Optional: User attaches a screenshot.
  5. If screenshot attached, client calls `POST /feedback/screenshot/upload` to get an R2 presigned PUT URL, uploads the image, and includes `screenshot_url` in final submission.
  6. Checkbox: "Allow Hiffi team to contact me about this report".
  7. Calls `POST /feedback/`.
- **Tester Considerations:** Verify that feedback submissions from logged-in users include their user ID and registered email in `admin/dashboard?section=feedback`.

---

### Module 11: Comprehensive Admin Portal (`/admin/dashboard`)

Access to `/admin/dashboard` is strictly authenticated and gated by granular RBAC permissions.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             ADMIN PORTAL SECTIONS                                │
├───────────────────────┬──────────────────────────┬───────────────────────────────┤
│ 1. Overview           │ 9. Visitor Journeys      │ 17. Curated Playlists         │
│ 2. Users Management   │ 10. Referrals Tracking   │ 18. Artist Inventory & Claims │
│ 3. Creators Directory │ 11. Followers Network    │ 19. Ranking Anomalies         │
│ 4. Videos Management  │ 12. Recorded Searches    │ 20. Team Members & Invites    │
│ 5. Comments Triage    │ 13. UTM Campaigns & Polls│ 21. Custom RBAC Roles         │
│ 6. Replies Triage     │ 14. Collaboration Inbound│ 22. Tools & YouTube API Keys  │
│ 7. Content Flag Queue │ 15. Discovery Survey     │                               │
│ 8. Feedback Inbox     │ 16. Migration Requests   │                               │
└───────────────────────┴──────────────────────────┴───────────────────────────────┘
```

#### Detailed Section Capabilities:
1. **Overview:** Platform health counters (total streams, active users, uploads) and creator funnel snapshot.
2. **Users:** Search users, toggle account status (Active / Disabled), inspect registration date, and reveal email addresses.
3. **Creators Directory:** Creator lifecycle metrics (onboarding stage, upload status, retention, and follow-up flags).
4. **Videos:** Search and filter all uploaded videos by status, visibility, duration, and view counts. Hard delete videos.
5. **Comments & Replies Moderation:** View comments across all videos; delete abusive or spam comments.
6. **Content Flag Review:** Triage user-submitted content flags. Change status (`pending` → `under_review` → `resolved` / `dismissed`), view video snippet, and enter internal resolution notes.
7. **Feedback Inbox:** Inspect user bug reports with embedded screenshot viewer, device context, and contact consent.
8. **Visitor Journeys & Funnels:** Visual funnel analysis tracking visitor drop-off from Landing → Discover → Stream → Auth → Creator Upgrade.
9. **Curated Playlists:** Create and manage official editorial playlists. Toggle hero carousel promotion and reorder track sequencing.
10. **Artist Inventory & Claims:** Upload CSV batches of artist metadata, inspect unclaimed directory profiles, and review/approve identity claims.
11. **Ranking Anomalies:** Automated detection for sudden YouTube subscriber or view count anomalies on Hiffi 500 artists.
12. **Team & Roles:** Superadmins can invite new team members by email and configure custom permission profiles using the granular permission matrix.
13. **Tools & YouTube API Keys:** Monitor YouTube Data API v3 quota consumption across rotated API keys pool.

---

## 4. End-to-End Workflows

### E2E 1: New Fan Registration → Instant Stream
```
[Visitor on /] ──► [Clicks "Sign Up"] ──► [Enters Name, Username, Email, Pass]
      │
      ▼
[Turnstile Solved] ──► [POST /auth/register] ──► [JWT Issued & Stored]
      │
      ▼
[Home Discover Feed] ──► [Selects Video] ──► [/watch/{id} Starts Streaming]
```
1. Guest visits home page, scrolls discover feed, and clicks "Sign Up".
2. Fills out the form with valid details. Cloudflare Turnstile validates in background.
3. Clicks "Create Account". API returns 200 with JWT and user object.
4. Client stores JWT in local storage; top-right navbar updates with user avatar.
5. User clicks any music video. Stream begins instantly without ads.

---

### E2E 2: User-to-Creator Upgrade via Email OTP
```
[Logged-in Fan] ──► [Navigates to /creator/apply] ──► [Clicks "Become a Creator"]
      │
      ▼
[POST /users/self/request-creator-upgrade] ──► [OTP Emailed to User]
      │
      ▼
[Enters 6-Digit OTP] ──► [POST /users/self/verify-creator-upgrade]
      │
      ▼
[Role Upgraded to 'creator'] ──► [Welcome Toast & Redirect to /studio]
```
1. User with `role: "user"` visits `/creator/apply`.
2. Clicks "Become a Creator". System sends 6-digit OTP to user's registered email address.
3. Form displays OTP input with 60s resend countdown.
4. User inputs OTP and clicks "Verify & become a creator".
5. API updates role to `creator`. Client refreshes user session and unlocks `/studio`.

---

### E2E 3: Video Upload & Publishing
```
[Creator in /studio] ──► [Selects MP4 Video File] ──► [In-Browser Canvas Frame Extractor]
      │
      ▼
[3 Thumbnails Generated] ──► [Enters Title, Description, Tags] ──► [Clicks "Publish"]
      │
      ▼
[POST /videos/upload] ──► [Receives bridge_id + Presigned Video/Thumbnail URLs]
      │
      ▼
[Direct PUT to Storage] ──► [POST /videos/upload/ack/{bridge_id}] ──► [Live on Platform]
```
1. Creator opens `/studio/tools/upload`.
2. Drops an MP4 music video file.
3. Browser automatically extracts 3 distinct video frames at different timestamps.
4. Creator selects the best frame as thumbnail, enters title and tags, and clicks "Upload".
5. Backend issues 20-minute presigned PUT URLs for video and thumbnail.
6. Client uploads binaries directly to S3/R2 storage with progress bar.
7. Upon completion, client calls `/videos/upload/ack/{bridge_id}`.
8. Video is marked active and becomes streamable worldwide.

---

### E2E 4: YouTube Content Migration
```
[Creator in /studio/tools/migrate] ──► [Enters YouTube Channel URL & Content Type]
      │
      ▼
[POST /migration-requests] ──► [Request Placed in 'pending' Queue]
      │
      ▼
[Admin in /admin/dashboard?section=migrations] ──► [Reviews Request & Checks Quota]
      │
      ▼
[Admin Changes Status to 'approved' / 'completed'] ──► [Videos Imported to Creator Account]
```
1. Creator submits official YouTube channel URL and selects "Music Videos".
2. Request appears in admin dashboard under "Migration Requests".
3. Admin verifies ownership and approves the migration.
4. Automated workers fetch video assets and publish them directly under the creator's profile.

---

### E2E 5: Unclaimed Artist Profile Claiming
```
[Artist Receives Claim URL with ?ident=...] ──► [Opens /claim/onboard]
      │
      ▼
[Token Verified via API] ──► [Sets New Password + Solves Turnstile]
      │
      ▼
[POST Complete Claim] ──► [Profile Linked to User + Upgraded to Creator]
      │
      ▼
[Direct Redirect to /studio to Manage Catalog]
```
1. Artist opens invitation link with secure `ident` token.
2. System loads pre-populated profile details.
3. Artist enters new password, completes Turnstile, and clicks "Activate Profile".
4. Backend provisions account, links historical streaming statistics, sets role to `creator`, and logs user in.

---

### E2E 6: Guest Conversion & Intent Replay
```
[Guest Watches Video] ──► [Clicks "Like" (Heart)] ──► [AuthDialog Opens]
      │
      ▼
[Action Saved in pending-intents] ──► [Guest Completes Login / Signup]
      │
      ▼
[Auth Completes] ──► [replayPendingGuestIntents() Fires Automatically]
      │
      ▼
[Video Liked Successfully + Toast Notification]
```
1. Unauthenticated guest clicks the Like button on `/watch/{videoId}`.
2. The UI intercepts the click, saves a pending like intent in memory/storage, and opens the auth dialog.
3. Guest logs in or registers.
4. Upon successful login, the system automatically replays the pending like intent.
5. The heart icon turns red, like counter increments, and a toast confirms "Video added to liked videos".

---

## 5. QA Testing Checklist

| ID | Module | Scenario | Preconditions | Steps | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **AUTH-01** | Auth | Register new user with valid details | Guest user | 1. Navigate to `/signup`<br>2. Fill Name, Username, Email, Password<br>3. Submit | Account created, instant JWT issued, redirected to home feed | **P0** |
| **AUTH-02** | Auth | Register with invalid username (spaces, symbols) | Guest user | 1. Enter `john doe!` as username<br>2. Fill other fields<br>3. Submit | Form blocks submission with inline error: lowercase letters, numbers, and underscores only | **P1** |
| **AUTH-03** | Auth | Register with duplicate username | Existing user `testartist` | 1. Enter username `testartist`<br>2. Submit | Red alert: "Username is already taken" (`409 Conflict`) | **P0** |
| **AUTH-04** | Auth | Password validation (whitespace check) | Guest user | 1. Enter `pass 123` as password<br>2. Submit | Form blocks submission: "Password cannot contain spaces" | **P1** |
| **AUTH-05** | Auth | Login with valid credentials | Registered user | 1. Go to `/login`<br>2. Enter email/username and password<br>3. Submit | Authenticated successfully; redirected to destination | **P0** |
| **AUTH-06** | Auth | Login with incorrect password | Registered user | 1. Enter valid username and wrong password<br>2. Submit | Error: "Invalid username/email or password" (`401`) | **P0** |
| **AUTH-07** | Auth | Forgot password OTP flow | Registered user | 1. Go to `/forgot-password`<br>2. Enter email<br>3. Enter received 6-digit OTP and new password | Password reset successfully; can log in with new password | **P1** |
| **HOME-01** | Home | Discover feed initial load & SSR | None | 1. Open `/` in incognito browser | First 10 videos render instantly without layout shift; meta tags populated | **P0** |
| **HOME-02** | Home | Infinite scroll pagination | None | 1. Scroll to bottom of home feed | Spinner triggers, next 10 videos load deterministically without duplicates | **P0** |
| **HOME-03** | Home | Mood mix filter selection | None | 1. Click "Workout" mood chip | Feed transitions smoothly to workout tracks; URL updates | **P1** |
| **HOME-04** | Home | Soft navigation scroll restoration (`new-main`) | None | 1. Scroll down 5 pages on home feed<br>2. Click video to open watch page<br>3. Click browser back button | Home feed restores exact previous scroll position and loaded videos | **P0** |
| **HOME-05** | Home | Hard feed reload on logo click | Scrolled down feed | 1. Click Hiffi logo in navbar | Feed scrolls to top, resets mood to All, and shuffles with new random seed | **P1** |
| **HOME-06** | Home | Hover video card preview | None | 1. Hover mouse over feed video card | Thumbnail plays silent micro-preview after 300ms debounce | **P2** |
| **REC-01** | Recs | Instant Up Next seeding (`new-main`) | None | 1. Click video from home discover feed | Watch page Up Next list renders immediately from home session | **P0** |
| **REC-02** | Recs | Current video exclusion | Playing video ID `vid-123` | 1. Inspect Up Next recommendation list | `vid-123` is strictly excluded from recommendation cards | **P0** |
| **WATCH-01**| Watch | Video playback and audio controls | None | 1. Open `/watch/{videoId}`<br>2. Test Play, Pause, Seek, Volume, Mute | Video plays smoothly; volume preference persists on page reload | **P0** |
| **WATCH-02**| Watch | Multi-resolution profile switching | Multi-bitrate video | 1. Click player gear icon<br>2. Switch between 720p, 480p, original | Quality changes seamlessly without player unmounting or crash | **P1** |
| **WATCH-03**| Watch | Google SeekToAction URL parameter | None | 1. Open `/watch/{videoId}?t=60` | Player automatically seeks to 01:00 once metadata loads | **P1** |
| **WATCH-04**| Watch | Upvote / Downvote toggle logic | Logged-in user | 1. Click Upvote (increments)<br>2. Click Downvote | Upvote decrements and Downvote increments; state is mutually exclusive | **P0** |
| **WATCH-05**| Watch | Post comment and reply | Logged-in user | 1. Type comment and submit<br>2. Reply to own comment | Comment appears instantly; reply nests under parent comment | **P1** |
| **WATCH-06**| Watch | Delete comment | Comment owner | 1. Click delete on own comment | Comment removed from list; comment counter decrements | **P1** |
| **WATCH-07**| Watch | Guest conversion like intent replay | Guest user | 1. Click Like as guest<br>2. Log in via modal | Modal closes, video is automatically liked without second click | **P0** |
| **PLAY-01** | Playlists | Create new playlist from watch page | Logged-in user | 1. Click "Save"<br>2. Enter "My Jam"<br>3. Click Create | Playlist created with current video; confirmation toast appears | **P1** |
| **PLAY-02** | Playlists | Continuous queue playback | Existing playlist | 1. Open `/playlists/{id}`<br>2. Click Play All<br>3. Let video 1 end | Player auto-advances to video 2 without user interaction | **P0** |
| **STUDIO-01**| Studio | Non-creator access restriction | User with `role: "user"` | 1. Navigate to `/studio` | Redirected to `/creator/apply` with toast: "Creator Status Required" | **P0** |
| **STUDIO-02**| Studio | Creator upgrade via email OTP | Logged-in user with email | 1. Go to `/creator/apply`<br>2. Click Become Creator<br>3. Enter OTP | Role updates to creator; user redirected to `/studio` | **P0** |
| **STUDIO-03**| Studio | Video upload & frame extraction | Creator user | 1. Drop MP4 file on upload tool | 3 video frames extracted in-browser; title prefilled from filename | **P0** |
| **STUDIO-04**| Studio | Direct storage upload & ack | Creator user | 1. Fill details and click Publish | Presigned PUT succeeds; ACK succeeds; video live on profile | **P0** |
| **STUDIO-05**| Studio | Upload navigation guard | Active upload | 1. Attempt to close tab or navigate away during upload | Modal warning prompts user that upload will be aborted | **P1** |
| **MIGR-01** | Migrate | Submit YouTube migration request | Creator user | 1. Enter YouTube channel URL<br>2. Submit request | Request saved with status `pending`; visible in creator table | **P1** |
| **MOD-01**  | Mod | Report video for copyright/spam | Logged-in user | 1. Open report dialog on video<br>2. Select reason & submit | Success alert with Case UUID; appears in Admin Flags queue | **P1** |
| **MOD-02**  | Mod | Prevent self-reporting | Video owner | 1. Attempt to report own video | Report option is hidden or disabled | **P2** |
| **CLAIM-01**| Claim | Claim artist profile via token link | Artist with valid token | 1. Open `/claim/onboard?ident=TOKEN`<br>2. Set password & Turnstile | Account activated, converted to creator, logged in to studio | **P0** |
| **CLAIM-02**| Claim | Tampered claim token | None | 1. Open `/claim/onboard?ident=INVALID` | Error alert: "Activation link is invalid or expired" | **P1** |
| **SEARCH-01**| Search | Search videos and @creators | None | 1. Type `@kairo` in search overlay<br>2. Switch tabs to Videos/Users | Displays matching creator profile cards and relevant videos | **P1** |
| **SEARCH-02**| Search | SQL-like query sanitization | None | 1. Enter `' OR '1'='1` in search | System strips dangerous patterns and executes safe text search | **P1** |
| **ADMIN-01**| Admin | Unauthorized access block | Guest / Regular user | 1. Attempt to open `/admin/dashboard` | Access blocked (`403 Forbidden` / redirect to login) | **P0** |
| **ADMIN-02**| Admin | Granular RBAC permission enforcement | Admin with `users:read` only | 1. Open `/admin/dashboard`<br>2. Try to access `/admin/dashboard?section=admins` | Section is hidden from sidebar; direct URL returns permission denied | **P0** |
| **ADMIN-03**| Admin | User deactivation | Admin with `users.moderation:write` | 1. Find user in Users table<br>2. Click "Disable User" | User status changes to Disabled; user cannot log in | **P0** |
| **ADMIN-04**| Admin | YouTube migration triage | Admin with `migration.requests:write` | 1. Open Migration Requests<br>2. Change status to `approved` | Status updates; system begins background catalog ingestion | **P1** |
| **ADMIN-05**| Admin | Content flag resolution | Admin with `flags.review:write` | 1. Open flag detail<br>2. Add resolution note & resolve | Flag status changes to `resolved`; archived in queue | **P1** |
| **ADMIN-06**| Admin | Curated playlist hero toggle | Admin with `curated.playlists:write` | 1. Edit curated playlist<br>2. Toggle "Feature in Hero Carousel" | Playlist immediately reflects on Home page hero carousel | **P1** |
| **ADMIN-07**| Admin | Reveal user email security check | Admin | 1. Click "Reveal Email" on user row | Modal warns of audit logging; email unmasks successfully | **P2** |
| **FEED-01** | Feedback| Submit in-app bug with screenshot | None | 1. Open feedback sheet<br>2. Attach screenshot & submit | Image uploads to R2; report appears in Admin Feedback inbox | **P1** |

---

## 6. API & Integration Reference

| Integration / Service | Purpose | Implementation Location | Expected Behavior | Failure Scenarios & Handling | Tester Considerations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Core REST API** (`api.hiffi.com`) | Central platform data store | `lib/api-client.ts`, `lib/api/*` | Validates JWT Bearer tokens; returns JSON `{ success: true, data: ... }` | Returns `401` on expired token, `403` on permission denial, `500` on server error | Verify token refresh and auto-logout on `401 Unauthorized`. |
| **Cloudflare Workers Proxy** | Secure video streaming & CDN edge | `lib/storage.ts`, Workers domain | Serves video chunks with `x-api-key` header without exposing raw storage credentials | `502 Bad Gateway` if upstream storage times out | Test video buffering on high-latency connections. |
| **Cloudflare Turnstile** | Bot mitigation for signups & claims | `hooks/use-turnstile-form.ts`, `TurnstileFormField` | Invisibly validates human interaction; issues short-lived verification token | Blocked submission if token missing or invalid | Turnstile can be disabled in development mode (`NEXT_PUBLIC_TURNSTILE_ENABLED=false`). |
| **S3 / Cloudflare R2** | Video, thumbnail, banner, avatar storage | `lib/api/upload.ts`, `lib/storage.ts` | Direct PUT binary upload via 20-minute presigned URLs | `403 Presigned URL Expired` if upload takes >20 minutes | Test with large video files (>500MB) to verify chunked upload reliability. |
| **Umami Analytics** | Privacy-focused product telemetry | `lib/umami.ts`, `lib/conversion-tracking.ts` | Tracks custom events (`Played Video`, `Video Liked`, `Creator Account Created`) | Fire-and-forget; never blocks UI execution | Inspect network tab for `POST /api/send` analytics payloads. |
| **Email Service / OTP Gateway** | Creator upgrades, password resets, onboarding | Core backend worker | Delivers 6-digit numeric OTP within 15–30 seconds | Delivery delay or spam filtering | Ensure 60-second resend countdown prevents spamming the email gateway. |
| **YouTube Data API v3** | Channel catalog migration and Top 500 stats | Core backend & `components/admin/youtube-api-keys-panel.tsx` | Ingests video metadata, titles, descriptions, and view counts | Daily API quota exceeded (HTTP 403) | Admin Tools section provides an API key rotation pool. |

---

## 7. Known Limitations, Risks & Edge Cases

1. **Video Transcoding Latency:**
   - When a creator finishes uploading a video, it is placed in an asynchronous transcoding queue to produce 720p and 480p streams.
   - *Impact on Testing:* Immediately opening a newly uploaded video may show a "Video is still processing" banner. Allow 2–5 minutes for transcoding to complete before validating multi-resolution switching.

2. **Presigned Upload URL Expiration:**
   - Upload presigned URLs expire strictly 20 minutes after generation.
   - *Impact on Testing:* If uploading an extremely large file on a throttled connection that exceeds 20 minutes, the upload fails at the storage layer.

3. **Username Availability Rate Limiting:**
   - As noted in backend code comments, `GET /users/availability/{username}` does not have aggressive rate-limiting middleware.
   - *Impact on Testing:* Rapid typing in signup form triggers multiple availability queries. The client mitigates this with a 300ms debounce.

4. **Storage Cleanup on Video Deletion:**
   - Deleting a video removes its record from the database, but physical video files and thumbnails in object storage may be scheduled for asynchronous garbage collection.

5. **Deterministic Random Seed Session Lifetime:**
   - The random seed persists in `sessionStorage`. Closing the tab or opening a new browser tab generates a fresh seed. Soft navigations within the same tab preserve the seed.

---

## 8. Test Environment & Setup

### 8.1 Recommended Environments
- **Local Dev:** `http://localhost:3000` (Web) / Flutter Android/iOS Simulator
- **Staging / Pre-production:** `https://dev.hiffi.com` / `https://api.dev.hiffi.com`
- **Production:** `https://hiffi.com` / `https://api.hiffi.com`

### 8.2 Test Accounts Required
To execute the complete QA suite, prepare the following 4 dedicated test personas:

| Persona | Role | Purpose / Focus |
| :--- | :--- | :--- |
| **Test Fan** | `user` | Standard viewing, like/comment engagement, custom playlist creation. |
| **Test Creator** | `creator` | Hiffi Studio access, video uploading, thumbnail extraction, YouTube migration. |
| **Test Admin** | `admin` (superadmin)| Full dashboard access, user deactivation, flag triage, team management. |
| **Restricted Admin** | `admin` (custom role)| Gated permissions (e.g. `flags.review:*` only) to verify RBAC access restrictions. |

### 8.3 Test Assets Required
- Sample MP4 video files: Short (<30s), Medium (2–5 min), Large (>100MB).
- Sample video files with non-standard aspect ratios (vertical 9:16 shorts vs standard 16:9).
- Sample profile banner images (`.jpg`, `.webp`, `.png`) up to 10MB.
- Sample CSV file for bulk artist inventory ingest in the Admin Portal.
- Public YouTube music video URL and channel handle for migration testing.

---

## 9. Regression Checklist (Release Sign-off)

Before approving any production deployment, verify these 12 critical smoke paths:

- [ ] **1. Public Discovery Feed:** Home page loads without errors; cards render with thumbnails; infinite scroll fetches next page.
- [ ] **2. Hard Feed Reload:** Clicking Hiffi logo scrolls to top, resets mood, and generates a new video shuffle.
- [ ] **3. Video Playback:** Video plays with sound; play/pause works; volume persists across reload.
- [ ] **4. Instant Up Next (`new-main`):** Opening video from home instantly populates Up Next recommendations without loading flicker.
- [ ] **5. Soft Navigation Back:** Navigating back from Watch page restores previous home scroll position.
- [ ] **6. Authentication:** Existing user can log in; new user can sign up; token persists in storage.
- [ ] **7. Social Engagement:** Upvote, downvote, and comment submission succeed; guest click triggers auth modal.
- [ ] **8. Guest Intent Replay:** Guest liking a video and logging in automatically executes the like.
- [ ] **9. Studio & Upload:** Creator can upload an MP4, auto-extract a thumbnail, and publish successfully.
- [ ] **10. Navigation Guard:** Navigating away during video upload prompts confirmation modal.
- [ ] **11. Moderation:** Reporting a video generates a reference ID and appears in the Admin Flags queue.
- [ ] **12. Admin Security:** Unauthorized users cannot access `/admin/dashboard`; RBAC restrictions properly hide unauthorized sections.

---

## 10. Project Coverage Summary

| Inspected Area | Source Branch / Codebase | Verification Status | Notes / QA Observations |
| :--- | :--- | :--- | :--- |
| **Home Page & Feed** | `hiffi_web` (`new-main`) | ✅ Fully Implemented | Includes SSR snapshot hydration, Hero Curated Carousel, Mood Mix chips, and deterministic stable shuffles. |
| **Recommendation Engine** | `hiffi_web` (`new-main`) | ✅ Fully Implemented | `lib/related-videos.ts` seeds instantly from home session; prefetches on hover; queries `/videos/recommend` (limit 16). |
| **Scroll Persistence** | `hiffi_web` (`new-main`) | ✅ Fully Implemented | `lib/home-feed-session.ts` preserves feed array and scroll offset on `#main-content` across soft navigations. |
| **Core Web Platform & Pages** | `hiffi_web` (`hiffi_dev_v2`) | ✅ Fully Implemented | Covers `/watch`, `/search`, `/profile`, `/playlists`, `/liked`, `/history`, `/following`, and content pages. |
| **Creator Studio & Upload** | `hiffi_web` (`hiffi_dev_v2`) | ✅ Fully Implemented | Multi-step wizard with in-browser canvas frame extractor, presigned PUT to R2/S3, ACK, and upload navigation guards. |
| **Creator Upgrade Flow** | `hiffi_web` (`hiffi_dev_v2`) | ✅ Fully Implemented | OTP email verification required. Direct role update via PUT is strictly blocked by the backend API. |
| **YouTube Migration Engine** | `hiffi_web` (`hiffi_dev_v2`) | ✅ Fully Implemented | Creator submission form with channel URL validation; Admin review and status pipeline. |
| **Content Flags & Moderation**| `hiffi_web` (`hiffi_dev_v2`) | ✅ Fully Implemented | Contextual reporting dialogs; user case tracking on `/support/reports`; full Admin review queue. |
| **Artist Inventory & Claims** | `hiffi_web` (`hiffi_dev_v2`) | ✅ Fully Implemented | Regional directories, CSV bulk upload, and tokenized claim activation on `/claim/onboard`. |
| **Admin Portal & RBAC v2** | `hiffi_web` (`hiffi_dev_v2`) | ✅ Fully Implemented | 22 operational sections gated by fine-grained `module.subfeature:action` string permissions. |
| **In-App Feedback System** | `hiffi_web` (`hiffi_dev_v2`) | ✅ Fully Implemented | Auto-captures client environment; uploads screenshots via presigned R2 URLs; surfaced in admin feedback inbox. |
| **Mobile Application Parity** | `flutter/hiffi` (`main`) | ✅ Parity Verified | Flutter app shares backend APIs (`api.hiffi.com`), GoRouter structure, video streaming, and user workflows. |
