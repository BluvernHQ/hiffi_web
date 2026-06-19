import { listManagedChannelIds, resolveTargetChannelId } from "@/lib/youtube-api"
import { requestYoutubeReadonlyAccess } from "@/lib/youtube-google-auth"
import { parseYoutubeTargetUrl } from "@/lib/youtube-url"

export type YoutubeChannelVerificationResult =
  | {
      verified: true
      channelId: string
      googleEmail: string | null
    }
  | {
      verified: false
      reason:
        | "invalid_url"
        | "channel_not_found"
        | "channel_not_managed"
        | "auth_cancelled"
        | "auth_failed"
      message: string
    }

function isAuthCancelledError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const code = (error as { code?: string }).code
  return code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request"
}

export async function verifyYoutubeChannelOwnership(
  youtubeUrl: string,
): Promise<YoutubeChannelVerificationResult> {
  const target = parseYoutubeTargetUrl(youtubeUrl)
  if (!target) {
    return {
      verified: false,
      reason: "invalid_url",
      message: "Enter a supported YouTube channel or playlist URL.",
    }
  }

  let accessToken: string
  let googleEmail: string | null

  try {
    const auth = await requestYoutubeReadonlyAccess()
    accessToken = auth.accessToken
    googleEmail = auth.email
  } catch (error) {
    if (isAuthCancelledError(error)) {
      return {
        verified: false,
        reason: "auth_cancelled",
        message: "Google sign-in was cancelled.",
      }
    }
    return {
      verified: false,
      reason: "auth_failed",
      message: error instanceof Error ? error.message : "Google sign-in failed.",
    }
  }

  try {
    const targetChannelId = await resolveTargetChannelId(accessToken, target)
    if (!targetChannelId) {
      return {
        verified: false,
        reason: "channel_not_found",
        message: "Could not find a YouTube channel for that URL.",
      }
    }

    const managedChannelIds = await listManagedChannelIds(accessToken)
    if (!managedChannelIds.has(targetChannelId)) {
      return {
        verified: false,
        reason: "channel_not_managed",
        message:
          "This Google account does not manage the YouTube channel for that URL. Sign in with the account that owns the channel.",
      }
    }

    return {
      verified: true,
      channelId: targetChannelId,
      googleEmail,
    }
  } catch (error) {
    return {
      verified: false,
      reason: "auth_failed",
      message: error instanceof Error ? error.message : "YouTube verification failed.",
    }
  }
}
