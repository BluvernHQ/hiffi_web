import {
  buildSitemapEntries,
  buildStaticOnlyEntries,
  chunkIdsToSitemapIndexXml,
  entriesToUrlsetXml,
  getSitemapChunkIds,
  sitemapXmlResponse,
} from "@/lib/seo/sitemap-data"

export const revalidate = 3600

/**
 * Canonical sitemap entrypoint for robots.txt / Search Console.
 * Single chunk → full urlset. Multiple chunks → sitemap index.
 * Falls back to static routes when the API is unreachable (e.g. offline build).
 */
export async function GET() {
  try {
    const ids = await getSitemapChunkIds()

    if (ids.length <= 1) {
      const entries = await buildSitemapEntries(0)
      return sitemapXmlResponse(entriesToUrlsetXml(entries))
    }

    return sitemapXmlResponse(chunkIdsToSitemapIndexXml(ids))
  } catch (error) {
    console.error("[hiffi] sitemap.xml failed:", error)
    const entries = await buildStaticOnlyEntries()
    return sitemapXmlResponse(entriesToUrlsetXml(entries))
  }
}
