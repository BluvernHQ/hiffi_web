import type { SeoProfile, SeoVideo } from "@/lib/seo/fetch-public"
import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"

/**
 * Converts a duration in seconds to ISO 8601 duration string (PT#H#M#S).
 * Required by schema.org VideoObject.duration for Google video rich results.
 */
export function secondsToIsoDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "PT0S"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  let iso = "PT"
  if (h > 0) iso += `${h}H`
  if (m > 0) iso += `${m}M`
  if (s > 0 || (h === 0 && m === 0)) iso += `${s}S`
  return iso
}

/**
 * VideoObject — schema.org/VideoObject
 * Google requirements: name, description, thumbnailUrl (ImageObject), uploadDate, contentUrl OR embedUrl.
 * Google recommended: duration (ISO 8601), interactionStatistic, publisher with logo.
 * https://developers.google.com/search/docs/appearance/structured-data/video
 */
export function buildVideoJsonLd(video: SeoVideo) {
  const pageUrl = absoluteUrl(`/watch/${encodeURIComponent(video.videoId)}`)
  const origin = getSiteOrigin()

  const author =
    video.creatorUsername.length > 0
      ? {
          "@type": "Person",
          "@id": absoluteUrl(`/profile/${encodeURIComponent(video.creatorUsername)}#person`),
          name: video.creatorUsername,
          url: absoluteUrl(`/profile/${encodeURIComponent(video.creatorUsername)}`),
        }
      : undefined

  // thumbnailUrl must be ImageObject (not bare string) per Google's VideoObject spec.
  // Minimum size: 60×30px. Google recommends 1280×720 for maximum rich-result eligibility.
  const thumbnailObject = video.thumbnailUrl
    ? {
        "@type": "ImageObject",
        url: video.thumbnailUrl,
        // width/height not known from API — omit rather than guess
      }
    : undefined

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${pageUrl}#video`,
    name: video.title,
    url: pageUrl,
    embedUrl: pageUrl,
    // isFamilyFriendly: required by Google for video indexing eligibility
    isFamilyFriendly: true,
    // inLanguage: helps search engines and LLMs attribute content correctly
    inLanguage: "en",
  }

  if (video.description) node.description = video.description
  if (thumbnailObject) node.thumbnailUrl = thumbnailObject
  if (video.createdAt) node.uploadDate = video.createdAt
  if (video.updatedAt) node.dateModified = video.updatedAt
  if (video.contentUrl) node.contentUrl = video.contentUrl
  if (author) node.author = author
  if (video.tags?.length) node.keywords = video.tags.join(", ")

  // duration: ISO 8601 — REQUIRED for Google video rich results carousel.
  // Populated when the API provides durationSeconds.
  if (video.durationSeconds && video.durationSeconds > 0) {
    node.duration = secondsToIsoDuration(video.durationSeconds)
  }

  // interactionStatistic: view count — boosts click-through in rich results
  const stats: unknown[] = []
  if (typeof video.viewCount === "number") {
    stats.push({
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/WatchAction",
      userInteractionCount: video.viewCount,
    })
  }
  if (stats.length === 1) node.interactionStatistic = stats[0]
  else if (stats.length > 1) node.interactionStatistic = stats

  // potentialAction array:
  //   1. WatchAction  — tells Google/LLMs this page streams the video
  //   2. SeekToAction — enables Google to deep-link to specific timestamps in search results
  //      URL pattern must include {seek_to_second_number} placeholder exactly as Google requires.
  //      See: https://developers.google.com/search/docs/appearance/structured-data/video#seek
  node.potentialAction = [
    {
      "@type": "WatchAction",
      target: pageUrl,
    },
    {
      "@type": "SeekToAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${pageUrl}?t={seek_to_second_number}`,
      },
      "startOffset-input": "required name=seek_to_second_number",
    },
  ]

  // publisher: references the site-level Organization node by @id
  node.publisher = {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: "Hiffi",
    url: origin,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/hiffi_logo.png"),
      width: 512,
      height: 512,
    },
  }

  return node
}

/**
 * MusicVideoObject — schema.org/MusicVideoObject (subtype of VideoObject).
 * Signals music/artist context for Google video surfaces and carousels.
 * https://schema.org/MusicVideoObject
 */
export function buildMusicVideoJsonLd(video: SeoVideo) {
  const pageUrl = absoluteUrl(`/watch/${encodeURIComponent(video.videoId)}`)
  const origin = getSiteOrigin()
  const artistName = (video.creatorDisplayName || video.creatorUsername || "").trim()

  const byArtist = artistName
    ? {
        "@type": "MusicGroup",
        name: artistName,
        ...(video.creatorUsername
          ? { url: absoluteUrl(`/profile/${encodeURIComponent(video.creatorUsername)}`) }
          : {}),
      }
    : undefined

  const thumbnailObject = video.thumbnailUrl
    ? {
        "@type": "ImageObject",
        url: video.thumbnailUrl,
      }
    : undefined

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "MusicVideoObject",
    "@id": `${pageUrl}#music-video`,
    name: video.title,
    url: pageUrl,
    embedUrl: pageUrl,
    ...(video.tags?.[0] ? { genre: video.tags[0] } : { genre: "Music" }),
    isFamilyFriendly: true,
    inLanguage: "en",
  }

  if (video.description) node.description = video.description
  if (thumbnailObject) node.thumbnailUrl = thumbnailObject
  if (video.createdAt) node.uploadDate = video.createdAt
  if (video.updatedAt) node.dateModified = video.updatedAt
  if (video.contentUrl) node.contentUrl = video.contentUrl
  if (byArtist) node.byArtist = byArtist
  if (video.tags?.length) node.keywords = video.tags.join(", ")

  if (video.durationSeconds && video.durationSeconds > 0) {
    node.duration = secondsToIsoDuration(video.durationSeconds)
  }

  if (typeof video.viewCount === "number") {
    node.interactionStatistic = {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/WatchAction",
      userInteractionCount: video.viewCount,
    }
  }

  node.potentialAction = [
    {
      "@type": "WatchAction",
      target: pageUrl,
    },
    {
      "@type": "SeekToAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${pageUrl}?t={seek_to_second_number}`,
      },
      "startOffset-input": "required name=seek_to_second_number",
    },
  ]

  node.publisher = {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: "Hiffi",
    url: origin,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/hiffi_logo.png"),
      width: 512,
      height: 512,
    },
  }

  return node
}

function stripJsonLdContext(node: Record<string, unknown>): Record<string, unknown> {
  const { ["@context"]: _c, ...rest } = node
  return rest
}

/** MusicVideoObject + VideoObject @graph for broad crawler compatibility. */
export function buildWatchPageJsonLd(video: SeoVideo) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      stripJsonLdContext(buildMusicVideoJsonLd(video) as Record<string, unknown>),
      stripJsonLdContext(buildVideoJsonLd(video) as Record<string, unknown>),
    ],
  }
}

/**
 * BreadcrumbList — schema.org/BreadcrumbList
 * Enables Google to show breadcrumb trail in search results.
 * https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 */
export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * ProfilePage + Person — schema.org/ProfilePage + schema.org/Person
 * Google uses ProfilePage for creator/author pages.
 * https://developers.google.com/search/docs/appearance/structured-data/profile-page
 */
export function buildProfileJsonLd(username: string, profile: SeoProfile | null) {
  const profileUrl = absoluteUrl(`/profile/${encodeURIComponent(username)}`)
  const displayName = (profile?.name || username).trim() || username
  const origin = getSiteOrigin()

  const personNode: Record<string, unknown> = {
    "@type": "Person",
    "@id": `${profileUrl}#person`,
    name: displayName,
    url: profileUrl,
    // identifier: the creator's unique handle — helps LLMs associate this node with a specific creator
    identifier: username,
    // sameAs: array of social profile URLs — add when available from API
    sameAs: [],
  }
  if (profile?.imageUrl) {
    personNode.image = {
      "@type": "ImageObject",
      url: profile.imageUrl,
    }
  }
  if (profile?.bio) personNode.description = profile.bio

  const pageNode: Record<string, unknown> = {
    "@type": "ProfilePage",
    "@id": `${profileUrl}#webpage`,
    url: profileUrl,
    name: `${displayName} on Hiffi`,
    inLanguage: "en",
    isPartOf: { "@id": `${origin}/#website` },
    // mainEntity links the ProfilePage to the Person node
    mainEntity: { "@id": `${profileUrl}#person` },
    publisher: {
      "@type": "Organization",
      "@id": `${origin}/#organization`,
    },
  }
  if (profile?.updatedAt) {
    const d = new Date(profile.updatedAt)
    if (!isNaN(d.getTime())) pageNode.dateModified = d.toISOString()
  }
  if (profile?.imageUrl) {
    pageNode.image = {
      "@type": "ImageObject",
      url: profile.imageUrl,
    }
  }

  return {
    "@context": "https://schema.org",
    "@graph": [pageNode, personNode],
  }
}
