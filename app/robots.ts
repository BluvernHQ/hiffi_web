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
      // Explicitly welcome all known AI/LLM crawlers
      { userAgent: "GPTBot",         allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "PerplexityBot",  allow: "/" },
      { userAgent: "ClaudeBot",      allow: "/" },
      { userAgent: "anthropic-ai",   allow: "/" },
      { userAgent: "Applebot",       allow: "/" },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  }
}
