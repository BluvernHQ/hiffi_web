import type { ReadonlyURLSearchParams } from "next/navigation"

/** Deep-link filter values from `/admin/dashboard?section=…&video_id=…` etc. */
export function readAdminTableUrlFilters(searchParams: ReadonlyURLSearchParams | URLSearchParams) {
  const rawSource = searchParams.get("source")?.trim().toLowerCase() ?? ""
  const userSource = rawSource === "organic" || rawSource === "inventory" ? rawSource : ""
  return {
    videoId: searchParams.get("video_id")?.trim() ?? "",
    commentFilter: searchParams.get("filter")?.trim() ?? "",
    userUid: searchParams.get("uid")?.trim() ?? "",
    userUsername: searchParams.get("username")?.trim() ?? "",
    userSource,
    returnTo: searchParams.get("returnTo")?.trim() ?? "",
  }
}

export function hasAdminTableDeepLink(urlFilters: ReturnType<typeof readAdminTableUrlFilters>): boolean {
  return !!(
    urlFilters.videoId ||
    urlFilters.commentFilter ||
    urlFilters.userUid ||
    urlFilters.userUsername ||
    urlFilters.userSource
  )
}

const ADMIN_TABLE_FILTER_PARAMS = [
  "video_id",
  "filter",
  "uid",
  "username",
  "source",
  "returnTo",
  "q",
] as const

/** Remove deep-link / search params so "Clear filters" fully resets the table. */
export function stripAdminTableFilterParams(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params.toString())
  for (const key of ADMIN_TABLE_FILTER_PARAMS) {
    next.delete(key)
  }
  return next
}
