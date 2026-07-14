"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { ArtistDirectoryFilterOption } from "@/lib/artist-directory"
import {
  ARTIST_INDEX_PATH,
  artistDirectoryFilterSeoHref,
  buildArtistDirectoryHref,
  pickHubInlineFilters,
} from "@/lib/artist-directory"
import { ArtistFilterBar } from "@/components/artists/ArtistFilterBar"
import { ArtistSearch } from "@/components/artists/ArtistSearch"

type ArtistIndexControlsProps = {
  initialQuery: string
  initialActiveFilterIds: string[]
  filterOptions: ArtistDirectoryFilterOption[]
  variant?: "default" | "hub"
  /** When set, directory search/filter/clear updates in place without router navigation. */
  onSyncDirectory?: (query: string, activeFilterIds: string[]) => void
  isDirectoryPending?: boolean
}

export function ArtistIndexControls({
  initialQuery,
  initialActiveFilterIds,
  filterOptions,
  variant = "default",
  onSyncDirectory,
  isDirectoryPending = false,
}: ArtistIndexControlsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(initialQuery)
  const [activeFilterIds, setActiveFilterIds] = useState(initialActiveFilterIds)
  const suppressEmptyDirectorySyncRef = useRef(false)
  const isClientSync = Boolean(onSyncDirectory)

  const displayedFilterIds = isClientSync ? initialActiveFilterIds : activeFilterIds

  useEffect(() => {
    setQuery(initialQuery)
    if (!isClientSync) {
      setActiveFilterIds(initialActiveFilterIds)
    }
  }, [initialQuery, initialActiveFilterIds, isClientSync])

  const pushDirectoryState = useCallback(
    (nextQuery: string, nextFilterIds: string[]) => {
      // Single city/genre filter → SEO landing page (e.g. /artist-index/genre/rap).
      // Must use router navigation so Next.js loads the route; replaceState alone breaks soft nav.
      if (!nextQuery.trim() && nextFilterIds.length === 1 && variant === "hub") {
        const filter = filterOptions.find((entry) => entry.id === nextFilterIds[0])
        const seoHref = filter ? artistDirectoryFilterSeoHref(filter) : null
        if (seoHref) {
          startTransition(() => {
            router.push(seoHref)
          })
          return
        }
      }

      if (onSyncDirectory) {
        onSyncDirectory(nextQuery, nextFilterIds)
        return
      }

      startTransition(() => {
        router.push(
          buildArtistDirectoryHref({
            query: nextQuery,
            activeFilterIds: nextFilterIds,
            page: 1,
          }),
        )
      })
    },
    [filterOptions, onSyncDirectory, router, variant],
  )

  const handleSubmit = useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim()
      setQuery(trimmed)
      pushDirectoryState(trimmed, displayedFilterIds)
    },
    [displayedFilterIds, pushDirectoryState],
  )

  const handleQueryChange = useCallback(
    (nextQuery: string) => {
      setQuery(nextQuery)
      if (!nextQuery.trim() && query.trim()) {
        if (suppressEmptyDirectorySyncRef.current) {
          suppressEmptyDirectorySyncRef.current = false
          return
        }
        pushDirectoryState("", displayedFilterIds)
      }
    },
    [displayedFilterIds, pushDirectoryState, query],
  )

  const handleSearchAllProfiles = useCallback(() => {
    suppressEmptyDirectorySyncRef.current = true
    pushDirectoryState("", displayedFilterIds)
    setQuery("")
  }, [displayedFilterIds, pushDirectoryState])

  const handleProfileSelect = useCallback(
    (slug: string) => {
      router.push(`${ARTIST_INDEX_PATH}/${encodeURIComponent(slug)}`)
    },
    [router],
  )

  const toggleFilter = useCallback(
    (filterId: string) => {
      const currentFilterIds = isClientSync ? initialActiveFilterIds : activeFilterIds
      const currentQuery = isClientSync ? initialQuery : query
      const nextFilterIds = currentFilterIds.includes(filterId)
        ? currentFilterIds.filter((id) => id !== filterId)
        : [...currentFilterIds, filterId]

      if (!isClientSync) {
        setActiveFilterIds(nextFilterIds)
      }
      pushDirectoryState(currentQuery, nextFilterIds)
    },
    [
      activeFilterIds,
      initialActiveFilterIds,
      initialQuery,
      isClientSync,
      pushDirectoryState,
      query,
    ],
  )

  const isHub = variant === "hub"
  const hubFilters = pickHubInlineFilters(filterOptions)
  const emphasizeAtlanta =
    isHub &&
    !displayedFilterIds.some((id) => id.startsWith("city:")) &&
    !initialQuery.trim()
  const isSearching = onSyncDirectory ? isDirectoryPending : isPending

  if (isHub) {
    return (
      <section
        aria-label="Search and filter artists"
        className="rounded-2xl border border-[#E8192C]/15 bg-[#FAFAFA] p-3 shadow-sm sm:p-4"
      >
        <ArtistSearch
          query={query}
          onQueryChange={handleQueryChange}
          onSubmit={handleSubmit}
          onSearchAllProfiles={handleSearchAllProfiles}
          onProfileSelect={handleProfileSelect}
          variant="hub"
          loading={isSearching}
        />
        <div className="mt-3 border-t border-[#E8192C]/10 pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Filter by
          </p>
          <ArtistFilterBar
            filters={hubFilters}
            activeFilterIds={displayedFilterIds}
            onToggleFilter={toggleFilter}
            variant="inline"
            emphasizeAtlanta={emphasizeAtlanta}
          />
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-2">
      <ArtistSearch
        query={query}
        onQueryChange={setQuery}
        onSubmit={handleSubmit}
        onProfileSelect={handleProfileSelect}
        variant={variant}
        loading={isSearching}
      />
      <ArtistFilterBar
        filters={filterOptions}
        activeFilterIds={displayedFilterIds}
        onToggleFilter={toggleFilter}
      />
    </div>
  )
}
