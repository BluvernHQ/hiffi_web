"use client"

import { useEffect } from "react"
import { buildArtistDirectoryHref } from "@/lib/artist-directory"
import { saveArtistDirectoryNavContext } from "@/lib/artist-index/directory-nav-context"

type DirectoryNavContextSeedProps = {
  query: string
  activeFilterIds: string[]
  page: number
  slugs: string[]
  totalMatches: number
  returnUrl?: string
}

/** Sync listing state into session storage for profile prev/next navigation. */
export function DirectoryNavContextSeed({
  query,
  activeFilterIds,
  page,
  slugs,
  totalMatches,
  returnUrl,
}: DirectoryNavContextSeedProps) {
  useEffect(() => {
    const href =
      returnUrl ??
      (typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : buildArtistDirectoryHref({ query, activeFilterIds, page }))

    saveArtistDirectoryNavContext({
      returnUrl: href,
      query,
      activeFilterIds,
      page,
      slugs,
      totalMatches,
    })
  }, [query, activeFilterIds, page, slugs, totalMatches, returnUrl])

  return null
}
