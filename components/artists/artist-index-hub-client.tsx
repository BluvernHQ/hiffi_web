"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"

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
  paginationHref?: (page: number) => string
  childrenBeforeGrid?: ReactNode
  childrenAfterGrid?: ReactNode
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
}: ArtistIndexHubClientProps) {
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

  useEffect(() => {
    saveArtistDirectoryNavContext({
      returnUrl: buildArtistDirectoryHref({
        query: directory.query,
        activeFilterIds: directory.activeFilterIds,
        page: directory.currentPage,
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
      })
      const previousHref = buildArtistDirectoryHref({
        query: previous.query,
        activeFilterIds: previous.activeFilterIds,
        page: previous.currentPage,
      })

      lastRequestRef.current = { query: nextQuery, activeFilterIds: nextFilterIds, page }

      const cached = getCachedDirectorySnapshot(nextQuery, nextFilterIds, page)

      if (historyMode === "push") {
        window.history.pushState(null, "", href)
      } else if (historyMode === "replace") {
        window.history.replaceState(null, "", href)
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
          window.history.replaceState(null, "", previousHref)
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
    [],
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
          paginationHref={paginationHref}
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
