import {
  buildSitemapEntries,
  buildStaticOnlyEntries,
  entriesToUrlsetXml,
  getSitemapChunkIds,
  sitemapXmlResponse,
} from "@/lib/seo/sitemap-data"

export const revalidate = 3600

type RouteContext = {
  params: Promise<{ id: string }>
}

/** Chunked sitemaps at /sitemaps/0.xml, /sitemaps/1.xml, … */
export async function GET(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params
  const id = Number.parseInt(String(rawId).replace(/\.xml$/i, ""), 10)

  if (!Number.isFinite(id) || id < 0) {
    return new Response("Not Found", { status: 404 })
  }

  try {
    const ids = await getSitemapChunkIds()
    if (!ids.includes(id)) {
      return new Response("Not Found", { status: 404 })
    }

    const entries = await buildSitemapEntries(id)
    return sitemapXmlResponse(entriesToUrlsetXml(entries))
  } catch (error) {
    console.error(`[hiffi] sitemaps/${id} failed:`, error)
    if (id !== 0) {
      return new Response("Not Found", { status: 404 })
    }
    const entries = await buildStaticOnlyEntries()
    return sitemapXmlResponse(entriesToUrlsetXml(entries))
  }
}
