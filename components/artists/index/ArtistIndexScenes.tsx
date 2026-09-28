"use client"

import { useState } from "react"
import Link from "next/link"
import { artistIndexCityHref } from "@/lib/artist-directory"
import type { HubCity } from "@/lib/artist-index/hub-data"
import { ArtistDetailEyebrow, ArtistDetailHeading } from "@/components/artists/detail/ArtistDetailSection"
import { cn } from "@/lib/utils"

const INITIAL_CITIES = 12
const INITIAL_CITIES_MOBILE = 6

/** Ranked cities as a numbered, typographic list — the index's "where the sound lives". */
export function ArtistIndexScenes({ cities }: { cities: HubCity[] }) {
  const [showAll, setShowAll] = useState(false)
  if (cities.length === 0) return null

  const visible = showAll ? cities : cities.slice(0, INITIAL_CITIES)

  return (
    <section aria-labelledby="artist-index-scenes">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <ArtistDetailEyebrow>Scenes</ArtistDetailEyebrow>
          <ArtistDetailHeading id="artist-index-scenes">Where the sound lives</ArtistDetailHeading>
        </div>
        <p className="max-w-xs text-sm leading-6 text-[#77726A]">
          The cities with the most ranked artists this week. Open one to meet its scene.
        </p>
      </div>

      <ol className="mt-8 grid border-t border-[#0B0B0C]/12 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((city, index) => (
          <li
            key={city.slug}
            className={cn(
              "border-b border-[#0B0B0C]/12",
              !showAll && index >= INITIAL_CITIES_MOBILE && "max-sm:hidden",
            )}
          >
            <Link href={artistIndexCityHref(city.slug)} className="group flex items-baseline gap-4 py-4">
              <span className="w-7 shrink-0 font-mono text-[11px] tabular-nums text-[#0B0B0C]/35 transition-colors group-hover:text-[#E8192C]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className="font-signal min-w-0 flex-1 truncate text-[1.6rem] font-bold uppercase leading-none text-[#0B0B0C] transition-transform duration-300 group-hover:translate-x-1"
                title={city.region ? `${city.label}, ${city.region}` : city.label}
              >
                {city.label}
              </span>
              <span className="shrink-0 text-right text-xs font-semibold tabular-nums text-[#77726A]">
                {city.rankedCount.toLocaleString()}
                <span className="ml-1 font-normal">ranked</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {cities.length > INITIAL_CITIES_MOBILE ? (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          aria-expanded={showAll}
          className={cn(
            "mt-6 text-sm font-semibold text-[#0B0B0C] underline decoration-[#0B0B0C]/25 underline-offset-4 transition-colors hover:decoration-[#E8192C]",
            cities.length <= INITIAL_CITIES && "sm:hidden",
          )}
        >
          {showAll ? "Show fewer cities" : `All ${cities.length} cities`}
        </button>
      ) : null}
    </section>
  )
}
