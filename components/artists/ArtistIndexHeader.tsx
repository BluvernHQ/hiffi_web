import Link from "next/link"
import Image from "next/image"
import { ChevronRight } from "lucide-react"
import { artistButtonSolid } from "@/components/artists/artist-styles"
import { cn } from "@/lib/utils"

type Breadcrumb = {
  label: string
  href?: string
}

type ArtistIndexHeaderProps = {
  claimHref?: string
  claimLabel?: string
  breadcrumbs?: Breadcrumb[]
}

export function ArtistIndexHeader({
  claimHref = "/artist-index/claim",
  claimLabel = "Claim your profile",
  breadcrumbs,
}: ArtistIndexHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-16 items-center justify-between px-2 sm:px-3 md:px-4">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/appbarlogo.png"
            alt="Hiffi"
            width={120}
            height={32}
            className="h-8 w-auto"
            style={{ width: "auto" }}
            priority
          />
        </Link>
        <Link href={claimHref} className={cn(artistButtonSolid, "shrink-0")}>
          {claimLabel}
        </Link>
      </div>
      {breadcrumbs?.length ? (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 border-t border-border/40 px-2 pb-2.5 pt-2 text-xs sm:px-3 md:px-4"
        >
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.label} className="inline-flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="h-3 w-3 text-[#E8192C]/50" aria-hidden />
              ) : null}
              {crumb.href ? (
                <Link
                  href={crumb.href}
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
        </nav>
      ) : null}
    </header>
  )
}
