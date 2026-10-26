/**
 * Registry of every tracked control. The id is put on the element with `{...trackId(id)}`; the
 * tracker sends it as the event tag, so it is also the step name in admin journeys and the row in
 * the Features tab.
 *
 * Never rename or reuse an id: history is keyed by it. Retire it and add a new one instead.
 * New ids get `since` (launch date, YYYY-MM-DD) so adoption is measured from launch.
 * `npm run lint:tracking` fails on attributes whose values are not registered here.
 */

export type TrackingIdInfo = {
  /** Product area, groups rows in the Features tab. */
  feature: string
  label: string
  since?: string
}

export const TRACKING_IDS = {
  // Navigation
  "appbar-logo": { feature: "navigation", label: "App bar logo" },
  "navbar-hip-hop-500-link": { feature: "navigation", label: "Navbar: Hip-Hop 500" },
  "navbar-artist-index-link": { feature: "navigation", label: "Navbar: Artist Index" },
  "navbar-open-search-button": { feature: "search", label: "Open search" },
  "navbar-open-search-button-mobile": { feature: "search", label: "Open search (mobile)" },
  "navbar-open-hiffi-studio-button": { feature: "creator", label: "Navbar: Hiffi Studio" },
  "navbar-open-become-creator-button": { feature: "creator", label: "Navbar: Become a creator" },
  "navbar-profile-link": { feature: "navigation", label: "User menu: Profile" },
  "navbar-user-menu-hiffi-studio-link": { feature: "creator", label: "User menu: Hiffi Studio" },
  "navbar-user-menu-become-creator-link": { feature: "creator", label: "User menu: Become a creator" },
  "navbar-my-reports-link": { feature: "reports", label: "User menu: My reports" },
  "navbar-send-feedback": { feature: "feedback", label: "Navbar: Send feedback" },
  "navbar-login-button": { feature: "auth", label: "Navbar: Log in" },
  "navbar-signup-button": { feature: "auth", label: "Navbar: Sign up" },
  "navbar-logout-confirm-button": { feature: "auth", label: "Log out" },
  sidebar_home_button: { feature: "navigation", label: "Sidebar: Home" },
  sidebar_history_link: { feature: "navigation", label: "Sidebar: History" },
  sidebar_liked_videos_link: { feature: "navigation", label: "Sidebar: Liked videos" },
  sidebar_playlists_link: { feature: "navigation", label: "Sidebar: Playlists" },
  sidebar_following_link: { feature: "navigation", label: "Sidebar: Following" },
  "sidebar-send-feedback": { feature: "feedback", label: "Sidebar: Send feedback" },
  "global-player-expand-button": { feature: "player", label: "Expand mini player" },

  // Opening videos
  "opened-video": { feature: "video", label: "Opened a video" },
  opened_video: { feature: "video", label: "Opened a video (grid)" },
  "opened-video-from-home": { feature: "video", label: "Opened video from home" },
  "opened-video-from-home-hero": { feature: "home", label: "Opened video from home hero" },
  "opened-video-from-search": { feature: "search", label: "Opened video from search" },
  "opened-video-from-mood": { feature: "mood-mix", label: "Opened video from mood mix" },
  "opened-video-from-playlist": { feature: "playlists", label: "Opened video from playlist" },
  "opened-video-from-recommended": { feature: "video", label: "Opened recommended video" },
  "opened-video-from-liked": { feature: "video", label: "Opened video from liked" },
  "opened-video-from-profile": { feature: "profile", label: "Opened video from profile" },
  "opened-video-from-history": { feature: "video", label: "Opened video from history" },
  "opened-video-from-feed-preview": { feature: "home", label: "Opened video from feed preview" },
  "video-card-open-profile": { feature: "profile", label: "Video card: open artist profile" },
  "video-card-add-to-playlist-button": { feature: "playlists", label: "Video card: add to playlist" },
  "video-card-share": { feature: "share", label: "Video card: share" },

  // Player
  "played-video": { feature: "player", label: "Pressed play" },
  "paused-video": { feature: "player", label: "Paused" },
  "player-next-recommended": { feature: "player", label: "Next video" },
  "player-previous": { feature: "player", label: "Previous video" },
  "player-seek-backward": { feature: "player", label: "Seek backward" },
  "player-seek-forward": { feature: "player", label: "Seek forward" },
  "unmuted-video": { feature: "player", label: "Unmuted (tap to unmute)" },
  unmuted_video: { feature: "player", label: "Unmuted" },
  muted_video: { feature: "player", label: "Muted" },
  entered_fullscreen: { feature: "player", label: "Entered fullscreen" },
  exited_fullscreen: { feature: "player", label: "Exited fullscreen" },
  "opened-quality-settings": { feature: "player", label: "Opened quality settings" },
  "up-next-sidebar-click": { feature: "up-next", label: "Up Next sidebar video" },
  "playlist-queue-click": { feature: "playlists", label: "Picked a track from the queue" },
  "up-next-overlay-play": { feature: "up-next", label: "Up Next overlay: play" },
  "up-next-overlay-cancel": { feature: "up-next", label: "Up Next overlay: cancel" },

  // Watch page
  "watch-like-video": { feature: "watch", label: "Liked a video" },
  "watch-unlike-video": { feature: "watch", label: "Removed a like" },
  "watch-save-to-playlist": { feature: "playlists", label: "Watch: save to playlist" },
  "watch-more-actions": { feature: "watch", label: "Watch: more actions" },
  "shared-video": { feature: "share", label: "Watch: share" },
  followed_creator: { feature: "follow", label: "Followed an artist" },
  unfollowed_creator: { feature: "follow", label: "Unfollowed an artist" },
  "opened-comments": { feature: "comments", label: "Opened comments" },
  "comment-post": { feature: "comments", label: "Posted a comment", since: "2026-10-21" },
  "comment-reply-post": { feature: "comments", label: "Posted a reply", since: "2026-10-21" },
  "guest-comment-signup-link": { feature: "guest-conversion", label: "Comments: guest sign up" },
  "guest-comment-login-link": { feature: "guest-conversion", label: "Comments: guest log in" },

  // Share and playlists
  "share-dialog-copy-link": { feature: "share", label: "Share dialog: copy link", since: "2026-10-21" },
  "share-dialog-native-share": { feature: "share", label: "Share dialog: more options", since: "2026-10-21" },
  "playlist-picker-new": { feature: "playlists", label: "Add to playlist: new playlist", since: "2026-10-21" },
  "playlist-picker-save": { feature: "playlists", label: "Add to playlist: save", since: "2026-10-21" },
  "playlist-create-submit": { feature: "playlists", label: "Created a playlist", since: "2026-10-21" },

  // Home and mood mix
  "home-hero-filmstrip-prev": { feature: "home", label: "Hero: previous" },
  "home-hero-filmstrip-next": { feature: "home", label: "Hero: next" },
  "home-hero-mute": { feature: "home", label: "Hero: mute" },
  "home-hero-unmute": { feature: "home", label: "Hero: unmute" },
  "home-hero-share": { feature: "share", label: "Hero: share" },
  "feed-preview-mute": { feature: "home", label: "Feed preview: mute" },
  "feed-preview-unmute": { feature: "home", label: "Feed preview: unmute" },
  "mood-mix-open-picker": { feature: "mood-mix", label: "Opened mood mix picker" },
  "mood-mix-dismiss-picker": { feature: "mood-mix", label: "Dismissed mood mix picker" },
  "mood-mix-switch-vibe": { feature: "mood-mix", label: "Switched mood mix vibe" },
  "mood-mix-full-feed": { feature: "mood-mix", label: "Left mood mix for full feed" },
  "mood-mix-select": { feature: "mood-mix", label: "Selected a mood" },
  "mood-mix-run": { feature: "mood-mix", label: "Started a mood mix" },

  // Search
  "search-overlay-recent-search-button": { feature: "search", label: "Search: recent search" },
  "search-overlay-trending-search-button": { feature: "search", label: "Search: trending search" },
  "search-overlay-user-result-link": { feature: "search", label: "Search: user result" },
  "search-overlay-video-result-link": { feature: "search", label: "Search: video result" },
  "search-overlay-processing-video-result-button": { feature: "search", label: "Search: processing video result" },
  "search-overlay-view-all-results-button": { feature: "search", label: "Search: view all results" },

  // Auth
  "login-submit-button": { feature: "auth", label: "Log in: submit" },
  "login-skip-button": { feature: "auth", label: "Log in: skip" },
  "login-switch-account-button": { feature: "auth", label: "Log in: switch account" },
  "login-toggle-password-visibility-button": { feature: "auth", label: "Log in: show password" },
  "signup-create-account-button": { feature: "auth", label: "Sign up: create account" },
  "signup-skip-button": { feature: "auth", label: "Sign up: skip" },
  "signup-toggle-password-visibility-button": { feature: "auth", label: "Sign up: show password" },

  // Guest conversion
  "guest-following-signup": { feature: "guest-conversion", label: "Following: guest sign up" },
  "guest-following-login": { feature: "guest-conversion", label: "Following: guest log in" },
  "guest-watch-60s-signup": { feature: "guest-conversion", label: "Watch 60s nudge: sign up" },
  "guest-rec-ready-signup": { feature: "guest-conversion", label: "Up Next nudge: sign up" },
  "guest-third-track-signup": { feature: "guest-conversion", label: "Third track nudge: sign up" },
  "guest-liked-signup": { feature: "guest-conversion", label: "Liked: guest sign up" },
  "guest-history-signup": { feature: "guest-conversion", label: "History: guest sign up" },

  // Upload and creator studio
  "upload-custom-thumbnail-button": { feature: "upload", label: "Upload: custom thumbnail" },
  "upload-remove-thumbnail-button": { feature: "upload", label: "Upload: remove thumbnail" },
  "upload-cancel-draft-button": { feature: "upload", label: "Upload: cancel draft" },
  "upload-submit-video-button": { feature: "upload", label: "Upload: submit video" },
  "upload-success-watch-video-button": { feature: "upload", label: "Upload done: watch video" },
  "upload-another-video-button": { feature: "upload", label: "Upload done: upload another" },
  "upload-progress-watch-video-button": { feature: "upload", label: "Upload progress: watch video" },
  "creator-studio-upload-new-video-button": { feature: "creator", label: "Studio: upload new video" },
  "creator-studio-start-migration-button": { feature: "creator", label: "Studio: start migration" },
  "creator-studio-start-migration-submit-button": { feature: "creator", label: "Studio: submit migration" },
  "creator-apply-sign-in": { feature: "creator", label: "Creator apply: sign in" },
  "creator-apply-sign-up": { feature: "creator", label: "Creator apply: sign up" },
  "creator-verify-upgrade-otp-button": { feature: "creator", label: "Creator apply: verify code" },
  "creator-become-creator-button": { feature: "creator", label: "Creator apply: become a creator" },

  // Profile, reports, artists
  "profile-artist-index-link": { feature: "artist-index", label: "Profile: Artist Index link" },
  "report-video": { feature: "reports", label: "Report a video" },
  "report-comment": { feature: "reports", label: "Report a comment" },
  "report-profile": { feature: "reports", label: "Report a profile" },
  "report-submitted": { feature: "reports", label: "Submitted a report" },
  "artist-nav-breadcrumb-link": { feature: "artist-index", label: "Artist Index: breadcrumb" },
  "artist-nav-claim-button": { feature: "claim", label: "Artist Index: claim profile" },
  "claim-welcome-continue": { feature: "claim", label: "Claim: welcome continue" },
  "claim-banner-resend-confirmation": { feature: "claim", label: "Claim banner: resend confirmation" },

  // Feedback and forms
  "feedback-capture-screenshot-button": { feature: "feedback", label: "Feedback: capture screenshot" },
  "feedback-submitted": { feature: "feedback", label: "Feedback: submitted" },
  "feature-request-login": { feature: "feedback", label: "Feature request: log in" },
  "feature-request-signup": { feature: "feedback", label: "Feature request: sign up" },
  "feature-request-submitted": { feature: "feedback", label: "Feature request: submitted" },
  "brand-collaboration-submit-button": { feature: "collaborate", label: "Brand collaboration: submit" },

  // Recommendations v2 surfaces
  "opened-video-from-daily-mix": { feature: "recommendations", label: "Opened video from Your daily mix", since: "2026-10-26" },
  "opened-video-from-because": { feature: "recommendations", label: "Opened video from Because you watched", since: "2026-10-26" },
  "rec-artist-card": { feature: "recommendations", label: "Artists for you: opened profile", since: "2026-10-26" },
  "rec-onboarding-artist": { feature: "recommendations", label: "Onboarding: picked an artist", since: "2026-10-26" },
  "rec-onboarding-mood": { feature: "recommendations", label: "Onboarding: picked a mood", since: "2026-10-26" },
  "rec-onboarding-save": { feature: "recommendations", label: "Onboarding: saved picks", since: "2026-10-26" },
  "rec-onboarding-skip": { feature: "recommendations", label: "Onboarding: skipped", since: "2026-10-26" },

  // Playback signals sent from code (lib/analytics/playback-signals.ts) for recommendations
  video_progress: { feature: "playback", label: "Watched past 25/50/75/90%", since: "2026-10-26" },
  video_complete: { feature: "playback", label: "Watched to the end", since: "2026-10-26" },
  video_replay: { feature: "playback", label: "Replayed a video", since: "2026-10-26" },
  video_skip: { feature: "playback", label: "Left a video before the end", since: "2026-10-26" },

  // Outcomes sent from code (captureConversionEvent), not from clicks
  conversion_signup_completed: { feature: "auth", label: "Signed up" },
  conversion_creator_account_created: { feature: "creator", label: "Became a creator", since: "2026-10-25" },
  conversion_video_uploaded: { feature: "upload", label: "Uploaded a video", since: "2026-10-25" },
  conversion_playlist_song_added: { feature: "playlists", label: "Added a song to a playlist", since: "2026-10-25" },
} as const satisfies Record<string, TrackingIdInfo>

export type TrackingId = keyof typeof TRACKING_IDS

export function isTrackingId(value: string): value is TrackingId {
  return Object.prototype.hasOwnProperty.call(TRACKING_IDS, value)
}

export function trackingIdInfo(id: string): TrackingIdInfo | null {
  return isTrackingId(id) ? TRACKING_IDS[id] : null
}

/** Spread onto the element: `<button {...trackId("comment-post")}>`. */
export function trackId(
  id: TrackingId,
  detail?: string | number | null,
): { "data-analytics-id": TrackingId; "data-analytics-detail"?: string } {
  if (detail == null || detail === "") return { "data-analytics-id": id }
  return { "data-analytics-id": id, "data-analytics-detail": String(detail) }
}
