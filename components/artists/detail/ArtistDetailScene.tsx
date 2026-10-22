import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { artistIndexCityHref, getArtistCitySlug } from "@/lib/artist-directory"
import { ArtistPortrait } from "@/components/artists/detail/ArtistPortrait"
import { ArtistDetailEyebrow, ArtistDetailHeading } from "@/components/artists/detail/ArtistDetailSection"
import { artistPlaceLabel } from "@/components/artists/detail/artist-detail-data"
import { publicRankHint } from "@/lib/chart-size"

function tileBadge(artist: Artist): string | null {
  const band = artist.ranking?.status === "ranked" ? artist.ranking.band : null
  return publicRankHint(artist.rank, band)
}

type ArtistDetailSceneProps = {
  artist: Artist
  otherArtists: Artist[]
}

export function ArtistDetailScene({ artist, otherArtists }: ArtistDetailSceneProps) {
  if (otherArtists.length === 0) return null

  const place = artistPlaceLabel(artist)
  const citySlug = getArtistCitySlug(artist.city)
  const sameCity = place ? otherArtists.filter((other) => artistPlaceLabel(other) === place).length : 0
  const heading = place && sameCity >= otherArtists.length / 2 ? `More from ${place}` : "Artists to know"

  return (
    <section aria-labelledby="artist-scene">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <ArtistDetailEyebrow>In the scene</ArtistDetailEyebrow>
          <ArtistDetailHeading id="artist-scene">{heading}</ArtistDetailHeading>
        </div>
        {citySlug && place ? (
          <Link
            href={artistIndexCityHref(citySlug)}
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#E8192C] transition-colors hover:text-[#d01528]"
          >
            Explore all {place} artists
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ) : null}
      </div>

      <ul className="scrollbar-none -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-y-8 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {otherArtists.map((other) => {
          const otherPlace = artistPlaceLabel(other)
          const badge = tileBadge(other)
          return (
            <li key={other.slug} className="w-[42%] shrink-0 snap-start sm:w-auto">
              <Link href={`/artist-index/${other.slug}`} className="group block">
                <div className="relative overflow-hidden rounded-2xl bg-[#0B0B0C]">
                  <ArtistPortrait
                    artist={other}
                    decorative
                    className="w-full grayscale-[0.85] transition duration-500 group-hover:scale-[1.03] group-hover:grayscale-0"
                  />
                  {badge ? (
                    <span className="absolute left-2 top-2 rounded-full bg-[#0B0B0C]/75 px-2 py-1 text-[10px] font-bold uppercase leading-none tracking-[0.08em] text-[#F4F1EA] backdrop-blur-md">
                      {badge}
                    </span>
                  ) : null}
                </div>
                <p className="font-signal -mb-[0.15em] mt-[calc(0.75rem-0.15em)] truncate py-[0.15em] text-lg font-bold uppercase leading-none text-[#0B0B0C]">
                  {other.name}
                </p>
                <p className="mt-1.5 truncate font-mono text-[10px] uppercase tracking-[0.22em] text-[#77726A]">
                  {[otherPlace, other.genre[0]].filter(Boolean).join(" · ") || "Hiffi Artist Index"}
                </p>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
