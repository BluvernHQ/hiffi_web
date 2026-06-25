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
  breadcrumbs?: Breadcrumb[]
}

export function ArtistIndexHeader({
  claimHref = "/artist-index",
  breadcrumbs,
}: ArtistIndexHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "flex items-center justify-between",
            breadcrumbs?.length ? "py-3" : "h-16",
          )}
        >
          <div className="min-w-0">
            <Link href="/" className="flex items-center">
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
            {breadcrumbs?.length ? (
              <nav aria-label="Breadcrumb" className="mt-1 flex items-center gap-1 text-xs">
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
                          index === breadcrumbs.length - 1
                            ? "text-[#E8192C]"
                            : "text-[#E8192C]/80",
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
          </div>
          <Link href={claimHref} className={artistButtonSolid}>
            Claim Now
          </Link>
        </div>
      </div>
    </header>
  )
}
