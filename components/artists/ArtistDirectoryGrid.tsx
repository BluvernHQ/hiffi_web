import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { buildArtistDirectoryHref } from "@/lib/artist-directory"
import { ArtistCard } from "@/components/artists/ArtistCard"
import { ArtistDirectoryGridSkeleton } from "@/components/artists/ArtistDirectoryGridSkeleton"
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
  /** Replace grid with skeletons (search/filter changes). */
  showSkeleton?: boolean
  /** Backend `has_more` — enables next when total page count is unknown. */
  hasMore?: boolean
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
  onPageChange,
  isPending = false,
  showSkeleton = false,
  hasMore = false,
  compactHeader = false,
  cardVariant = "default",
}: ArtistDirectoryGridProps) {
  const pageNumbers = buildPageNumbers(currentPage, totalPages)
  const pageHref =
    paginationHref ??
    ((page: number) => buildArtistDirectoryHref({ query, activeFilterIds, page }))

  const paginationClassName =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors"
  const paginationInactiveClassName = "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
  const paginationActiveClassName = "bg-[#E8192C] text-white pointer-events-none"
  const paginationNavClassName =
    "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted/40"

  const canGoToPage = (page: number) => {
    if (isPending || page < 1 || page === currentPage) return false
    if (page <= totalPages) return true
    return hasMore && page === currentPage + 1
  }

  const goToPage = (page: number) => {
    if (!canGoToPage(page)) return
    onPageChange?.(page)
  }

  const renderPageControl = (page: number) => {
    const isCurrent = currentPage === page
    const className = cn(
      paginationClassName,
      isCurrent ? paginationActiveClassName : paginationInactiveClassName,
      isPending && !isCurrent && "opacity-50",
    )

    if (onPageChange) {
      return (
        <button
          key={page}
          type="button"
          onClick={() => goToPage(page)}
          disabled={isPending}
          aria-label={`Page ${page}`}
          aria-current={isCurrent ? "page" : undefined}
          className={className}
        >
          {page}
        </button>
      )
    }

    return (
      <Link
        key={page}
        href={pageHref(page)}
        aria-current={isCurrent ? "page" : undefined}
        className={className}
      >
        {page}
      </Link>
    )
  }

  const renderNavControl = (
    targetPage: number,
    label: string,
    icon: ReactNode,
    disabled: boolean,
  ) => {
    if (disabled) {
      return (
        <span
          className={cn(paginationNavClassName, "opacity-40")}
          aria-hidden
        >
          {icon}
        </span>
      )
    }

    if (onPageChange) {
      return (
        <button
          type="button"
          onClick={() => goToPage(targetPage)}
          disabled={isPending}
          className={cn(paginationNavClassName, isPending && "opacity-50")}
          aria-label={label}
          aria-busy={isPending || undefined}
        >
          {icon}
        </button>
      )
    }

    return (
      <Link href={pageHref(targetPage)} className={paginationNavClassName} aria-label={label}>
        {icon}
      </Link>
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

      {showSkeleton ? (
        <ArtistDirectoryGridSkeleton compact={compactHeader} />
      ) : artists.length > 0 ? (
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

          {totalPages > 1 || hasMore ? (
            <nav
              aria-label="Artist directory pagination"
              className="flex items-center justify-center gap-1 sm:gap-2"
            >
              {renderNavControl(
                currentPage - 1,
                "Previous page",
                <ChevronLeft className="h-4 w-4" />,
                currentPage <= 1,
              )}

              {pageNumbers.map((entry, index) =>
                entry === "ellipsis" ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted-foreground">
                    …
                  </span>
                ) : (
                  renderPageControl(entry)
                ),
              )}

              {renderNavControl(
                currentPage + 1,
                "Next page",
                isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />,
                currentPage >= totalPages && !hasMore,
              )}
            </nav>
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
