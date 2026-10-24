"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { Artist } from "@/lib/artists"
import { buildArtistDirectoryHref, parseArtistDirectorySearchParams } from "@/lib/artist-directory"
import type { ArtistDirectoryFilterOption } from "@/lib/artist-directory"
import {
  fetchDirectorySnapshotCached,
  getCachedDirectorySnapshot,
  prefetchDirectoryPages,
} from "@/lib/artist-index/directory-client-cache"
import { saveArtistDirectoryNavContext } from "@/lib/artist-index/directory-nav-context"
import { ArtistIndexIntro } from "@/components/artists/ArtistIndexIntro"
import { ArtistIndexControls } from "@/components/artists/ArtistIndexControls"
import { ArtistDirectoryGrid } from "@/components/artists/ArtistDirectoryGrid"
import { ArtistDetailEyebrow, ArtistDetailHeading } from "@/components/artists/detail/ArtistDetailSection"
import { ArtistIndexClaimBand } from "@/components/artists/index/ArtistIndexClaimBand"
import { ArtistIndexFaq } from "@/components/artists/ArtistIndexFaq"
import { ArtistIndexMasthead } from "@/components/artists/index/ArtistIndexMasthead"
import { ArtistIndexRosterNav } from "@/components/artists/index/ArtistIndexRosterNav"
import { ArtistIndexScenes } from "@/components/artists/index/ArtistIndexScenes"
import { chartListArtists, type ChartList } from "@/lib/artist-index/chart-list"
import { Button } from "@/components/ui/button"
import type { ArtistIndexHubFeature } from "@/lib/artist-index/hub-data"
import { INDEX_CHART_SIZES, type ChartSize } from "@/lib/chart-size"
import { signalNarrow } from "@/lib/fonts/signal"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import { artistPageContainer } from "@/components/artists/artist-layout"
import { useRestoreRosterScroll } from "@/components/artists/index/roster-scroll"

type DirectorySnapshot = {
  query: string
  activeFilterIds: string[]
  artistCount: number
  totalMatches: number
  totalPages: number
  currentPage: number
  pageArtists: Artist[]
  hasMore: boolean
  isCleanHub: boolean
}

type ArtistIndexHubClientProps = {
  initialDirectory: DirectorySnapshot
  filterOptions: ArtistDirectoryFilterOption[]
  introTitle?: string
  introDescription?: string
  sectionTitle?: string
  sectionSubtitle?: string
  /** City and genre pages pass their own page links. The main index builds them from the directory. */
  paginationHref?: (page: number) => string
  childrenBeforeGrid?: ReactNode
  childrenAfterGrid?: ReactNode
  /** Premium hub: dark masthead with the weekly chart, scenes, roster grid. */
  feature?: ArtistIndexHubFeature
  /** `null` is All: the existing roster. A size filters that grid to the chart slice. */
  chartSize?: ChartSize | null
  chartList?: ChartList | null
  /** Whole-catalog size for the masthead; `artistCount` narrows while searching. */
  catalogCount?: number
  /** Genres with at least one artist, for the masthead browse links. */
  genreSlugs?: string[]
}

function chartRosterHref(size: ChartSize, cpage: number) {
  const href = buildArtistDirectoryHref({ top: size })
  if (cpage <= 1) return href
  return href.includes("?") ? `${href}&cpage=${cpage}` : `${href}?cpage=${cpage}`
}

function filterKey(ids: string[]): string {
  return ids.join(",")
}

type DirectoryHistoryMode = "push" | "replace" | "none"

function parseDirectoryFromLocation(): {
  query: string
  activeFilterIds: string[]
  page: number
} {
  const sp = new URLSearchParams(window.location.search)
  return parseArtistDirectorySearchParams({
    q: sp.get("q") ?? undefined,
    f: sp.get("f") ?? undefined,
    page: sp.get("page") ?? undefined,
  })
}

export function ArtistIndexHubClient({
  initialDirectory,
  filterOptions,
  introTitle,
  introDescription,
  sectionTitle: sectionTitleProp,
  sectionSubtitle: sectionSubtitleProp,
  paginationHref,
  childrenBeforeGrid,
  childrenAfterGrid,
  feature,
  chartSize = null,
  chartList = null,
  catalogCount,
  genreSlugs,
}: ArtistIndexHubClientProps) {
  const router = useRouter()
  useRestoreRosterScroll(chartSize)
  const [directory, setDirectory] = useState(initialDirectory)
  const [isPending, setIsPending] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const gridSectionRef = useRef<HTMLDivElement>(null)
  const fetchGenerationRef = useRef(0)
  const pendingRef = useRef(false)
  const directoryRef = useRef(directory)
  const lastRequestRef = useRef({
    query: initialDirectory.query,
    activeFilterIds: initialDirectory.activeFilterIds,
    page: initialDirectory.currentPage,
  })
  directoryRef.current = directory

  // Sync state when server components update or searchParams change via router navigation
  useEffect(() => {
    setDirectory(initialDirectory)
  }, [initialDirectory])

  useEffect(() => {
    saveArtistDirectoryNavContext({
      returnUrl: buildArtistDirectoryHref({
        query: directory.query,
        activeFilterIds: directory.activeFilterIds,
        page: directory.currentPage,
        top: chartSize ?? undefined,
      }),
      query: directory.query,
      activeFilterIds: directory.activeFilterIds,
      page: directory.currentPage,
      slugs: directory.pageArtists.map((artist) => (artist as Artist).slug),
      totalMatches: directory.totalMatches,
    })
  }, [
    directory.query,
    directory.activeFilterIds,
    directory.currentPage,
    directory.pageArtists,
    directory.totalMatches,
    chartSize,
  ])

  useEffect(() => {
    prefetchDirectoryPages(
      directory.query,
      directory.activeFilterIds,
      directory.currentPage,
      directory.hasMore,
    )
  }, [directory.query, directory.activeFilterIds, directory.currentPage, directory.hasMore])

  const syncDirectory = useCallback(
    (
      nextQuery: string,
      nextFilterIds: string[],
      page = 1,
      options?: { history?: DirectoryHistoryMode },
    ) => {
      const historyMode = options?.history ?? "push"
      const previous = directoryRef.current
      const generation = ++fetchGenerationRef.current
      const href = buildArtistDirectoryHref({
        query: nextQuery,
        activeFilterIds: nextFilterIds,
        page,
        top: chartSize ?? undefined,
      })
      const previousHref = buildArtistDirectoryHref({
        query: previous.query,
        activeFilterIds: previous.activeFilterIds,
        page: previous.currentPage,
        top: chartSize ?? undefined,
      })

      lastRequestRef.current = { query: nextQuery, activeFilterIds: nextFilterIds, page }

      const cached = getCachedDirectorySnapshot(nextQuery, nextFilterIds, page)

      if (historyMode === "push") {
        try {
          window.history.pushState(window.history.state, "", href)
        } catch {
          window.history.pushState(null, "", href)
        }
        router.push(href, { scroll: false })
      } else if (historyMode === "replace") {
        try {
          window.history.replaceState(window.history.state, "", href)
        } catch {
          window.history.replaceState(null, "", href)
        }
        router.replace(href, { scroll: false })
      }
      setLoadError(null)

      if (cached) {
        pendingRef.current = false
        setIsPending(false)
        setDirectory(cached as DirectorySnapshot)
        return
      }

      pendingRef.current = true
      setIsPending(true)

      // Optimistic page/filter highlight; keep cards while fetching (stale-while-revalidate).
      setDirectory((current) => ({
        ...current,
        query: nextQuery,
        activeFilterIds: nextFilterIds,
        currentPage: page,
        isCleanHub: !nextQuery.trim() && nextFilterIds.length === 0 && page === 1,
      }))

      void fetchDirectorySnapshotCached(nextQuery, nextFilterIds, page)
        .then((snapshot) => {
          if (generation !== fetchGenerationRef.current) return
          setDirectory(snapshot as DirectorySnapshot)
          setLoadError(null)
          prefetchDirectoryPages(
            snapshot.query,
            snapshot.activeFilterIds,
            snapshot.currentPage,
            snapshot.hasMore,
          )
        })
        .catch(() => {
          if (generation !== fetchGenerationRef.current) return
          try {
            window.history.replaceState(window.history.state, "", previousHref)
          } catch {
            window.history.replaceState(null, "", previousHref)
          }
          router.replace(previousHref, { scroll: false })
          setDirectory(previous)
          setLoadError("Couldn't load artists. Check your connection and try again.")
        })
        .finally(() => {
          if (generation === fetchGenerationRef.current) {
            pendingRef.current = false
            setIsPending(false)
          }
        })
    },
    [router, chartSize],
  )

  const handleRetry = useCallback(() => {
    const { query, activeFilterIds, page } = lastRequestRef.current
    syncDirectory(query, activeFilterIds, page)
  }, [syncDirectory])

  const handlePageChange = useCallback(
    (page: number) => {
      if (pendingRef.current) return
      syncDirectory(directory.query, directory.activeFilterIds, page)
      gridSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    },
    [directory.activeFilterIds, directory.query, syncDirectory],
  )

  // Browser back/forward — pagination uses pushState so each page is a history entry.
  useEffect(() => {
    const onPopState = () => {
      const { query, activeFilterIds, page } = parseDirectoryFromLocation()
      const current = directoryRef.current
      if (
        current.query === query &&
        filterKey(current.activeFilterIds) === filterKey(activeFilterIds) &&
        current.currentPage === page
      ) {
        return
      }
      syncDirectory(query, activeFilterIds, page, { history: "none" })
      gridSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [syncDirectory])

  const sectionTitle = directory.query.trim()
    ? "Browse artists"
    : directory.isCleanHub
      ? sectionTitleProp ?? "Featured artists"
      : "Browse artists"

  const sectionSubtitle = directory.query.trim()
    ? `${directory.totalMatches.toLocaleString()} profiles match your search`
    : directory.isCleanHub
      ? sectionSubtitleProp ??
        "Verified and emerging hip-hop and rap artists across cities — search profiles and explore official links."
      : `${directory.totalMatches.toLocaleString()} profiles match your filters`

  const resolvedPaginationHref =
    paginationHref ??
    ((page: number) =>
      buildArtistDirectoryHref({
        query: directory.query,
        activeFilterIds: directory.activeFilterIds,
        page,
        top: chartSize ?? undefined,
      }))

  if (feature) {
    const trimmedQuery = directory.query.trim()
    const roster = trimmedQuery
      ? {
          eyebrow: "Search",
          title: `“${trimmedQuery}”`,
          meta: `${directory.totalMatches.toLocaleString()} ${directory.totalMatches === 1 ? "match" : "matches"}`,
        }
      : directory.isCleanHub
        ? { eyebrow: "The roster", title: "Fresh on the index", meta: "Newly claimed and verified artists first." }
        : {
            eyebrow: "The roster",
            title: "Every artist",
            meta: `Page ${directory.currentPage.toLocaleString()}${directory.totalPages > 1 ? ` of ${directory.totalPages.toLocaleString()}` : ""}`,
          }

    return (
      <div className={cn(signalNarrow.variable, "text-[#0B0B0C]")}>
        <ArtistIndexMasthead
          artistCount={catalogCount ?? directory.artistCount}
          feature={feature}
          genreSlugs={genreSlugs}
          search={
            <ArtistIndexControls
              initialQuery={directory.query}
              initialActiveFilterIds={directory.activeFilterIds}
              filterOptions={filterOptions}
              variant="hub"
              tone="dark"
              onSyncDirectory={syncDirectory}
              isDirectoryPending={isPending}
            />
          }
        />

        <div className={cn(artistPageContainer, "space-y-14 pb-16 pt-10 sm:space-y-24 sm:pb-20 sm:pt-20")}>
          {directory.isCleanHub ? (
            <ArtistIndexScenes cities={feature.cities} chartSize={feature.chartSize} showChartSize={false} />
          ) : null}

          <section ref={gridSectionRef} aria-labelledby="artist-index-roster" className="scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <ArtistDetailEyebrow>{roster.eyebrow}</ArtistDetailEyebrow>
                <ArtistDetailHeading id="artist-index-roster" className="break-words">
                  {roster.title}
                </ArtistDetailHeading>
                {!directory.isCleanHub || chartSize == null ? (
                  <p className="mt-2 text-sm text-[#77726A]">{roster.meta}</p>
                ) : null}
              </div>
              <ArtistIndexRosterNav
                selected={chartSize}
                allHref={buildArtistDirectoryHref({})}
                sizeHrefs={INDEX_CHART_SIZES.map((size) => ({
                  size,
                  href: buildArtistDirectoryHref({ top: size }),
                }))}
              />
            </div>

            {loadError ? (
              <div
                className="mt-8 flex flex-col items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                role="alert"
              >
                <p className="text-sm text-destructive">{loadError}</p>
                <Button type="button" variant="outline" size="sm" onClick={handleRetry}>
                  Try again
                </Button>
              </div>
            ) : null}

            <div className="mt-10">
              {directory.isCleanHub && chartList && chartSize ? (
                <ArtistDirectoryGrid
                  artists={chartListArtists(chartList)}
                  currentPage={chartList.page}
                  totalPages={Math.max(1, Math.ceil(chartList.total / chartList.pageSize))}
                  hasMore={false}
                  totalMatches={chartList.total}
                  artistCount={chartList.total}
                  query=""
                  activeFilterIds={[]}
                  paginationHref={(cpage) => chartRosterHref(chartSize, cpage)}
                  compactHeader
                  cardVariant="roster"
                />
              ) : (
                <ArtistDirectoryGrid
                  artists={directory.pageArtists}
                  currentPage={directory.currentPage}
                  totalPages={directory.totalPages}
                  hasMore={directory.hasMore}
                  totalMatches={directory.totalMatches}
                  artistCount={directory.artistCount}
                  query={directory.query}
                  activeFilterIds={directory.activeFilterIds}
                  paginationHref={resolvedPaginationHref}
                  onPageChange={handlePageChange}
                  isPending={isPending}
                  compactHeader
                  cardVariant="roster"
                />
              )}
            </div>
          </section>

          <ArtistIndexClaimBand />
          {directory.isCleanHub ? <ArtistIndexFaq variant="roster" /> : null}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="space-y-4 sm:space-y-5">
        <ArtistIndexIntro
          artistCount={directory.artistCount}
          title={introTitle}
          description={introDescription}
          variant="hub"
        />
        <ArtistIndexControls
          initialQuery={directory.query}
          initialActiveFilterIds={directory.activeFilterIds}
          filterOptions={filterOptions}
          variant="hub"
          onSyncDirectory={syncDirectory}
          isDirectoryPending={isPending}
        />
      </div>

      {childrenBeforeGrid}

      {loadError ? (
        <div
          className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p className="text-sm text-destructive">{loadError}</p>
          <Button type="button" variant="outline" size="sm" onClick={handleRetry}>
            Try again
          </Button>
        </div>
      ) : null}

      <div ref={gridSectionRef} className="scroll-mt-20">
        <ArtistDirectoryGrid
          artists={directory.pageArtists}
          currentPage={directory.currentPage}
          totalPages={directory.totalPages}
          hasMore={directory.hasMore}
          totalMatches={directory.totalMatches}
          artistCount={directory.artistCount}
          query={directory.query}
          activeFilterIds={directory.activeFilterIds}
          sectionTitle={sectionTitle}
          sectionSubtitle={sectionSubtitle}
          paginationHref={resolvedPaginationHref}
          onPageChange={handlePageChange}
          isPending={isPending}
          compactHeader={false}
          cardVariant="hub"
        />
      </div>

      {childrenAfterGrid}
    </div>
  )
}
