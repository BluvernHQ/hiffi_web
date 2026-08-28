import type { CreatorSegment, FunnelComparePeriod } from "@/lib/types/admin-creators"

export type CreatorsView = "dashboard" | "directory"

export type CreatorsDirectoryQuery = {
  view?: CreatorsView
  creator?: string
  status?: string
  upload_status?: string
  segment?: string
  city?: string
  genre?: string
  claim_status?: string
  stale_days?: string
  page?: string
  /** Shared analytics calendar (`YYYY-MM-DD` UTC). */
  as_of?: string
}

const DIRECTORY_KEYS = [
  "status",
  "upload_status",
  "segment",
  "city",
  "genre",
  "claim_status",
  "stale_days",
  "page",
] as const

/** UTC calendar date as `YYYY-MM-DD` (API `as_of` format). */
export function utcDateString(date = new Date()): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Validate / clamp an `as_of` string. Invalid → today UTC. Future → today UTC. */
export function normalizeAsOf(value: string | null | undefined): string {
  const today = utcDateString()
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return today
  if (value > today) return today
  return value
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

export function formatRate(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—"
  return `${value.toFixed(1)}%`
}

export function formatDays(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—"
  return `${value.toFixed(1)}d`
}

export function kpiDirectoryParams(
  card:
    | "total"
    | "uploads"
    | "never"
    | "new"
    | "active_7d"
    | "active_30d",
): Partial<CreatorsDirectoryQuery> {
  switch (card) {
    case "total":
      return { view: "directory", status: "approved" }
    case "uploads":
      return { view: "directory", segment: "has_uploads" }
    case "never":
      return { view: "directory", segment: "never_uploaded" }
    case "new":
      return { view: "directory", segment: "new_this_week" }
    case "active_7d":
      return { view: "directory", segment: "active_7d" }
    case "active_30d":
      return { view: "directory", segment: "active_30d" }
  }
}

export function attentionDirectoryParams(
  key: string,
  staleDays?: number,
): Partial<CreatorsDirectoryQuery> {
  const map: Record<string, CreatorSegment | undefined> = {
    never_uploaded: "never_uploaded",
    never_returned: "never_returned",
    stale_uploaders: "stale",
    at_risk_30: "at_risk_30",
    at_risk_60: "at_risk_60",
    at_risk_90: "at_risk_90",
    new_creators_without_upload: "new_without_upload",
  }
  const segment = map[key]
  const next: Partial<CreatorsDirectoryQuery> = { view: "directory" }
  if (segment) next.segment = segment
  if (segment === "stale" && staleDays) next.stale_days = String(staleDays)
  return next
}

export function creatorsDashboardHref(params: Partial<CreatorsDirectoryQuery> = {}): string {
  const sp = new URLSearchParams()
  sp.set("section", "creators")
  if (params.creator) {
    sp.set("creator", params.creator)
    return `/admin/dashboard?${sp.toString()}`
  }
  const view = params.view ?? "dashboard"
  if (view === "directory") sp.set("creators_view", "directory")
  if (params.as_of) sp.set("as_of", params.as_of)
  for (const key of DIRECTORY_KEYS) {
    const value = params[key]
    if (value) sp.set(key, value)
  }
  return `/admin/dashboard?${sp.toString()}`
}

export function deltaLabel(current: number, previous: number | undefined): string | null {
  if (previous == null) return null
  const delta = current - previous
  if (delta === 0) return "0 vs prior"
  const sign = delta > 0 ? "+" : ""
  return `${sign}${formatCount(delta)} vs prior`
}

export function isFunnelCompare(value: string | null): value is FunnelComparePeriod {
  return value === "7d" || value === "30d"
}

export function hasDirectoryQuery(params: URLSearchParams): boolean {
  if (params.get("creators_view") === "directory") return true
  return DIRECTORY_KEYS.some((key) => Boolean(params.get(key)))
}
