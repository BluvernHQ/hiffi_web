import Link from "next/link"
import type { Artist } from "@/lib/artists"
import type { ArtistDirectoryFilterOption } from "@/lib/artist-directory"
import { artistIndexCityHref, artistIndexGenreHref, ARTIST_INDEX_CLAIM_PATH } from "@/lib/artist-directory"
import { ArtistIndexControls } from "@/components/artists/ArtistIndexControls"
import { ArtistIndexIntro } from "@/components/artists/ArtistIndexIntro"
import { ArtistRow } from "@/components/artists/ArtistRow"
import { artistPanelShell } from "@/components/artists/artist-styles"
import { cn } from "@/lib/utils"

type ArtistIndexHubLandingProps = {
  artistCount: number
  introDescription: string
  filterOptions: ArtistDirectoryFilterOption[]
  previewArtists: Artist[]
}

export function ArtistIndexHubLanding({
  artistCount,
  introDescription,
  filterOptions,
  previewArtists,
}: ArtistIndexHubLandingProps) {
  const cityFilters = filterOptions
    .filter((filter) => filter.kind === "city")
    .sort((a, b) => b.count - a.count)
  const genreFilters = filterOptions
    .filter((filter) => filter.kind === "genre")
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const primaryCity = cityFilters[0]
  const singleCityFocus = cityFilters.length === 1 && primaryCity?.slug
  const hubFilterOptions = singleCityFocus
    ? filterOptions.filter((filter) => filter.kind !== "city")
    : filterOptions

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <ArtistIndexIntro
          artistCount={artistCount}
          description={introDescription}
          compact={false}
        />
        <p className="shrink-0 text-sm font-medium text-muted-foreground sm:text-right">
          {artistCount.toLocaleString()} profiles indexed
        </p>
      </div>

      <ArtistIndexControls
        initialQuery=""
        initialActiveFilterIds={[]}
        filterOptions={hubFilterOptions}
      />

      {singleCityFocus && primaryCity ? (
        <section
          aria-labelledby="hub-atlanta-heading"
          className={cn(
            artistPanelShell,
            "border border-primary/20 bg-primary/[0.03] p-5 sm:p-6",
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Now indexing</p>
          <h2 id="hub-atlanta-heading" className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {primaryCity.count.toLocaleString()}+ {primaryCity.label} hip-hop & rap artists
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The full browsable directory — scene guide, new profiles, genre filters, and claimable
            listings — lives on the {primaryCity.label} page.
          </p>
          <Link
            href={artistIndexCityHref(primaryCity.slug!)}
            className="mt-5 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Browse {primaryCity.label} artists →
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Already found your listing?{" "}
            <Link href={ARTIST_INDEX_CLAIM_PATH} className="font-semibold text-primary hover:underline">
              Claim your profile
            </Link>
          </p>
        </section>
      ) : cityFilters.length > 1 ? (
        <section aria-labelledby="hub-cities-heading">
          <h2 id="hub-cities-heading" className="text-xl font-bold tracking-tight text-foreground">
            Browse by city
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Each city page has scene context, filters, and the full local artist directory.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {cityFilters.map((city) => (
              <Link
                key={city.id}
                href={artistIndexCityHref(city.slug!)}
                className={cn(
                  artistPanelShell,
                  "group border border-border bg-background p-5 transition-colors hover:border-primary/40",
                  primaryCity?.id === city.id && "ring-1 ring-primary/20",
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {primaryCity?.id === city.id ? "Featured market" : "City directory"}
                </p>
                <h3 className="mt-2 text-lg font-bold text-foreground group-hover:text-primary">
                  {city.label}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {city.count.toLocaleString()} hip-hop & rap profiles
                </p>
                <span className="mt-4 inline-flex text-sm font-semibold text-primary">
                  Open {city.label} directory →
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {genreFilters.length > 0 ? (
        <section aria-labelledby="hub-genres-heading">
          <h2 id="hub-genres-heading" className="text-xl font-bold tracking-tight text-foreground">
            Browse by genre
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {genreFilters.map((genre) => (
              <Link
                key={genre.id}
                href={artistIndexGenreHref(genre.slug!)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {genre.label}
                <span className="ml-1.5 text-muted-foreground">({genre.count.toLocaleString()})</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {previewArtists.length > 0 ? (
        <section
          aria-labelledby="hub-preview-heading"
          className={cn(artistPanelShell, "border border-border bg-muted/10 px-4 py-5 sm:px-6")}
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="hub-preview-heading" className="text-lg font-bold tracking-tight text-foreground">
                Recently indexed
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {singleCityFocus && primaryCity
                  ? `New ${primaryCity.label} profiles — browse the full directory for every artist.`
                  : "A preview of new profiles — open a city directory for the full list."}
              </p>
            </div>
            {primaryCity ? (
              <Link
                href={artistIndexCityHref(primaryCity.slug!)}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Browse all {primaryCity.label} artists →
              </Link>
            ) : null}
          </div>
          <ul className="mt-4 divide-y divide-border/70">
            {previewArtists.map((artist) => (
              <li key={artist.slug}>
                <ArtistRow artist={artist} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
