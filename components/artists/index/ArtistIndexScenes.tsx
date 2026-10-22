"use client"

import { useState } from "react"
import Link from "next/link"
import { artistIndexCityHref, artistIndexGenreHref, buildArtistDirectoryHref } from "@/lib/artist-directory"
import { DEFAULT_CHART_SIZE, type ChartSize } from "@/lib/chart-size"
import type { HubCity } from "@/lib/artist-index/hub-data"
import { ArtistIndexChartSize } from "@/components/artists/index/ArtistIndexChartSize"
import { ArtistDetailEyebrow, ArtistDetailHeading } from "@/components/artists/detail/ArtistDetailSection"

const INITIAL_CITIES = 12

/** Ranked cities as a numbered, typographic list — the index's "where the sound lives". */
type ArtistIndexScenesProps = {
  cities: HubCity[]
  chartSize?: ChartSize
  eyebrow?: string
  title?: string
  description?: string
  /** Where the chart-size links stay. Defaults to the artist index hub. */
  chartPage?: { kind: "city" | "genre"; slug: string; page?: number }
  /** Hide when the page already shows the same control beside the chart. */
  showChartSize?: boolean
}

export function ArtistIndexScenes({
  cities,
  chartSize = DEFAULT_CHART_SIZE,
  eyebrow = "Scenes",
  title = "Where the sound lives",
  description,
  chartPage,
  showChartSize = true,
}: ArtistIndexScenesProps) {
  const sceneDescription =
    description ??
    `Cities with artists inside the Top ${chartSize.toLocaleString()} this week. Open one to meet its scene.`
  const sizeHref = (size: ChartSize) => {
    if (chartPage?.kind === "city") return artistIndexCityHref(chartPage.slug, chartPage.page, size)
    if (chartPage?.kind === "genre") return artistIndexGenreHref(chartPage.slug, chartPage.page, size)
    return buildArtistDirectoryHref({ top: size })
  }
  const [showAll, setShowAll] = useState(false)
  if (cities.length === 0) return null

  const visible = showAll ? cities : cities.slice(0, INITIAL_CITIES)
  const sharedSlug = new Set(
    cities
      .map((city) => city.slug)
      .filter((slug, index, slugs) => slugs.indexOf(slug) !== index),
  )
  const cityKey = (city: HubCity, index: number) => city.id ?? `${city.slug}-${city.region ?? index}`
  const cityName = (city: HubCity) =>
    sharedSlug.has(city.slug) && city.region ? `${city.label}, ${city.region}` : city.label

  return (
    <section aria-labelledby="artist-index-scenes">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <ArtistDetailEyebrow>{eyebrow}</ArtistDetailEyebrow>
          <ArtistDetailHeading id="artist-index-scenes">{title}</ArtistDetailHeading>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          {showChartSize ? <ArtistIndexChartSize value={chartSize} hrefFor={sizeHref} /> : null}
          <p className="max-w-xs text-sm leading-6 text-[#77726A] max-sm:hidden">{sceneDescription}</p>
        </div>
      </div>

      <ol
        aria-label="Cities"
        className="scrollbar-none -mx-4 mt-6 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 pb-1 sm:hidden"
      >
        {cities.map((city, index) => (
          <li key={cityKey(city, index)} className="min-w-[8.5rem] shrink-0 snap-start">
            <Link
              href={artistIndexCityHref(city.slug, undefined, chartSize)}
              className="flex h-full flex-col rounded-2xl border border-[#0B0B0C]/12 bg-white/50 p-3.5 transition-colors active:bg-white"
            >
              <span className="font-mono text-[10px] tabular-nums text-[#0B0B0C]/35">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-signal mt-3 whitespace-nowrap text-[1.3rem] font-bold uppercase leading-none text-[#0B0B0C]">
                {cityName(city)}
              </span>
              <span className="mt-1.5 text-[11px] font-semibold tabular-nums text-[#77726A]">
                {city.rankedCount.toLocaleString()}
                <span className="ml-1 font-normal">ranked</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <ol className="mt-8 grid border-t max-sm:hidden border-[#0B0B0C]/12 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((city, index) => (
          <li key={cityKey(city, index)} className="border-b border-[#0B0B0C]/12">
            <Link href={artistIndexCityHref(city.slug, undefined, chartSize)} className="group flex items-baseline gap-4 py-4">
              <span className="w-7 shrink-0 font-mono text-[11px] tabular-nums text-[#0B0B0C]/35 transition-colors group-hover:text-[#E8192C]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className="font-signal -my-[0.15em] min-w-0 flex-1 truncate py-[0.15em] text-[1.6rem] font-bold uppercase leading-none text-[#0B0B0C] transition-transform duration-300 group-hover:translate-x-1"
                title={city.region ? `${city.label}, ${city.region}` : city.label}
              >
                {cityName(city)}
              </span>
              <span className="shrink-0 text-right text-xs font-semibold tabular-nums text-[#77726A]">
                {city.rankedCount.toLocaleString()}
                <span className="ml-1 font-normal">ranked</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {cities.length > INITIAL_CITIES ? (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          aria-expanded={showAll}
          className="mt-6 text-sm font-semibold text-[#0B0B0C] underline decoration-[#0B0B0C]/25 underline-offset-4 transition-colors hover:decoration-[#E8192C] max-sm:hidden"
        >
          {showAll ? "Show fewer cities" : `All ${cities.length} cities`}
        </button>
      ) : null}
    </section>
  )
}
