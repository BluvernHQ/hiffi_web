import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight } from "lucide-react"
import { artistButtonSolid } from "@/components/artists/artist-styles"
import { ArtistSectionNav } from "@/components/artists/ArtistSectionNav"
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

export function ArtistIndexHeader({
  claimHref = "/artist-index/claim",
  claimLabel = "Claim your profile",
  breadcrumbs,
  breadcrumbTrailing,
  tone = "paper",
}: ArtistIndexHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur",
        tone === "ink"
          ? "border-white/10 bg-[#070708]/90 supports-[backdrop-filter]:bg-[#070708]/75"
          : "border-border/60 bg-white/95 supports-[backdrop-filter]:bg-white/80",
      )}
    >
      <div className="flex h-16 items-center gap-6 px-2 sm:px-3 md:px-4">
        <Link href="/" className="flex shrink-0 items-center" data-analytics-name="artist-nav-logo">
          <Image
            src="/appbarlogo.png"
            alt="Hiffi logo"
            width={120}
            height={32}
            className="h-8 w-auto"
            style={{ width: "auto" }}
            priority
          />
        </Link>
        <ArtistSectionNav tone={tone} layout="bar" className="hidden sm:flex" />
        {claimHref ? (
          <Link
            href={claimHref}
            className={cn(artistButtonSolid, "ml-auto shrink-0")}
            data-analytics-name="artist-nav-claim-button"
          >
            {claimLabel}
          </Link>
        ) : null}
      </div>
      <ArtistSectionNav tone={tone} layout="tabs" className="sm:hidden" />
      {breadcrumbs?.length ? (
        <nav
          aria-label="Breadcrumb"
          className={cn(
            "flex items-center justify-between gap-3 border-t px-2 pb-2.5 pt-2 text-xs sm:px-3 md:px-4",
            tone === "ink" ? "border-white/10" : "border-border/40",
          )}
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.label} className="inline-flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="h-3 w-3 text-[#E8192C]/50" aria-hidden />
              ) : null}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  data-analytics-name="artist-nav-breadcrumb-link"
                  className={cn(
                    "font-medium transition-colors hover:text-[#d01528]",
                    index === breadcrumbs.length - 1 ? "text-[#E8192C]" : "text-[#E8192C]/80",
                  )}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-[#E8192C]">{crumb.label}</span>
              )}
            </span>
          ))}
          </div>
          {breadcrumbTrailing ? <div className="shrink-0">{breadcrumbTrailing}</div> : null}
        </nav>
      ) : null}
    </header>
  )
}
