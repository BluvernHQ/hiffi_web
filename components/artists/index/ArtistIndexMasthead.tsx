import type { ReactNode } from "react"
import Link from "next/link"
import { artistIndexCityHref, artistIndexGenreHref } from "@/lib/artist-directory"
import type { ArtistIndexHubFeature } from "@/lib/artist-index/hub-data"
import { ArtistIndexChart } from "@/components/artists/index/ArtistIndexChart"
import { artistPageContainer } from "@/components/artists/artist-layout"

const BROWSE_LINKS = [
  { label: "Hip-Hop", href: artistIndexGenreHref("hip-hop") },
  { label: "Rap", href: artistIndexGenreHref("rap") },
  { label: "Trap", href: artistIndexGenreHref("trap") },
  { label: "Drill", href: artistIndexGenreHref("drill") },
  { label: "Atlanta", href: artistIndexCityHref("atlanta") },
]

type ArtistIndexMastheadProps = {
  artistCount: number
  feature: ArtistIndexHubFeature
  search: ReactNode
}

export function ArtistIndexMasthead({ artistCount, feature, search }: ArtistIndexMastheadProps) {
  const cityCount = feature.cities.length

  return (
    <section className="relative isolate overflow-hidden bg-[#0B0B0C] text-[#F4F1EA]">
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_10%_0%,rgba(232,25,44,0.24),transparent_50%),radial-gradient(ellipse_at_95%_100%,rgba(242,198,98,0.08),transparent_45%)]"
        aria-hidden
      />
      <div className="mood-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay" aria-hidden />

      <div className={artistPageContainer}>
        <div className="grid gap-10 pb-14 pt-12 sm:pb-16 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-end lg:gap-16 lg:pb-20 lg:pt-20 2xl:grid-cols-[minmax(0,1fr)_460px] 2xl:gap-24">
          <div className="artist-rise min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50 sm:text-[11px]">
              Hiffi Artist Index
            </p>
            <h1 className="font-signal mt-4 text-[length:clamp(3rem,7.4vw,7.75rem)] font-bold uppercase leading-[0.86] tracking-[-0.005em]">
              Hip-hop &amp; rap artists,
              <span className="block text-white/35">city by city.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-7 text-white/60 sm:text-base">
              {artistCount > 0 ? `${artistCount.toLocaleString()}+ artists` : "Thousands of artists"}
              {cityCount > 0 ? ` across ${cityCount} ranked cities` : ""}, ranked every week on the Hiffi 500. Find an
              artist, or find yourself and claim your page.
            </p>

            <div className="mt-8 max-w-2xl">{search}</div>

            <nav aria-label="Browse the index" className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">Browse</span>
              {BROWSE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-white/12 px-3.5 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/35 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <ArtistIndexChart chart={feature.chart} className="artist-rise [animation-delay:120ms]" />
        </div>

      </div>
    </section>
  )
}
