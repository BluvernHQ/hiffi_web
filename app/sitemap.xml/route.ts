import {
  buildSitemapEntries,
  chunkIdsToSitemapIndexXml,
  entriesToUrlsetXml,
  getSitemapChunkIds,
  sitemapXmlResponse,
} from "@/lib/seo/sitemap-data"

export const revalidate = 3600

/**
 * Canonical sitemap entrypoint for robots.txt / Search Console.
 * Single chunk → full urlset. Multiple chunks → sitemap index.
 */
export async function GET() {
  const ids = await getSitemapChunkIds()

  if (ids.length <= 1) {
    const entries = await buildSitemapEntries(0)
    return sitemapXmlResponse(entriesToUrlsetXml(entries))
  }

  return sitemapXmlResponse(chunkIdsToSitemapIndexXml(ids))
}
