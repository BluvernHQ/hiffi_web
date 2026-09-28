import Link from "next/link"
import { ArrowDown, ArrowRight } from "lucide-react"
import type { TopArtist } from "@/lib/top-artists"
import { cn } from "@/lib/utils"
import { artistPageContainer } from "@/components/artists/artist-layout"
import { ArtistPortrait } from "@/components/artists/detail/ArtistPortrait"
import { TopChartArtistButton } from "@/components/top-artists/premium/TopChartDrawer"
import { chartPlace } from "@/components/top-artists/premium/chart-format"

type TopChartMastheadProps = {
  podium: TopArtist[]
  chartWeek: string | null
  totalRanked: number
  cityCount: number
}

function PodiumCard({ artist, lead }: { artist: TopArtist; lead: boolean }) {
  const place = chartPlace(artist)
  return (
    <TopChartArtistButton
      artist={artist}
      className={cn(
        "group relative block w-full overflow-hidden rounded-[22px] bg-[#141416] text-left ring-1 transition-transform duration-500 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
        lead ? "aspect-[3/4] ring-[#F2C662]/45" : "aspect-[3/4] ring-white/10",
      )}
    >
      <ArtistPortrait
        artist={{ name: artist.artist_name, image: artist.image ?? null }}
        decorative
        className="absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/10" aria-hidden />
      <span
        className={cn(
          "font-signal absolute left-3 top-2.5 font-bold leading-none tabular-nums sm:left-4 sm:top-3",
          lead
            ? "bg-gradient-to-b from-[#FFF4CF] via-[#F2C662] to-[#C28A2A] bg-clip-text text-[length:clamp(2.75rem,4.4vw,4.25rem)] text-transparent"
            : "text-[length:clamp(2rem,3vw,3rem)] text-white/85",
        )}
      >
        {artist.rank}
      </span>
      <span className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <span
          className={cn(
            "font-signal line-clamp-2 font-bold uppercase leading-[0.92] text-[#F4F1EA]",
            lead ? "text-[length:clamp(1.25rem,2vw,1.9rem)]" : "text-[length:clamp(1rem,1.5vw,1.35rem)]",
          )}
        >
          {artist.artist_name}
        </span>
        {place ? (
          <span className="mt-1.5 block truncate font-mono text-[9px] uppercase tracking-[0.22em] text-white/55 sm:text-[10px]">
            {place}
          </span>
        ) : null}
      </span>
    </TopChartArtistButton>
  )
}

export function TopChartMasthead({ podium, chartWeek, totalRanked, cityCount }: TopChartMastheadProps) {
  const [first, second, third] = podium

  return (
    <section className="relative isolate overflow-hidden bg-[#0B0B0C] text-[#F4F1EA]">
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_10%_0%,rgba(232,25,44,0.26),transparent_50%),radial-gradient(ellipse_at_90%_100%,rgba(242,198,98,0.1),transparent_45%)]"
        aria-hidden
      />
      <div className="mood-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay" aria-hidden />

      <div className={artistPageContainer}>
        <div className="grid gap-12 pb-14 pt-12 sm:pb-16 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:items-end lg:gap-14 lg:pb-20 lg:pt-20 2xl:grid-cols-[minmax(0,1fr)_600px] 2xl:gap-24">
          <div className="artist-rise min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50 sm:text-[11px]">
              Hiffi Hip-Hop 500{chartWeek ? ` — Week of ${chartWeek}` : ""}
            </p>
            <h1 className="font-signal mt-6 text-[length:clamp(2.75rem,5.9vw,7.25rem)] font-bold uppercase leading-[0.86] tracking-[-0.005em]">
              The 500 moving
              <span className="block text-white/35">hip-hop right now.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-7 text-white/60 sm:text-base">
              Ranked every week from YouTube and Instagram signal: audience growth, view velocity, reach and
              consistency.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#ranking"
                className="inline-flex items-center gap-2 rounded-full bg-[#F4F1EA] px-5 py-3 text-sm font-semibold text-[#0B0B0C] transition-colors hover:bg-white"
              >
                See the ranking
                <ArrowDown className="h-4 w-4" aria-hidden />
              </a>
              <Link
                href="/top-artists/how-it-works"
                className="group inline-flex items-center gap-1.5 rounded-full px-4 py-3 text-sm font-semibold text-white/70 transition-colors hover:text-white"
              >
                How it works
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>

            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/10 pt-6">
              {[
                { label: "Artists ranked", value: totalRanked > 0 ? totalRanked.toLocaleString() : "500" },
                ...(cityCount > 0 ? [{ label: "City charts", value: cityCount.toLocaleString() }] : []),
                { label: "Refreshed", value: "Weekly" },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.26em] text-white/40">{item.label}</dt>
                  <dd className="font-signal mt-1.5 text-3xl font-bold uppercase leading-none">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {first ? (
            <div className="artist-rise [animation-delay:120ms]">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 sm:text-[11px]">
                This week’s top three
              </p>
              <ol className="grid grid-cols-[1fr_1.18fr_1fr] items-end gap-2.5 sm:gap-3">
                {[second, first, third].map((artist, index) =>
                  artist ? (
                    <li key={artist.username} className={cn(index === 1 && "pb-5 sm:pb-8")}>
                      <PodiumCard artist={artist} lead={index === 1} />
                    </li>
                  ) : (
                    <li key={index} />
                  ),
                )}
              </ol>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
