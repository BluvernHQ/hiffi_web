import type { ReactNode } from "react"
import { ArtistIndexHeader } from "@/components/artists/ArtistIndexHeader"
import { SiteFooter } from "@/components/layout/site-footer"
import { cn } from "@/lib/utils"

type ArtistDirectoryShellProps = {
  children: ReactNode
  claimHref?: string
  claimLabel?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  breadcrumbTrailing?: ReactNode
  /** Children own their width and padding (full-bleed sections on a warm paper background). */
  bleed?: boolean
  /** `ink`: dark chrome and page, used by the Hip-Hop 500 chart. */
  tone?: "paper" | "ink"
}

export function ArtistDirectoryShell({
  children,
  claimHref,
  claimLabel,
  breadcrumbs,
  breadcrumbTrailing,
  bleed = false,
  tone = "paper",
}: ArtistDirectoryShellProps) {
  const ink = tone === "ink"
  return (
    <div className={cn("min-h-screen", ink ? "bg-[#070708] text-[#F4F1EA]" : bleed ? "bg-[#F4F1EA]" : "bg-white")}>
      <ArtistIndexHeader
        claimHref={claimHref}
        claimLabel={claimLabel}
        breadcrumbs={breadcrumbs}
        breadcrumbTrailing={breadcrumbTrailing}
        tone={tone}
      />
      {bleed ? (
        <main>{children}</main>
      ) : (
        <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</main>
      )}
      <SiteFooter variant={ink ? "ink" : "default"} />
    </div>
  )
}
