import type { ContentFlag } from "@/lib/types/content-flag"
import { getThumbnailUrl } from "@/lib/storage"
import { formatReportReason } from "@/lib/report/build-metadata"

/** Human-readable labels for report_type values from the API */
export function formatReportType(reportType: string): string {
  return reportType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

function metaString(meta: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = meta[key]
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  return null
}

export type FlagDisplayModel = {
  referenceId: string
  reportTypeLabel: string
  reasonLabel: string
  statusLabel: string
  reporterLabel: string
  reporterSubLabel: string | null
  reporterUsername: string | null
  reporterUid: string | null
  targetTitle: string
  targetSubtitle: string | null
  targetHref: string | null
  thumbnailUrl: string | null
  messagePreview: string | null
  reporterDescription: string | null
  contextRows: { label: string; value: string; href?: string }[]
}

export function buildFlagDisplayModel(flag: ContentFlag): FlagDisplayModel {
  const meta = (flag.metadata ?? {}) as Record<string, unknown>
  const reportType = flag.report_type.replace(/_/g, " ")

  const username = metaString(meta, "username", "user_username", "userUsername")
  const displayName = metaString(meta, "display_name", "displayName", "name")
  const videoTitle = metaString(meta, "video_title", "videoTitle", "title")
  const messageText = metaString(meta, "message_text", "messageText", "comment")
  const profileUrl = metaString(meta, "profile_url", "profileUrl")
  const thumbnailRaw = metaString(meta, "thumbnail_url", "thumbnailUrl", "video_thumbnail")

  let targetTitle = "Reported content"
  let targetSubtitle: string | null = null
  let thumbnailUrl: string | null = null
  let messagePreview: string | null = null
  let targetHref: string | null = null

  if (flag.report_type === "video" || flag.target_type === "video") {
    targetTitle = videoTitle ?? "Video"
    targetSubtitle = username ? `@${username}` : null
    thumbnailUrl = thumbnailRaw ? getThumbnailUrl(thumbnailRaw) : null
    targetHref = `/watch/${flag.target_id}`
  } else if (flag.report_type === "comment" || flag.target_type === "comment") {
    targetTitle = "Comment"
    targetSubtitle = username ? `by @${username}` : null
    messagePreview = messageText
    const videoId = metaString(meta, "video_id", "videoId")
    if (videoId) targetHref = `/watch/${videoId}`
  } else if (
    flag.report_type === "user" ||
    flag.report_type === "creator" ||
    flag.target_type === "user"
  ) {
    targetTitle = displayName ?? username ?? "User profile"
    targetSubtitle = username ? `@${username}` : null
    targetHref =
      profileUrl ??
      (username ? `/profile/${encodeURIComponent(username)}` : null)
  } else {
    targetTitle = videoTitle ?? displayName ?? `${reportType} report`
    targetSubtitle = username ? `@${username}` : null
    messagePreview = messageText
    thumbnailUrl = thumbnailRaw ? getThumbnailUrl(thumbnailRaw) : null
  }

  const contextRows: { label: string; value: string; href?: string }[] = []
  if (videoTitle && flag.report_type !== "video") {
    contextRows.push({ label: "Video", value: videoTitle })
  }
  if (messageText && flag.report_type !== "comment") {
    contextRows.push({ label: "Message", value: messageText })
  }
  if (username) {
    contextRows.push({
      label: "Account",
      value: `@${username}`,
      href: `/profile/${encodeURIComponent(username)}`,
    })
  }
  const videoId = metaString(meta, "video_id", "videoId")
  if (videoId && flag.report_type === "comment") {
    contextRows.push({
      label: "On video",
      value: videoId.length > 12 ? `${videoId.slice(0, 8)}…` : videoId,
      href: `/watch/${videoId}`,
    })
  }

  return {
    referenceId: flag.reference_id,
    reportTypeLabel: reportType.charAt(0).toUpperCase() + reportType.slice(1),
    reasonLabel: formatReportReason(flag.reason),
    statusLabel: flag.status.replace(/_/g, " "),
    reporterLabel: "Reporter",
    reporterSubLabel: null,
    reporterUsername: null,
    reporterUid: null,
    targetTitle,
    targetSubtitle,
    targetHref,
    thumbnailUrl,
    messagePreview,
    reporterDescription: flag.description?.trim() || null,
    contextRows,
  }
}

export function applyReporterDisplay(
  model: FlagDisplayModel,
  reporter: { username?: string; name?: string; uid?: string } | null,
  reporterId: string,
): FlagDisplayModel {
  if (reporter?.username) {
    return {
      ...model,
      reporterLabel: reporter.name?.trim() || reporter.username,
      reporterSubLabel: `@${reporter.username}`,
      reporterUsername: reporter.username,
      reporterUid: reporter.uid ?? reporterId,
    }
  }
  return {
    ...model,
    reporterLabel: "Reporter",
    reporterSubLabel: reporterId.length > 16 ? `${reporterId.slice(0, 8)}…${reporterId.slice(-4)}` : reporterId,
    reporterUsername: null,
    reporterUid: reporterId,
  }
}

export function listRowSummary(flag: ContentFlag): string {
  const model = buildFlagDisplayModel(flag)
  if (model.messagePreview) {
    const trimmed = model.messagePreview.slice(0, 60)
    return trimmed.length < model.messagePreview.length ? `${trimmed}…` : trimmed
  }
  if (model.targetSubtitle) return `${model.targetTitle} · ${model.targetSubtitle}`
  return model.targetTitle
}
