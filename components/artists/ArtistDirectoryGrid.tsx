import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { buildArtistDirectoryHref } from "@/lib/artist-directory"
import { ArtistCard } from "@/components/artists/ArtistCard"
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
  compactHeader?: boolean
  cardVariant?: "default" | "hub"
}

function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages: (number | "ellipsis")[] = [1]
  if (current > 3) pages.push("ellipsis")

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  if (current < total - 2) pages.push("ellipsis")
  pages.push(total)
  return pages
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
  compactHeader = false,
  cardVariant = "default",
}: ArtistDirectoryGridProps) {
  const pageNumbers = buildPageNumbers(currentPage, totalPages)
  const pageHref =
    paginationHref ??
    ((page: number) => buildArtistDirectoryHref({ query, activeFilterIds, page }))

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
        <div className={compactHeader ? "space-y-6" : "space-y-8"}>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-6">
            {artists.map((artist) => (
              <ArtistCard key={artist.slug} artist={artist} variant={cardVariant} />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              aria-label="Artist directory pagination"
              className="flex items-center justify-center gap-1 sm:gap-2"
            >
              {currentPage > 1 ? (
                <Link
                  href={pageHref(currentPage - 1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted/40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              ) : (
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground opacity-40"
                  aria-hidden
                >
                  <ChevronLeft className="h-4 w-4" />
                </span>
              )}

              {pageNumbers.map((entry, index) =>
                entry === "ellipsis" ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Link
                    key={entry}
                    href={pageHref(entry)}
                    aria-current={currentPage === entry ? "page" : undefined}
                    className={cn(
                      "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors",
                      currentPage === entry
                        ? "bg-[#E8192C] text-white"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    {entry}
                  </Link>
                ),
              )}

              {currentPage < totalPages ? (
                <Link
                  href={pageHref(currentPage + 1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted/40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground opacity-40"
                  aria-hidden
                >
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </nav>
          ) : null}
        </div>
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
