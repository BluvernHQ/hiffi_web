import { apiClient } from "@/lib/api-client"
import { debugLog, debugWarn } from "@/lib/debug"
import { clearPendingGuestIntents, getPendingGuestIntents } from "./pending-intents"

/** Replay guest actions stored before signup/login. Best-effort; failures are logged only. */
export async function replayPendingGuestIntents(): Promise<void> {
  const intents = getPendingGuestIntents()
  if (intents.length === 0) return

  clearPendingGuestIntents()

  for (const intent of intents) {
    try {
      if (intent.type === "like") {
        await apiClient.upvoteVideo(intent.videoId)
        debugLog("[hiffi] Replayed pending like for", intent.videoId)
      } else if (intent.type === "follow") {
        await apiClient.followUser(intent.username)
        debugLog("[hiffi] Replayed pending follow for", intent.username)
      }
    } catch (error) {
      debugWarn("[hiffi] Failed to replay guest intent:", intent, error)
    }
  }
}
