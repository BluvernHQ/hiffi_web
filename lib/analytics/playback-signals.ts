import { isAdminAnalyticsSurface } from "@/lib/analytics/admin-analytics-guard"
import { recAttributionProps } from "@/lib/recs/attribution"
import { recordSessionOutcome } from "@/lib/recs/session"

/**
 * Implicit feedback for recommendations (sent for guests and users alike):
 * - video_progress at 25/50/75/90% of the duration
 * - video_complete when playback reaches the end
 * - video_replay when a finished video is played again, or restarted after real listening
 * - video_skip when the viewer leaves an unfinished video (next, navigation, closing the tab)
 * Watched seconds count real playback only (seeks are excluded).
 */

const MILESTONES = [25, 50, 75, 90]
/** Real-playback jumps above this are seeks, not watching. */
const MAX_TICK_DELTA = 2.5

type Active = {
  videoId: string
  startedAt: number
  watched: number
  lastTime: number | null
  duration: number
  position: number
  milestones: Set<number>
  completed: boolean
}

function capture(tag: string, videoId: string, props: Record<string, unknown>) {
  if (typeof window === "undefined" || isAdminAnalyticsSurface()) return
  try {
    window.HifiAnalytics?.capture(tag, { video_id: videoId, ...recAttributionProps(videoId), ...props })
  } catch {
    // best-effort only
  }
}

const round = (n: number) => Math.round(n * 10) / 10

export function createPlaybackSignals() {
  let active: Active | null = null

  const leave = (reason: "next" | "navigate" | "close") => {
    const a = active
    active = null
    if (!a || a.completed) return
    const fraction = a.duration > 0 ? Math.min(1, a.position / a.duration) : 0
    if (a.watched < 5) recordSessionOutcome(a.videoId, "early_skip")
    else if (fraction < 0.5) recordSessionOutcome(a.videoId, "skip")
    capture("video_skip", a.videoId, {
      reason,
      seconds_watched: round(a.watched),
      position_seconds: round(a.position),
      duration_seconds: round(a.duration),
      fraction: Math.round(fraction * 1000) / 1000,
    })
  }

  return {
    /** First play of a video (switching videos ends the previous one as a skip). */
    start(videoId: string) {
      if (!videoId || active?.videoId === videoId) return
      leave("next")
      active = {
        videoId,
        startedAt: Date.now(),
        watched: 0,
        lastTime: null,
        duration: 0,
        position: 0,
        milestones: new Set(),
        completed: false,
      }
    },

    tick(currentTime: number, duration: number, playing: boolean) {
      const a = active
      if (!a) return
      if (duration > 0) a.duration = duration
      // Jumping back to the start after real listening is a replay, like replaying after the end.
      if (
        !a.completed &&
        a.lastTime !== null &&
        currentTime < 2 &&
        a.lastTime > 5 &&
        a.watched >= Math.max(30, a.duration * 0.25)
      ) {
        recordSessionOutcome(a.videoId, "replay")
        capture("video_replay", a.videoId, { restart: true, seconds_watched: round(a.watched) })
        a.watched = 0
        a.position = 0
        a.milestones.clear()
        a.lastTime = currentTime
        return
      }
      if (playing && a.lastTime !== null) {
        const delta = currentTime - a.lastTime
        if (delta > 0 && delta <= MAX_TICK_DELTA) a.watched += delta
      }
      a.lastTime = currentTime
      a.position = Math.max(a.position, currentTime)
      if (a.duration <= 0) return
      const pct = (currentTime / a.duration) * 100
      for (const m of MILESTONES) {
        if (pct >= m && !a.milestones.has(m) && a.watched >= (a.duration * m) / 100 / 2) {
          a.milestones.add(m)
          capture("video_progress", a.videoId, { pct: m, seconds_watched: round(a.watched) })
        }
      }
    },

    ended() {
      const a = active
      if (!a || a.completed) return
      a.completed = true
      recordSessionOutcome(a.videoId, "complete")
      capture("video_complete", a.videoId, {
        seconds_watched: round(a.watched),
        duration_seconds: round(a.duration),
      })
    },

    replay(videoId: string) {
      recordSessionOutcome(videoId, "replay")
      capture("video_replay", videoId, {})
      active = null
      this.start(videoId)
    },

    leave,

    /** Flush a pending skip before the tab goes away (the tracker beacons on pagehide). */
    leaveOnPageHide() {
      if (!active || active.completed) return
      leave("close")
      try {
        window.HifiAnalytics?.flushBeacon()
      } catch {
        // ignore
      }
    },
  }
}
