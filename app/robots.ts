import type { MetadataRoute } from "next"
import { getSiteOrigin } from "@/lib/seo/site"

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin()
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/upload", "/api/"],
      },
      // Explicitly welcome all known AI/LLM crawlers + major search bots (GEO / AI Overviews / Copilot)
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "Bingbot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "Applebot", allow: "/" },
      { userAgent: "CCBot", allow: "/" },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  }
}
