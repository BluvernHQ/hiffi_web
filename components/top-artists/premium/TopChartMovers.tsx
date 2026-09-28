import type { TopArtist } from "@/lib/top-artists"
import { ArtistPortrait } from "@/components/artists/detail/ArtistPortrait"
import { ArtistDetailEyebrow, ArtistDetailHeading } from "@/components/artists/detail/ArtistDetailSection"
import { TopChartArtistButton } from "@/components/top-artists/premium/TopChartDrawer"
import { chartPlace } from "@/components/top-artists/premium/chart-format"

/** Biggest weekly climbs, as portrait tiles. */
export function TopChartMovers({ movers }: { movers: TopArtist[] }) {
  if (movers.length === 0) return null

  return (
    <section id="movers" aria-labelledby="top-chart-movers" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <ArtistDetailEyebrow className="text-white/45">Movers</ArtistDetailEyebrow>
          <ArtistDetailHeading id="top-chart-movers" className="text-[#F4F1EA]">
            Momentum right now
          </ArtistDetailHeading>
        </div>
        <p className="max-w-xs text-sm leading-6 text-white/50 max-sm:hidden">
          The biggest climbs on the chart over the last seven days.
        </p>
      </div>

      <ol className="scrollbar-none -mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {movers.map((artist) => {
          const place = chartPlace(artist)
          const climb = artist.rank_delta_7d ?? 0
          return (
            <li key={artist.username} className="w-[62%] shrink-0 snap-start sm:w-auto">
              <TopChartArtistButton artist={artist} context="Biggest risers" className="group block w-full text-left">
                <span className="relative block overflow-hidden rounded-[20px] bg-[#141416] ring-1 ring-white/10">
                  <ArtistPortrait
                    artist={{ name: artist.artist_name, image: artist.image ?? null }}
                    decorative
                    className="w-full transition duration-700 ease-out group-hover:scale-[1.04]"
                  />
                  {climb > 0 ? (
                    <span className="absolute left-3 top-3 rounded-full bg-[#0B0B0C]/80 px-2.5 py-1 text-[11px] font-bold tabular-nums text-[#7BD88F] backdrop-blur-md">
                      ▲ {climb} spots
                    </span>
                  ) : null}
                </span>
                <span className="font-signal mt-3.5 block truncate text-[1.45rem] font-bold uppercase leading-none text-[#F4F1EA] transition-colors group-hover:text-[#FF4D5E] sm:text-[1.6rem]">
                  {artist.artist_name}
                </span>
                <span className="mt-1.5 block truncate font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                  {[`Now #${artist.rank}`, place].filter(Boolean).join(" · ")}
                </span>
              </TopChartArtistButton>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
