import type { TopArtist } from "@/lib/top-artists"
import { movementDelta7d } from "@/lib/top-artists"
import { artistPlaceLabel } from "@/components/artists/detail/artist-detail-data"

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })

export function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return "—"
  return compact.format(value)
}

/** API momentum is fractional growth (0.42 → +42%). */
export function formatMomentum(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value === 0) return "—"
  const percent = value * 100
  const size = Math.abs(percent)
  const sign = percent > 0 ? "+" : "−"
  if (size >= 1000) return `${sign}${compact.format(size)}%`
  return `${sign}${size.toFixed(size >= 10 ? 0 : size >= 1 ? 1 : 2)}%`
}

export type MomentumWindow = 7 | 30 | 90

export function artistMomentum(artist: TopArtist, window: MomentumWindow): number {
  const value =
    window === 7 ? artist.youtube_momentum_7d : window === 30 ? artist.youtube_momentum_30d : artist.youtube_momentum_90d
  return value != null && Number.isFinite(value) ? value : 0
}

/**
 * Direction for the Move column: real rank movement when the weekly snapshots have it,
 * otherwise the momentum trend (the preferred window first, then 7d → 30d → 90d).
 */
export type ChartTrend =
  | { source: "rank"; kind: "up" | "down" | "new"; value: number }
  | { source: "momentum"; kind: "up" | "down"; value: number; window: MomentumWindow }
  | null

export function chartTrend(artist: TopArtist, prefer?: MomentumWindow): ChartTrend {
  const movement = chartMovement(artist)
  if (movement && movement.kind !== "flat") return { source: "rank", kind: movement.kind, value: movement.value }
  const windows: MomentumWindow[] = prefer ? [prefer, 7, 30, 90] : [7, 30, 90]
  for (const window of windows) {
    const value = artistMomentum(artist, window)
    if (value !== 0) return { source: "momentum", kind: value > 0 ? "up" : "down", value, window }
  }
  return null
}

export function chartPlace(artist: TopArtist): string | null {
  const highlight = artist.ranking?.highlight
  if (highlight?.kind === "city") return highlight.label
  const [city = "", state = ""] = (artist.location ?? "").split(",").map((part) => part.trim())
  return artistPlaceLabel({ city, state })
}

const BAND_LABEL = { top_5: "Top 5%", top_10: "Top 10%", top_25: "Top 25%" } as const

/**
 * Where an artist stands overall: their Hiffi 500 rank for members, at most a percentile band for
 * everyone else. Artists outside the 500 never get an overall number.
 */
export function chartStanding(artist: TopArtist): { kind: "rank"; rank: number } | { kind: "band"; label: string } | null {
  if (artist.global_rank) return { kind: "rank", rank: artist.global_rank }
  const band = artist.ranking?.band
  return band && band in BAND_LABEL ? { kind: "band", label: BAND_LABEL[band as keyof typeof BAND_LABEL] } : null
}

export type ChartMovement = { kind: "up" | "down" | "flat" | "new"; value: number } | null

export function chartMovement(artist: TopArtist): ChartMovement {
  if (artist.is_new_entry) return { kind: "new", value: 0 }
  const delta = movementDelta7d(artist)
  if (delta == null) return null
  if (delta > 0) return { kind: "up", value: delta }
  if (delta < 0) return { kind: "down", value: Math.abs(delta) }
  return { kind: "flat", value: 0 }
}

export function formatChartWeek(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function chartArtistHref(artist: Pick<TopArtist, "username">): string {
  return `/artist-index/${encodeURIComponent(artist.username)}`
}
