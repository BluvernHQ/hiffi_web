import { normalizeAsOf, utcDateString, type CreatorsDirectoryQuery } from "@/lib/admin/creator-nav"
import type { CreatorDateRange, FunnelComparePeriod } from "@/lib/types/admin-creators"

/**
 * One date range for everything under Admin > Creators (overview tabs and directory).
 * URL: `range=<preset>` for rolling presets (re-resolved against today), or `from_date` / `as_of`
 * for a custom range. No range params = all time up to today.
 */
export const CREATOR_RANGE_PRESETS = [
  { id: "7d", label: "Past 7 days", days: 7 },
  { id: "15d", label: "Past 15 days", days: 15 },
  { id: "30d", label: "Past 30 days", days: 30 },
  { id: "90d", label: "Past 90 days", days: 90 },
  { id: "180d", label: "Past 6 months", days: 180 },
  { id: "365d", label: "Past 12 months", days: 365 },
  { id: "all", label: "All time", days: null },
] as const

export type CreatorRangePresetId = (typeof CREATOR_RANGE_PRESETS)[number]["id"]

export type ResolvedCreatorsRange = {
  preset: CreatorRangePresetId | "custom"
  label: string
  from_date?: string
  to_date: string
  /** Inclusive length in days; null for all time. */
  days: number | null
}

/** URL keys that carry the shared range. */
export const CREATOR_RANGE_KEYS = ["range", "from_date", "as_of"] as const

const DEFAULT_STALE_DAYS = 14
const STORAGE_KEY = "hiffi_admin_creators_range_v1"

function shiftDays(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + delta)
  return utcDateString(d)
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1
}

function isPreset(value: string | null): value is CreatorRangePresetId {
  return CREATOR_RANGE_PRESETS.some((p) => p.id === value)
}

export function resolveCreatorsRange(params: URLSearchParams): ResolvedCreatorsRange {
  const today = utcDateString()
  const range = params.get("range")
  if (isPreset(range)) {
    const preset = CREATOR_RANGE_PRESETS.find((p) => p.id === range)!
    if (preset.days == null) return { preset: "all", label: preset.label, to_date: today, days: null }
    return {
      preset: preset.id,
      label: preset.label,
      from_date: shiftDays(today, -(preset.days - 1)),
      to_date: today,
      days: preset.days,
    }
  }
  const to = normalizeAsOf(params.get("as_of"))
  const fromRaw = params.get("from_date")
  const from = fromRaw && /^\d{4}-\d{2}-\d{2}$/.test(fromRaw) && fromRaw <= to ? fromRaw : undefined
  if (!from && to === today) return { preset: "all", label: "All time", to_date: today, days: null }
  return {
    preset: "custom",
    label: "Custom range",
    ...(from ? { from_date: from } : {}),
    to_date: to,
    days: from ? daysBetween(from, to) : null,
  }
}

export function toCreatorDateRange(r: ResolvedCreatorsRange): CreatorDateRange {
  return { to_date: r.to_date, ...(r.from_date ? { from_date: r.from_date } : {}) }
}

/** "Stale uploader" = uploaded before but not within the selected range (14 days for all time). */
export function staleDaysFor(r: ResolvedCreatorsRange): number {
  return Math.min(365, Math.max(1, r.days ?? DEFAULT_STALE_DAYS))
}

/** Funnel deltas compare with the snapshot 7 or 30 days before the range end, whichever fits the range. */
export function comparePeriodFor(r: ResolvedCreatorsRange): FunnelComparePeriod {
  return r.days != null && r.days > 7 ? "30d" : "7d"
}

/** Applies a range to URL params (mutates and returns them). */
export function applyCreatorsRange(
  params: URLSearchParams,
  next: { preset: CreatorRangePresetId } | { from_date?: string; to_date: string },
): URLSearchParams {
  for (const key of CREATOR_RANGE_KEYS) params.delete(key)
  if ("preset" in next) {
    if (next.preset !== "all") params.set("range", next.preset)
  } else {
    if (next.from_date) params.set("from_date", next.from_date)
    if (next.to_date !== utcDateString()) params.set("as_of", next.to_date)
  }
  return params
}

/** The current range params, for links that stay inside Creators. */
export function rangeLinkParams(params: URLSearchParams): Partial<CreatorsDirectoryQuery> {
  return {
    range: params.get("range") || undefined,
    as_of: params.get("as_of") || undefined,
    from_date: params.get("from_date") || undefined,
  }
}

export function hasRangeParams(params: URLSearchParams): boolean {
  return CREATOR_RANGE_KEYS.some((key) => params.has(key))
}

/** The range chosen earlier in this browser session, as URL params ("" = all time). */
export function storedRangeQuery(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeRangeQuery(params: URLSearchParams): void {
  const sp = new URLSearchParams()
  for (const key of CREATOR_RANGE_KEYS) {
    const value = params.get(key)
    if (value) sp.set(key, value)
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, sp.toString())
  } catch {
    // ignore
  }
}

export function formatRangeDates(r: ResolvedCreatorsRange): string {
  const fmt = (day: string) =>
    new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
  if (!r.from_date) return `Up to ${fmt(r.to_date)}`
  return `${fmt(r.from_date)} – ${fmt(r.to_date)}`
}
