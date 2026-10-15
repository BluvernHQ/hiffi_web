import type { BreakdownItem } from "@/lib/api/admin-traffic"
import { formatBandwidth, formatCount } from "@/lib/api/admin-traffic"

export type TrafficMapMetric = "requests" | "pageViews" | "visits" | "bandwidth"

export const MAP_COLORS = {
  background: "#f8f8fa",
  empty: "#e4e4e7",
  border: "#d4d4d8",
  highlight: "#ED1C2F",
  highlightLight: "#fecdd3",
} as const

/** Cloudflare may return ISO-2 codes or full country names in `key`. */
const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  "united states": "us",
  "united states of america": "us",
  "united kingdom": "gb",
  "great britain": "gb",
  "russia": "ru",
  "russian federation": "ru",
  "south korea": "kr",
  "korea, republic of": "kr",
  "north korea": "kp",
  "vietnam": "vn",
  "viet nam": "vn",
  "iran": "ir",
  "iran, islamic republic of": "ir",
  "syria": "sy",
  "syrian arab republic": "sy",
  "tanzania": "tz",
  "tanzania, united republic of": "tz",
  "bolivia": "bo",
  "bolivia, plurinational state of": "bo",
  "venezuela": "ve",
  "venezuela, bolivarian republic of": "ve",
  "brunei": "bn",
  "brunei darussalam": "bn",
  "laos": "la",
  "lao people's democratic republic": "la",
  "moldova": "md",
  "moldova, republic of": "md",
  "palestine": "ps",
  "palestinian territory": "ps",
  "czech republic": "cz",
  "czechia": "cz",
  "ivory coast": "ci",
  "côte d'ivoire": "ci",
  "cote d'ivoire": "ci",
  "hong kong": "hk",
  "taiwan": "tw",
  "macau": "mo",
  "macao": "mo",
}

export function safeMetric(value: number | undefined | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

export function normalizeBreakdownItem(item: BreakdownItem): BreakdownItem {
  return {
    ...item,
    requests: safeMetric(item.requests),
    pageViews: safeMetric(item.pageViews),
    visits: safeMetric(item.visits),
    bandwidth: safeMetric(item.bandwidth),
  }
}

export function normalizeCountryCode(key: string): string | null {
  const trimmed = key.trim()
  if (!trimmed) return null

  if (/^[a-z]{2}$/i.test(trimmed)) {
    return trimmed.toLowerCase()
  }

  const mapped = COUNTRY_NAME_TO_ISO[trimmed.toLowerCase()]
  return mapped ?? null
}

export function metricValue(item: BreakdownItem, metric: TrafficMapMetric): number {
  switch (metric) {
    case "requests":
      return item.requests
    case "pageViews":
      return item.pageViews
    case "visits":
      return item.visits
    case "bandwidth":
      return item.bandwidth
  }
}

export function formatMapMetricValue(metric: TrafficMapMetric, value: number): string {
  if (metric === "bandwidth") return formatBandwidth(value)
  return formatCount(value)
}

export function metricLabel(metric: TrafficMapMetric): string {
  switch (metric) {
    case "requests":
      return "Requests"
    case "pageViews":
      return "Page views"
    case "visits":
      return "Visits"
    case "bandwidth":
      return "Bandwidth"
  }
}

export type CountryMapPoint = {
  country: string
  value: number
  item: BreakdownItem
}

export function breakdownToCountryMapData(
  items: BreakdownItem[],
  metric: TrafficMapMetric,
): CountryMapPoint[] {
  const points: CountryMapPoint[] = []
  for (const item of items) {
    const country = normalizeCountryCode(item.key)
    if (!country) continue
    const normalized = normalizeBreakdownItem(item)
    points.push({
      country,
      value: metricValue(normalized, metric),
      item: normalized,
    })
  }
  return points
}

export function countryMapTooltip(countryName: string, item: BreakdownItem | undefined): string {
  if (!item) return countryName
  return [
    countryName,
    `Requests: ${formatCount(item.requests)}`,
    `Page views: ${formatCount(item.pageViews)}`,
    `Visits: ${formatCount(item.visits)}`,
    `Bandwidth: ${formatBandwidth(item.bandwidth)}`,
  ].join("\n")
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "")
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
}

/** Interpolate from light rose to brand red for choropleth fill. */
export function countryMapFill(intensity: number): string {
  const clamped = Math.min(1, Math.max(0, intensity))
  const [r1, g1, b1] = hexToRgb(MAP_COLORS.highlightLight)
  const [r2, g2, b2] = hexToRgb(MAP_COLORS.highlight)
  const mix = (a: number, b: number) => Math.round(a + (b - a) * clamped)
  return rgbToHex(mix(r1, r2), mix(g1, g2), mix(b1, b2))
}

export function topCountriesByMetric(
  items: BreakdownItem[],
  metric: TrafficMapMetric,
  limit = 8,
): Array<{ key: string; value: number; item: BreakdownItem }> {
  return items
    .map((item) => ({
      key: item.key,
      value: metricValue(normalizeBreakdownItem(item), metric),
      item: normalizeBreakdownItem(item),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}
