"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ARTIST_INDEX_PATH } from "@/lib/artist-directory"
import { getArtistDirectoryReturnUrl } from "@/lib/artist-index/directory-nav-context"

type ArtistIndexBackLinkProps = {
  label?: string
  className?: string
}

export function ArtistIndexBackLink({
  label = "Back to Artist Index",
  className = "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
}: ArtistIndexBackLinkProps) {
  const router = useRouter()

  return (
    <Link
      href={ARTIST_INDEX_PATH}
      onClick={(event) => {
        event.preventDefault()
        router.push(getArtistDirectoryReturnUrl())
      }}
      className={className}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  )
}
