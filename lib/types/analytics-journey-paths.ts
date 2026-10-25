/** Shapes returned by /analytics/journey-paths and /analytics/features (admin only). */

export type JourneyPlatform = "web" | "ios" | "android"

export interface JourneyFilters {
  /** ISO date-time or YYYY-MM-DD; the API defaults to the last 7 days. */
  from?: string
  to?: string
  platform?: JourneyPlatform | ""
  max_steps?: number
  /** Only journeys that include this step (tracking id or `page:/path`). */
  contains?: string
  include_guests?: boolean
  sort?: "sessions" | "users"
  limit?: number
  offset?: number
}

export interface JourneyPath {
  journey_id: string
  /** Steps in order: tracking ids, or `page:<page type>` for page views. */
  steps: string[]
  sessions: number
  users: number
  guests: number
  /** Share of matched sessions, 0..1. */
  share: number
  first_seen: string
  last_seen: string
}

export interface JourneyPathsResponse {
  journeys: JourneyPath[]
  count: number
  limit: number
  offset: number
  has_more: boolean
  total_sessions: number
  matched_sessions: number
  journey_count: number
}

export type JourneyPersonKind = "user" | "guest" | "session"

export interface JourneyPerson {
  identity: string
  kind: JourneyPersonKind
  uid?: string
  username?: string | null
  visitor_id?: string
  sessions: number
  first_seen: string
  last_seen: string
  last_session_id: string
  platform: string
}

export interface JourneyPeopleResponse {
  users: JourneyPerson[]
  count: number
  limit: number
  offset: number
  has_more: boolean
}

export interface FeatureUsage {
  id: string
  events: number
  sessions: number
  users: number
  guests: number
  first_seen: string
  last_seen: string
}

export interface FeaturesResponse {
  features: FeatureUsage[]
  count: number
  has_more: boolean
  active_users: number
  active_guests: number
  active_sessions: number
}

export interface FeatureTrendDay {
  day: string
  users: number
  guests: number
  sessions: number
  active_users: number
  active_guests: number
}

export interface FeatureTrendResponse {
  id: string
  days: FeatureTrendDay[]
}
