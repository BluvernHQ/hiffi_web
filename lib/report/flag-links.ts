import type { ContentFlag } from "@/lib/types/content-flag"

/** Best-effort public URL for the reported entity */
export function getFlagTargetHref(flag: ContentFlag): string | null {
  const meta = flag.metadata ?? {}
  if (flag.report_type === "video" || flag.target_type === "video") {
    return `/watch/${flag.target_id}`
  }
  if (flag.report_type === "comment" || flag.target_type === "comment") {
    const videoId = meta.video_id ?? meta.videoId
    if (typeof videoId === "string" && videoId) return `/watch/${videoId}`
  }
  if (
    flag.report_type === "user" ||
    flag.report_type === "creator" ||
    flag.target_type === "user" ||
    flag.target_type === "creator"
  ) {
    const username = meta.username
    if (typeof username === "string" && username) return `/profile/${encodeURIComponent(username)}`
  }
  return null
}
