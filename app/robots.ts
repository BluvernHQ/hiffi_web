import type { MetadataRoute } from "next"
import { getSiteOrigin } from "@/lib/seo/site"

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin()
  const isProdEnv = (process.env.NEXT_PUBLIC_ENV || "beta").toLowerCase() === "prod"

  if (!isProdEnv) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    }
  }

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
