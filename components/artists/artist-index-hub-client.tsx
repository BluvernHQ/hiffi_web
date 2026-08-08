"use client"

import { useCallback, useRef, useState } from "react"
import type { Artist } from "@/lib/artists"
import { buildArtistDirectoryHref } from "@/lib/artist-directory"
import type { ArtistDirectoryFilterOption } from "@/lib/artist-directory"
import { ArtistIndexIntro } from "@/components/artists/ArtistIndexIntro"
import { ArtistIndexControls } from "@/components/artists/ArtistIndexControls"
import { ArtistDirectoryGrid } from "@/components/artists/ArtistDirectoryGrid"
import type { ReactNode } from "react"

type DirectorySnapshot = {
  query: string
  activeFilterIds: string[]
  artistCount: number
  totalMatches: number
  totalPages: number
  currentPage: number
  pageArtists: Artist[]
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

async function fetchDirectorySnapshot(
  query: string,
  activeFilterIds: string[],
  page = 1,
): Promise<DirectorySnapshot> {
  const params = new URLSearchParams()
  if (query.trim()) params.set("q", query.trim())
  if (activeFilterIds.length > 0) params.set("f", activeFilterIds.join(","))
  if (page > 1) params.set("page", String(page))

  const response = await fetch(`/api/artist-index/directory?${params.toString()}`)
  if (!response.ok) {
    throw new Error("Failed to load artist directory")
  }

  return response.json() as Promise<DirectorySnapshot>
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
  const gridSectionRef = useRef<HTMLDivElement>(null)
  const fetchGenerationRef = useRef(0)

  const syncDirectory = useCallback((nextQuery: string, nextFilterIds: string[], page = 1) => {
    const generation = ++fetchGenerationRef.current
    const href = buildArtistDirectoryHref({
      query: nextQuery,
      activeFilterIds: nextFilterIds,
      page,
    })
    window.history.replaceState(null, "", href)
    setIsPending(true)

    void fetchDirectorySnapshot(nextQuery, nextFilterIds, page)
      .then((snapshot) => {
        if (generation !== fetchGenerationRef.current) return
        setDirectory(snapshot)
      })
      .catch(() => {
        // Keep current grid on fetch failure.
      })
      .finally(() => {
        if (generation === fetchGenerationRef.current) {
          setIsPending(false)
        }
      })
  }, [])

  const handlePageChange = useCallback(
    (page: number) => {
      syncDirectory(directory.query, directory.activeFilterIds, page)
      gridSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    },
    [directory.activeFilterIds, directory.query, syncDirectory],
  )

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

      <div ref={gridSectionRef} className="scroll-mt-20">
        <ArtistDirectoryGrid
          artists={directory.pageArtists}
          currentPage={directory.currentPage}
          totalPages={directory.totalPages}
          totalMatches={directory.totalMatches}
          artistCount={directory.artistCount}
          query={directory.query}
          activeFilterIds={directory.activeFilterIds}
          sectionTitle={sectionTitle}
          sectionSubtitle={sectionSubtitle}
          paginationHref={paginationHref}
          onPageChange={handlePageChange}
          compactHeader={false}
          cardVariant="hub"
        />
      </div>

      {childrenAfterGrid}
    </div>
  )
}
