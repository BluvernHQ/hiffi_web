import type { SeoProfile } from "@/lib/seo/fetch-public"

export function buildProfilePageTitle(username: string, profile: SeoProfile | null): string {
  const handle = (profile?.username || username).trim()
  const display = (profile?.name || handle).trim() || handle
  return `@${handle} — ${display}`
}

export function buildProfilePageDescription(username: string, profile: SeoProfile | null): string {
  const handle = (profile?.username || username).trim()
  if (profile?.bio?.length) return profile.bio
  return `Hip-hop music videos and profile of @${handle} on Hiffi — independent rap artist streaming platform.`
}

export type ProfileVideoSummary = {
  videoId: string
  title: string
}

export function buildProfileVideoSummaries(
  videos: Record<string, unknown>[],
  limit = 10,
): ProfileVideoSummary[] {
  return videos
    .slice(0, limit)
    .map((v) => ({
      videoId: String(v.video_id || "").trim(),
      title: String(v.video_title || "Video").trim() || "Video",
    }))
    .filter((v) => v.videoId.length > 0)
}
