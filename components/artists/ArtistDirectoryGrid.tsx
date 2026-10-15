import { Loader2 } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { ArtistCard } from "@/components/artists/ArtistCard"
import { ArtistRosterCard } from "@/components/artists/index/ArtistRosterCard"
import { ARTIST_ROSTER_GRID, ArtistRosterSkeleton } from "@/components/artists/index/ArtistRosterSkeleton"
import { ArtistDirectoryGridSkeleton } from "@/components/artists/ArtistDirectoryGridSkeleton"
import { ArtistDirectoryPagination } from "@/components/artists/ArtistDirectoryPagination"
import { artistPanelShell } from "@/components/artists/artist-styles"
import { cn } from "@/lib/utils"

type ArtistDirectoryGridProps = {
  artists: Artist[]
  currentPage: number
  totalPages: number
  totalMatches: number
  artistCount: number
  query: string
  activeFilterIds: string[]
  sectionTitle?: string
  sectionSubtitle?: string
  paginationHref?: (page: number) => string
  /** When set, pagination updates in place instead of navigating via links. */
  onPageChange?: (page: number) => void
  /** Client directory fetch in flight — disables pagination and dims the grid. */
  isPending?: boolean
  /** Backend `has_more` — enables next when total page count is unknown. */
  hasMore?: boolean
  compactHeader?: boolean
  cardVariant?: "default" | "hub" | "roster"
}

export function ArtistDirectoryGrid({
  artists,
  currentPage,
  totalPages,
  totalMatches,
  artistCount,
  query,
  activeFilterIds,
  sectionTitle,
  sectionSubtitle,
  paginationHref,
  onPageChange,
  isPending = false,
  hasMore = false,
  compactHeader = false,
  cardVariant = "default",
}: ArtistDirectoryGridProps) {
  const showPagination = totalPages > 1 || hasMore

  const paginationProps = {
    currentPage,
    totalPages,
    hasMore,
    isPending,
    query,
    activeFilterIds,
    paginationHref,
    onPageChange,
  }

  if (cardVariant === "roster") {
    return (
      <section aria-busy={isPending || undefined}>
        <h2 className="sr-only">Artists</h2>
        {isPending ? (
          <>
            <ArtistRosterSkeleton count={Math.max(artists.length, 12)} />
            <span className="sr-only" role="status">
              Loading artists
            </span>
          </>
        ) : artists.length > 0 ? (
          <div className={ARTIST_ROSTER_GRID}>
            {artists.map((artist, index) => (
              <div
                key={artist.slug}
                className="artist-rise"
                style={{ animationDelay: `${Math.min(index, 11) * 40}ms` }}
              >
                <ArtistRosterCard artist={artist} />
              </div>
            ))}
          </div>
        ) : (
          <div className="border-y border-[#0B0B0C]/12 py-16 text-center">
            <p className="font-signal text-4xl font-bold uppercase leading-none text-[#0B0B0C] sm:text-5xl">
              No one by that name. Yet.
            </p>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#77726A]">
              Try a shorter spelling or a stage name. If you’re an artist who isn’t indexed, you can still claim a
              page.
            </p>
          </div>
        )}

        {showPagination ? <ArtistDirectoryPagination {...paginationProps} tone="paper" className="mt-14" /> : null}
      </section>
    )
  }

  const defaultSubtitle = `${totalMatches.toLocaleString()} of ${artistCount.toLocaleString()} profiles match your filters`

  return (
    <section className={compactHeader ? "space-y-4" : "space-y-6"}>
      {!compactHeader || sectionTitle ? (
        <div>
          {compactHeader && !sectionTitle ? (
            <h2 className="sr-only">Artist directory</h2>
          ) : (
            <h2
              className={
                compactHeader
                  ? "text-lg font-bold tracking-tight text-foreground"
                  : "text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              }
            >
              {sectionTitle ? (
                sectionTitle
              ) : compactHeader ? (
                "Directory"
              ) : (
                <>
                  All{" "}
                  <span
                    className="font-normal text-transparent"
                    style={{ WebkitTextStroke: "1px rgba(10, 10, 10, 0.85)" }}
                  >
                    artists
                  </span>
                </>
              )}
            </h2>
          )}
          {sectionSubtitle && !compactHeader ? (
            <p className="mt-1 text-sm text-muted-foreground">{sectionSubtitle}</p>
          ) : sectionSubtitle ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{sectionSubtitle}</p>
          ) : !compactHeader ? (
            <p className="mt-1 text-sm text-muted-foreground">{defaultSubtitle}</p>
          ) : null}
        </div>
      ) : (
        <h2 className="sr-only">Artist directory</h2>
      )}

      {artists.length > 0 ? (
        <div className={cn("relative", compactHeader ? "space-y-6" : "space-y-8")}>
          {isPending ? (
            <div
              className="absolute inset-0 z-10 flex items-start justify-center rounded-xl bg-background/40 pt-24"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-7 w-7 animate-spin text-[#E8192C]" aria-hidden />
              <span className="sr-only">Loading artists</span>
            </div>
          ) : null}
          <div
            className={cn(
              "grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-6",
              isPending && "pointer-events-none opacity-60",
            )}
            aria-busy={isPending || undefined}
          >
            {artists.map((artist) => (
              <ArtistCard key={artist.slug} artist={artist} variant={cardVariant} />
            ))}
          </div>

          {showPagination ? (
            <ArtistDirectoryPagination {...paginationProps} />
          ) : null}
        </div>
      ) : isPending ? (
        <ArtistDirectoryGridSkeleton compact={compactHeader} />
      ) : (
        <div
          className={cn(
            artistPanelShell,
            "border border-dashed border-border bg-muted/20 px-6 py-12 text-center",
          )}
        >
          <p className="text-base font-medium text-foreground">No artists match your filters</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try clearing a filter or searching with a different keyword.
          </p>
        </div>
      )}
    </section>
  )
}
