/** Passive nudge triggers — ranked lower number = higher priority */
export type GuestConversionTrigger =
  | "like_attempt"
  | "follow_attempt"
  | "third_track"
  | "watch_60s"
  | "rec_ready"
  | "history_visit"

export const GUEST_CONVERSION_PRIORITY: Record<GuestConversionTrigger, number> = {
  like_attempt: 1,
  follow_attempt: 2,
  third_track: 3,
  watch_60s: 4,
  rec_ready: 5,
  history_visit: 6,
}

export type GuestPlayedVideo = {
  videoId: string
  title?: string
  thumbnail?: string
  artistUsername?: string
  playedAt: number
}

export type PendingLikeIntent = {
  type: "like"
  videoId: string
  videoTitle?: string
}

export type PendingFollowIntent = {
  type: "follow"
  username: string
  displayName?: string
  avatarUrl?: string
}

export type PendingGuestIntent = PendingLikeIntent | PendingFollowIntent

export type GuestConversionSession = {
  sessionId: string
  playedVideoIds: string[]
  playCount: number
  passiveNudgeShown: boolean
  dismissedTriggers: Partial<Record<GuestConversionTrigger, boolean>>
  attemptedLike: boolean
  attemptedFollow: boolean
  recNudgeEligible: boolean
  recPickCount: number
}
