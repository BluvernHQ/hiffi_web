import { fetchVideoEntriesForSitemap, fetchVideoForSeo } from "@/lib/seo/fetch-public"
import { absoluteUrl } from "@/lib/seo/site"

const XML_CONTENT_TYPE = "application/xml; charset=utf-8"
const VIDEO_SITEMAP_LIMIT = 1000
const FETCH_BATCH_SIZE = 12

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function toSitemapVideoDuration(value?: number): string | null {
  if (!value || !Number.isFinite(value)) return null
  const clamped = Math.max(1, Math.floor(value))
  return String(clamped)
}

async function fetchVideoDetailsBatch(videoIds: string[]) {
  const details = await Promise.all(videoIds.map((videoId) => fetchVideoForSeo(videoId)))
  return details.filter((video): video is NonNullable<typeof video> => video !== null)
}

export async function GET() {
  const entries = await fetchVideoEntriesForSitemap(VIDEO_SITEMAP_LIMIT)

  if (entries.length === 0) {
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"></urlset>`
    return new Response(emptyXml, {
      headers: {
        "Content-Type": XML_CONTENT_TYPE,
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    })
  }

  const videos = []
  for (let i = 0; i < entries.length; i += FETCH_BATCH_SIZE) {
    const batch = entries.slice(i, i + FETCH_BATCH_SIZE).map((entry) => entry.videoId)
    const batchVideos = await fetchVideoDetailsBatch(batch)
    videos.push(...batchVideos)
  }

  const urlsXml = videos
    .map((video) => {
      const pageUrl = absoluteUrl(`/watch/${encodeURIComponent(video.videoId)}`)
      const title = escapeXml(video.title)
      const description = escapeXml(
        (video.description || `Watch ${video.title} on Hiffi streaming`).slice(0, 2048),
      )
      const thumbnailUrl = escapeXml(video.thumbnailUrl || absoluteUrl("/favicon.ico"))
      const publicationDate = video.createdAt || new Date().toISOString()
      const contentUrl = video.contentUrl ? `<video:content_loc>${escapeXml(video.contentUrl)}</video:content_loc>` : ""
      const durationNode = toSitemapVideoDuration(video.durationSeconds)
      const durationXml = durationNode ? `<video:duration>${durationNode}</video:duration>` : ""

      return `<url><loc>${escapeXml(pageUrl)}</loc><video:video><video:thumbnail_loc>${thumbnailUrl}</video:thumbnail_loc><video:title>${title}</video:title><video:description>${description}</video:description><video:publication_date>${escapeXml(publicationDate)}</video:publication_date>${contentUrl}${durationXml}</video:video></url>`
    })
    .join("")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${urlsXml}</urlset>`

  return new Response(xml, {
    headers: {
      "Content-Type": XML_CONTENT_TYPE,
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
