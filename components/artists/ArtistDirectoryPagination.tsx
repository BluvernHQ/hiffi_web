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
  className,
}: ArtistDirectoryPaginationProps) {
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

  const paginationClassName =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors"
  const paginationInactiveClassName = "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
  const paginationActiveClassName = "bg-[#E8192C] text-white pointer-events-none"
  const paginationNavClassName =
    "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted/40"

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
  )
}
