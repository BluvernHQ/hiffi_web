import type { ReactNode } from "react"
import type { Metadata } from "next"
import { JsonLd } from "@/components/seo/json-ld"
import { fetchUserForSeo } from "@/lib/seo/fetch-public"
import { truncateMetaDescription } from "@/lib/seo/meta"
import { buildProfileJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo/schema"
import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"

type RouteParams = { username: string }

async function resolvedParams(params: Promise<RouteParams> | RouteParams): Promise<RouteParams> {
  return Promise.resolve(params)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams> | RouteParams
}): Promise<Metadata> {
  const { username: rawUsername } = await resolvedParams(params)
  const username = rawUsername.trim()
  const profile = await fetchUserForSeo(username)

  const handle = (profile?.username || username).trim()
  const display = (profile?.name || handle).trim() || handle

  const title = `@${handle} — ${display} | Hiffi`
  const description = profile?.bio?.length
    ? truncateMetaDescription(profile.bio)
    : `Videos and profile of @${handle} on Hiffi.`

  const canonical = absoluteUrl(`/profile/${encodeURIComponent(handle)}`)

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      url: canonical,
      title: `${display} (@${handle})`,
      description,
      siteName: "Hiffi",
      ...(profile?.imageUrl
        ? { images: [{ url: profile.imageUrl, alt: display }] }
        : {}),
    },
    twitter: {
      card: profile?.imageUrl ? "summary_large_image" : "summary",
      title: `${display} (@${handle})`,
      description,
      ...(profile?.imageUrl ? { images: [profile.imageUrl] } : {}),
    },
  }
}

export default async function ProfileSegmentLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<RouteParams> | RouteParams
}) {
  const { username: rawUsername } = await resolvedParams(params)
  const username = rawUsername.trim()
  const profile = await fetchUserForSeo(username)

  const displayName = (profile?.name || username).trim() || username
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Hiffi", url: getSiteOrigin() },
    { name: "Creators", url: absoluteUrl("/") },
    { name: displayName, url: absoluteUrl(`/profile/${encodeURIComponent(username)}`) },
  ])

  return (
    <>
      <JsonLd data={buildProfileJsonLd(username, profile)} />
      <JsonLd data={breadcrumb} />
      {children}
    </>
  )
}
