/** Client platform reported alongside every feedback submission. */
export type FeedbackPlatform = "web" | "ios" | "android"

/** Environment/context attached to a feedback submission. */
export interface FeedbackContext {
  /** Current page URL (max 2048 chars). */
  page_url: string
  /** Browser user agent (max 1024 chars). */
  user_agent: string
  /** Product app version, e.g. "2.2.2" (max 128 chars). */
  app_version: string
  /** Reporting platform. */
  platform: FeedbackPlatform
}

/** Body for POST /feedback/. */
export interface SubmitFeedbackInput {
  /** Required, 1–4000 chars, non-empty after trim. */
  description: string
  /** Optional CDN feedback screenshot URL (max 2048 chars). */
  screenshot_url?: string
  /** Whether the user consents to follow-up contact. */
  allow_contact: boolean
  context: FeedbackContext
}

/** Data returned by POST /feedback/. */
export interface SubmitFeedbackResult {
  id: string
  email_sent: boolean
}

/** Data returned by POST /feedback/screenshot/upload. */
export interface ScreenshotUploadTarget {
  message: string
  /** Presigned PUT URL (R2). Expires ~20 minutes after issue. */
  gateway_url: string
  /** Object path within the bucket. */
  path: string
  /** Public CDN URL to send back as `screenshot_url`. */
  screenshot_url: string
}

/**
 * A stored feedback submission as surfaced by the admin dashboard
 * (GET /admin/feedback). Nullable columns are omitted when null.
 */
export interface FeedbackSubmission {
  id: string
  /** JWT uid when the submitter was logged in; omitted if anonymous. */
  user_id?: string
  description: string
  /** Public CDN URL if a screenshot was attached. */
  screenshot_url?: string
  allow_contact: boolean
  page_url: string
  user_agent: string
  app_version: string
  platform: FeedbackPlatform
  /** Client IP if captured. */
  client_ip?: string
  email_sent: boolean
  /** Set when `email_sent` is true. */
  email_sent_at?: string
  created_at: string
}

/** Filters for GET /admin/feedback (admin dashboard list). */
export interface AdminListFeedbackParams {
  limit?: number
  offset?: number
  platform?: FeedbackPlatform
  allow_contact?: boolean
  user_id?: string
  email_sent?: boolean
}

/** Result of GET /admin/feedback — a single page of submissions. */
export interface FeedbackListResult {
  submissions: FeedbackSubmission[]
  /** Echo of the effective pagination. */
  limit: number
  offset: number
  /** Number of rows in this page (not total matching rows). */
  count: number
}
