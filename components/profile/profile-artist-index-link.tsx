import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { artistIndexHref } from "@/lib/artist-directory"
import { cn } from "@/lib/utils"

type ProfileArtistIndexLinkProps = {
  username: string
  className?: string
}

/** Navigable Artist Index listing when GET /users/{username} reports in_inventory. */
export function ProfileArtistIndexLink({ username, className }: ProfileArtistIndexLinkProps) {
  const slug = username.trim().replace(/^@+/, "").toLowerCase()
  if (!slug) return null

  const href = artistIndexHref(slug)
  const displayPath = href.startsWith("/") ? href : `/${href}`

  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs font-medium text-muted-foreground">Artist Index</p>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-0.5 inline-flex max-w-full items-center gap-1.5 text-xs sm:text-sm font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        data-analytics-name="profile-artist-index-link"
      >
        <span className="truncate" title={displayPath}>
          {displayPath}
        </span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
        <span className="sr-only">Open Artist Index profile</span>
      </Link>
    </div>
  )
}
