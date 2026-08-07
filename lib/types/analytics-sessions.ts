export type SessionStatus = "active" | "inactive"
export type Platform = "web" | "ios" | "android" | "tv"

export interface AnalyticsSession {
  session_id: string
  uid?: string
  client_ip: string
  geo_lat: number
  geo_lng: number
  platform: Platform | string
  build_id: string
  started_at: string
  last_seen_at: string
  event_count: number
  status: SessionStatus
}

export interface AnalyticsEvent {
  timestamp: string
  session_id: string
  tag: string
  platform: Platform | string
  build_id: string
  path?: string
  dom_path?: string
  event_id?: string
  properties?: Record<string, unknown>
}

export interface SessionsListResponse {
  sessions: AnalyticsSession[]
  count: number
  limit: number
  offset: number
  has_more: boolean
  filters: Record<string, unknown>
}

export interface SessionEventsResponse {
  session_id: string
  events: AnalyticsEvent[]
  count: number
  limit: number
  offset: number
  order: "asc" | "desc"
  has_more: boolean
}

export class AnalyticsApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "AnalyticsApiError"
    this.status = status
  }
}

export function isGeoUnknown(lat: number, lng: number): boolean {
  return lat === 0 && lng === 0
}

export function formatSessionVisitor(session: AnalyticsSession): string {
  if (session.uid) return session.uid
  const short = session.session_id.slice(0, 8)
  return `Anonymous · ${short}`
}

export function formatGeoLabel(lat: number, lng: number): string {
  if (isGeoUnknown(lat, lng)) return "Unknown"
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}
