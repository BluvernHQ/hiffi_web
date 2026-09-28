"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, PencilLine, X } from "lucide-react"
import type { Artist } from "@/lib/artists"
import type { ArtistDirectoryNavContext } from "@/lib/artist-index/directory-nav-context"
import { ArtistIndexBackLink } from "@/components/artists/ArtistIndexBackLink"
import {
  ArtistProfileDirectoryFooterNav,
  ArtistProfileDirectoryHeaderNav,
} from "@/components/artists/ArtistProfileDirectoryNav"
import { ArtistEditForm } from "@/components/artists/ArtistEditForm"
import { ArtistShareButton } from "@/components/artists/ArtistShareButton"
import { ClaimReceiptBanner } from "@/components/artists/claim/ClaimReceiptNotices"
import { ArtistDetailClaimBand } from "@/components/artists/detail/ArtistDetailClaimBand"
import { ArtistDetailListen } from "@/components/artists/detail/ArtistDetailListen"
import { ArtistDetailMasthead } from "@/components/artists/detail/ArtistDetailMasthead"
import { ArtistDetailScene } from "@/components/artists/detail/ArtistDetailScene"
import { ArtistDetailStanding } from "@/components/artists/detail/ArtistDetailStanding"
import { ArtistDetailStory } from "@/components/artists/detail/ArtistDetailStory"
import { artistButtonMuted } from "@/components/artists/artist-styles"
import { signalNarrow } from "@/lib/fonts/signal"
import { cn } from "@/lib/utils"

type ArtistDetailInteractiveProps = {
  artist: Artist
  profilePath: string
  otherArtists: Artist[]
  initialEditMode?: boolean
  onDirectoryNavigate?: (slug: string, context: ArtistDirectoryNavContext) => void
}

export function ArtistDetailInteractive({
  artist,
  profilePath,
  otherArtists,
  initialEditMode = false,
  onDirectoryNavigate,
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

  if (editMode) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 pb-10 pt-5 sm:px-6 sm:pt-6 lg:px-8">
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

        <ArtistEditForm
          key={artist.slug}
          artist={artist}
          onCancel={closeEditMode}
          fieldIdPrefix="artist-inline-"
        />
      </div>
    )
  }

  return (
    <div className={cn(signalNarrow.variable, "text-[#0B0B0C]")}>
      <ArtistDetailMasthead
        artist={artist}
        topBar={
          <>
            <ArtistIndexBackLink
              label="Artist Index"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
            />
            <div className="flex items-center gap-2">
              <ArtistProfileDirectoryHeaderNav
                slug={artist.slug}
                tone="dark"
                onDirectoryNavigate={onDirectoryNavigate}
              />
              <ArtistShareButton title={artist.name} path={profilePath} />
            </div>
          </>
        }
      />

      <div className="mx-auto max-w-6xl space-y-20 px-4 pb-20 pt-12 sm:space-y-24 sm:px-6 sm:pt-16 lg:px-8">
        <ClaimReceiptBanner
          artist={{
            slug: artist.slug,
            name: artist.name,
            claim_status: artist.claim_status,
            verified: artist.verified,
          }}
          fallback={null}
        />

        <ArtistDetailStanding artist={artist} />

        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-20">
          <ArtistDetailStory artist={artist} />
          <ArtistDetailListen artist={artist} />
        </div>

        <ArtistDetailScene artist={artist} otherArtists={otherArtists} />

        <ArtistDetailClaimBand artist={artist} />

        <ArtistProfileDirectoryFooterNav slug={artist.slug} onDirectoryNavigate={onDirectoryNavigate} />
      </div>
    </div>
  )
}
