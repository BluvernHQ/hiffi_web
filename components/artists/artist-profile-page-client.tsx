"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { ArtistDetailInteractive } from "@/components/artists/ArtistDetailInteractive"
import type { ArtistDirectoryNavContext } from "@/lib/artist-index/directory-nav-context"
import { saveArtistDirectoryNavContext } from "@/lib/artist-index/directory-nav-context"

type ProfilePayload = {
  artist: Artist
  otherArtists: Artist[]
  breadcrumbs: Array<{ label: string; href?: string }>
  profilePath: string
}

type ArtistProfilePageClientProps = {
  initialArtist: Artist
  initialOtherArtists: Artist[]
  initialBreadcrumbs: Array<{ label: string; href?: string }>
  initialEditMode?: boolean
}

type HistoryMode = "push" | "replace" | "none"

function slugFromProfilePathname(pathname: string): string | null {
  const match = pathname.match(/^\/artist-index\/([^/]+)\/?$/)
  const slug = match?.[1]?.trim().toLowerCase()
  if (!slug || slug === "city" || slug === "genre" || slug === "claim") return null
  return slug
}

export function ArtistProfilePageClient({
  initialArtist,
  initialOtherArtists,
  initialBreadcrumbs,
  initialEditMode = false,
}: ArtistProfilePageClientProps) {
  const [artist, setArtist] = useState(initialArtist)
  const [otherArtists, setOtherArtists] = useState(initialOtherArtists)
  const [breadcrumbs, setBreadcrumbs] = useState(initialBreadcrumbs)
  const [profilePath, setProfilePath] = useState(`/artist-index/${initialArtist.slug}`)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadArtist = useCallback(
    async (slug: string, options?: { history?: HistoryMode; navContext?: ArtistDirectoryNavContext }) => {
      if (slug === artist.slug && !options?.navContext) return

      setLoading(true)
      setLoadError(null)

      try {
        const response = await fetch(
          `/api/artist-index/profile?slug=${encodeURIComponent(slug)}`,
        )
        if (!response.ok) throw new Error("Failed to load artist profile")

        const data = (await response.json()) as ProfilePayload
        setArtist(data.artist)
        setOtherArtists(data.otherArtists)
        setBreadcrumbs(data.breadcrumbs)
        setProfilePath(data.profilePath)

        if (options?.navContext) {
          saveArtistDirectoryNavContext(options.navContext)
        }

        const historyMode = options?.history ?? "push"
        const nextPath = `/artist-index/${data.artist.slug}`
        if (historyMode === "push") {
          window.history.pushState(null, "", nextPath)
        } else if (historyMode === "replace") {
          window.history.replaceState(null, "", nextPath)
        }

        window.scrollTo({ top: 0, behavior: "smooth" })
      } catch {
        setLoadError("Couldn't load this artist. Try again.")
      } finally {
        setLoading(false)
      }
    },
    [artist.slug],
  )

  const handleDirectoryNavigate = useCallback(
    (slug: string, navContext: ArtistDirectoryNavContext) => {
      void loadArtist(slug, { history: "push", navContext })
    },
    [loadArtist],
  )

  useEffect(() => {
    const onPopState = () => {
      const slug = slugFromProfilePathname(window.location.pathname)
      if (!slug || slug === artist.slug) return
      void loadArtist(slug, { history: "none" })
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [artist.slug, loadArtist])

  return (
    <ArtistDirectoryShell
      claimHref={`/artist-index/${artist.slug}/claim`}
      breadcrumbs={breadcrumbs}
    >
      {loadError ? (
        <div
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {loadError}
        </div>
      ) : null}

      <div className="relative">
        {loading ? (
          <div
            className="absolute inset-0 z-10 flex items-start justify-center bg-white/60 pt-24"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-8 w-8 animate-spin text-[#E8192C]" aria-hidden />
            <span className="sr-only">Loading artist profile</span>
          </div>
        ) : null}

        <div className={loading ? "pointer-events-none opacity-60" : undefined} aria-busy={loading}>
          <ArtistDetailInteractive
            key={artist.slug}
            artist={artist}
            profilePath={profilePath}
            otherArtists={otherArtists}
            initialEditMode={initialEditMode && artist.slug === initialArtist.slug ? initialEditMode : false}
            onDirectoryNavigate={handleDirectoryNavigate}
          />
        </div>
      </div>
    </ArtistDirectoryShell>
  )
}
