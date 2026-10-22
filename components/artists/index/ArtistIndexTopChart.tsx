import Link from "next/link"
import { ArtistPortrait } from "@/components/artists/detail/ArtistPortrait"
import { ArtistDetailEyebrow, ArtistDetailHeading } from "@/components/artists/detail/ArtistDetailSection"
import { artistIndexCityHref, artistIndexGenreHref, buildArtistDirectoryHref } from "@/lib/artist-directory"
import type { ChartList } from "@/lib/artist-index/chart-list"
import { INDEX_CHART_SIZES, type ChartSize } from "@/lib/chart-size"
import { cn } from "@/lib/utils"

type ArtistIndexTopChartProps = {
  chartSize: ChartSize
  list: ChartList
  /** City and genre pages keep the category on that page. The hub uses the index. */
  page?: { kind: "city" | "genre"; slug: string }
  tone?: "light" | "dark"
  className?: string
}

function categoryHref(size: ChartSize, page?: ArtistIndexTopChartProps["page"]) {
  if (page?.kind === "city") return artistIndexCityHref(page.slug, undefined, size)
  if (page?.kind === "genre") return artistIndexGenreHref(page.slug, undefined, size)
  return buildArtistDirectoryHref({ top: size })
}

function listPageHref(size: ChartSize, cpage: number) {
  const base = buildArtistDirectoryHref({ top: size })
  if (cpage <= 1) return base
  return base.includes("?") ? `${base}&cpage=${cpage}` : `${base}?cpage=${cpage}`
}

/** One ranked list for every chart category, the way a chart index repeats the same rows. */
export function ArtistIndexTopChart({
  chartSize,
  list,
  page,
  tone = "light",
  className,
}: ArtistIndexTopChartProps) {
  const dark = tone === "dark"
  const pageCount = Math.max(1, Math.ceil(list.total / list.pageSize))
  const place = (globalRank: number) => globalRank - list.start + 1

  return (
    <section aria-labelledby="artist-index-top-chart" className={className}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        {dark ? (
          <h2 id="artist-index-top-chart" className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/50 sm:text-[11px]">
            Top {chartSize.toLocaleString()}
          </h2>
        ) : (
          <div>
            <ArtistDetailEyebrow>Top charts</ArtistDetailEyebrow>
            <ArtistDetailHeading id="artist-index-top-chart">Top {chartSize.toLocaleString()}</ArtistDetailHeading>
          </div>
        )}
        {dark ? null : (
          <p className="text-sm text-[#77726A]">{list.total.toLocaleString()} artists</p>
        )}
      </div>

      <nav aria-label="Chart categories" className={cn("mt-4 flex flex-wrap gap-x-4 gap-y-2", dark && "mt-3")}>
        {INDEX_CHART_SIZES.map((size) => {
          const selected = size === chartSize
          return (
            <Link
              key={size}
              href={categoryHref(size, page)}
              scroll={false}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "text-sm font-semibold tabular-nums underline-offset-4",
                selected
                  ? dark
                    ? "text-[#F4F1EA] underline decoration-[#E8192C]"
                    : "text-[#0B0B0C] underline decoration-[#E8192C]"
                  : dark
                    ? "text-white/45 hover:text-white"
                    : "text-[#77726A] hover:text-[#0B0B0C]",
              )}
            >
              Top {size.toLocaleString()}
            </Link>
          )
        })}
      </nav>

      {list.items.length > 0 ? (
        <ol className={cn("mt-6 divide-y", dark ? "divide-white/10" : "mt-8 divide-[#0B0B0C]/10 border-t border-[#0B0B0C]/10")}>
          {list.items.map((artist) => (
            <li key={artist.username}>
              <Link
                href={`/artist-index/${encodeURIComponent(artist.username)}`}
                className="group grid grid-cols-[3rem_2.75rem_minmax(0,1fr)] items-center gap-3 py-3 sm:grid-cols-[3.5rem_3rem_minmax(0,1fr)] sm:gap-4"
              >
                <span
                  className={cn(
                    "font-signal text-right text-lg font-bold tabular-nums leading-none sm:text-2xl",
                    dark ? "text-white/80" : "text-[#0B0B0C]",
                  )}
                >
                  {place(artist.rank).toLocaleString()}
                </span>
                <ArtistPortrait
                  artist={{ name: artist.name, image: artist.image }}
                  decorative
                  className={cn("h-11 w-11 rounded-md sm:h-12 sm:w-12", dark ? "ring-1 ring-white/10" : "ring-1 ring-[#0B0B0C]/10")}
                />
                <span className="min-w-0">
                  <span className={cn("block truncate text-[15px] font-semibold", dark ? "text-[#F4F1EA]" : "text-[#0B0B0C]")}>
                    {artist.name}
                  </span>
                  {artist.place ? (
                    <span className={cn("mt-0.5 block truncate text-xs", dark ? "text-white/45" : "text-[#77726A]")}>
                      {artist.place}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className={cn("mt-6 text-sm", dark ? "text-white/50" : "text-[#77726A]")}>
          No artists in this chart.
        </p>
      )}

      {page ? null : pageCount > 1 ? (
        <nav aria-label="Chart pages" className="mt-6 flex items-center justify-between text-sm font-semibold">
          {list.page > 1 ? (
            <Link href={listPageHref(chartSize, list.page - 1)} className="text-[#0B0B0C] underline-offset-4 hover:underline">
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="font-normal text-[#77726A]">
            {list.page.toLocaleString()} of {pageCount.toLocaleString()}
          </span>
          {list.page < pageCount ? (
            <Link href={listPageHref(chartSize, list.page + 1)} className="text-[#0B0B0C] underline-offset-4 hover:underline">
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </section>
  )
}
