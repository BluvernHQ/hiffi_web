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
      url: absoluteUrl("/faq"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/support"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: absoluteUrl("/terms-of-use"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/payment-terms"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/privacy-policy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/search"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: absoluteUrl("/creator/apply"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.78,
    },
    {
      url: absoluteUrl("/app"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
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
