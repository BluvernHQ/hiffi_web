import type { RisersWindow, TopArtist } from "@/lib/top-artists"
import { CHART_MODES, type ChartMode } from "@/lib/top-chart"

export type ShareCardFormat = "square" | "story"

/** Which board the artist was opened from; decides the card template and the caption. */
export type ChartShareScope = {
  mode: ChartMode
  /** City chart id (or legacy location) — only on the overall board. */
  cityKey: string | null
  cityLabel: string | null
  window: RisersWindow
}

export const DEFAULT_SHARE_SCOPE: ChartShareScope = { mode: "overall", cityKey: null, cityLabel: null, window: 7 }

export const SHARE_CARD_SIZE: Record<ShareCardFormat, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
}

function handleOf(username: string): string {
  return username.trim().toLowerCase().replace(/^@+/, "")
}

function scopeParams(scope: ChartShareScope): URLSearchParams {
  const params = new URLSearchParams()
  if (scope.mode === "overall" && scope.cityKey) params.set("city", scope.cityKey)
  if (scope.mode !== "overall") params.set("mode", scope.mode)
  if (scope.mode === "risers" && scope.window === 30) params.set("window", "30")
  return params
}

/** Link preview page (OG image + redirect into the chart with the drawer open). */
export function sharePagePath(username: string, scope: ChartShareScope): string {
  const query = scopeParams(scope).toString()
  return `/top-artists/share/${encodeURIComponent(handleOf(username))}${query ? `?${query}` : ""}`
}

export function shareCardPath(username: string, scope: ChartShareScope, format: ShareCardFormat): string {
  const params = scopeParams(scope)
  params.set("format", format)
  return `/top-artists/share/${encodeURIComponent(handleOf(username))}/card?${params}`
}

export function shareCardFilename(username: string, format: ShareCardFormat): string {
  const slug = handleOf(username).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "artist"
  return `hiffi-500-${slug}-${format}.png`
}

export function chartModeLabel(mode: ChartMode): string {
  return CHART_MODES.find((entry) => entry.id === mode)?.label ?? "Hiffi Hip-Hop 500"
}

const BOARD_NAMES: Record<ChartMode, string> = {
  overall: "the Hiffi Hip-Hop 500",
  risers: "Biggest Risers",
}

export function shareHeadline(artist: TopArtist, scope: ChartShareScope): string {
  const name = artist.artist_name || artist.username
  if (scope.mode === "overall" && scope.cityKey) {
    const city = scope.cityLabel ?? "their city"
    const global = artist.global_rank ? ` (#${artist.global_rank} on the Hiffi 500)` : ""
    return `${name} is #${artist.rank} in ${city}${global} on the Hiffi Hip-Hop chart`
  }
  if (scope.mode === "overall") return `${name} is #${artist.global_rank ?? artist.rank} on the Hiffi Hip-Hop 500`
  return `${name} is #${artist.rank} on ${BOARD_NAMES[scope.mode]}`
}
