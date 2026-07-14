/** Viewer identity from auth (user and/or userData). */
export type ReportViewer = {
  uid?: string | null
  username?: string | null
} | null | undefined

function normalizeUsername(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed.toLowerCase() : null
}

function normalizeUid(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed || null
}

/** True when the signed-in viewer owns the target (same uid or username). */
export function isOwnContentTarget(
  viewer: ReportViewer,
  target: {
    uid?: unknown
    user_uid?: unknown
    userUid?: unknown
    username?: unknown
    user_username?: unknown
    userUsername?: unknown
    commented_by?: unknown
    comment_by_username?: unknown
  },
): boolean {
  if (!viewer) return false

  const viewerUid = normalizeUid(viewer.uid)
  const viewerUsername = normalizeUsername(viewer.username)

  const targetUid =
    normalizeUid(target.uid) ??
    normalizeUid(target.user_uid) ??
    normalizeUid(target.userUid) ??
    normalizeUid(target.commented_by)

  const targetUsername =
    normalizeUsername(target.username) ??
    normalizeUsername(target.user_username) ??
    normalizeUsername(target.userUsername) ??
    normalizeUsername(target.comment_by_username)

  if (viewerUid && targetUid && viewerUid === targetUid) return true
  if (viewerUsername && targetUsername && viewerUsername === targetUsername) return true
  return false
}

/** Whether the report action should be shown (not own content). Guests may see it and are prompted to sign in. */
export function canReportContentTarget(
  viewer: ReportViewer,
  target: Parameters<typeof isOwnContentTarget>[1],
): boolean {
  return !isOwnContentTarget(viewer, target)
}
