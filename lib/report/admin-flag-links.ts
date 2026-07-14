import type { ContentFlag } from "@/lib/types/content-flag"

export type AdminFlagTargetLink = {
  href: string
  label: string
}

function metaString(meta: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = meta[key]
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  return null
}

export function buildAdminDashboardLink(
  section: string,
  params: Record<string, string | undefined>,
): string {
  const query = new URLSearchParams()
  query.set("section", section)
  for (const [key, value] of Object.entries(params)) {
    const trimmed = value?.trim()
    if (trimmed) query.set(key, trimmed)
  }
  return `/admin/dashboard?${query.toString()}`
}

/** Admin table deep links for moderating the reported entity. */
export function getAdminFlagTargetLinks(
  flag: ContentFlag,
  options?: { returnTo?: string },
): AdminFlagTargetLink[] {
  const meta = (flag.metadata ?? {}) as Record<string, unknown>
  const returnTo = options?.returnTo?.trim()
  const extra = returnTo ? { returnTo } : {}

  const reportType = flag.report_type.toLowerCase()
  const targetType = flag.target_type.toLowerCase()

  if (reportType === "video" || targetType === "video") {
    return [
      {
        href: buildAdminDashboardLink("videos", { video_id: flag.target_id, ...extra }),
        label: "View in Videos table",
      },
    ]
  }

  if (reportType === "comment" || targetType === "comment") {
    const links: AdminFlagTargetLink[] = [
      {
        href: buildAdminDashboardLink("comments", { filter: flag.target_id, ...extra }),
        label: "View in Comments table",
      },
    ]
    const videoId = metaString(meta, "video_id", "videoId")
    if (videoId) {
      links.push({
        href: buildAdminDashboardLink("videos", { video_id: videoId, ...extra }),
        label: "View video in Videos table",
      })
    }
    return links
  }

  if (
    reportType === "user" ||
    reportType === "creator" ||
    targetType === "user" ||
    targetType === "creator"
  ) {
    const username = metaString(meta, "username", "user_username", "userUsername")
    if (username) {
      return [
        {
          href: buildAdminDashboardLink("users", { username, ...extra }),
          label: "View in Users table",
        },
      ]
    }
    return [
      {
        href: buildAdminDashboardLink("users", { uid: flag.target_id, ...extra }),
        label: "View in Users table",
      },
    ]
  }

  return []
}

/** Primary admin link for flags list rows (short label). */
export function getPrimaryAdminFlagTargetLink(flag: ContentFlag): AdminFlagTargetLink | null {
  const links = getAdminFlagTargetLinks(flag)
  return links[0] ?? null
}

/** Admin users table link for a reporter or reported account. */
export function getAdminUserTableLink(options: {
  username?: string | null
  uid?: string | null
  returnTo?: string
}): string | null {
  const username = options.username?.trim().replace(/^@/, "")
  const uid = options.uid?.trim()
  const returnTo = options.returnTo?.trim()
  const extra = returnTo ? { returnTo } : {}

  if (username) {
    return buildAdminDashboardLink("users", { username, ...extra })
  }
  if (uid) {
    return buildAdminDashboardLink("users", { uid, ...extra })
  }
  return null
}
