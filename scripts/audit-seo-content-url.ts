#!/usr/bin/env node --experimental-strip-types
/**
 * Reports watch URLs where SEO contentUrl would be empty (no progressive MP4 proxy).
 *
 * Usage:
 *   HIIFI_SERVER_READ_BEARER=... node --experimental-strip-types scripts/audit-seo-content-url.ts [videoId ...]
 *   HIIFI_SERVER_READ_BEARER=... node --experimental-strip-types scripts/audit-seo-content-url.ts --sitemap-sample 20
 *
 * Requires network + read bearer. Skips gracefully when bearer is unset.
 */

import { fetchVideoEntriesForSitemap } from "../lib/seo/fetch-public"

async function main() {
  const bearer = process.env.HIFFI_SERVER_READ_BEARER?.trim()
  if (!bearer) {
    console.error("Set HIIFI_SERVER_READ_BEARER to audit contentUrl resolution.")
    process.exit(1)
  }

  const args = process.argv.slice(2)
  let videoIds: string[] = []

  if (args[0] === "--sitemap-sample") {
    const limit = Math.min(Number(args[1] || 20), 100)
    const entries = await fetchVideoEntriesForSitemap(limit)
    videoIds = entries.map((e) => e.videoId)
  } else if (args.length > 0) {
    videoIds = args
  } else {
    console.error("Pass video IDs or --sitemap-sample [n]")
    process.exit(1)
  }

  const { fetchVideoForSeo } = await import("../lib/seo/fetch-public")

  let missing = 0
  for (const videoId of videoIds) {
    const video = await fetchVideoForSeo(videoId)
    if (!video) {
      console.log(`MISSING_VIDEO ${videoId}`)
      missing += 1
      continue
    }
    if (!video.contentUrl) {
      console.log(`EMPTY_CONTENT_URL ${videoId} ${video.title}`)
      missing += 1
    }
  }

  console.log(`Checked ${videoIds.length} videos; ${missing} without contentUrl.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
