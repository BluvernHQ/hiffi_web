import type { MetadataRoute } from "next"
import { fetchVideoEntriesForSitemap, type SitemapVideoEntry } from "@/lib/seo/fetch-public"
import { absoluteUrl } from "@/lib/seo/site"

export const revalidate = 3600

const STATIC_LAST_MODIFIED = new Date("2026-06-01T00:00:00.000Z")

function getSitemapMaxVideos(): number {
  const raw = process.env.SITEMAP_MAX_VIDEOS?.trim()
  const parsed = raw ? Number.parseInt(raw, 10) : 50_000
  if (!Number.isFinite(parsed) || parsed <= 0) return 50_000
  return Math.min(parsed, 50_000)
}

function getSitemapVideoChunkSize(): number {
  const raw = process.env.SITEMAP_VIDEO_CHUNK_SIZE?.trim()
  const parsed = raw ? Number.parseInt(raw, 10) : 10_000
  if (!Number.isFinite(parsed) || parsed <= 0) return 10_000
  return Math.min(parsed, 50_000)
}

function buildStaticEntries(): MetadataRoute.Sitemap {
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
  ]
}

function buildProfileLastModifiedByUsername(
  entries: SitemapVideoEntry[],
): Map<string, Date> {
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

function buildProfileEntries(
  profileDates: Map<string, Date>,
  fallback: Date,
): MetadataRoute.Sitemap {
  return [...profileDates.entries()].map(([username, lastModified]) => ({
    url: absoluteUrl(`/profile/${encodeURIComponent(username)}`),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))
}

function buildVideoEntries(
  entries: SitemapVideoEntry[],
  fallback: Date,
): MetadataRoute.Sitemap {
  return entries.map((entry) => ({
    url: absoluteUrl(`/watch/${encodeURIComponent(entry.videoId)}`),
    lastModified: entry.lastModified ?? fallback,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))
}

let cachedVideoEntries: SitemapVideoEntry[] | null = null

async function getAllVideoEntries(): Promise<SitemapVideoEntry[]> {
  if (!cachedVideoEntries) {
    cachedVideoEntries = await fetchVideoEntriesForSitemap(getSitemapMaxVideos())
  }
  return cachedVideoEntries
}

/** Splits large video catalogs across /sitemap/[id].xml when count exceeds chunk size. */
export async function generateSitemaps() {
  const entries = await getAllVideoEntries()
  const chunkSize = getSitemapVideoChunkSize()
  const videoChunkCount = Math.max(1, Math.ceil(entries.length / chunkSize))

  const ids: Array<{ id: number }> = [{ id: 0 }]
  if (entries.length > chunkSize) {
    for (let i = 1; i <= videoChunkCount; i += 1) {
      ids.push({ id: i })
    }
  }
  return ids
}

export default async function sitemap(props: {
  id: Promise<number>
}): Promise<MetadataRoute.Sitemap> {
  const id = await props.id
  const now = new Date()
  const entries = await getAllVideoEntries()
  const chunkSize = getSitemapVideoChunkSize()
  const profileDates = buildProfileLastModifiedByUsername(entries)

  if (id === 0) {
    const staticEntries = buildStaticEntries()
    const profileEntries = buildProfileEntries(profileDates, now)

    if (entries.length <= chunkSize) {
      return [...staticEntries, ...buildVideoEntries(entries, now), ...profileEntries]
    }

    return [...staticEntries, ...profileEntries]
  }

  const chunkIndex = id - 1
  const start = chunkIndex * chunkSize
  const chunk = entries.slice(start, start + chunkSize)
  return buildVideoEntries(chunk, now)
}
