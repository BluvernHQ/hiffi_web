/** Chart sizes accepted by `GET /inventory/top` and the related city, search, and riser routes. */
export const CHART_SIZES = [500, 1000, 5000, 10000] as const

export type ChartSize = (typeof CHART_SIZES)[number]

/** Categories shown on the artist index. The Hiffi 500 stays on its own page. */
export const INDEX_CHART_SIZES = [1000, 5000, 10000] as const satisfies readonly ChartSize[]

export const DEFAULT_CHART_SIZE: ChartSize = 500

/** Chart shown on city pages when no category is chosen. The hub itself opens on All. */
export const INDEX_DEFAULT_CHART_SIZE: ChartSize = 1000

export function isChartSize(value: number): value is ChartSize {
  return (CHART_SIZES as readonly number[]).includes(value)
}

/**
 * Each category is the next slice, not a repeat of #1.
 * Top 500 is 1–500. Top 1,000 is 501–1,000. Top 5,000 is 1,001–5,000.
 */
export function chartBand(size: ChartSize): { start: number; end: number; offset: number } {
  const index = CHART_SIZES.indexOf(size)
  const start = index <= 0 ? 1 : CHART_SIZES[index - 1] + 1
  return { start, end: size, offset: start - 1 }
}

/** The smallest chart that still contains this global rank. */
export function chartSizeForRank(rank: number): ChartSize {
  if (rank <= 500) return 500
  if (rank <= 1000) return 1000
  if (rank <= 5000) return 5000
  return 10000
}

export function chartNameForRank(rank: number): string {
  const size = chartSizeForRank(rank)
  return size === 500 ? "Hiffi 500" : `Top ${size.toLocaleString()}`
}

/** Exact rank for top 500 artists; tiered buckets for 501+. */
export function publicRankBucket(rank: number): string {
  if (rank <= 500) return `#${rank}`

  if (rank <= 1000) return "Top 1,000"
  if (rank <= 5000) return "Top 5,000"
  return "Top 10,000"
}

const PERCENT_BAND_LABEL = { top_5: "Top 5%", top_10: "Top 10%", top_25: "Top 25%" } as const

/** Top 5% / Top 10% / Top 25% from the weekly ranking band. Other bands stay blank. */
export function percentBandLabel(band: string | null | undefined): string | null {
  if (band === "top_5" || band === "top_10" || band === "top_25") return PERCENT_BAND_LABEL[band]
  return null
}

/** Ranks past 5,000 have no API percent band. Show their place in the Top 10,000. */
function top10000Percent(rank: number): string | null {
  if (rank <= 5000) return null
  const pct = Math.min(100, Math.ceil((rank / 10000) * 100))
  return `Top ${pct}%`
}

/** One public label. A percent band wins over the numbered bucket so a card never stacks both. */
export function publicRankHint(rank: number, band?: string | null): string | null {
  return percentBandLabel(band) ?? top10000Percent(rank) ?? (rank > 0 ? publicRankBucket(rank) : null)
}

/** Missing or unknown values stay on the Top 500. */
export function parseChartSize(value: string | string[] | undefined | null): ChartSize {
  const raw = Array.isArray(value) ? value[0] : value
  const size = Number(raw)
  return isChartSize(size) ? size : DEFAULT_CHART_SIZE
}

/** Artist index roster filter. Missing, Top 500, or unknown means All. */
export function parseIndexChartSize(value: string | string[] | undefined | null): ChartSize | null {
  const raw = Array.isArray(value) ? value[0] : value
  const size = Number(raw)
  if (size === 1000 || size === 5000 || size === 10000) return size
  return null
}
