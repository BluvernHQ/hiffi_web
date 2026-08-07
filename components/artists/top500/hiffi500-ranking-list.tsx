"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, Minus, Search } from "lucide-react"
import { artistProfilePhotoAlt } from "@/lib/artists"
import { cn } from "@/lib/utils"
import {
  hasMovementData,
  movementDelta7d,
  topArtistScoreBand,
  topArtistSocialLinks,
  topArtistTier,
  type TopArtist,
} from "@/lib/top-artists"
import { HIFFI_ARTIST_RED } from "@/components/artists/artist-styles"
import { Hiffi500ShareButton } from "@/components/artists/top500/hiffi500-share-button"

function artistInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
  }
  return name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "?"
}

function ArtistBubble({ artist }: { artist: TopArtist }) {
  const src = artist.image?.trim() || artist.banner_image?.trim() || null
  const initials = artistInitials(artist.artist_name)

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={artistProfilePhotoAlt(artist.artist_name)}
        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-black/5"
      />
    )
  }

  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8192C]/10 text-xs font-semibold text-[#E8192C] ring-1 ring-[#E8192C]/15"
      aria-hidden
    >
      {initials}
    </div>
  )
}

export function MovementBadge({ artist }: { artist: TopArtist }) {
  if (artist.is_new_entry) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
        New
      </span>
    )
  }

  const delta = movementDelta7d(artist)
  if (delta == null) {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground"
        title="Weekly movement unlocks with ranking snapshots"
      >
        <Minus className="h-3 w-3" aria-hidden />
        —
      </span>
    )
  }

  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600">
        <ArrowUp className="h-3 w-3" aria-hidden />
        {delta}
      </span>
    )
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#E8192C]">
        <ArrowDown className="h-3 w-3" aria-hidden />
        {Math.abs(delta)}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
      <Minus className="h-3 w-3" aria-hidden />
      0
    </span>
  )
}

export function ScoreBandBadge({ artist }: { artist: TopArtist }) {
  const band = topArtistScoreBand(artist)
  return (
    <span
      className={cn(
        "hidden items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide sm:inline-flex",
        band.highlight ? "bg-[#E8192C] text-white" : "bg-muted text-muted-foreground",
      )}
    >
      {band.short}
    </span>
  )
}

export function Hiffi500RankedRow({
  artist,
  showShare = true,
  showTier = false,
  showMovement = false,
}: {
  artist: TopArtist
  showShare?: boolean
  showTier?: boolean
  showMovement?: boolean
}) {
  const socials = topArtistSocialLinks(artist.other_socials)
  const youtube = socials.find((s) => s.key === "youtube")
  const tier = topArtistTier(artist.rank)

  return (
    <li className="flex items-center gap-3 border-b border-border py-4 last:border-b-0 sm:gap-4 sm:py-5">
      <span
        className="w-10 shrink-0 text-center text-xl font-black tabular-nums sm:w-12 sm:text-2xl"
        style={{ color: HIFFI_ARTIST_RED }}
      >
        {artist.rank}
      </span>
      <ArtistBubble artist={artist} />
      <div className="min-w-0 flex-1">
        <Link
          href={`/artist-index/${artist.username}`}
          className="block truncate font-bold hover:text-[#E8192C]"
          data-analytics-name="hiffi500-row-artist-link"
        >
          {artist.artist_name}
        </Link>
        <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">
          {[artist.location, youtube ? youtube.handle : null].filter(Boolean).join(" · ") ||
            "Rap / Artist"}
        </p>
      </div>
      {showMovement ? (
        <div className="flex w-12 shrink-0 justify-center">
          <MovementBadge artist={artist} />
        </div>
      ) : null}
      <ScoreBandBadge artist={artist} />
      {showTier ? (
        <span className="hidden rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:inline-flex">
          {tier.label}
        </span>
      ) : null}
      {showShare ? <Hiffi500ShareButton artist={artist} className="hidden md:inline-flex" /> : null}
    </li>
  )
}

function filterArtists(artists: TopArtist[], query: string): TopArtist[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return artists
  return artists.filter(
    (a) =>
      a.artist_name.toLowerCase().includes(normalized) ||
      a.username.toLowerCase().includes(normalized) ||
      (a.location ?? "").toLowerCase().includes(normalized),
  )
}

export function Hiffi500RankingList({
  artists,
  emptyTitle,
  emptyBody,
  searchable = true,
  searchPlaceholder = "Filter by name or city",
}: {
  artists: TopArtist[]
  emptyTitle?: string
  emptyBody?: string
  searchable?: boolean
  searchPlaceholder?: string
}) {
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => filterArtists(artists, query), [artists, query])
  const showMovement = artists.some(hasMovementData)

  if (artists.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-border px-6 py-12 text-center">
        <h3 className="text-base font-semibold">{emptyTitle ?? "No artists to show yet"}</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          {emptyBody ??
            "This module unlocks when weekly ranking snapshots include movement data."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {searchable ? (
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-full border border-border bg-white py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-[#E8192C]/50 focus:ring-2 focus:ring-[#E8192C]/10"
            aria-label="Filter artists"
          />
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No artists match “{query}”. Try a different name or city.
        </p>
      ) : (
        <ol>
          {filtered.map((artist) => (
            <Hiffi500RankedRow
              key={artist.username}
              artist={artist}
              showMovement={showMovement}
            />
          ))}
        </ol>
      )}
    </div>
  )
}

export function MovementPendingBanner({ label }: { label: string }) {
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
      <span className="font-semibold">{label}</span> needs weekly snapshot deltas from the ranking
      API. The page is ready — once <code className="text-xs">rank_delta_7d</code> /{" "}
      <code className="text-xs">is_new_entry</code> ship, this list fills automatically.
    </p>
  )
}
