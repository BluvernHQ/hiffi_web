"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { ArtistDirectoryFilterOption } from "@/lib/artist-directory"
import { buildArtistDirectoryHref } from "@/lib/artist-directory"
import { ArtistFilterBar } from "@/components/artists/ArtistFilterBar"
import { ArtistSearch } from "@/components/artists/ArtistSearch"

type ArtistIndexControlsProps = {
  initialQuery: string
  initialActiveFilterIds: string[]
  filterOptions: ArtistDirectoryFilterOption[]
}

export function ArtistIndexControls({
  initialQuery,
  initialActiveFilterIds,
  filterOptions,
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

  return (
    <div className="space-y-2">
      <ArtistSearch query={query} onQueryChange={setQuery} />
      <ArtistFilterBar
        filters={filterOptions}
        activeFilterIds={activeFilterIds}
        onToggleFilter={toggleFilter}
      />
    </div>
  )
}
