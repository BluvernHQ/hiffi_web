"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const SECTIONS = [
  { href: "/artist-index", label: "Artist Index", analytics: "artist-nav-artist-index-link", match: ["/artist-index"] },
  { href: "/top-artists", label: "Top Artists", analytics: "artist-nav-top-artists-link", match: ["/top-artists", "/hiffi-500"] },
] as const

function isActive(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

type ArtistSectionNavProps = {
  tone: "paper" | "ink"
  /** `bar`: inline in the header row. `tabs`: full-width row under it on small screens. */
  layout: "bar" | "tabs"
  className?: string
}

/** Shared section switch for the Artist Index and Top Artists headers. */
export function ArtistSectionNav({ tone, layout, className }: ArtistSectionNavProps) {
  const pathname = usePathname() ?? ""
  const ink = tone === "ink"

  return (
    <nav
      aria-label="Artist sections"
      className={cn(
        layout === "bar" ? "items-center gap-1" : "grid grid-cols-2 border-t",
        layout === "tabs" && (ink ? "border-white/10" : "border-border/40"),
        className,
      )}
    >
      {SECTIONS.map((section) => {
        const active = isActive(pathname, section.match)
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? "page" : undefined}
            data-analytics-name={section.analytics}
            className={cn(
              "relative font-semibold transition-colors",
              layout === "bar"
                ? "rounded-full px-3.5 py-2 text-sm"
                : "flex h-10 items-center justify-center text-[13px]",
              ink
                ? active
                  ? "text-[#F4F1EA]"
                  : "text-white/50 hover:text-[#F4F1EA]"
                : active
                  ? "text-[#0B0B0C]"
                  : "text-[#0B0B0C]/50 hover:text-[#0B0B0C]",
              layout === "bar" && active && (ink ? "bg-white/[0.08]" : "bg-[#0B0B0C]/[0.05]"),
            )}
          >
            {section.label}
            {layout === "tabs" && active ? (
              <span className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-[#E8192C]" aria-hidden />
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
