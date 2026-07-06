import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { JsonLd } from "@/components/seo/json-ld"
import { ArtistCityScene } from "@/components/artists/ArtistCityScene"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import { artistIndexCityHref } from "@/lib/artist-directory"
import { ATLANTA_SCENE_PAGE_TITLE } from "@/lib/artist-index/city-seo-content"
import {
  buildArtistCityScenePageMetadata,
  getArtistCityPage,
} from "@/lib/artist-directory-seo"
import { resolveArtistDirectoryPage } from "@/lib/artists"
import { buildArtistIndexBreadcrumbJsonLd } from "@/lib/seo/artist-index-schema"
import { absoluteUrl } from "@/lib/seo/site"
import { ARTIST_INDEX_PATH } from "@/lib/artist-directory"

type ArtistCityScenePageProps = {
  params: Promise<{ citySlug: string }>
}

export async function generateStaticParams() {
  return [{ citySlug: "atlanta" }]
}

export async function generateMetadata({ params }: ArtistCityScenePageProps): Promise<Metadata> {
  const { citySlug } = await params
  const city = await getArtistCityPage(citySlug)
  if (!city || citySlug !== "atlanta") {
    return { title: "Scene Guide Not Found", robots: { index: false, follow: false } }
  }

  const directory = await resolveArtistDirectoryPage({
    activeFilterIds: [city.filterId],
    page: 1,
  })

  return buildArtistCityScenePageMetadata(citySlug, {
    profileCount: directory.totalMatches,
  })
}

export default async function ArtistCityScenePage({ params }: ArtistCityScenePageProps) {
  const { citySlug } = await params
  const city = await getArtistCityPage(citySlug)
  if (!city || citySlug !== "atlanta") notFound()

  const directory = await resolveArtistDirectoryPage({
    activeFilterIds: [city.filterId],
    page: 1,
  })

  const pageUrl = absoluteUrl(`${ARTIST_INDEX_PATH}/city/${citySlug}/scene`)
  const directoryUrl = absoluteUrl(artistIndexCityHref(citySlug))
  const countLabel =
    directory.totalMatches > 0 ? directory.totalMatches.toLocaleString() : "800"

  return (
    <ArtistDirectoryShell
      breadcrumbs={[
        { label: "Artist Index", href: ARTIST_INDEX_PATH },
        { label: city.label, href: artistIndexCityHref(citySlug) },
        { label: "Hip-hop scene" },
      ]}
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": `${pageUrl}#webpage`,
              url: pageUrl,
              name: ATLANTA_SCENE_PAGE_TITLE,
              description: `Guide to the Atlanta hip-hop scene — trap, drill, melodic rap, and underground ATL talent indexed on Hiffi.`,
              inLanguage: "en",
              isPartOf: { "@id": `${absoluteUrl("/")}#website` },
              about: {
                "@type": "Place",
                name: "Atlanta, Georgia",
                description: "Atlanta hip-hop and rap music scene",
              },
              mainEntity: { "@id": `${directoryUrl}#webpage` },
            },
            buildArtistIndexBreadcrumbJsonLd([
              { name: "Artist Index", url: absoluteUrl(ARTIST_INDEX_PATH) },
              { name: city.label, url: directoryUrl },
              { name: "Hip-hop scene", url: pageUrl },
            ]),
          ],
        }}
      />

      <div className="mx-auto max-w-3xl space-y-8 pb-4">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Scene guide
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Atlanta hip-hop &amp; rap scene
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Context on the ATL hip-hop market — trap, drill, underground talent, and how Hiffi
            indexes {countLabel}+ artist profiles.{" "}
            <Link
              href={artistIndexCityHref(citySlug)}
              className="font-semibold text-[#E8192C] underline-offset-2 hover:underline"
            >
              Browse the full Atlanta directory
            </Link>
            .
          </p>
        </header>

        <ArtistCityScene
          citySlug={citySlug}
          cityLabel={city.label}
          profileCount={directory.totalMatches}
          asPage
        />

        <div className="rounded-2xl border border-[#E8192C]/20 bg-[#E8192C]/5 px-5 py-5 sm:px-6">
          <p className="text-sm font-semibold text-foreground">
            Browse {countLabel}+ Atlanta artist profiles
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Search by name, explore subgenres, and claim your listing on the Hiffi Artist Index.
          </p>
          <Link
            href={artistIndexCityHref(citySlug)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#E8192C] transition-colors hover:text-[#d01528]"
          >
            Open Atlanta artist directory
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </ArtistDirectoryShell>
  )
}
