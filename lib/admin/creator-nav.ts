import type {
  CreatorMetricsSection,
  CreatorPopulation,
  CreatorSegment,
  FunnelComparePeriod,
} from "@/lib/types/admin-creators"
import { isCreatorMetricsSection, isCreatorPopulation } from "@/lib/types/admin-creators"

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
  page?: string
  /** Shared rolling range preset (`7d`, `30d`, ...); see lib/admin/creators-range.ts. */
  range?: string
  /** Shared analytics end date (`YYYY-MM-DD` UTC). Alias for to_date in URL. */
  as_of?: string
  from_date?: string
  to_date?: string
  /** Overview metrics sub-section. */
  creators_metrics?: CreatorMetricsSection | string
  /** Organic vs claimed dashboard. */
  creators_pop?: CreatorPopulation | string
}

const DIRECTORY_KEYS = [
  "status",
  "upload_status",
  "segment",
  "city",
  "genre",
  "claim_status",
  "page",
] as const

/** UTC calendar date as `YYYY-MM-DD` (API date format). */
export function utcDateString(date = new Date()): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Validate / clamp a date string. Invalid → today UTC. Future → today UTC. */
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

export function formatHours(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—"
  return `${value.toFixed(1)}h`
}

export function parseCreatorsPopulation(
  value: string | null | undefined,
): CreatorPopulation {
  return isCreatorPopulation(value) ? value : "organic"
}

export function parseCreatorsMetricsSection(
  value: string | null | undefined,
): CreatorMetricsSection {
  return isCreatorMetricsSection(value) ? value : "growth"
}

export function kpiDirectoryParams(
  card: "total" | "uploads" | "never" | "new" | "active_7d" | "active_30d",
  population: CreatorPopulation = "organic",
): Partial<CreatorsDirectoryQuery> {
  const withPop = (
    base: Partial<CreatorsDirectoryQuery>,
  ): Partial<CreatorsDirectoryQuery> => ({
    ...base,
    creators_pop: population === "claimed" ? "claimed" : undefined,
  })

  switch (card) {
    case "total":
      return withPop({ view: "directory", status: "approved" })
    case "uploads":
      return withPop({ view: "directory", segment: "has_uploads" })
    case "never":
      return withPop({ view: "directory", segment: "never_uploaded" })
    case "new":
      return withPop({ view: "directory", segment: "new_this_week" })
    case "active_7d":
      return withPop({ view: "directory", segment: "active_7d" })
    case "active_30d":
      return withPop({ view: "directory", segment: "active_30d" })
  }
}

export function attentionDirectoryParams(
  key: string,
  population: CreatorPopulation = "organic",
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
  const next: Partial<CreatorsDirectoryQuery> = {
    view: "directory",
    creators_pop: population === "claimed" ? "claimed" : undefined,
  }
  if (segment) next.segment = segment
  return next
}

export function creatorsDashboardHref(params: Partial<CreatorsDirectoryQuery> = {}): string {
  const sp = new URLSearchParams()
  sp.set("section", "creators")
  if (params.creator) {
    sp.set("creator", params.creator)
    if (params.creators_pop && params.creators_pop !== "organic") {
      sp.set("creators_pop", String(params.creators_pop))
    }
    return `/admin/dashboard?${sp.toString()}`
  }
  const view = params.view ?? "dashboard"
  if (view === "directory") sp.set("creators_view", "directory")

  if (params.range) sp.set("range", params.range)
  const toDate = params.to_date || params.as_of
  if (toDate) sp.set("as_of", toDate)
  if (params.from_date) sp.set("from_date", params.from_date)

  if (params.creators_metrics && params.creators_metrics !== "growth") {
    sp.set("creators_metrics", params.creators_metrics)
  }
  if (params.creators_pop && params.creators_pop !== "organic") {
    sp.set("creators_pop", params.creators_pop)
  }
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
