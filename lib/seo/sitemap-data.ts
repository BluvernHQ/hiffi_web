import type { MetadataRoute } from "next"
import { SITEMAP_STATIC_CONTENT_PAGES } from "@/lib/content-pages"
import { getArtistCityPages, getArtistGenrePages } from "@/lib/artist-directory-seo"
import { artistIndexCityHref, artistIndexCitySceneHref, artistIndexGenreHref } from "@/lib/artist-directory"
import { getArtists } from "@/lib/artists"
import { fetchVideoEntriesForSitemap, type SitemapVideoEntry } from "@/lib/seo/fetch-public"
import { absoluteUrl } from "@/lib/seo/site"
import { getAllAtlantaSitemapPaths } from "@/lib/atlanta/registry"
import { MOODS } from "@/lib/mood-tabs"

export const SITEMAP_REVALIDATE_SECONDS = 3600

const STATIC_LAST_MODIFIED = new Date("2026-06-01T00:00:00.000Z")

export function getSitemapMaxVideos(): number {
  const raw = process.env.SITEMAP_MAX_VIDEOS?.trim()
  const parsed = raw ? Number.parseInt(raw, 10) : 50_000
  if (!Number.isFinite(parsed) || parsed <= 0) return 50_000
  return Math.min(parsed, 50_000)
}

export function getSitemapVideoChunkSize(): number {
  const raw = process.env.SITEMAP_VIDEO_CHUNK_SIZE?.trim()
  const parsed = raw ? Number.parseInt(raw, 10) : 10_000
  if (!Number.isFinite(parsed) || parsed <= 0) return 10_000
  return Math.min(parsed, 50_000)
}

function buildStaticEntries(
  cityPages: Awaited<ReturnType<typeof getArtistCityPages>>,
  genrePages: Awaited<ReturnType<typeof getArtistGenrePages>>,
): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: absoluteUrl("/faq"),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/support"),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: absoluteUrl("/terms-of-use"),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/payment-terms"),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/privacy-policy"),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/search"),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: absoluteUrl("/creator/apply"),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.78,
    },
    {
      url: absoluteUrl("/app"),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/hip-hop"),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    ...MOODS.map((mood) => ({
      url: absoluteUrl(`/hip-hop/mood/${encodeURIComponent(mood.query.replace(/\s+/g, "-").toLowerCase())}`),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...SITEMAP_STATIC_CONTENT_PAGES.map(({ path, changeFrequency, priority }) => ({
      url: absoluteUrl(path),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency,
      priority,
    })),
    {
      url: absoluteUrl("/artist-index"),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.92,
    },
    {
      url: absoluteUrl("/artist-index/claim"),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.88,
    },
    ...cityPages.map((city) => ({
      url: absoluteUrl(artistIndexCityHref(city.slug)),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...cityPages
      .filter((city) => city.slug === "atlanta")
      .map((city) => ({
        url: absoluteUrl(artistIndexCitySceneHref(city.slug)),
        lastModified: STATIC_LAST_MODIFIED,
        changeFrequency: "monthly" as const,
        priority: 0.86,
      })),
    ...genrePages.map((genre) => ({
      url: absoluteUrl(artistIndexGenreHref(genre.slug)),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.88,
    })),
    ...getAllAtlantaSitemapPaths().map((path) => ({
      url: absoluteUrl(path),
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: path === "/atlanta" ? 0.85 : path.split("/").length <= 3 ? 0.8 : 0.72,
    })),
  ]
}

async function buildArtistIndexProfileEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const artists = await getArtists()
    return artists.map((artist) => ({
      url: absoluteUrl(`/artist-index/${artist.slug}`),
      lastModified: artist.added_date ? new Date(artist.added_date) : STATIC_LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    }))
  } catch (error) {
    console.warn("[hiffi] sitemap: skipping artist index profiles (API unavailable):", error)
    return []
  }
}

/** Static routes only — used when video/API fetches fail during build or runtime. */
export async function buildStaticOnlyEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const [cityPages, genrePages] = await Promise.all([getArtistCityPages(), getArtistGenrePages()])
    return buildStaticEntries(cityPages, genrePages)
  } catch (error) {
    console.warn("[hiffi] sitemap: static fallback without city/genre pages:", error)
    return buildStaticEntries([], [])
  }
}

function buildProfileLastModifiedByUsername(entries: SitemapVideoEntry[]): Map<string, Date> {
  const byUsername = new Map<string, Date>()
  for (const entry of entries) {
    const username = entry.username.trim().toLowerCase()
    if (!username || !entry.lastModified) continue
    const prev = byUsername.get(username)
    if (!prev || entry.lastModified > prev) {
      byUsername.set(username, entry.lastModified)
    }
  }
  return byUsername
}

function buildProfileEntries(profileDates: Map<string, Date>, fallback: Date): MetadataRoute.Sitemap {
  return [...profileDates.entries()].map(([username, lastModified]) => ({
    url: absoluteUrl(`/profile/${encodeURIComponent(username)}`),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))
}

function buildVideoEntries(entries: SitemapVideoEntry[], fallback: Date): MetadataRoute.Sitemap {
  return entries.map((entry) => ({
    url: absoluteUrl(`/watch/${encodeURIComponent(entry.videoId)}`),
    lastModified: entry.lastModified ?? fallback,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))
}

let cachedVideoEntries: SitemapVideoEntry[] | null = null

export async function getAllVideoEntries(): Promise<SitemapVideoEntry[]> {
  if (!cachedVideoEntries) {
    try {
      cachedVideoEntries = await fetchVideoEntriesForSitemap(getSitemapMaxVideos())
    } catch (error) {
      console.warn("[hiffi] sitemap: skipping video entries (API unavailable):", error)
      cachedVideoEntries = []
    }
  }
  return cachedVideoEntries
}

/** Chunk ids for /sitemap/{id}.xml — 0 is core pages + profiles (+ videos when they fit). */
export async function getSitemapChunkIds(): Promise<number[]> {
  const entries = await getAllVideoEntries()
  const chunkSize = getSitemapVideoChunkSize()
  const ids = [0]
  if (entries.length > chunkSize) {
    const videoChunkCount = Math.max(1, Math.ceil(entries.length / chunkSize))
    for (let i = 1; i <= videoChunkCount; i += 1) {
      ids.push(i)
    }
  }
  return ids
}

export async function buildSitemapEntries(id: number): Promise<MetadataRoute.Sitemap> {
  try {
    const now = new Date()
    const entries = await getAllVideoEntries()
    const chunkSize = getSitemapVideoChunkSize()
    const profileDates = buildProfileLastModifiedByUsername(entries)

    if (id === 0) {
      const [cityPages, genrePages] = await Promise.all([getArtistCityPages(), getArtistGenrePages()])
      const staticEntries = buildStaticEntries(cityPages, genrePages)
      const profileEntries = buildProfileEntries(profileDates, now)
      const artistIndexEntries = await buildArtistIndexProfileEntries()

      if (entries.length <= chunkSize) {
        return [...staticEntries, ...artistIndexEntries, ...buildVideoEntries(entries, now), ...profileEntries]
      }

      return [...staticEntries, ...artistIndexEntries, ...profileEntries]
    }

    const chunkIndex = id - 1
    const start = chunkIndex * chunkSize
    const chunk = entries.slice(start, start + chunkSize)
    return buildVideoEntries(chunk, now)
  } catch (error) {
    console.warn(`[hiffi] sitemap chunk ${id} failed, using static fallback:`, error)
    if (id === 0) {
      return buildStaticOnlyEntries()
    }
    return []
  }
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function formatLastModified(value: Date | string | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export function entriesToUrlsetXml(entries: MetadataRoute.Sitemap): string {
  const urls = entries
    .map((entry) => {
      const lastmod = formatLastModified(entry.lastModified)
      const changefreq = entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : ""
      const priority =
        typeof entry.priority === "number" && Number.isFinite(entry.priority)
          ? `<priority>${entry.priority.toFixed(1)}</priority>`
          : ""
      const lastmodXml = lastmod ? `<lastmod>${lastmod}</lastmod>` : ""
      return `<url><loc>${escapeXml(entry.url)}</loc>${lastmodXml}${changefreq}${priority}</url>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
}

export function chunkIdsToSitemapIndexXml(ids: number[], lastModified = new Date()): string {
  const lastmod = lastModified.toISOString()
  const items = ids
    .map((id) => {
      const loc = absoluteUrl(`/sitemaps/${id}.xml`)
      return `<sitemap><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod></sitemap>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`
}

export function sitemapXmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, s-maxage=${SITEMAP_REVALIDATE_SECONDS}, stale-while-revalidate=86400`,
    },
  })
}
