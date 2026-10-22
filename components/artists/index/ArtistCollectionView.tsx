import Link from "next/link"
import { ArrowLeft, ChevronDown } from "lucide-react"
import type { Artist } from "@/lib/artists"
import type { ArtistDirectoryFilterOption } from "@/lib/artist-directory"
import { artistIndexCityHref, artistIndexGenreHref, buildArtistDirectoryHref } from "@/lib/artist-directory"
import { chartListArtists } from "@/lib/artist-index/chart-list"
import type { HubCity } from "@/lib/artist-index/hub-data"
import { DEFAULT_CHART_SIZE, INDEX_CHART_SIZES, type ChartSize } from "@/lib/chart-size"
import { signalNarrow } from "@/lib/fonts/signal"
import { cn } from "@/lib/utils"
import { ArtistDirectoryGrid } from "@/components/artists/ArtistDirectoryGrid"
import { ArtistIndexControls } from "@/components/artists/ArtistIndexControls"
import { artistPageContainer } from "@/components/artists/artist-layout"
import { ArtistDetailEyebrow, ArtistDetailHeading } from "@/components/artists/detail/ArtistDetailSection"
import { ArtistIndexClaimBand } from "@/components/artists/index/ArtistIndexClaimBand"
import { ArtistIndexRosterNav } from "@/components/artists/index/ArtistIndexRosterNav"
import { ArtistIndexScenes } from "@/components/artists/index/ArtistIndexScenes"
import type { ChartList } from "@/lib/artist-index/chart-list"
import { ArtistCitySceneTeaser } from "@/components/artists/ArtistCitySceneTeaser"

const SOUNDS = [
  { slug: "hip-hop", label: "Hip-Hop" },
  { slug: "rap", label: "Rap" },
  { slug: "trap", label: "Trap" },
  { slug: "drill", label: "Drill" },
]

type ArtistCollectionViewProps = {
  kind: "city" | "genre"
  slug: string
  label: string
  /** SEO headline; rendered as the h1 with the label on its own line. */
  headline: string
  description: string
  filterId: string
  filterOptions: ArtistDirectoryFilterOption[]
  directory: {
    pageArtists: Artist[]
    artistCount: number
    totalMatches: number
    currentPage: number
    totalPages: number
    hasMore: boolean
  }
  paginationHref: (page: number) => string
  chartList?: ChartList | null
  /** `null` is All. A size filters this page's roster to that chart slice. */
  chartSize?: ChartSize | null
  scenes: HubCity[]
  /** Genres with at least one artist; empty sounds are left out of the genre nav. */
  genreSlugs?: string[]
  faqItems?: readonly { question: string; answer: string }[]
}

/** City / genre landing: dark masthead, roster grid, more scenes, claim band. */
export function ArtistCollectionView({
  kind,
  slug,
  label,
  headline,
  description,
  filterId,
  filterOptions,
  directory,
  paginationHref,
  chartList = null,
  chartSize = null,
  scenes,
  genreSlugs,
  faqItems,
}: ArtistCollectionViewProps) {
  const sounds = genreSlugs ? SOUNDS.filter((sound) => genreSlugs.includes(sound.slug)) : SOUNDS
  const rest = headline.toLowerCase().startsWith(label.toLowerCase())
    ? headline.slice(label.length).trim()
    : headline
  const isFirstPage = directory.currentPage === 1
  const otherScenes = scenes.filter((city) => city.slug !== slug)
  const pageHref = (size?: ChartSize) =>
    kind === "city" ? artistIndexCityHref(slug, undefined, size) : artistIndexGenreHref(slug, undefined, size)
  const showingChart = Boolean(chartList && chartSize)

  return (
    <div className={cn(signalNarrow.variable, "text-[#0B0B0C]")}>
      <section className="relative isolate overflow-hidden bg-[#0B0B0C] text-[#F4F1EA]">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_10%_0%,rgba(232,25,44,0.24),transparent_50%),radial-gradient(ellipse_at_95%_100%,rgba(242,198,98,0.08),transparent_45%)]"
          aria-hidden
        />
        <div className="mood-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay" aria-hidden />

        <div className={artistPageContainer}>
          <div className="grid gap-10 pb-14 pt-8 sm:pb-16 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-end lg:gap-16 lg:pb-20 lg:pt-12 2xl:grid-cols-[minmax(0,1fr)_460px] 2xl:gap-24">
            <div className="artist-rise min-w-0">
              <Link
                href={buildArtistDirectoryHref({})}
                className="group -ml-1 mb-7 inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 text-xs font-semibold text-white/55 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
                Artist Index
              </Link>
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/50 sm:text-[11px]">
                Hiffi Artist Index — {kind === "city" ? "Scene" : "Sound"}
              </p>
              <h1 className="font-signal mt-6 break-words font-bold uppercase leading-[0.86] tracking-[-0.005em]">
                <span className="block text-[length:clamp(3.5rem,10vw,9.5rem)]">{label}</span>
                {rest ? (
                  <span className="mt-2 block text-[length:clamp(1.75rem,3.6vw,3.25rem)] text-white/35">{rest}</span>
                ) : null}
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-7 text-white/60 sm:text-base">{description}</p>

              <div className="mt-8 max-w-2xl">
                <ArtistIndexControls
                  initialQuery=""
                  initialActiveFilterIds={[filterId]}
                  filterOptions={filterOptions}
                  variant="hub"
                  tone="dark"
                  searchPlaceholder={`Search ${kind === "genre" ? label.toLowerCase() : label} artists`}
                />
              </div>

              {kind === "genre" && sounds.some((sound) => sound.slug !== slug) ? (
                <nav aria-label="Other sounds" className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">Sounds</span>
                  {sounds.map((sound) =>
                    sound.slug === slug ? (
                      <span
                        key={sound.slug}
                        aria-current="page"
                        className="rounded-full bg-[#F4F1EA] px-3.5 py-1.5 text-xs font-semibold text-[#0B0B0C]"
                      >
                        {sound.label}
                      </span>
                    ) : (
                      <Link
                        key={sound.slug}
                        href={artistIndexGenreHref(sound.slug)}
                        className="rounded-full border border-white/12 px-3.5 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/35 hover:text-white"
                      >
                        {sound.label}
                      </Link>
                    ),
                  )}
                </nav>
              ) : null}
            </div>

            {directory.totalMatches > 0 ? (
              <div className="artist-rise rounded-[26px] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-md [animation-delay:120ms] sm:p-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 sm:text-[11px]">
                  On the index
                </p>
                <p className="font-signal mt-4 text-[length:clamp(4rem,8vw,6.5rem)] font-bold leading-[0.85] tabular-nums">
                  {directory.totalMatches.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-white/55">
                  {label} {kind === "genre" ? "artists across every city" : "artists and counting"}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className={cn(artistPageContainer, "space-y-14 pb-16 pt-10 sm:space-y-24 sm:pb-20 sm:pt-20")}>
        <section aria-labelledby="artist-collection-roster">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <ArtistDetailEyebrow>The roster</ArtistDetailEyebrow>
              <ArtistDetailHeading id="artist-collection-roster">
                Every {kind === "genre" ? label.toLowerCase() : label} artist
              </ArtistDetailHeading>
            </div>
            <ArtistIndexRosterNav
              selected={chartSize}
              allHref={pageHref()}
              sizeHrefs={INDEX_CHART_SIZES.map((size) => ({ size, href: pageHref(size) }))}
            />
          </div>

          <div className="mt-10">
            {showingChart && chartList && chartSize ? (
              <ArtistDirectoryGrid
                artists={chartListArtists(chartList)}
                currentPage={chartList.page}
                totalPages={Math.max(1, Math.ceil(chartList.total / chartList.pageSize))}
                hasMore={false}
                totalMatches={chartList.total}
                artistCount={chartList.total}
                query=""
                activeFilterIds={[filterId]}
                paginationHref={(cpage) => {
                  const base = pageHref(chartSize)
                  if (cpage <= 1) return base
                  return base.includes("?") ? `${base}&cpage=${cpage}` : `${base}?cpage=${cpage}`
                }}
                compactHeader
                cardVariant="roster"
              />
            ) : (
              <ArtistDirectoryGrid
                artists={directory.pageArtists}
                currentPage={directory.currentPage}
                totalPages={directory.totalPages}
                hasMore={directory.hasMore}
                totalMatches={directory.totalMatches}
                artistCount={directory.artistCount}
                query=""
                activeFilterIds={[filterId]}
                paginationHref={paginationHref}
                compactHeader
                cardVariant="roster"
              />
            )}
          </div>
        </section>

        {kind === "city" && slug === "atlanta" ? (
          <ArtistCitySceneTeaser
            citySlug={slug}
            cityLabel={label}
            profileCount={directory.totalMatches}
          />
        ) : null}

        {isFirstPage ? (
          <ArtistIndexScenes
            cities={otherScenes}
            chartSize={chartSize ?? DEFAULT_CHART_SIZE}
            chartPage={{ kind, slug, page: directory.currentPage }}
            showChartSize={false}
            eyebrow={kind === "city" ? "More scenes" : "Scenes"}
            title={kind === "city" ? "Beyond " + label : `Where ${label.toLowerCase()} lives`}
          />
        ) : null}

        {faqItems && faqItems.length > 0 ? (
          <section
            aria-labelledby="collection-faq-heading"
            className="rounded-3xl border border-[#0B0B0C]/10 bg-white p-6 shadow-sm sm:p-10"
          >
            <div className="max-w-2xl">
              <ArtistDetailEyebrow>FAQ</ArtistDetailEyebrow>
              <ArtistDetailHeading id="collection-faq-heading">
                Frequently asked questions
              </ArtistDetailHeading>
              <p className="mt-2 text-sm text-[#77726A] sm:text-base">
                Answers about browsing, searching, and claiming {label} artist listings.
              </p>
            </div>

            <div className="mt-8 divide-y divide-[#0B0B0C]/10 border-t border-[#0B0B0C]/10">
              {faqItems.map((item) => (
                <details key={item.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="text-base font-semibold text-[#0B0B0C] transition-colors group-open:text-[#E8192C]">
                      {item.question}
                    </span>
                    <ChevronDown
                      className="mt-1 h-4 w-4 shrink-0 text-[#77726A] transition-transform duration-200 group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#3B3833] sm:text-[15px]">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <ArtistIndexClaimBand />
      </div>
    </div>
  )
}
