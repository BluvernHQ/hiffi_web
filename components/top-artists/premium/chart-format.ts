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
  const digits = Math.abs(percent) >= 10 ? 0 : 1
  return `${percent > 0 ? "+" : ""}${percent.toFixed(digits)}%`
}

export function chartPlace(artist: TopArtist): string | null {
  const highlight = artist.ranking?.highlight
  if (highlight?.kind === "city") return highlight.label
  const [city = "", state = ""] = (artist.location ?? "").split(",").map((part) => part.trim())
  return artistPlaceLabel({ city, state })
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
