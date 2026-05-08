export type VoteState = { upvoted: boolean; downvoted: boolean }

function getSourceVideoId(source: any): string {
  if (!source) return ""
  return source.video_id || source.videoId || ""
}

export function resolveVoteState(source: any, fallback: VoteState = { upvoted: false, downvoted: false }): VoteState {
  if (!source) return fallback

  if (typeof source.upvoted === "boolean" || typeof source.downvoted === "boolean") {
    return {
      upvoted: source.upvoted === true,
      downvoted: source.downvoted === true,
    }
  }

  const voteStatus = source.uservotestatus || source.user_vote_status
  if (typeof voteStatus === "string") {
    if (voteStatus === "upvoted") return { upvoted: true, downvoted: false }
    if (voteStatus === "downvoted") return { upvoted: false, downvoted: true }
  }

  if (source.upvoted_at || source.liked_at) {
    return { upvoted: true, downvoted: false }
  }

  return fallback
}

export function hasVoteMetadata(source: any): boolean {
  if (!source) return false
  if (typeof source.upvoted === "boolean" || typeof source.downvoted === "boolean") return true
  if (typeof source.uservotestatus === "string" || typeof source.user_vote_status === "string") return true
  if (source.upvoted_at || source.liked_at) return true
  return false
}

export function resolveVoteStateForVideo(source: any, expectedVideoId: string, fallback: VoteState = { upvoted: false, downvoted: false }): VoteState {
  if (!source) return fallback
  const sourceId = getSourceVideoId(source)
  if (!sourceId || sourceId !== expectedVideoId) return fallback
  return resolveVoteState(source, fallback)
}

