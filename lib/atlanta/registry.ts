import { ATLANTA_BEST_OF } from "./best-of"
import { ATLANTA_ERAS } from "./eras"
import { ATLANTA_GENRES } from "./genres"
import { ATLANTA_STUDIOS } from "./studios"
import { ATLANTA_VENUES } from "./venues"
import type {
  AtlantaAdjacent,
  AtlantaBestOfPage,
  AtlantaCategory,
  AtlantaEraPage,
  AtlantaGenrePage,
  AtlantaPageMeta,
  AtlantaProfilePage,
} from "./types"

export const ATLANTA_CATEGORY_LABELS: Record<AtlantaCategory, string> = {
  genres: "Genres",
  "best-of": "Best-of",
  eras: "Eras",
  studios: "Studios",
  venues: "Venues",
}

export function atlantaCategoryHref(category: AtlantaCategory): string {
  return `/atlanta/${category}`
}

export function atlantaPageHref(category: AtlantaCategory, slug: string): string {
  return `/atlanta/${category}/${slug}`
}

export function getAtlantaGenres(): AtlantaGenrePage[] {
  return ATLANTA_GENRES
}

export function getAtlantaBestOf(): AtlantaBestOfPage[] {
  return ATLANTA_BEST_OF
}

export function getAtlantaEras(): AtlantaEraPage[] {
  return ATLANTA_ERAS
}

export function getAtlantaStudios(): AtlantaProfilePage[] {
  return ATLANTA_STUDIOS
}

export function getAtlantaVenues(): AtlantaProfilePage[] {
  return ATLANTA_VENUES
}

export function getAtlantaGenre(slug: string): AtlantaGenrePage | undefined {
  return ATLANTA_GENRES.find((page) => page.slug === slug)
}

export function getAtlantaBestOfPage(slug: string): AtlantaBestOfPage | undefined {
  return ATLANTA_BEST_OF.find((page) => page.slug === slug)
}

export function getAtlantaEra(slug: string): AtlantaEraPage | undefined {
  return ATLANTA_ERAS.find((page) => page.slug === slug)
}

export function getAtlantaStudio(slug: string): AtlantaProfilePage | undefined {
  return ATLANTA_STUDIOS.find((page) => page.slug === slug)
}

export function getAtlantaVenue(slug: string): AtlantaProfilePage | undefined {
  return ATLANTA_VENUES.find((page) => page.slug === slug)
}

export function atlantaGenreStaticParams(): { slug: string }[] {
  return ATLANTA_GENRES.map((page) => ({ slug: page.slug }))
}

export function atlantaBestOfStaticParams(): { slug: string }[] {
  return ATLANTA_BEST_OF.map((page) => ({ slug: page.slug }))
}

export function atlantaEraStaticParams(): { slug: string }[] {
  return ATLANTA_ERAS.map((page) => ({ slug: page.slug }))
}

export function atlantaStudioStaticParams(): { slug: string }[] {
  return ATLANTA_STUDIOS.map((page) => ({ slug: page.slug }))
}

export function atlantaVenueStaticParams(): { slug: string }[] {
  return ATLANTA_VENUES.map((page) => ({ slug: page.slug }))
}

function adjacentFromList(
  category: AtlantaCategory,
  pages: AtlantaPageMeta[],
  slug: string,
): AtlantaAdjacent {
  const index = pages.findIndex((page) => page.slug === slug)
  if (index < 0) return { prev: null, next: null }

  const prevPage = index > 0 ? pages[index - 1] : null
  const nextPage = index < pages.length - 1 ? pages[index + 1] : null

  return {
    prev: prevPage
      ? { slug: prevPage.slug, title: prevPage.title, href: atlantaPageHref(category, prevPage.slug) }
      : null,
    next: nextPage
      ? { slug: nextPage.slug, title: nextPage.title, href: atlantaPageHref(category, nextPage.slug) }
      : null,
  }
}

export function getAtlantaEraAdjacent(slug: string): AtlantaAdjacent {
  return adjacentFromList("eras", ATLANTA_ERAS, slug)
}

export function getAtlantaBestOfAdjacent(slug: string): AtlantaAdjacent {
  return adjacentFromList("best-of", ATLANTA_BEST_OF, slug)
}

/** All cluster paths for sitemap (hub, indexes, detail pages). */
export function getAllAtlantaSitemapPaths(): string[] {
  const paths = [
    "/atlanta",
    "/atlanta/genres",
    "/atlanta/best-of",
    "/atlanta/eras",
    "/atlanta/studios",
    "/atlanta/venues",
  ]

  for (const page of ATLANTA_GENRES) paths.push(atlantaPageHref("genres", page.slug))
  for (const page of ATLANTA_BEST_OF) paths.push(atlantaPageHref("best-of", page.slug))
  for (const page of ATLANTA_ERAS) paths.push(atlantaPageHref("eras", page.slug))
  for (const page of ATLANTA_STUDIOS) paths.push(atlantaPageHref("studios", page.slug))
  for (const page of ATLANTA_VENUES) paths.push(atlantaPageHref("venues", page.slug))

  return paths
}
