import type { ApiClientContext } from "./context"

export type VideoApiShape = {
  video_id?: string
  videoId?: string
  video_title?: string
  videoTitle?: string
  video_thumbnail?: string
  videoThumbnail?: string
  user_username?: string
  userUsername?: string
  [key: string]: unknown
}

export async function getVideo(
  ctx: ApiClientContext,
  videoId: string,
): Promise<{
  success: boolean
  video_url: string
  video?: VideoApiShape
  upvoted?: boolean
  downvoted?: boolean
  following?: boolean
  profile_picture?: string
  put_view_error?: string
}> {
  const response = await ctx.request<{
    success?: boolean
    status?: string
    data?: {
      video?: VideoApiShape
      video_url?: string
      upvoted?: boolean
      downvoted?: boolean
      following?: boolean
      profile_picture?: string
      put_view_error?: string
    }
    video?: VideoApiShape
    video_url?: string
    upvoted?: boolean
    downvoted?: boolean
    following?: boolean
    profile_picture?: string
    put_view_error?: string
  }>(`/videos/${videoId}`, {}, true)

  const isSuccess = response.status === "success" || response.success
  if (!isSuccess) return { success: false, video_url: "" }

  if (response.data) {
    return {
      success: true,
      video_url: response.data.video_url || "",
      video: response.data.video,
      upvoted: response.data.upvoted,
      downvoted: response.data.downvoted,
      following: response.data.following,
      profile_picture: response.data.profile_picture || "",
      put_view_error: response.data.put_view_error,
    }
  }

  return {
    success: true,
    video_url: response.video_url || "",
    video: response.video,
    upvoted: response.upvoted,
    downvoted: response.downvoted,
    following: response.following,
    profile_picture: response.profile_picture || "",
    put_view_error: response.put_view_error,
  }
}

export async function followUser(ctx: ApiClientContext, username: string): Promise<{ success: boolean; message: string }> {
  const response = await ctx.request<{
    success?: boolean
    status?: string
    data?: { message?: string }
    message?: string
  }>(`/social/users/follow/${username}`, { method: "POST", body: JSON.stringify({}) }, true)

  return {
    success: Boolean(response.status === "success" || response.success),
    message: response.data?.message || response.message || "",
  }
}

export async function unfollowUser(ctx: ApiClientContext, username: string): Promise<{ success: boolean; message: string }> {
  const response = await ctx.request<{
    success?: boolean
    status?: string
    data?: { message?: string }
    message?: string
  }>(`/social/users/unfollow/${username}`, { method: "POST", body: JSON.stringify({}) }, true)

  return {
    success: Boolean(response.status === "success" || response.success),
    message: response.data?.message || response.message || "",
  }
}

