"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { ARTIST_INDEX_PATH } from "@/lib/artist-directory"

/** Browser-style back control; falls back to Artist Index with no history. */
export function ArtistClaimBackLink() {
  const router = useRouter()

  return (
    <Link
      href={ARTIST_INDEX_PATH}
      onClick={(event) => {
        event.preventDefault()
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back()
          return
        }
        router.push(ARTIST_INDEX_PATH)
      }}
      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back
    </Link>
  )
}
