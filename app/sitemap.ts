import type { MetadataRoute } from "next"
import { fetchVideoEntriesForSitemap } from "@/lib/seo/fetch-public"
import { absoluteUrl } from "@/lib/seo/site"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
  ]

  const entries = await fetchVideoEntriesForSitemap()
  if (entries.length === 0) {
    return staticEntries
  }

  const usernames = new Set<string>()

  const videoEntries: MetadataRoute.Sitemap = entries.map((e) => {
    if (e.username) {
      usernames.add(e.username.toLowerCase())
    }
    return {
      url: absoluteUrl(`/watch/${encodeURIComponent(e.videoId)}`),
      lastModified: e.lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }
  })

  const profileEntries: MetadataRoute.Sitemap = [...usernames].map((u) => ({
    url: absoluteUrl(`/profile/${encodeURIComponent(u)}`),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  return [...staticEntries, ...videoEntries, ...profileEntries]
}
