import type { ReactNode } from "react"
import { ArtistIndexHeader } from "@/components/artists/ArtistIndexHeader"
import { SiteFooter } from "@/components/layout/site-footer"

type ArtistDirectoryShellProps = {
  children: ReactNode
  claimHref?: string
  claimLabel?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
}

export function ArtistDirectoryShell({
  children,
  claimHref,
  claimLabel,
  breadcrumbs,
}: ArtistDirectoryShellProps) {
  return (
    <div className="min-h-screen bg-white">
      <ArtistIndexHeader claimHref={claimHref} claimLabel={claimLabel} breadcrumbs={breadcrumbs} />
      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</main>
      <SiteFooter />
    </div>
  )
}
