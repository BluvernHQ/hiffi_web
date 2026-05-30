/** Human-readable labels for reason codes from the API */
export function formatReportReason(reason: string): string {
  return reason
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

export function buildVideoReportMetadata(video: Record<string, unknown>): Record<string, unknown> {
  return {
    video_title: video.video_title ?? video.videoTitle ?? "",
    thumbnail_url: video.video_thumbnail ?? video.videoThumbnail ?? "",
    username: video.user_username ?? video.userUsername ?? "",
  }
}

export function buildCommentReportMetadata(
  comment: { comment: string; comment_by_username?: string },
  videoId: string,
): Record<string, unknown> {
  return {
    message_text: comment.comment,
    video_id: videoId,
    username: comment.comment_by_username ?? "",
  }
}

export function buildUserReportMetadata(
  profileUser: Record<string, unknown>,
  username: string,
  profileUrl: string,
): Record<string, unknown> {
  const displayName =
    (typeof profileUser.name === "string" && profileUser.name.trim()) ||
    (typeof profileUser.username === "string" && profileUser.username) ||
    username
  return {
    username: profileUser.username ?? username,
    display_name: displayName,
    profile_url: profileUrl,
  }
}

export function resolveUserTargetId(profileUser: Record<string, unknown>, username: string): string {
  const nested = profileUser.user
  const nestedUser =
    nested !== null && typeof nested === "object" ? (nested as Record<string, unknown>) : null
  const uid =
    profileUser.uid ??
    profileUser.user_uid ??
    profileUser.userUid ??
    nestedUser?.uid ??
    nestedUser?.user_uid
  if (typeof uid === "string" && uid.trim()) return uid.trim()
  return username
}
