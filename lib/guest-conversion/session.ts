import type {
  GuestConversionSession,
  GuestConversionTrigger,
  GuestPlayedVideo,
} from "./types"
import { GUEST_CONVERSION_PRIORITY } from "./types"

const SESSION_KEY = "hiffi_guest_conversion_session"
const PLAY_COUNT_COOKIE = "hiffi_guest_plays"
const THIRD_TRACK_THRESHOLD = 3

/** Fired when a new unique guest play is recorded (detail: { playCount, isThirdPlay }) */
export const GUEST_PLAY_COUNT_CHANGED_EVENT = "hiffi:guest-play-count-changed"
/** Fired when guest conversion session flags change (dismiss, etc.) */
export const GUEST_CONVERSION_SESSION_CHANGED = "hiffi:guest-conversion-changed"

function notifyGuestConversionChanged() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(GUEST_CONVERSION_SESSION_CHANGED))
}
const REC_MIN_PLAYS = 2
const REC_MIN_PICKS = 5

function newSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function defaultSession(): GuestConversionSession {
  return {
    sessionId: newSessionId(),
    playedVideoIds: [],
    playCount: 0,
    passiveNudgeShown: false,
    dismissedTriggers: {},
    attemptedLike: false,
    attemptedFollow: false,
    recNudgeEligible: false,
    recPickCount: 0,
  }
}

function readSession(): GuestConversionSession {
  if (typeof window === "undefined") return defaultSession()
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return defaultSession()
    const parsed = JSON.parse(raw) as GuestConversionSession
    if (!parsed.sessionId) return defaultSession()
    return { ...defaultSession(), ...parsed }
  } catch {
    return defaultSession()
  }
}

function writeSession(session: GuestConversionSession) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    document.cookie = `${PLAY_COUNT_COOKIE}=${session.playCount}; path=/; SameSite=Lax`
  } catch {
    // ignore quota errors
  }
}

function passiveTriggers(): GuestConversionTrigger[] {
  return ["third_track", "watch_60s", "rec_ready", "history_visit"]
}

export function getGuestPlayCount(): number {
  return readSession().playCount
}

export function hasGuestAttemptedHighIntent(): boolean {
  const s = readSession()
  return s.attemptedLike || s.attemptedFollow
}

export function recordGuestVideoPlay(videoId: string): { playCount: number; isThirdPlay: boolean } {
  const id = String(videoId || "").trim()
  if (!id) return { playCount: readSession().playCount, isThirdPlay: false }

  const session = readSession()
  const isNew = !session.playedVideoIds.includes(id)
  if (!isNew) {
    return { playCount: session.playCount, isThirdPlay: session.playCount >= THIRD_TRACK_THRESHOLD }
  }

  session.playedVideoIds = [...session.playedVideoIds, id].slice(-50)
  session.playCount += 1
  const isThirdPlay = session.playCount === THIRD_TRACK_THRESHOLD
  writeSession(session)

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(GUEST_PLAY_COUNT_CHANGED_EVENT, {
        detail: { playCount: session.playCount, isThirdPlay },
      }),
    )
  }

  return { playCount: session.playCount, isThirdPlay }
}

/** Whether the global 3rd-track bottom bar should show on this route */
export function shouldShowThirdTrackBottomBar(pathname: string): boolean {
  if (pathname.startsWith("/watch/")) return false
  const session = readSession()
  if (hasGuestAttemptedHighIntent()) return false
  if (session.dismissedTriggers.third_track) return false
  return session.playCount >= THIRD_TRACK_THRESHOLD
}

export function markGuestLikeAttempt() {
  const session = readSession()
  session.attemptedLike = true
  writeSession(session)
}

export function markGuestFollowAttempt() {
  const session = readSession()
  session.attemptedFollow = true
  writeSession(session)
}

export function setGuestRecPicksReady(pickCount: number) {
  const session = readSession()
  session.recPickCount = pickCount
  session.recNudgeEligible =
    pickCount >= REC_MIN_PICKS && session.playCount >= REC_MIN_PLAYS
  writeSession(session)
}

export function dismissGuestConversionTrigger(trigger: GuestConversionTrigger) {
  const session = readSession()
  session.dismissedTriggers = { ...session.dismissedTriggers, [trigger]: true }
  writeSession(session)
  notifyGuestConversionChanged()
}

export function markGuestPassiveNudgeShown() {
  const session = readSession()
  session.passiveNudgeShown = true
  writeSession(session)
}

export function canShowPassiveNudge(trigger: GuestConversionTrigger): boolean {
  const session = readSession()
  if (session.dismissedTriggers[trigger]) return false
  if (hasGuestAttemptedHighIntent()) return false

  if (trigger === "third_track") {
    return session.playCount >= THIRD_TRACK_THRESHOLD
  }
  if (trigger === "rec_ready") {
    return session.recNudgeEligible && session.recPickCount >= REC_MIN_PICKS
  }
  if (trigger === "history_visit") {
    return true
  }

  return true
}

/** Highest-priority passive trigger that is eligible and not dismissed */
export function resolvePassiveNudgeTrigger(
  candidates: GuestConversionTrigger[],
): GuestConversionTrigger | null {
  const passive = candidates.filter((t) => passiveTriggers().includes(t))
  const sorted = passive.sort(
    (a, b) => GUEST_CONVERSION_PRIORITY[a] - GUEST_CONVERSION_PRIORITY[b],
  )
  for (const trigger of sorted) {
    if (canShowPassiveNudge(trigger)) return trigger
  }
  return null
}

export function resetGuestConversionSession() {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(SESSION_KEY)
    document.cookie = `${PLAY_COUNT_COOKIE}=; path=/; max-age=0; SameSite=Lax`
  } catch {
    // ignore
  }
}
