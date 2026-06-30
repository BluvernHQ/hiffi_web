"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { ArtistDirectoryFilterOption } from "@/lib/artist-directory"
import { buildArtistDirectoryHref, pickHubInlineFilters } from "@/lib/artist-directory"
import { ArtistFilterBar } from "@/components/artists/ArtistFilterBar"
import { ArtistSearch } from "@/components/artists/ArtistSearch"

type ArtistIndexControlsProps = {
  initialQuery: string
  initialActiveFilterIds: string[]
  filterOptions: ArtistDirectoryFilterOption[]
  variant?: "default" | "hub"
}

export function ArtistIndexControls({
  initialQuery,
  initialActiveFilterIds,
  filterOptions,
  variant = "default",
}: ArtistIndexControlsProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [activeFilterIds, setActiveFilterIds] = useState(initialActiveFilterIds)

  useEffect(() => {
    setQuery(initialQuery)
    setActiveFilterIds(initialActiveFilterIds)
  }, [initialQuery, initialActiveFilterIds])

  const pushDirectoryState = useCallback(
    (nextQuery: string, nextFilterIds: string[]) => {
      router.push(
        buildArtistDirectoryHref({
          query: nextQuery,
          activeFilterIds: nextFilterIds,
          page: 1,
        }),
      )
    },
    [router],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query === initialQuery) return
      pushDirectoryState(query, activeFilterIds)
    }, 280)
    return () => window.clearTimeout(timer)
  }, [query, initialQuery, activeFilterIds, pushDirectoryState])

  const toggleFilter = useCallback(
    (filterId: string) => {
      const nextFilterIds = activeFilterIds.includes(filterId)
        ? activeFilterIds.filter((id) => id !== filterId)
        : [...activeFilterIds, filterId]
      setActiveFilterIds(nextFilterIds)
      pushDirectoryState(query, nextFilterIds)
    },
    [activeFilterIds, query, pushDirectoryState],
  )

  const isHub = variant === "hub"
  const hubFilters = pickHubInlineFilters(filterOptions)
  const emphasizeAtlanta =
    isHub && !activeFilterIds.some((id) => id.startsWith("city:")) && !query.trim()

  if (isHub) {
    return (
      <div className="rounded-2xl border border-[#E8192C]/15 bg-white p-2 shadow-sm sm:p-2.5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <ArtistSearch
            query={query}
            onQueryChange={setQuery}
            variant="hub"
            embedded
          />
          <ArtistFilterBar
            filters={hubFilters}
            activeFilterIds={activeFilterIds}
            onToggleFilter={toggleFilter}
            variant="inline"
            emphasizeAtlanta={emphasizeAtlanta}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <ArtistSearch query={query} onQueryChange={setQuery} variant={variant} />
      <ArtistFilterBar
        filters={filterOptions}
        activeFilterIds={activeFilterIds}
        onToggleFilter={toggleFilter}
      />
    </div>
  )
}
