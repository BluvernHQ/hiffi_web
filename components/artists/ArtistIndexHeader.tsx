import type { ReactNode } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type Breadcrumb = {
  label: string
  href?: string
}

type ArtistIndexHeaderProps = {
  /** `null` hides the claim button (e.g. on the claim page itself). */
  claimHref?: string | null
  claimLabel?: string
  breadcrumbs?: Breadcrumb[]
  breadcrumbTrailing?: ReactNode
  tone?: "paper" | "ink"
}

/** Section bar under the app navbar: breadcrumbs on the left, claim CTA on the right. */
export function ArtistIndexHeader({
  claimHref = "/artist-index/claim",
  claimLabel = "Claim your profile",
  breadcrumbs,
  breadcrumbTrailing,
  tone = "paper",
}: ArtistIndexHeaderProps) {
  const hasBreadcrumbs = Boolean(breadcrumbs?.length)
  if (!hasBreadcrumbs && !claimHref && !breadcrumbTrailing) return null

  const ink = tone === "ink"

  return (
    <div
      className={cn(
        "w-full border-b",
        ink ? "border-white/10 bg-[#070708]" : "border-border/60 bg-white",
      )}
    >
      <div className="flex min-h-12 items-center justify-between gap-3 px-2 py-2 sm:px-3 md:px-4">
        {hasBreadcrumbs ? (
          <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-xs">
            {breadcrumbs!.map((crumb, index) => (
              <span key={crumb.label} className="inline-flex items-center gap-1">
                {index > 0 ? <ChevronRight className="h-3 w-3 text-[#E8192C]/50" aria-hidden /> : null}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    data-analytics-name="artist-nav-breadcrumb-link"
                    className={cn(
                      "font-medium transition-colors hover:text-[#d01528]",
                      index === breadcrumbs!.length - 1 ? "text-[#E8192C]" : "text-[#E8192C]/80",
                    )}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-[#E8192C]">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : (
          <span className="flex-1" />
        )}
        <div className="flex shrink-0 items-center gap-3">
          {breadcrumbTrailing}
          {claimHref ? (
            <Link
              href={claimHref}
              data-analytics-name="artist-nav-claim-button"
              className="inline-flex h-8 items-center justify-center rounded-full bg-[#E8192C] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#d01528]"
            >
              {claimLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
