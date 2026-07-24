"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, MapPin, Search, Youtube } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  fetchTopArtistsClient,
  hasMovementData,
  topArtistScoreBand,
  topArtistSocialLinks,
  topArtistTier,
  TOP_ARTISTS_PAGE_SIZE,
  type TopArtist,
  type TopArtistsPage,
} from "@/lib/top-artists"
import {
  artistButtonOutline,
  artistButtonSolid,
  artistPanelShell,
  HIFFI_ARTIST_RED,
} from "@/components/artists/artist-styles"
import { Hiffi500RankedRow } from "@/components/artists/top500/hiffi500-ranking-list"
import { Hiffi500ShareButton } from "@/components/artists/top500/hiffi500-share-button"

function artistInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
  }
  return name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "?"
}

/** Soft brand-adjacent monogram colors — red / charcoal / warm stone, no purple defaults. */
function monogramPalette(seed: string): { from: string; to: string; text: string } {
  const palettes = [
    { from: "#E8192C", to: "#7f0d18", text: "#ffffff" },
    { from: "#1c1917", to: "#44403c", text: "#fafaf9" },
    { from: "#b91c1c", to: "#1c1917", text: "#ffffff" },
    { from: "#292524", to: "#E8192C", text: "#ffffff" },
    { from: "#78716c", to: "#292524", text: "#fafaf9" },
    { from: "#9f1239", to: "#450a0a", text: "#ffffff" },
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return palettes[Math.abs(hash) % palettes.length]
}

function artistPhotoSrc(artist: TopArtist): string | null {
  return artist.image?.trim() || artist.banner_image?.trim() || null
}

function ArtistBubble({ artist, size }: { artist: TopArtist; size: "sm" | "lg" }) {
  const src = artistPhotoSrc(artist)
  const initials = artistInitials(artist.artist_name)
  const sizeClasses = size === "lg" ? "h-14 w-14 text-base" : "h-10 w-10 text-xs"

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={cn("shrink-0 rounded-full object-cover ring-1 ring-black/5", sizeClasses)}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[#E8192C]/10 font-semibold text-[#E8192C] ring-1 ring-[#E8192C]/15",
        sizeClasses,
      )}
      aria-hidden
    >
      {initials}
    </div>
  )
}

function ArtistPortrait({
  artist,
  className,
  size = "panel",
}: {
  artist: TopArtist
  className?: string
  size?: "panel" | "tile"
}) {
  const src = artistPhotoSrc(artist)
  const initials = artistInitials(artist.artist_name)
  const palette = monogramPalette(artist.username || artist.artist_name)

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={artist.artist_name}
        className={cn("rounded-2xl object-cover", className)}
      />
    )
  }

  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl", className)}
      style={{
        background: `linear-gradient(145deg, ${palette.from} 0%, ${palette.to} 100%)`,
      }}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.25), transparent 40%)",
        }}
      />
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-black leading-none tracking-tight",
          size === "tile" ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl",
        )}
        style={{ color: palette.text }}
      >
        {initials}
      </span>
    </div>
  )
}

function TierBadge({ rank, size = "sm" }: { rank: number; size?: "sm" | "md" }) {
  const tier = topArtistTier(rank)
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold uppercase tracking-wide",
        size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]",
        tier.highlight ? "bg-[#E8192C] text-white" : "bg-muted text-muted-foreground",
      )}
    >
      {tier.label}
    </span>
  )
}

function YoutubeSourceNote({ fetchedAt }: { fetchedAt: number }) {
  const asOf = new Date(fetchedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 font-medium">
        <Youtube className="h-3.5 w-3.5 text-[#E8192C]" aria-hidden />
        Ranked using YouTube public data only
      </span>
      <span>Last updated {asOf}. Rankings refresh as new metrics are collected.</span>
    </div>
  )
}

/** Featured banner — #1 only. Spotlight below covers #2–#6 so the hero isn’t repeated. */
function FeaturedBanner({ artist }: { artist: TopArtist }) {
  return (
    <section className={cn(artistPanelShell, "border border-border bg-white p-6 sm:p-8")}>
      <div className="flex flex-col gap-6 md:flex-row md:items-stretch md:justify-between">
        <ArtistPortrait
          artist={artist}
          size="tile"
          className="aspect-[16/10] w-full shrink-0 md:hidden"
        />
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center rounded-md border border-[#E8192C]/30 bg-[#E8192C]/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#E8192C]">
            #1 · Top 500 Artist
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            {artist.artist_name}
          </h2>
          {artist.location ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-[#E8192C]" aria-hidden />
              {artist.location}
            </p>
          ) : null}
          <p className="mt-2 text-sm font-semibold">
            Rap / Hip-Hop <span className="mx-1 text-muted-foreground">•</span>
            <span className="text-[#E8192C]">#{artist.rank} on the Hiffi 500</span>
          </p>
          {artist.bio ? (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {artist.bio}
            </p>
          ) : null}
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {topArtistScoreBand(artist).label}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/artist-index/${artist.username}`}
              className={artistButtonSolid}
              data-analytics-name="hiffi500-hero-view-profile"
            >
              View Profile
            </Link>
            {artist.claim_status !== "claimed" ? (
              <Link
                href={`/artist-index/${artist.username}/claim`}
                className={artistButtonOutline}
                data-analytics-name="hiffi500-hero-claim"
              >
                Claim this profile
              </Link>
            ) : null}
            <Hiffi500ShareButton artist={artist} className="px-4 py-2.5 text-sm" />
          </div>
        </div>
        <ArtistPortrait
          artist={artist}
          size="tile"
          className="hidden min-h-44 w-72 shrink-0 self-stretch md:block"
        />
      </div>
    </section>
  )
}

/** Spotlight — ranks 2–6 beside a detail panel (avoids repeating #1 from the hero). */
function SpotlightSection({
  artists,
  selected,
  onSelect,
}: {
  artists: TopArtist[]
  selected: TopArtist
  onSelect: (artist: TopArtist) => void
}) {
  const socials = topArtistSocialLinks(selected.other_socials)
  const tier = topArtistTier(selected.rank)

  return (
    <section className={cn(artistPanelShell, "overflow-hidden border border-border bg-white")}>
      <div className="grid md:grid-cols-[260px_1fr]">
        <aside className="border-b border-border md:border-b-0 md:border-r">
          <p className="border-b border-border px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Also charting
          </p>
          <ol>
            {artists.map((artist) => {
              const isActive = artist.username === selected.username
              return (
                <li key={artist.username}>
                  <button
                    type="button"
                    onClick={() => onSelect(artist)}
                    className={cn(
                      "flex w-full items-center gap-3 border-l-4 px-4 py-3.5 text-left transition-colors",
                      isActive
                        ? "border-[#E8192C] bg-[#E8192C]/5"
                        : "border-transparent hover:bg-muted/40",
                    )}
                    data-analytics-name="hiffi500-spotlight-select"
                  >
                    <ArtistBubble artist={artist} size="sm" />
                    <span
                      className={cn(
                        "min-w-0 truncate font-bold",
                        isActive ? "text-[#E8192C]" : "text-foreground",
                      )}
                    >
                      {artist.rank}. {artist.artist_name}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <a
            href="#hiffi500-rankings"
            className="block border-t border-border px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-[#E8192C]"
          >
            See all rankings
          </a>
        </aside>

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row">
            <ArtistPortrait
              artist={selected}
              size="tile"
              className="h-40 w-full shrink-0 sm:h-44 sm:w-44"
            />
            <div className="min-w-0 flex-1">
              <TierBadge rank={selected.rank} size="md" />
              <h3 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                {selected.rank}. {selected.artist_name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Rap / Hip-Hop{selected.location ? ` • ${selected.location}` : ""}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Current ranking
            </p>
            <p className="mt-1 text-4xl font-black tracking-tight">
              #{selected.rank}
              <span className="ml-3 align-middle text-sm font-semibold text-[#E8192C]">
                {tier.label}
              </span>
            </p>
            <p className="mt-2 text-sm font-semibold">{topArtistScoreBand(selected).label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Scored from YouTube public engagement signals
            </p>
          </div>

          {socials.length > 0 ? (
            <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {socials.map((link) => (
                <div key={link.key} className="min-w-0">
                  <dt className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {link.label}
                  </dt>
                  <dd className="truncate text-sm font-semibold">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#E8192C]"
                      data-analytics-name={`hiffi500-spotlight-${link.key}-link`}
                    >
                      {link.handle}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href={`/artist-index/${selected.username}`}
              className="inline-flex items-center text-sm font-bold uppercase tracking-wide text-[#E8192C] hover:text-[#d01528]"
              data-analytics-name="hiffi500-spotlight-full-profile"
            >
              See full artist profile »
            </Link>
            <Hiffi500ShareButton artist={selected} />
          </div>
        </div>
      </div>
    </section>
  )
}

export interface Hiffi500ClientProps {
  initialPage: TopArtistsPage | null
}

export function Hiffi500Client({ initialPage }: Hiffi500ClientProps) {
  const [artists, setArtists] = useState<TopArtist[]>(initialPage?.items ?? [])
  const [hasMore, setHasMore] = useState(initialPage?.has_more ?? false)
  const [totalRanked, setTotalRanked] = useState(initialPage?.total_ranked ?? 0)
  const [fetchedAt, setFetchedAt] = useState(initialPage?.fetched_at ?? Date.now())
  const [loadingMore, setLoadingMore] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [query, setQuery] = useState("")
  // Default spotlight to #2 so the hero owns #1.
  const [spotlightUsername, setSpotlightUsername] = useState<string | null>(
    initialPage?.items[1]?.username ?? initialPage?.items[0]?.username ?? null,
  )
  const [error, setError] = useState<string | null>(
    initialPage ? null : "Could not load the ranking. Please try again.",
  )

  const spotlightCandidates = useMemo(() => artists.slice(1, 6), [artists])
  const spotlight =
    spotlightCandidates.find((a) => a.username === spotlightUsername) ??
    spotlightCandidates[0] ??
    null
  const showMovement = useMemo(() => artists.some(hasMovementData), [artists])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return artists
    return artists.filter(
      (a) =>
        a.artist_name.toLowerCase().includes(normalized) ||
        a.username.toLowerCase().includes(normalized) ||
        (a.location ?? "").toLowerCase().includes(normalized),
    )
  }, [artists, query])

  const loadPage = useCallback(async (offset: number, replace: boolean) => {
    const page = await fetchTopArtistsClient(TOP_ARTISTS_PAGE_SIZE, offset)
    setArtists((prev) => {
      if (replace) return page.items
      const seen = new Set(prev.map((a) => a.username))
      return [...prev, ...page.items.filter((a) => !seen.has(a.username))]
    })
    setHasMore(page.has_more)
    setTotalRanked(page.total_ranked)
    setFetchedAt(page.fetched_at)
    setError(null)
    if (replace) {
      setSpotlightUsername(page.items[1]?.username ?? page.items[0]?.username ?? null)
    }
  }, [])

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      await loadPage(artists.length, false)
    } catch {
      setError("Could not load more artists. Please try again.")
    } finally {
      setLoadingMore(false)
    }
  }

  const handleRetry = async () => {
    if (retrying) return
    setRetrying(true)
    try {
      await loadPage(0, true)
    } catch {
      setError("Could not load the ranking. Please try again.")
    } finally {
      setRetrying(false)
    }
  }

  if (artists.length === 0) {
    return (
      <div className={cn(artistPanelShell, "border border-border bg-white p-10 text-center")}>
        <h2 className="text-lg font-semibold">
          {error ? "Couldn’t load the Hiffi 500" : "Ranking is warming up"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {error ??
            "Artists are being scored from YouTube public data. Check back soon — the list fills in as metrics are collected."}
        </p>
        {error ? (
          <button type="button" onClick={handleRetry} className={cn("mt-6", artistButtonSolid)}>
            {retrying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Retry
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <YoutubeSourceNote fetchedAt={fetchedAt} />

      {artists[0] ? <FeaturedBanner artist={artists[0]} /> : null}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter this page by name or city"
          className="w-full rounded-full border border-border bg-white py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-[#E8192C]/50 focus:ring-2 focus:ring-[#E8192C]/10"
          aria-label="Filter artists on this page"
        />
      </div>

      {spotlightCandidates.length > 0 && spotlight ? (
        <SpotlightSection
          artists={spotlightCandidates}
          selected={spotlight}
          onSelect={(artist) => setSpotlightUsername(artist.username)}
        />
      ) : null}

      <section id="hiffi500-rankings" className="scroll-mt-24">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            Top <span style={{ color: HIFFI_ARTIST_RED }}>Rap &amp; Hip-Hop</span> Artists
          </h2>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {totalRanked.toLocaleString()} artists ranked from YouTube signals
          </p>
        </div>
        <div className="mt-3 hidden items-center gap-3 border-b border-border pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:flex">
          <span className="w-12 text-center">Rank</span>
          <span className="w-10" />
          <span className="flex-1">Artist</span>
          {showMovement ? <span className="w-12 text-center">Δ 7d</span> : null}
          <span className="w-16 text-right">Band</span>
          <span className="hidden w-16 md:block" />
        </div>

        <ol className="mt-1">
          {filtered.map((artist) => (
            <Hiffi500RankedRow
              key={artist.username}
              artist={artist}
              showMovement={showMovement}
            />
          ))}
        </ol>

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No artists on this page match “{query}”. Try loading more rankings or a different filter.
          </p>
        ) : null}

        {error && artists.length > 0 ? (
          <p className="mt-4 text-center text-sm text-[#E8192C]">{error}</p>
        ) : null}

        {hasMore && !query ? (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className={cn(artistButtonOutline, "min-w-44")}
              data-analytics-name="hiffi500-load-more"
            >
              {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {loadingMore ? "Loading…" : "See more rankings"}
            </button>
          </div>
        ) : null}
      </section>

      <section
        className={cn(
          artistPanelShell,
          "bg-[#E8192C] px-6 py-10 text-center text-white sm:px-10 sm:py-12",
        )}
      >
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Are You an Artist?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
          Claim your Hiffi Artist Profile to verify your links, upload videos, and get discovered by
          fans and industry leaders.
        </p>
        <Link
          href="/artist-index/claim"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-base font-semibold text-[#E8192C] transition-colors hover:bg-white/90 sm:px-8 sm:py-4 sm:text-lg"
          data-analytics-name="hiffi500-claim-banner"
        >
          Claim your profile
        </Link>
      </section>
    </div>
  )
}
