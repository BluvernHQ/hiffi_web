import type { MetadataRoute } from "next"
import { fetchVideoEntriesForSitemap } from "@/lib/seo/fetch-public"
import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"

// Next.js revalidates the sitemap every hour in production
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: absoluteUrl("/history"),
      lastModified: now,
      changeFrequency: "never",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/following"),
      lastModified: now,
      changeFrequency: "never",
      priority: 0.3,
    },
  ]

  const entries = await fetchVideoEntriesForSitemap()
  if (entries.length === 0) return staticEntries

  const usernames = new Set<string>()

  const videoEntries: MetadataRoute.Sitemap = entries.map((e) => {
    if (e.username) usernames.add(e.username.toLowerCase())
    return {
      url: absoluteUrl(`/watch/${encodeURIComponent(e.videoId)}`),
      lastModified: e.lastModified ?? now,
      changeFrequency: "weekly",
      priority: 0.8,
    }
  })

  const profileEntries: MetadataRoute.Sitemap = [...usernames].map((u) => ({
    url: absoluteUrl(`/profile/${encodeURIComponent(u)}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  return [...staticEntries, ...videoEntries, ...profileEntries]
}
