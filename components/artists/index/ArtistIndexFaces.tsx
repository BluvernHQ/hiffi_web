import Link from "next/link"
import type { HubFace } from "@/lib/artist-index/hub-data"
import { ArtistPortrait } from "@/components/artists/detail/ArtistPortrait"
import { cn } from "@/lib/utils"

type ArtistIndexFacesProps = {
  faces: HubFace[]
  className?: string
}

/** Portrait grid on the index masthead. */
export function ArtistIndexFaces({ faces, className }: ArtistIndexFacesProps) {
  const tiles = faces.slice(0, faces.length >= 6 ? 6 : 3)
  if (tiles.length < 3) return null

  return (
    <aside aria-labelledby="artist-index-faces" className={cn("min-w-0", className)}>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2
          id="artist-index-faces"
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 sm:text-[11px]"
        >
          Top of the index
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/30">This week</span>
      </div>

      <ol aria-label="Top ranked artists this week" className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {tiles.map((face) => (
          <li key={face.username} className="aspect-[4/5] min-w-0">
            <Link
              href={`/artist-index/${encodeURIComponent(face.username)}`}
              className="group relative block h-full w-full overflow-hidden rounded-2xl bg-[#141416] ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ArtistPortrait
                artist={{ name: face.name, image: face.image }}
                decorative
                className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              <span
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"
                aria-hidden
              />
              {face.rank > 0 ? (
                <span
                  className={cn(
                    "absolute left-2 top-2 rounded-full bg-[#0B0B0C]/75 px-2 py-1 text-[10px] font-bold leading-none tabular-nums backdrop-blur-md sm:left-2.5 sm:top-2.5",
                    face.rank <= 3 ? "text-[#F2C662]" : "text-[#F4F1EA]",
                  )}
                >
                  <span className="sr-only">Rank </span>#{face.rank}
                </span>
              ) : null}
              <span className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3">
                <span className="font-signal -mt-[0.15em] line-clamp-2 pt-[0.15em] text-[13px] font-bold uppercase leading-[0.95] text-[#F4F1EA] sm:text-[15px]">
                  {face.name}
                </span>
                {face.place ? (
                  <span className="mt-1 block truncate font-mono text-[9px] uppercase tracking-[0.2em] text-white/50">
                    {face.place}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  )
}
