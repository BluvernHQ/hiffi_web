"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowDownRight, ArrowUpRight, BadgeCheck, ChevronDown, Loader2, Search } from "lucide-react"
import { loadTopChartPageAction, loadTopChartPhotosAction } from "@/app/(main)/top-artists/actions"
import { CHART_MODES, type ChartMode, type ChartPage } from "@/lib/top-chart"
import type { ChartShareScope } from "@/lib/top-chart-share"
import type { RisersWindow, TopArtist } from "@/lib/top-artists"
import { cn } from "@/lib/utils"
import { ArtistPortrait } from "@/components/artists/detail/ArtistPortrait"
import { ArtistDetailEyebrow, ArtistDetailHeading } from "@/components/artists/detail/ArtistDetailSection"
import { useTopChartDrawer } from "@/components/top-artists/premium/TopChartDrawer"
import { TopChartCityPicker } from "@/components/top-artists/premium/TopChartCityPicker"
import {
  artistMomentum,
  chartPlace,
  chartStanding,
  chartTrend,
  formatCount,
  formatMomentum,
  type ChartTrend,
  type MomentumWindow,
} from "@/components/top-artists/premium/chart-format"

export type ChartCity = {
  key: string
  id: string | null
  location: string | null
  label: string
  rankedCount: number
}

type SortKey = "rank" | "momentum30" | "momentum7" | "momentum90" | "views" | "subscribers"

const SORTS: Array<{ id: SortKey; label: string }> = [
  { id: "rank", label: "Chart rank" },
  { id: "momentum30", label: "Momentum 30d" },
  { id: "momentum7", label: "Momentum 7d" },
  { id: "momentum90", label: "Momentum 90d" },
  { id: "views", label: "Recent avg views" },
  { id: "subscribers", label: "Subscribers" },
]

const SORT_VALUE: Record<Exclude<SortKey, "rank">, (artist: TopArtist) => number> = {
  momentum30: (a) => a.youtube_momentum_30d ?? 0,
  momentum7: (a) => a.youtube_momentum_7d ?? 0,
  momentum90: (a) => a.youtube_momentum_90d ?? 0,
  views: (a) => a.youtube_recent_avg_views ?? 0,
  subscribers: (a) => a.youtube_subscriber_count ?? 0,
}

const FEATURED_CITIES = 10
const ROW_GRID =
  "grid grid-cols-[2.5rem_2.75rem_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[3.25rem_3rem_minmax(0,1fr)_5.5rem] sm:gap-4"
const ROW_GRID_STATS = "md:grid-cols-[3.5rem_3.25rem_minmax(0,1fr)_5.5rem_5.5rem_5.5rem_4.5rem]"

const SORT_WINDOW: Partial<Record<SortKey, MomentumWindow>> = { momentum7: 7, momentum30: 30, momentum90: 90 }
const ROW_GRID_PLAIN = "md:grid-cols-[3.5rem_3.25rem_minmax(0,1fr)_5.5rem]"
const FOCUS_BATCH = 100
const FOCUS_PHOTO_RADIUS = 6
/** The drawer locks page scroll, so it opens once the row has scrolled into view. */
const FOCUS_DRAWER_DELAY_MS = 650
const FOCUS_HIGHLIGHT_MS = 4000

type TopChartBoardProps = {
  initialMode: ChartMode
  initialCity: ChartCity | null
  initialWindow: RisersWindow
  initialPage: ChartPage | null
  cities: ChartCity[]
  /** Deep-linked artist on this board: scroll to their row, then open the drawer. */
  focusArtist?: TopArtist | null
}

function chartRowId(username: string): string {
  return `chart-row-${username}`
}

function syncBoardParams(mode: ChartMode, city: ChartCity | null, windowDays: RisersWindow) {
  const url = new URL(window.location.href)
  const params = url.searchParams
  if (mode === "overall") params.delete("mode")
  else params.set("mode", mode)
  if (mode === "overall" && city) params.set("city", city.id ?? city.location ?? city.label)
  else params.delete("city")
  if (mode === "risers" && windowDays === 30) params.set("window", "30")
  else params.delete("window")
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
}

function matchesQuery(artist: TopArtist, needle: string): boolean {
  return (
    artist.artist_name.toLowerCase().includes(needle) ||
    artist.username.toLowerCase().includes(needle) ||
    (artist.location ?? "").toLowerCase().includes(needle)
  )
}

function mergeUnique(prev: TopArtist[], next: TopArtist[]): TopArtist[] {
  const seen = new Set(prev.map((artist) => artist.username))
  return [...prev, ...next.filter((artist) => !seen.has(artist.username))]
}

export function TopChartBoard({
  initialMode,
  initialCity,
  initialWindow,
  initialPage,
  cities,
  focusArtist = null,
}: TopChartBoardProps) {
  const { open } = useTopChartDrawer()
  const [mode, setMode] = useState<ChartMode>(initialMode)
  const [city, setCity] = useState<ChartCity | null>(initialCity)
  const [windowDays, setWindowDays] = useState<RisersWindow>(initialWindow)
  const [items, setItems] = useState<TopArtist[]>(initialPage?.items ?? [])
  const [hasMore, setHasMore] = useState(initialPage?.hasMore ?? false)
  const [total, setTotal] = useState<number | null>(initialPage?.total ?? null)
  const [switching, setSwitching] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchingAll, setSearchingAll] = useState(false)
  const [error, setError] = useState<string | null>(initialPage ? null : "The chart didn’t load. Try again in a moment.")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortKey>("rank")
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const requestRef = useRef(0)

  const modeMeta = CHART_MODES.find((entry) => entry.id === mode) ?? CHART_MODES[0]
  const featuredCities = cities.slice(0, FEATURED_CITIES)
  const moreCities = cities.slice(FEATURED_CITIES)
  const cityInMore = city ? moreCities.some((entry) => entry.key === city.key) : false

  const fetchPage = useCallback(
    (target: { mode: ChartMode; city: ChartCity | null; window: RisersWindow }, offset: number, extra?: { limit?: number; enrich?: boolean }) =>
      loadTopChartPageAction({
        mode: target.mode,
        cityId: target.mode === "overall" ? (target.city?.id ?? null) : null,
        cityLocation: target.mode === "overall" && !target.city?.id ? (target.city?.location ?? null) : null,
        window: target.window,
        offset,
        ...extra,
      }),
    [],
  )

  const switchBoard = useCallback(
    async (next: { mode: ChartMode; city: ChartCity | null; window: RisersWindow }) => {
      const requestId = ++requestRef.current
      setMode(next.mode)
      setCity(next.city)
      setWindowDays(next.window)
      setSort("rank")
      setSwitching(true)
      setError(null)
      syncBoardParams(next.mode, next.city, next.window)
      try {
        const page = await fetchPage(next, 0)
        if (requestId !== requestRef.current) return
        if (!page) throw new Error("empty")
        setItems(page.items)
        setHasMore(page.hasMore)
        setTotal(page.total)
      } catch {
        if (requestId !== requestRef.current) return
        setItems([])
        setHasMore(false)
        setTotal(null)
        setError("The chart didn’t load. Try again in a moment.")
      } finally {
        if (requestId === requestRef.current) setSwitching(false)
      }
    },
    [fetchPage],
  )

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    const requestId = requestRef.current
    setLoadingMore(true)
    try {
      const page = await fetchPage({ mode, city, window: windowDays }, items.length)
      if (requestId !== requestRef.current || !page) return
      setItems((prev) => mergeUnique(prev, page.items))
      setHasMore(page.hasMore)
      if (page.total != null) setTotal(page.total)
    } catch {
      setError("Couldn’t load more artists. Try again.")
    } finally {
      setLoadingMore(false)
    }
  }, [city, fetchPage, hasMore, items.length, loadingMore, mode, windowDays])

  const needle = query.trim().toLowerCase()

  // Searching covers the whole board: pull the remaining rows (without photos) in the background.
  useEffect(() => {
    if (!needle || !hasMore || searchingAll || switching) return
    const requestId = requestRef.current
    let offset = items.length
    let cancelled = false
    setSearchingAll(true)
    ;(async () => {
      try {
        let more = true
        while (more && !cancelled && requestId === requestRef.current) {
          const page = await fetchPage({ mode, city, window: windowDays }, offset, { limit: 100, enrich: false })
          if (!page || cancelled || requestId !== requestRef.current) break
          offset += page.items.length
          more = page.hasMore && page.items.length > 0
          setItems((prev) => mergeUnique(prev, page.items))
          setHasMore(more)
        }
      } finally {
        if (!cancelled) setSearchingAll(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needle, hasMore, switching])

  const visible = useMemo(() => {
    const filtered = needle ? items.filter((artist) => matchesQuery(artist, needle)) : items
    if (sort === "rank" || mode === "risers") return filtered
    const value = SORT_VALUE[sort]
    return [...filtered].sort((a, b) => value(b) - value(a))
  }, [items, mode, needle, sort])

  const missingPhotos = needle ? visible.filter((artist) => !artist.image) : []
  const missingKey = missingPhotos.length > 0 && missingPhotos.length <= 12 ? missingPhotos.map((a) => a.username).join(",") : ""

  useEffect(() => {
    if (!missingKey) return
    let cancelled = false
    loadTopChartPhotosAction(missingPhotos)
      .then((photos) => {
        if (cancelled || Object.keys(photos).length === 0) return
        setItems((prev) => prev.map((artist) => (photos[artist.username] ? { ...artist, image: photos[artist.username] } : artist)))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingKey])

  const trendWindow = SORT_WINDOW[sort]
  const showMovement = mode === "risers" || items.some((artist) => chartTrend(artist) !== null)
  const showStats = items.some(
    (artist) =>
      (artist.youtube_subscriber_count ?? 0) > 0 || artistMomentum(artist, 7) !== 0 || artistMomentum(artist, 30) !== 0,
  )
  const rowGrid = cn(ROW_GRID, showStats ? ROW_GRID_STATS : ROW_GRID_PLAIN)
  const heading = mode === "overall" && city ? `${city.label} chart` : mode === "overall" ? "The Hip-Hop 500" : modeMeta.label
  const kicker =
    mode === "overall" && city
      ? `The ${city.rankedCount} Hiffi 500 artists from ${city.label}, with their place on the 500.`
      : modeMeta.kicker
  const showStanding = mode !== "overall" || city !== null
  const drawerContext = mode === "overall" && city ? `${city.label} chart` : mode === "overall" ? "Hiffi Hip-Hop 500" : modeMeta.label
  const shareScope: ChartShareScope = {
    mode,
    cityKey: mode === "overall" ? (city?.key ?? null) : null,
    cityLabel: mode === "overall" ? (city?.label ?? null) : null,
    window: windowDays,
  }

  useEffect(() => {
    if (!focusArtist) return
    const username = focusArtist.username
    const target = { mode, city, window: windowDays }
    const timers: number[] = []
    let cancelled = false
    ;(async () => {
      let rows = items
      let more = hasMore
      while (more && !rows.some((artist) => artist.username === username) && rows.length < focusArtist.rank) {
        const page = await fetchPage(target, rows.length, { limit: FOCUS_BATCH, enrich: false }).catch(() => null)
        if (cancelled) return
        if (!page || page.items.length === 0) break
        rows = mergeUnique(rows, page.items)
        more = page.hasMore
      }
      if (cancelled) return
      if (rows !== items) {
        setItems(rows)
        setHasMore(more)
      }

      const index = rows.findIndex((artist) => artist.username === username)
      if (index >= 0) {
        setHighlighted(username)
        requestAnimationFrame(() => {
          document.getElementById(chartRowId(username))?.scrollIntoView({ behavior: "smooth", block: "center" })
        })
        timers.push(window.setTimeout(() => setHighlighted(null), FOCUS_HIGHLIGHT_MS))
        const nearby = rows
          .slice(Math.max(0, index - FOCUS_PHOTO_RADIUS), index + FOCUS_PHOTO_RADIUS + 1)
          .filter((artist) => !artist.image)
        if (nearby.length > 0) {
          loadTopChartPhotosAction(nearby)
            .then((photos) => {
              if (cancelled || Object.keys(photos).length === 0) return
              setItems((prev) =>
                prev.map((artist) => (photos[artist.username] ? { ...artist, image: photos[artist.username] } : artist)),
              )
            })
            .catch(() => {})
        }
      }
      const drawerArtist = index >= 0 ? { ...rows[index], image: rows[index].image ?? focusArtist.image } : focusArtist
      timers.push(window.setTimeout(() => open(drawerArtist, drawerContext, shareScope), index >= 0 ? FOCUS_DRAWER_DELAY_MS : 0))
    })()
    return () => {
      cancelled = true
      timers.forEach((timer) => window.clearTimeout(timer))
    }
    // Runs once for the deep link the page was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section id="ranking" aria-labelledby="top-chart-heading" className="scroll-mt-28 sm:scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <ArtistDetailEyebrow className="text-white/45">Charts</ArtistDetailEyebrow>
          <ArtistDetailHeading id="top-chart-heading" className="text-[#F4F1EA]">
            {heading}
          </ArtistDetailHeading>
        </div>
        <p className="max-w-sm text-sm leading-6 text-white/50">{kicker}</p>
      </div>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="Chart"
          className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        >
          {CHART_MODES.map((entry) => {
            const active = entry.id === mode
            return (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => (active ? null : switchBoard({ mode: entry.id, city: null, window: windowDays }))}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-[#F4F1EA] text-[#0B0B0C]"
                    : "border border-white/12 text-white/65 hover:border-white/35 hover:text-white",
                )}
              >
                {entry.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <label className="relative min-w-0 flex-1 lg:w-72 lg:flex-none">
            <span className="sr-only">Search the chart</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="w-full rounded-full border border-white/12 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-[#F4F1EA] outline-none transition-colors placeholder:text-white/40 focus:border-white/35 focus:bg-white/[0.07]"
            />
          </label>
          <label className="relative shrink-0">
            <span className="sr-only">{mode === "risers" ? "Risers window" : "Sort"}</span>
            {mode === "risers" ? (
              <select
                value={windowDays}
                onChange={(event) =>
                  switchBoard({ mode, city: null, window: Number(event.target.value) === 30 ? 30 : 7 })
                }
                className="appearance-none rounded-full border border-white/12 bg-white/[0.04] py-2.5 pl-4 pr-9 text-sm font-semibold text-[#F4F1EA] outline-none focus:border-white/35"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
              </select>
            ) : (
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className="appearance-none rounded-full border border-white/12 bg-white/[0.04] py-2.5 pl-4 pr-9 text-sm font-semibold text-[#F4F1EA] outline-none focus:border-white/35"
              >
                {SORTS.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            )}
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" aria-hidden />
          </label>
        </div>
      </div>

      {mode === "overall" && cities.length > 0 ? (
        <div className="scrollbar-none -mx-4 mt-4 flex items-center gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <span className="mr-1 shrink-0 font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">Cities</span>
          {[null, ...featuredCities].map((entry) => {
            const active = entry ? city?.key === entry.key : city === null
            return (
              <button
                key={entry?.key ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => (active ? null : switchBoard({ mode: "overall", city: entry, window: windowDays }))}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "bg-[#F4F1EA] text-[#0B0B0C]"
                    : "text-white/55 hover:bg-white/[0.06] hover:text-white",
                )}
              >
                {entry ? entry.label : "All"}
              </button>
            )
          })}
          {moreCities.length > 0 ? (
            <TopChartCityPicker
              cities={cities}
              selected={city}
              highlight={cityInMore}
              onSelect={(next) => switchBoard({ mode: "overall", city: next, window: windowDays })}
            />
          ) : null}
        </div>
      ) : null}

      <div className="mt-8">
        <div
          className={cn(
            rowGrid,
            "hidden border-b border-white/10 pb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-white/40 sm:grid",
          )}
          aria-hidden
        >
          <span>Rank</span>
          <span />
          <span>Artist</span>
          {showStats ? <span className="hidden text-right md:block">Subscribers</span> : null}
          {showStats ? <span className="hidden text-right md:block">7d</span> : null}
          {showStats ? <span className="hidden text-right md:block">30d</span> : null}
          <span className="text-right">{showMovement ? (mode === "risers" ? "Climb" : "Move") : ""}</span>
        </div>

        {switching ? (
          <ol aria-busy className="divide-y divide-white/[0.07]">
            {Array.from({ length: 8 }, (_, index) => (
              <li key={index} className={cn(ROW_GRID, ROW_GRID_STATS, "py-4")}>
                <span className="ink-skeleton h-7 w-8 rounded" />
                <span className="ink-skeleton h-11 w-11 rounded-xl" />
                <span>
                  <span className="ink-skeleton block h-4 w-1/2 rounded-full" />
                  <span className="ink-skeleton mt-2 block h-2.5 w-1/4 rounded-full" />
                </span>
                <span className="ink-skeleton ml-auto hidden h-3.5 w-12 rounded-full md:block" />
                <span className="ink-skeleton ml-auto hidden h-3.5 w-10 rounded-full md:block" />
                <span className="ink-skeleton ml-auto hidden h-3.5 w-10 rounded-full md:block" />
                <span className="ink-skeleton ml-auto h-5 w-10 rounded-full" />
              </li>
            ))}
          </ol>
        ) : visible.length > 0 ? (
          <ol className="divide-y divide-white/[0.07]">
            {visible.map((artist, index) => (
              <li
                key={artist.username}
                id={chartRowId(artist.username)}
                className="artist-rise scroll-mt-24"
                style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
              >
                <button
                  type="button"
                  onClick={() => open(artist, drawerContext, shareScope)}
                  className={cn(
                    rowGrid,
                    "group -mx-2 w-[calc(100%+1rem)] rounded-xl px-2 py-3.5 text-left transition-colors duration-700 hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:outline-none sm:py-4",
                    highlighted === artist.username && "bg-[#F2C662]/[0.07] ring-1 ring-inset ring-[#F2C662]/30",
                  )}
                >
                  <ChartRowContent
                    artist={artist}
                    showMovement={showMovement}
                    showStats={showStats}
                    showStanding={showStanding}
                    trendWindow={trendWindow}
                  />
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <div className="py-16 text-center">
            <p className="font-signal text-3xl font-bold uppercase text-[#F4F1EA]">
              {error ? "Chart unavailable" : needle ? "No one by that name" : "Nothing here yet"}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-white/50">
              {error ??
                (needle
                  ? searchingAll
                    ? "Still searching the rest of the chart…"
                    : "Try another spelling, or switch charts."
                  : "This chart fills in once the weekly snapshot lands.")}
            </p>
            {error ? (
              <button
                type="button"
                onClick={() => switchBoard({ mode, city, window: windowDays })}
                className="mt-6 rounded-full bg-[#F4F1EA] px-5 py-2.5 text-sm font-semibold text-[#0B0B0C]"
              >
                Try again
              </button>
            ) : null}
          </div>
        )}

        {!switching && visible.length > 0 ? (
          <div className="mt-10 flex flex-col items-center gap-4 border-t border-white/10 pt-8 sm:flex-row sm:justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45" role="status" aria-live="polite">
              {needle
                ? `${visible.length.toLocaleString()} ${visible.length === 1 ? "match" : "matches"}${searchingAll ? " · searching" : ""}`
                : `Showing ${items.length.toLocaleString()}${total ? ` of ${total.toLocaleString()}` : ""}`}
            </p>
            {hasMore && !needle ? (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex min-w-44 items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-[#F4F1EA] transition-colors hover:border-white/60 hover:bg-white/[0.04] disabled:opacity-60"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {loadingMore ? "Loading" : "Load more"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function ChartRowContent({
  artist,
  showMovement,
  showStats,
  showStanding,
  trendWindow,
}: {
  artist: TopArtist
  showMovement: boolean
  showStats: boolean
  showStanding: boolean
  trendWindow?: MomentumWindow
}) {
  const place = chartPlace(artist)
  const gold = artist.rank <= 3
  const standing = showStanding ? chartStanding(artist) : null

  return (
    <>
      <span
        className={cn(
          "font-signal text-[1.75rem] font-bold leading-none tabular-nums sm:text-[2.1rem]",
          gold ? "bg-gradient-to-b from-[#FFF4CF] via-[#F2C662] to-[#C28A2A] bg-clip-text text-transparent" : "text-[#F4F1EA]",
        )}
      >
        {artist.rank}
      </span>
      <ArtistPortrait
        artist={{ name: artist.artist_name, image: artist.image ?? null }}
        decorative
        className="h-11 w-11 rounded-xl ring-1 ring-white/10 sm:h-12 sm:w-12"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="font-signal truncate text-[1.25rem] font-bold uppercase leading-none text-[#F4F1EA] transition-colors group-hover:text-[#FF4D5E] sm:text-[1.45rem]">
            {artist.artist_name}
          </span>
          {artist.claim_status === "claimed" ? (
            <BadgeCheck className="h-4 w-4 shrink-0 text-[#6F95F0]" aria-label="Verified artist" />
          ) : null}
        </span>
        <span className="mt-1.5 flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
          <span className="truncate">{place || "Hip-hop"}</span>
          {standing ? (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 tracking-[0.14em]",
                standing.kind === "rank" ? "bg-[#F2C662]/12 text-[#F2C662]" : "bg-white/[0.06] text-white/55",
              )}
            >
              {standing.kind === "rank" ? `#${standing.rank} on the 500` : standing.label}
            </span>
          ) : null}
        </span>
      </span>
      {showStats ? (
        <span className="hidden text-right text-sm font-semibold tabular-nums text-white/80 md:block">
          {(artist.youtube_subscriber_count ?? 0) > 0 ? formatCount(artist.youtube_subscriber_count) : null}
        </span>
      ) : null}
      {showStats ? <MomentumCell value={artistMomentum(artist, 7)} label="7-day momentum" /> : null}
      {showStats ? <MomentumCell value={artistMomentum(artist, 30)} label="30-day momentum" /> : null}
      <span className="flex justify-end">{showMovement ? <TrendChip trend={chartTrend(artist, trendWindow)} /> : null}</span>
    </>
  )
}

function MomentumCell({ value, label }: { value: number; label: string }) {
  if (value === 0) return <span className="hidden md:block" />
  const up = value > 0
  const Arrow = up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        "hidden items-center justify-end gap-0.5 text-sm font-semibold tabular-nums md:flex",
        up ? "text-[#7BD88F]" : "text-[#FF6B78]",
      )}
      aria-label={`${label} ${formatMomentum(value)}`}
    >
      <Arrow className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {formatMomentum(value)}
    </span>
  )
}

function TrendChip({ trend }: { trend: ChartTrend }) {
  if (!trend) return null
  if (trend.source === "momentum") {
    const up = trend.kind === "up"
    const Arrow = up ? ArrowUpRight : ArrowDownRight
    return (
      <span
        className={cn(
          "inline-flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-full px-1.5 text-xs font-bold tabular-nums",
          up ? "bg-[#7BD88F]/12 text-[#7BD88F]" : "bg-[#FF6B78]/12 text-[#FF6B78]",
        )}
        aria-label={`${trend.window}-day momentum ${formatMomentum(trend.value)}`}
        title={`${trend.window}d momentum ${formatMomentum(trend.value)}`}
      >
        <Arrow className="h-4 w-4 shrink-0" aria-hidden />
        <span className="pr-1 md:hidden">{formatMomentum(trend.value)}</span>
      </span>
    )
  }
  const movement = trend
  if (movement.kind === "new") {
    return (
      <span className="rounded-full bg-[#F2C662]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#F2C662]">
        New
      </span>
    )
  }
  const up = movement.kind === "up"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums",
        up ? "bg-[#7BD88F]/12 text-[#7BD88F]" : "bg-[#FF6B78]/12 text-[#FF6B78]",
      )}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      <span className="sr-only">{up ? "Up" : "Down"}</span>
      {movement.value}
    </span>
  )
}
