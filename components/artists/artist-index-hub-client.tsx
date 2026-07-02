"use client"

import { useCallback, useState, useTransition } from "react"
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
  const [isPending, startTransition] = useTransition()

  const syncDirectory = useCallback((nextQuery: string, nextFilterIds: string[], page = 1) => {
    const href = buildArtistDirectoryHref({
      query: nextQuery,
      activeFilterIds: nextFilterIds,
      page,
    })
    window.history.replaceState(null, "", href)

    startTransition(() => {
      void fetchDirectorySnapshot(nextQuery, nextFilterIds, page)
        .then(setDirectory)
        .catch(() => {
          // Keep current grid on fetch failure.
        })
    })
  }, [])

  const sectionTitle = directory.query.trim()
    ? "Browse artists"
    : sectionTitleProp ?? (directory.isCleanHub ? "Featured artists" : undefined)
  const sectionSubtitle = directory.query.trim()
    ? `${directory.totalMatches.toLocaleString()} profiles match your search`
    : sectionSubtitleProp ??
      (directory.isCleanHub
        ? "Verified and emerging Atlanta hip-hop and rap artists — filter by genre and explore official links."
        : undefined)

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
          initialQuery={initialDirectory.query}
          initialActiveFilterIds={initialDirectory.activeFilterIds}
          filterOptions={filterOptions}
          variant="hub"
          onSyncDirectory={syncDirectory}
          isDirectoryPending={isPending}
        />
      </div>

      {childrenBeforeGrid}

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
        compactHeader={false}
        cardVariant="hub"
      />

      {childrenAfterGrid}
    </div>
  )
}
