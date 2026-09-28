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
}

export function ArtistDirectoryShell({
  children,
  claimHref,
  claimLabel,
  breadcrumbs,
  breadcrumbTrailing,
  bleed = false,
}: ArtistDirectoryShellProps) {
  return (
    <div className={cn("min-h-screen", bleed ? "bg-[#F4F1EA]" : "bg-white")}>
      <ArtistIndexHeader
        claimHref={claimHref}
        claimLabel={claimLabel}
        breadcrumbs={breadcrumbs}
        breadcrumbTrailing={breadcrumbTrailing}
      />
      {bleed ? (
        <main>{children}</main>
      ) : (
        <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</main>
      )}
      <SiteFooter />
    </div>
  )
}
