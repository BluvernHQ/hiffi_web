"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, PencilLine, X } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { ArtistClaimCta } from "@/components/artists/ArtistClaimCta"
import { ArtistDetailAbout } from "@/components/artists/ArtistDetailAbout"
import { ArtistDetailHero } from "@/components/artists/ArtistDetailHero"
import { ArtistEditForm } from "@/components/artists/ArtistEditForm"
import { ArtistSocialLinks } from "@/components/artists/ArtistSocialLinks"
import { ArtistOtherArtists } from "@/components/artists/ArtistOtherArtists"
import { artistButtonMuted } from "@/components/artists/artist-styles"
import { cn } from "@/lib/utils"

type ArtistDetailInteractiveProps = {
  artist: Artist
  profilePath: string
  otherArtists: Artist[]
  initialEditMode?: boolean
}

export function ArtistDetailInteractive({
  artist,
  profilePath,
  otherArtists,
  initialEditMode = false,
}: ArtistDetailInteractiveProps) {
  const [editMode, setEditMode] = useState(initialEditMode)

  useEffect(() => {
    setEditMode(initialEditMode)
  }, [initialEditMode])

  const closeEditMode = useCallback(() => {
    setEditMode(false)
    if (typeof window !== "undefined" && window.location.search.includes("edit=1")) {
      const url = new URL(window.location.href)
      url.searchParams.delete("edit")
      window.history.replaceState(null, "", url.pathname + url.search)
    }
  }, [])

  return (
    <div className="-mt-2 space-y-6 pb-4">
      {editMode ? (
        <header
          id="artist-edit-panel"
          className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Link
                href={`/artist-index/${artist.slug}`}
                onClick={(event) => {
                  event.preventDefault()
                  closeEditMode()
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to {artist.name}
              </Link>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8192C]/10">
                  <PencilLine className="h-5 w-5 text-[#E8192C]" aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E8192C]">
                    Suggest an edit
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {artist.name}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Update profile visuals, bio, links, and location. Your submission is reviewed
                    before anything goes live.
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={closeEditMode}
              className={cn(artistButtonMuted, "inline-flex shrink-0 items-center gap-2 self-start")}
            >
              <X className="h-4 w-4" aria-hidden />
              Cancel
            </button>
          </div>
        </header>
      ) : (
        <ArtistDetailHero artist={artist} profilePath={profilePath} />
      )}

      {editMode ? (
        <ArtistEditForm
          key={artist.slug}
          artist={artist}
          onCancel={closeEditMode}
          fieldIdPrefix="artist-inline-"
        />
      ) : (
        <>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-10">
            <ArtistDetailAbout artist={artist} />
            <ArtistSocialLinks artist={artist} />
          </div>

          <ArtistOtherArtists
            otherArtists={otherArtists}
            cityLabel={artist.city.split(",")[0]?.trim() || artist.city}
          />

          <ArtistClaimCta artist={artist} variant="banner" />
        </>
      )}
    </div>
  )
}
