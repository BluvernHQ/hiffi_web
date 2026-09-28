import type { Metadata } from "next"
import { JsonLd } from "@/components/seo/json-ld"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { artistPageContainer } from "@/components/artists/artist-layout"
import { ArtistIndexClaimBand } from "@/components/artists/index/ArtistIndexClaimBand"
import { TopChartBoard, type ChartCity } from "@/components/top-artists/premium/TopChartBoard"
import { TopChartDrawerProvider } from "@/components/top-artists/premium/TopChartDrawer"
import { TopChartMasthead } from "@/components/top-artists/premium/TopChartMasthead"
import { TopChartMethod } from "@/components/top-artists/premium/TopChartMethod"
import { TopChartMovers } from "@/components/top-artists/premium/TopChartMovers"
import { formatChartWeek } from "@/components/top-artists/premium/chart-format"
import { signalNarrow } from "@/lib/fonts/signal"
import { absoluteUrl } from "@/lib/seo/site"
import { getTopChartSnapshot, isChartMode, loadChartPage, withChartStats, type ChartMode } from "@/lib/top-chart"
import {
  enrichTopArtistsWithImages,
  fetchTopArtistsServer,
  fetchTopCitiesServer,
  fetchTopRisersServer,
  resolveTopCity,
  riserToTopArtist,
  type RisersWindow,
  type TopArtist,
} from "@/lib/top-artists"
import { cn } from "@/lib/utils"
import { DEFAULT_SHARE_SCOPE, chartModeLabel, type ChartShareScope } from "@/lib/top-chart-share"

export const dynamic = "force-dynamic"

const TITLE = "Hiffi Hip-Hop 500 — Live Signal Index"
const DESCRIPTION = "Live movement signals across the 500 biggest hip-hop artists — ranked by YouTube and Instagram."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/top-artists") },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/top-artists"),
    siteName: "Hiffi",
    type: "website",
    images: [{ url: absoluteUrl("/top-artists/share/og-default"), width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [absoluteUrl("/top-artists/share/og-default")],
  },
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined): string {
  return String(Array.isArray(value) ? (value[0] ?? "") : (value ?? "")).trim()
}

const MOVERS_COUNT = 4

export default async function TopArtistsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const modeParam = firstParam(sp.mode)
  const mode: ChartMode = isChartMode(modeParam) ? modeParam : "overall"
  const windowDays: RisersWindow = firstParam(sp.window) === "30" ? 30 : 7
  const cityParam = firstParam(sp.city) || firstParam(sp.location)
  const artistParam = firstParam(sp.artist).toLowerCase().replace(/^@+/, "")

  const citiesResponse = await fetchTopCitiesServer()
  const rawCities = citiesResponse?.items ?? []
  const cities: ChartCity[] = rawCities
    .filter((city) => city.ranked_count > 0 && (city.id || city.location))
    .sort((a, b) => b.ranked_count - a.ranked_count)
    .map((city) => ({
      key: city.id ?? city.location,
      id: city.id,
      location: city.id ? null : city.location,
      label: city.label,
      rankedCount: city.ranked_count,
    }))

  const resolvedCity = mode === "overall" && cityParam ? resolveTopCity(rawCities, cityParam) : null
  const initialCity = resolvedCity
    ? (cities.find((city) => city.key === (resolvedCity.city.id ?? resolvedCity.city.location)) ?? null)
    : null
  const isDefaultBoard = mode === "overall" && !resolvedCity

  const [board, overallTop, risers] = await Promise.all([
    loadChartPage({ mode, city: resolvedCity?.query ?? null, window: windowDays }, 0),
    isDefaultBoard ? Promise.resolve(null) : fetchTopArtistsServer(3, 0),
    fetchTopRisersServer({ window: 7, limit: MOVERS_COUNT }),
  ])

  const podium = (isDefaultBoard ? board?.items : overallTop?.items)?.slice(0, 3) ?? []
  const totalRanked = (isDefaultBoard ? board?.total : overallTop?.total_ranked) ?? 0
  const movers =
    risers?.has_history && risers.items.length > 0
      ? await enrichTopArtistsWithImages(await withChartStats(risers.items.slice(0, MOVERS_COUNT).map(riserToTopArtist)))
      : []

  let initialArtist: TopArtist | null = null
  if (artistParam) {
    const matches = (artist: TopArtist) => artist.username.toLowerCase() === artistParam
    initialArtist = board?.items.find(matches) ?? podium.find(matches) ?? null
    if (!initialArtist) {
      const hit = (await getTopChartSnapshot()).get(artistParam)
      if (hit) [initialArtist] = await enrichTopArtistsWithImages([hit])
    }
  }

  const onBoard = Boolean(initialArtist && board?.items.some((artist) => artist.username === initialArtist?.username))
  const initialScope: ChartShareScope = onBoard
    ? {
        mode,
        cityKey: initialCity?.key ?? null,
        cityLabel: initialCity?.label ?? null,
        window: windowDays,
      }
    : DEFAULT_SHARE_SCOPE
  const initialContext = !onBoard
    ? "Hiffi Hip-Hop 500"
    : initialCity
      ? `${initialCity.label} chart`
      : mode === "overall"
        ? "Hiffi Hip-Hop 500"
        : chartModeLabel(mode)

  const chartWeek = formatChartWeek(podium[0]?.ranking?.updated_at ?? citiesResponse?.updated_at)

  const jsonLd =
    isDefaultBoard && board && board.items.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: TITLE,
          description: DESCRIPTION,
          url: absoluteUrl("/top-artists"),
          numberOfItems: board.total ?? board.items.length,
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          itemListElement: board.items.map((artist) => ({
            "@type": "ListItem",
            position: artist.rank,
            name: artist.artist_name,
            url: absoluteUrl(`/artist-index/${artist.username}`),
          })),
        }
      : null

  return (
    <ArtistDirectoryShell claimLabel="Claim Now" bleed tone="ink">
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <div className={cn(signalNarrow.variable, "text-[#F4F1EA] [color-scheme:dark]")}>
        <TopChartDrawerProvider
          initialArtist={initialArtist}
          initialContext={initialContext}
          initialScope={initialScope}
        >
          <TopChartMasthead podium={podium} chartWeek={chartWeek} totalRanked={totalRanked} cityCount={cities.length} />

          <div className={cn(artistPageContainer, "space-y-20 pb-16 pt-12 sm:space-y-28 sm:pb-20 sm:pt-20")}>
            <TopChartBoard
              key={`${mode}:${initialCity?.key ?? ""}:${windowDays}`}
              initialMode={mode}
              initialCity={initialCity}
              initialWindow={windowDays}
              initialPage={board}
              cities={cities}
            />
            <TopChartMovers movers={movers} />
            <TopChartMethod />
            <div>
              <ArtistIndexClaimBand className="ring-1 ring-white/10" />
              <p className="mt-8 text-center text-xs leading-5 text-white/40">
                Independent index. Not affiliated with YouTube or Instagram. Figures may lag the platforms.
              </p>
            </div>
          </div>
        </TopChartDrawerProvider>
      </div>
    </ArtistDirectoryShell>
  )
}
