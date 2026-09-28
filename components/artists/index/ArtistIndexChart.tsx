import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import type { HubChartArtist } from "@/lib/artist-index/hub-data"
import { ArtistPortrait } from "@/components/artists/detail/ArtistPortrait"
import { cn } from "@/lib/utils"

/** A weekly top five on a dark masthead. */
type ArtistIndexChartProps = {
  chart: HubChartArtist[]
  title: string
  href?: string | null
  hrefLabel?: string
  className?: string
}

export function ArtistIndexChart({
  chart,
  title,
  href = null,
  hrefLabel = "Full chart",
  className,
}: ArtistIndexChartProps) {
  if (chart.length === 0) return null

  return (
    <aside
      aria-labelledby="artist-index-chart"
      className={cn(
        "rounded-[26px] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-md sm:p-6",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          id="artist-index-chart"
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 sm:text-[11px]"
        >
          {title}
        </h2>
        {href ? (
          <Link
            href={href}
            className="group inline-flex items-center gap-1 text-xs font-semibold text-white/60 transition-colors hover:text-white"
          >
            {hrefLabel}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ) : null}
      </div>

      <ol className="mt-3">
        {chart.map((artist) => (
          <li key={artist.username} className="border-t border-white/[0.08] first:border-t-0">
            <Link
              href={`/artist-index/${encodeURIComponent(artist.username)}`}
              className="group flex items-center gap-4 py-3"
            >
              <span
                className={cn(
                  "font-signal w-8 shrink-0 text-[2rem] font-bold leading-none tabular-nums",
                  artist.rank === 1
                    ? "bg-gradient-to-b from-[#FFF4CF] via-[#F2C662] to-[#C28A2A] bg-clip-text text-transparent"
                    : "text-white/30",
                )}
              >
                {artist.rank}
              </span>
              <ArtistPortrait
                artist={{ name: artist.name, image: artist.image }}
                decorative
                className="h-11 w-11 shrink-0 rounded-full ring-1 ring-white/10"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-[#F4F1EA]">{artist.name}</span>
                {artist.note ? (
                  <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                    {artist.note}
                  </span>
                ) : null}
              </span>
              <ArrowUpRight
                className="h-4 w-4 shrink-0 text-white/25 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  )
}
