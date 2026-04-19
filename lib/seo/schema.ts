import type { SeoProfile, SeoVideo } from "@/lib/seo/fetch-public"
import { organizationSchemaId, webSiteSchemaId } from "@/lib/seo/org"
import { absoluteUrl } from "@/lib/seo/site"

export function buildVideoJsonLd(video: SeoVideo) {
  const pageUrl = absoluteUrl(`/watch/${encodeURIComponent(video.videoId)}`)
  const webPageId = `${pageUrl}#webpage`
  const videoId = `${pageUrl}#video`
  const breadcrumbId = `${pageUrl}#breadcrumb`
  const orgId = organizationSchemaId()
  const siteId = webSiteSchemaId()

  const author =
    video.creatorUsername.length > 0
      ? {
          "@type": "Person",
          name: video.creatorUsername,
          url: absoluteUrl(`/profile/${encodeURIComponent(video.creatorUsername)}`),
        }
      : undefined

  const videoNode: Record<string, unknown> = {
    "@type": "VideoObject",
    "@id": videoId,
    name: video.title,
    url: pageUrl,
    embedUrl: pageUrl,
    inLanguage: "en",
    isPartOf: { "@id": siteId },
    publisher: { "@id": orgId },
    mainEntityOfPage: { "@id": webPageId },
  }

  if (video.description) videoNode.description = video.description
  if (video.thumbnailUrl) videoNode.thumbnailUrl = video.thumbnailUrl
  if (video.createdAt) videoNode.uploadDate = video.createdAt
  if (video.updatedAt) videoNode.dateModified = video.updatedAt
  if (video.contentUrl) videoNode.contentUrl = video.contentUrl
  if (author) videoNode.author = author

  const webPageNode: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": webPageId,
    url: pageUrl,
    name: video.title,
    inLanguage: "en",
    isPartOf: { "@id": siteId },
    mainEntity: { "@id": videoId },
    publisher: { "@id": orgId },
    breadcrumb: { "@id": breadcrumbId },
  }

  if (video.thumbnailUrl) {
    webPageNode.primaryImageOfPage = {
      "@type": "ImageObject",
      url: video.thumbnailUrl,
    }
  }

  const breadcrumbList = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: video.title,
        item: pageUrl,
      },
    ],
  }

  return {
    "@context": "https://schema.org",
    "@graph": [videoNode, webPageNode, breadcrumbList],
  }
}

export function buildProfileJsonLd(username: string, profile: SeoProfile | null) {
  const handle = (profile?.username || username).trim()
  const profileUrl = absoluteUrl(`/profile/${encodeURIComponent(handle)}`)
  const displayName = (profile?.name || handle).trim() || handle
  const personId = `${profileUrl}#person`
  const webPageId = `${profileUrl}#webpage`
  const breadcrumbId = `${profileUrl}#breadcrumb`
  const orgId = organizationSchemaId()
  const siteId = webSiteSchemaId()

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": webPageId,
        url: profileUrl,
        name: `${displayName} on Hiffi`,
        inLanguage: "en",
        isPartOf: { "@id": siteId },
        publisher: { "@id": orgId },
        mainEntity: { "@id": personId },
        breadcrumb: { "@id": breadcrumbId },
      },
      {
        "@type": "Person",
        "@id": personId,
        name: displayName,
        url: profileUrl,
        ...(profile?.imageUrl ? { image: profile.imageUrl } : {}),
        ...(profile?.bio ? { description: profile.bio } : {}),
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: displayName,
            item: profileUrl,
          },
        ],
      },
    ],
  }
}
