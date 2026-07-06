import type { Artist } from "@/lib/artists"
import { ARTIST_INDEX_FAQ, getArtistDisplayBio } from "@/lib/artist-directory-seo"
import { ARTIST_INDEX_PATH, getArtistCitySlug } from "@/lib/artist-directory"
import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"
import { buildBreadcrumbJsonLd } from "@/lib/seo/schema"

function artistSameAs(artist: Artist): string[] {
  return [artist.spotify_url, artist.ig_url, artist.yt_url, artist.tt_url, artist.fb_url].filter(
    (url): url is string => Boolean(url),
  )
}

export function buildArtistIndexBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return buildBreadcrumbJsonLd(items)
}

export function buildArtistIndexHubJsonLd(options?: {
  artists?: Artist[]
  pageUrl?: string
  pageName?: string
  pageDescription?: string
  totalItemCount?: number
  /** Use CollectionPage for city/genre listing surfaces. */
  pageType?: "WebPage" | "CollectionPage"
  breadcrumbs?: Array<{ name: string; url: string }>
  includeFaq?: boolean
  faqItems?: readonly { question: string; answer: string }[]
}) {
  const origin = getSiteOrigin()
  const pageUrl = options?.pageUrl ?? absoluteUrl(ARTIST_INDEX_PATH)
  const pageName = options?.pageName ?? "Hiffi Artist Index"
  const pageDescription =
    options?.pageDescription ??
    "Browse Atlanta hip-hop and rap artists on the Hiffi Artist Index. Search by artist name or filter by genre."
  const pageType = options?.pageType ?? "WebPage"
  const includeFaq = options?.includeFaq ?? true

  const listId = `${pageUrl}#artist-list`

  const graph: Record<string, unknown>[] = [
    {
      "@type": pageType,
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: pageName,
      description: pageDescription,
      inLanguage: "en",
      isPartOf: { "@id": `${origin}/#website` },
      publisher: { "@id": `${origin}/#organization` },
      ...(pageType === "CollectionPage" ? { mainEntity: { "@id": listId } } : {}),
    },
  ]

  if (includeFaq) {
    const faq = options?.faqItems ?? ARTIST_INDEX_FAQ
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    })
  }

  if (options?.artists?.length) {
    graph.push({
      "@type": "ItemList",
      "@id": listId,
      name: "Artist profiles",
      numberOfItems: options.totalItemCount ?? options.artists.length,
      itemListElement: options.artists.map((artist, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`${ARTIST_INDEX_PATH}/${artist.slug}`),
        name: artist.name,
      })),
    })
  }

  if (options?.breadcrumbs?.length) {
    graph.push(
      buildArtistIndexBreadcrumbJsonLd(options.breadcrumbs) as Record<string, unknown>,
    )
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  }
}

export function buildArtistProfileJsonLd(artist: Artist) {
  const profileUrl = absoluteUrl(`${ARTIST_INDEX_PATH}/${artist.slug}`)
  const origin = getSiteOrigin()
  const sameAs = artistSameAs(artist)
  const cityLabel = artist.city.split(",")[0]?.trim() || artist.city
  const displayBio = getArtistDisplayBio(artist)

  const musicGroup: Record<string, unknown> = {
    "@type": "MusicGroup",
    "@id": `${profileUrl}#music-group`,
    name: artist.name,
    url: profileUrl,
    genre: artist.genre,
    description: displayBio,
  }

  if (sameAs.length > 0) musicGroup.sameAs = sameAs
  if (artist.image) {
    musicGroup.image = {
      "@type": "ImageObject",
      url: artist.image,
    }
  }
  if (cityLabel) {
    musicGroup.foundingLocation = {
      "@type": "Place",
      name: artist.city,
    }
  }

  const profilePage: Record<string, unknown> = {
    "@type": "ProfilePage",
    "@id": `${profileUrl}#webpage`,
    url: profileUrl,
    name: `${artist.name} on Hiffi Artist Index`,
    inLanguage: "en",
    isPartOf: { "@id": `${origin}/#website` },
    mainEntity: { "@id": `${profileUrl}#music-group` },
    publisher: { "@id": `${origin}/#organization` },
    description: displayBio,
  }

  return {
    "@context": "https://schema.org",
    "@graph": [profilePage, musicGroup],
  }
}

export function buildArtistProfileBreadcrumbJsonLd(artist: Artist) {
  const citySlug = getArtistCitySlug(artist.city)
  const cityLabel = artist.city.split(",")[0]?.trim() || artist.city
  const primaryGenre = artist.genre[0]

  const items = [{ name: "Artist Index", url: absoluteUrl(ARTIST_INDEX_PATH) }]

  if (citySlug && cityLabel) {
    items.push({
      name: cityLabel,
      url: absoluteUrl(`${ARTIST_INDEX_PATH}/city/${citySlug}`),
    })
  }

  if (primaryGenre) {
    const genreSlug = primaryGenre
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
    if (genreSlug) {
      items.push({
        name: primaryGenre,
        url: absoluteUrl(`${ARTIST_INDEX_PATH}/genre/${genreSlug}`),
      })
    }
  }

  items.push({
    name: artist.name,
    url: absoluteUrl(`${ARTIST_INDEX_PATH}/${artist.slug}`),
  })

  return buildBreadcrumbJsonLd(items)
}
