import type { SeoProfile, SeoVideo } from "@/lib/seo/fetch-public"
import { absoluteUrl } from "@/lib/seo/site"

export function buildVideoJsonLd(video: SeoVideo) {
  const pageUrl = absoluteUrl(`/watch/${encodeURIComponent(video.videoId)}`)
  const author =
    video.creatorUsername.length > 0
      ? {
          "@type": "Person",
          name: video.creatorUsername,
          url: absoluteUrl(`/profile/${encodeURIComponent(video.creatorUsername)}`),
        }
      : undefined

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${pageUrl}#video`,
    name: video.title,
    url: pageUrl,
    embedUrl: pageUrl,
  }

  if (video.description) node.description = video.description
  if (video.thumbnailUrl) node.thumbnailUrl = video.thumbnailUrl
  if (video.createdAt) node.uploadDate = video.createdAt
  if (video.updatedAt) node.dateModified = video.updatedAt
  if (video.contentUrl) node.contentUrl = video.contentUrl
  if (author) node.author = author
  if (video.tags?.length) node.keywords = video.tags.join(", ")

  // interactionStatistic: tells Google (and LLMs) this video has real engagement
  if (typeof video.viewCount === "number") {
    node.interactionStatistic = {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/WatchAction",
      userInteractionCount: video.viewCount,
    }
  }

  node.publisher = {
    "@type": "Organization",
    name: "Hiffi",
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/hiffi_logo.png"),
    },
  }

  return node
}

export function buildProfileJsonLd(username: string, profile: SeoProfile | null) {
  const profileUrl = absoluteUrl(`/profile/${encodeURIComponent(username)}`)
  const displayName = (profile?.name || username).trim() || username

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${profileUrl}#webpage`,
        url: profileUrl,
        name: `${displayName} on Hiffi`,
        mainEntity: { "@id": `${profileUrl}#person` },
      },
      {
        "@type": "Person",
        "@id": `${profileUrl}#person`,
        name: displayName,
        url: profileUrl,
        ...(profile?.imageUrl ? { image: profile.imageUrl } : {}),
        ...(profile?.bio ? { description: profile.bio } : {}),
      },
    ],
  }
}
