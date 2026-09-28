import Link from "next/link"
import type { Artist } from "@/lib/artists"
import { ArtistPortrait } from "@/components/artists/detail/ArtistPortrait"
import { ArtistDetailEyebrow, ArtistDetailHeading } from "@/components/artists/detail/ArtistDetailSection"
import { artistPlaceLabel } from "@/components/artists/detail/artist-detail-data"

const BAND_LABEL = { top_5: "Top 5%", top_10: "Top 10%", top_25: "Top 25%" } as const

function tileBadge(artist: Artist): string | null {
  if (artist.rank > 0) return `#${artist.rank} Hiffi 500`
  const band = artist.ranking?.status === "ranked" ? artist.ranking.band : null
  return band && band in BAND_LABEL ? BAND_LABEL[band as keyof typeof BAND_LABEL] : null
}

type ArtistDetailSceneProps = {
  artist: Artist
  otherArtists: Artist[]
}

export function ArtistDetailScene({ artist, otherArtists }: ArtistDetailSceneProps) {
  if (otherArtists.length === 0) return null

  const place = artistPlaceLabel(artist)
  const sameCity = place ? otherArtists.filter((other) => artistPlaceLabel(other) === place).length : 0
  const heading = place && sameCity >= otherArtists.length / 2 ? `More from ${place}` : "Artists to know"

  return (
    <section aria-labelledby="artist-scene">
      <ArtistDetailEyebrow>In the scene</ArtistDetailEyebrow>
      <ArtistDetailHeading id="artist-scene">{heading}</ArtistDetailHeading>

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
                <p className="font-signal mt-3 truncate text-lg font-bold uppercase leading-none text-[#0B0B0C]">
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
