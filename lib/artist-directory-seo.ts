import type { Metadata } from "next"
import type { Artist } from "@/lib/artists"
import { getArtistDirectoryFilters } from "@/lib/artists"
import {
  ARTIST_INDEX_PATH,
  artistIndexCityHref,
  artistIndexCitySceneHref,
  artistIndexGenreHref,
  buildArtistDirectoryHref,
  getArtistCitySlug,
  getArtistImageUrl,
  slugifyArtistDirectorySegment,
} from "@/lib/artist-directory"
import {
  ATLANTA_SCENE_KEYWORDS,
  ATLANTA_SCENE_PAGE_TITLE,
  buildAtlantaScenePageDescription,
} from "@/lib/artist-index/city-seo-content"
import { absoluteUrl } from "@/lib/seo/site"
import { truncateMetaDescription } from "@/lib/seo/meta"

/** Visible H1 on /artist-index (plain text for JSON-LD). */
export const ARTIST_INDEX_HUB_HEADLINE = "Discover Atlanta's emerging hip-hop & rap artists"

/** `<title>` for clean /artist-index (layout appends " | Hiffi"). */
export const ARTIST_INDEX_HUB_META_TITLE = "Atlanta Hip-Hop & Rap Artists"

/** @deprecated Use ARTIST_INDEX_HUB_META_TITLE or ARTIST_INDEX_HUB_HEADLINE. */
export const ARTIST_INDEX_HUB_TITLE = ARTIST_INDEX_HUB_META_TITLE

export const ARTIST_INDEX_HUB_DESCRIPTION =
  "Search the Hiffi Artist Index — claimable hip-hop and rap profiles by city and genre. Atlanta is our first indexed market. Find, claim, or suggest edits."

export function buildArtistIndexHubDescription(artistCount?: number): string {
  const countClause =
    artistCount != null && artistCount > 0
      ? ` ${artistCount.toLocaleString()}+ artists indexed, Atlanta first.`
      : " Atlanta is our first indexed market."
  return truncateMetaDescription(
    `Search the Hiffi Artist Index — claimable hip-hop and rap profiles by city and genre.${countClause} Find, claim, or suggest edits.`,
  )
}

/** Definitive Atlanta city-page description (distinct from hub directory copy). */
export function buildAtlantaCityPageDescription(artistCount?: number): string {
  const countPhrase =
    artistCount != null && artistCount > 0
      ? ` Browse ${artistCount.toLocaleString()}+ ATL trap, drill, and underground profiles.`
      : ""
  return truncateMetaDescription(
    `Atlanta hip-hop and rap artists on Hiffi — the definitive ATL scene directory.${countPhrase} Claim your listing or explore emerging talent.`,
  )
}

export type ArtistCityPage = {
  slug: string
  label: string
  filterId: string
  headline: string
  description: string
  keywords: string[]
}

export type ArtistGenrePage = {
  slug: string
  label: string
  filterId: string
  headline: string
  description: string
  keywords: string[]
}

function buildCityPage(filter: Awaited<ReturnType<typeof getArtistDirectoryFilters>>[number]): ArtistCityPage {
  const isAtlanta = filter.slug === "atlanta"

  return {
    slug: filter.slug,
    label: filter.label,
    filterId: filter.id,
    headline: isAtlanta ? "Atlanta hip-hop & rap artists" : `${filter.label} hip-hop & rap artists`,
    description: isAtlanta
      ? buildAtlantaCityPageDescription(filter.count)
      : `Discover emerging hip-hop and rap artists from ${filter.label} on the Hiffi Artist Index. Browse claimable profiles, official links, and similar artists in the ${filter.label} scene.`,
    keywords: [
      `${filter.label} rap artists`,
      `${filter.label} hip-hop artists`,
      `${filter.label} rapper directory`,
      `emerging ${filter.label} artists`,
      `claim ${filter.label} artist profile`,
      ...(isAtlanta
        ? [
            "Atlanta hip-hop and rap artists",
            "Atlanta hip-hop artists",
            "Atlanta rap artists",
            "Atlanta hip-hop scene",
            "ATL rap artists",
            "Atlanta rapper directory",
            "underground Atlanta rap",
          ]
        : []),
    ],
  }
}

function buildGenrePage(filter: Awaited<ReturnType<typeof getArtistDirectoryFilters>>[number]): ArtistGenrePage {
  const genreLabel = filter.label.toLowerCase()

  // Genre filters span the full inventory; today that inventory is Atlanta-only (flagship market).
  // TODO(city-expand): Make headline city-aware when a second city is indexed — e.g. "{City} {genre} artists".
  return {
    slug: filter.slug,
    label: filter.label,
    filterId: filter.id,
    headline: `Atlanta ${genreLabel} artists`,
    description: `Browse ${filter.count.toLocaleString()}+ Atlanta ${genreLabel} artists on the Hiffi Artist Index. Search by artist name.`,
    keywords: [
      `Atlanta ${genreLabel} artists`,
      "Atlanta hip-hop and rap artists",
      `${genreLabel} artist directory`,
      `independent Atlanta ${genreLabel} artists`,
      `claim ${genreLabel} artist profile`,
    ],
  }
}

export async function getArtistCityPages(): Promise<ArtistCityPage[]> {
  return (await getArtistDirectoryFilters())
    .filter((filter) => filter.kind === "city" && filter.count > 0)
    .map(buildCityPage)
}

export async function getArtistGenrePages(): Promise<ArtistGenrePage[]> {
  return (await getArtistDirectoryFilters())
    .filter((filter) => filter.kind === "genre" && filter.count > 0)
    .map(buildGenrePage)
}

export const ARTIST_INDEX_FAQ = [
  {
    question: "What is the Hiffi Artist Index?",
    answer:
      "The Hiffi Artist Index is a searchable hip-hop and rap artist directory — browse by city, filter by genre, and open claimable profiles. Each listing lets artists verify links, update details, and connect fans to music videos on Hiffi. Atlanta is the first indexed market; the hub is built to expand city by city.",
  },
  {
    question: "How many artists are listed in the Hiffi Artist Index?",
    answer:
      "The Hiffi Artist Index currently lists 800+ hip-hop and rap artist profiles, with Atlanta as the first indexed market. The directory grows as artists claim profiles and Hiffi expands to new U.S. hip-hop scenes — think of it as a living rapper directory, not a static spreadsheet.",
  },
  {
    question: "How do I find Atlanta rap artists on Hiffi?",
    answer:
      "Visit the Atlanta artist directory at hiffi.com/artist-index/city/atlanta to browse 800+ hip-hop and rap profiles from the Atlanta scene. You can also start at hiffi.com/artist-index and filter by city or genre if you are comparing scenes or looking for a specific ATL subgenre.",
  },
  {
    question: "How do I claim my artist profile?",
    answer:
      "Visit hiffi.com/artist-index/claim to search your stage name, open your profile, and select Claim your profile. After verification, you can update your links, suggest edits, and upload music videos on Hiffi. Claiming is free and does not auto-publish your catalog.",
  },
  {
    question: "Is the Artist Index only for Atlanta artists?",
    answer:
      "Atlanta is the flagship market in the index, with 800+ profiles indexed today. Hiffi is expanding city-by-city across U.S. hip-hop and rap scenes as more artists claim profiles and upload content — the hub at /artist-index covers the full directory concept, not just one city page.",
  },
  {
    question: "Can fans suggest corrections to a profile?",
    answer:
      "Yes. Anyone can suggest edits on an artist profile. Suggestions are reviewed by the Hiffi team before changes go live to keep listings accurate and trustworthy.",
  },
  {
    question: "Does claiming a profile upload my music automatically?",
    answer:
      "No. Claiming verifies your identity and unlocks profile controls. Artists still upload videos and content directly to Hiffi after claiming.",
  },
] as const

export async function getArtistCityPage(slug: string): Promise<ArtistCityPage | undefined> {
  return (await getArtistCityPages()).find((page) => page.slug === slug)
}

export async function getArtistGenrePage(slug: string): Promise<ArtistGenrePage | undefined> {
  return (await getArtistGenrePages()).find((page) => page.slug === slug)
}

/** Hub search/filter/pagination URLs are utility views — keep them out of the index. */
export function shouldNoindexArtistIndexHubParams(options: {
  query?: string
  activeFilterIds?: string[]
  page?: number
}): boolean {
  const { query = "", activeFilterIds = [], page = 1 } = options
  return Boolean(query.trim()) || activeFilterIds.length > 0 || page > 1
}

function buildArtistIndexMetadata(opts: {
  title: string
  description: string
  path: string
  keywords?: string[]
  page?: number
  totalPages?: number
  index?: boolean
  ogImageUrl?: string
  ogImageAlt?: string
}): Metadata {
  const {
    title,
    description,
    path,
    keywords,
    page = 1,
    index = true,
    ogImageUrl = absoluteUrl("/hiffi_logo.png"),
    ogImageAlt = "Hiffi Artist Index",
  } = opts
  const pageSuffix = page > 1 ? ` — Page ${page}` : ""
  const fullTitle = `${title}${pageSuffix}`
  const url = absoluteUrl(path)
  const ogImage = { url: ogImageUrl, alt: ogImageAlt }

  return {
    title: fullTitle,
    description: truncateMetaDescription(description),
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: url },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" as const },
        }
      : { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: "Hiffi",
      title: `${fullTitle} | Hiffi`,
      description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${fullTitle} | Hiffi`,
      description,
      images: [ogImageUrl],
    },
  }
}

export async function buildArtistIndexHubMetadata(options?: {
  query?: string
  activeFilterIds?: string[]
  page?: number
  totalPages?: number
  totalMatches?: number
  artistCount?: number
}): Promise<Metadata> {
  const {
    query,
    activeFilterIds = [],
    page = 1,
    totalPages = 1,
    totalMatches,
    artistCount,
  } = options ?? {}

  const isCleanHub =
    !query && activeFilterIds.length === 0 && page === 1

  if (isCleanHub) {
    return buildArtistIndexMetadata({
      title: ARTIST_INDEX_HUB_META_TITLE,
      description: buildArtistIndexHubDescription(artistCount),
      path: ARTIST_INDEX_PATH,
      keywords: [
        "Atlanta hip-hop and rap artists",
        "Atlanta hip-hop artists",
        "Atlanta rap artists",
        "Hiffi artist index",
        "hip-hop artist directory",
        "rap artist directory",
        "ATL rap directory",
        "claim artist profile",
        "independent hip-hop",
        "underground rap artists",
      ],
    })
  }

  const parts: string[] = []
  if (query) parts.push(`"${query}"`)
  const filters = await getArtistDirectoryFilters()
  for (const filterId of activeFilterIds) {
    const filter = filters.find((entry) => entry.id === filterId)
    if (filter) parts.push(filter.label)
  }

  const filterLabel = parts.length > 0 ? parts.join(", ") : "All artists"
  const matchNote =
    totalMatches != null ? ` ${totalMatches.toLocaleString()} profiles match.` : ""

  return buildArtistIndexMetadata({
    title: `${filterLabel} — Artist Index`,
    description: `Browse ${filterLabel.toLowerCase()} on the Hiffi Artist Index.${matchNote} Claim your profile or suggest edits to keep listings accurate.`,
    path: buildArtistDirectoryHref({ query, activeFilterIds, page }),
    page,
    totalPages,
    index: false,
  })
}

export function buildArtistCityPageMetadata(
  city: ArtistCityPage,
  options?: { page?: number; totalPages?: number; totalMatches?: number },
): Metadata {
  const { page = 1, totalPages = 1, totalMatches } = options ?? {}
  const matchNote =
    totalMatches != null
      ? ` ${totalMatches.toLocaleString()} ${city.label} profiles listed.`
      : ""

  return buildArtistIndexMetadata({
    title: city.headline,
    description: `${city.description}${matchNote}`,
    path: artistIndexCityHref(city.slug, page > 1 ? page : undefined),
    keywords: city.keywords,
    page,
    totalPages,
  })
}

export function buildArtistCityScenePageMetadata(
  citySlug: string,
  options?: { profileCount?: number },
): Metadata {
  if (citySlug !== "atlanta") {
    return { title: "Scene Guide Not Found", robots: { index: false, follow: false } }
  }

  return buildArtistIndexMetadata({
    title: ATLANTA_SCENE_PAGE_TITLE,
    description: buildAtlantaScenePageDescription(options?.profileCount),
    path: artistIndexCitySceneHref(citySlug),
    keywords: [...ATLANTA_SCENE_KEYWORDS],
  })
}

export function buildArtistGenrePageMetadata(
  genre: ArtistGenrePage,
  options?: { page?: number; totalPages?: number; totalMatches?: number },
): Metadata {
  const { page = 1, totalPages = 1, totalMatches } = options ?? {}
  const matchNote =
    totalMatches != null ? ` ${totalMatches.toLocaleString()} profiles listed.` : ""

  return buildArtistIndexMetadata({
    title: genre.headline,
    description: `${genre.description}${matchNote}`,
    path: artistIndexGenreHref(genre.slug, page > 1 ? page : undefined),
    keywords: genre.keywords,
    page,
    totalPages,
  })
}

export function buildArtistProfileFallbackBio(artist: Artist): string {
  const cityLabel = artist.city.split(",")[0]?.trim() || artist.city
  const genres =
    artist.genre.length > 0 ? artist.genre.join(", ").toLowerCase() : "hip-hop"

  return `${artist.name} is a ${genres} artist from ${cityLabel} on the Hiffi Artist Index. Browse official links, claim this profile, and watch music videos on Hiffi.`
}

export function getArtistDisplayBio(artist: Artist): string {
  const trimmed = artist.bio?.trim()
  return trimmed || buildArtistProfileFallbackBio(artist)
}

export function buildArtistProfileMetadata(artist: Artist): Metadata {
  const genres = artist.genre.join(", ")
  const cityLabel = artist.city.split(",")[0]?.trim() || artist.city
  const displayBio = getArtistDisplayBio(artist)
  const statusNote = artist.verified
    ? "Verified on Hiffi."
    : artist.claim_status === "unclaimed"
      ? "Unclaimed profile — artists can claim and verify this listing."
      : "Claim pending review."

  const artistImage = getArtistImageUrl(artist.image)

  return buildArtistIndexMetadata({
    title: `${artist.name} — ${cityLabel} ${genres} Artist`,
    description: displayBio.slice(0, 155) || `${artist.name} on the Hiffi Artist Index — ${cityLabel} ${genres} artist. ${statusNote}`,
    path: `${ARTIST_INDEX_PATH}/${artist.slug}`,
    keywords: [
      artist.name,
      ...artist.genre,
      cityLabel,
      "Hiffi artist",
      "claim artist profile",
      `${cityLabel} rap artist`,
    ],
    ogImageUrl: artistImage ?? absoluteUrl("/hiffi_logo.png"),
    ogImageAlt: `${artist.name} — Hiffi Artist Index`,
  })
}

/** Resolve breadcrumb items for an artist profile (city + primary genre when available). */
export function buildArtistProfileBreadcrumbs(artist: Artist): Array<{ label: string; href?: string }> {
  const citySlug = getArtistCitySlug(artist.city)
  const cityLabel = artist.city.split(",")[0]?.trim() || artist.city
  const primaryGenre = artist.genre[0]

  const items: Array<{ label: string; href?: string }> = [
    { label: "Artist Index", href: ARTIST_INDEX_PATH },
  ]

  if (citySlug && cityLabel) {
    items.push({ label: cityLabel, href: artistIndexCityHref(citySlug) })
  }

  if (primaryGenre) {
    const genreSlug = slugifyArtistDirectorySegment(primaryGenre)
    if (genreSlug) {
      items.push({ label: primaryGenre, href: artistIndexGenreHref(genreSlug) })
    }
  }

  items.push({ label: artist.name })
  return items
}
