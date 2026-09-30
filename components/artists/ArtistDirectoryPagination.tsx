import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { buildArtistDirectoryHref } from "@/lib/artist-directory"
import { cn } from "@/lib/utils"

export type ArtistDirectoryPaginationProps = {
  currentPage: number
  totalPages: number
  hasMore?: boolean
  isPending?: boolean
  query?: string
  activeFilterIds?: string[]
  paginationHref?: (page: number) => string
  onPageChange?: (page: number) => void
  /** `paper`: ink-on-paper style for the premium hub. */
  tone?: "default" | "paper"
  className?: string
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

export function ArtistDirectoryPagination({
  currentPage,
  totalPages,
  hasMore = false,
  isPending = false,
  query = "",
  activeFilterIds = [],
  paginationHref,
  onPageChange,
  tone = "default",
  className,
}: ArtistDirectoryPaginationProps) {
  const isPaper = tone === "paper"
  if (totalPages <= 1 && !hasMore) return null

  const pageNumbers = buildPageNumbers(currentPage, totalPages)
  const pageHref =
    paginationHref ??
    ((page: number) => buildArtistDirectoryHref({ query, activeFilterIds, page }))

  const canGoToPage = (page: number) => {
    if (isPending || page < 1 || page === currentPage) return false
    if (page <= totalPages) return true
    return hasMore && page === currentPage + 1
  }

  const goToPage = (page: number) => {
    if (!canGoToPage(page)) return
    onPageChange?.(page)
  }

  const paginationClassName = isPaper
    ? "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 font-mono text-[13px] tabular-nums transition-colors"
    : "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors"
  const paginationInactiveClassName = isPaper
    ? "text-[#0B0B0C]/55 hover:bg-[#0B0B0C]/[0.06] hover:text-[#0B0B0C]"
    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
  const paginationActiveClassName = isPaper
    ? "bg-[#0B0B0C] text-[#F4F1EA] pointer-events-none"
    : "bg-[#E8192C] text-white pointer-events-none"
  const paginationNavClassName = isPaper
    ? "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#0B0B0C]/15 px-3 text-sm font-semibold text-[#0B0B0C] transition-colors hover:border-[#0B0B0C]/40 sm:px-4"
    : "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted/40"

  const renderPageControl = (page: number) => {
    const isCurrent = currentPage === page
    const controlClassName = cn(
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
          className={controlClassName}
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
        className={controlClassName}
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
        <span className={cn(paginationNavClassName, "opacity-40")} aria-hidden>
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

  const pageList = pageNumbers.map((entry, index) =>
    entry === "ellipsis" ? (
      <span
        key={`ellipsis-${index}`}
        className={cn("px-2 text-sm", isPaper ? "font-mono text-[#0B0B0C]/35" : "text-muted-foreground")}
      >
        …
      </span>
    ) : (
      renderPageControl(entry)
    ),
  )

  const nextIcon = isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />

  if (isPaper) {
    return (
      <nav
        aria-label="Artist directory pagination"
        className={cn("flex items-center justify-between gap-3 border-t border-[#0B0B0C]/12 pt-8", className)}
      >
        {renderNavControl(
          currentPage - 1,
          "Previous page",
          <>
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </>,
          currentPage <= 1,
        )}
        <div className="flex items-center gap-0.5 sm:gap-1">{pageList}</div>
        {renderNavControl(
          currentPage + 1,
          "Next page",
          <>
            <span className="hidden sm:inline">Next</span>
            {nextIcon}
          </>,
          currentPage >= totalPages && !hasMore,
        )}
      </nav>
    )
  }

  return (
    <nav
      aria-label="Artist directory pagination"
      className={cn("flex items-center justify-center gap-1 sm:gap-2", className)}
    >
      {renderNavControl(
        currentPage - 1,
        "Previous page",
        <ChevronLeft className="h-4 w-4" />,
        currentPage <= 1,
      )}

      {pageList}

      {renderNavControl(currentPage + 1, "Next page", nextIcon, currentPage >= totalPages && !hasMore)}
    </nav>
  )
}
