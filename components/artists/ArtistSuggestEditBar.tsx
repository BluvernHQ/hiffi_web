import Link from "next/link"
import { PencilLine } from "lucide-react"
import type { Artist } from "@/lib/artists"

type ArtistSuggestEditBarProps = {
  artist: Artist
}

export function ArtistSuggestEditBar({ artist }: ArtistSuggestEditBarProps) {
  const editHref = `/artist-index/${artist.slug}/edit`

  return (
    <aside className="rounded-2xl border border-border bg-muted/25 px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <PencilLine className="mt-0.5 h-5 w-5 shrink-0 text-[#E8192C]" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-foreground">Help improve this profile</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Anyone can suggest corrections or additions. Edits are reviewed by the Hiffi team
              before they go live.
            </p>
          </div>
        </div>
        <Link
          href={editHref}
          className="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-[#E8192C] bg-transparent px-5 py-2.5 text-sm font-semibold text-[#E8192C] transition-colors hover:bg-[#E8192C]/5"
        >
          Suggest an edit
        </Link>
      </div>
    </aside>
  )
}
