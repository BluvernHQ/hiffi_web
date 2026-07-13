export type AtlantaCategory = "genres" | "best-of" | "eras" | "studios" | "venues"

export type AtlantaPageMeta = {
  slug: string
  title: string
  description: string
  keywords?: string[]
}

export type AtlantaCrossLink = {
  label: string
  href: string
}

export type AtlantaCrossLinkGroup = {
  heading: string
  links: AtlantaCrossLink[]
}

export type AtlantaCatalogRef = {
  /** Display title for the entry */
  title: string
  /** Optional subtitle (artist, album, year) */
  subtitle?: string
  blurb?: string
  /** Artist Index profile slug when known */
  artistSlug?: string
  /** Watch page id when track is in catalog */
  watchId?: string
}

export type AtlantaRankedEntry = AtlantaCatalogRef & {
  rank: number
}

export type AtlantaContentSection = {
  heading: string
  paragraphs: string[]
}

export type AtlantaTimelineItem = {
  year: string
  label: string
}

export type AtlantaGenrePage = AtlantaPageMeta & {
  intro: string
  sections?: AtlantaContentSection[]
  crossLinks: AtlantaCrossLinkGroup[]
}

export type AtlantaBestOfPage = AtlantaPageMeta & {
  intro: string
  entries: AtlantaRankedEntry[]
  crossLinks: AtlantaCrossLinkGroup[]
  /** ISO date or human label for fast-moving lists (e.g. female MCs) */
  lastUpdated?: string
}

export type AtlantaEraPage = AtlantaPageMeta & {
  intro: string
  years?: string
  sections: AtlantaContentSection[]
  crossLinks: AtlantaCrossLinkGroup[]
}

export type AtlantaProfilePage = AtlantaPageMeta & {
  kind: "studio" | "label" | "producer" | "venue"
  intro: string
  bio: string
  neighborhood?: string
  address?: string
  notable: string[]
  timeline?: AtlantaTimelineItem[]
  crossLinks: AtlantaCrossLinkGroup[]
}

export type AtlantaHubCategoryCard = {
  category: AtlantaCategory
  title: string
  description: string
  href: string
}

export type AtlantaAdjacent = {
  prev: { slug: string; title: string; href: string } | null
  next: { slug: string; title: string; href: string } | null
}
