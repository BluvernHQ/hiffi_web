"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { ArtistDirectoryFilterOption } from "@/lib/artist-directory"
import {
  ARTIST_INDEX_PATH,
  artistDirectoryFilterIdSeoHref,
  buildArtistDirectoryHref,
} from "@/lib/artist-directory"
import { ArtistFilterBar } from "@/components/artists/ArtistFilterBar"
import { ArtistSearch } from "@/components/artists/ArtistSearch"

type ArtistIndexControlsProps = {
  initialQuery: string
  initialActiveFilterIds: string[]
  filterOptions: ArtistDirectoryFilterOption[]
  variant?: "default" | "hub"
  /** Hub search on a dark masthead (no light panel). */
  tone?: "light" | "dark"
  searchPlaceholder?: string
  /** When set, directory search/filter/clear updates in place without router navigation. */
  onSyncDirectory?: (query: string, activeFilterIds: string[]) => void
  isDirectoryPending?: boolean
}

export function ArtistIndexControls({
  initialQuery,
  initialActiveFilterIds,
  filterOptions,
  variant = "default",
  tone = "light",
  searchPlaceholder,
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
        const seoHref = artistDirectoryFilterIdSeoHref(nextFilterIds[0])
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
    [onSyncDirectory, router, variant],
  )

  const hasAppliedQuery = Boolean(initialQuery.trim())

  const handleSubmit = useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim()
      setQuery(trimmed)
      // Clearing text that was never searched leaves the page where it is.
      if (!trimmed && !hasAppliedQuery) return
      pushDirectoryState(trimmed, displayedFilterIds)
    },
    [displayedFilterIds, hasAppliedQuery, pushDirectoryState],
  )

  const handleQueryChange = useCallback(
    (nextQuery: string) => {
      setQuery(nextQuery)
      if (!nextQuery.trim() && query.trim() && hasAppliedQuery) {
        if (suppressEmptyDirectorySyncRef.current) {
          suppressEmptyDirectorySyncRef.current = false
          return
        }
        pushDirectoryState("", displayedFilterIds)
      }
    },
    [displayedFilterIds, hasAppliedQuery, pushDirectoryState, query],
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
  const isSearching = onSyncDirectory ? isDirectoryPending : isPending

  if (isHub && tone === "dark") {
    return (
      <section aria-label="Search artists">
        <ArtistSearch
          query={query}
          onQueryChange={handleQueryChange}
          onSubmit={handleSubmit}
          onSearchAllProfiles={handleSearchAllProfiles}
          onProfileSelect={handleProfileSelect}
          variant="hub"
          tone="dark"
          placeholder={searchPlaceholder}
          loading={isSearching}
        />
      </section>
    )
  }

  if (isHub) {
    return (
      <section
        aria-label="Search artists"
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
