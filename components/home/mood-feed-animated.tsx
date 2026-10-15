"use client"

import { useRef, useEffect } from "react"
import { useGSAP } from "@/lib/gsap/register"
import {
  clearFeedMotion,
  dimFeedLoading,
  resetFeedContainer,
  staggerFeedCards,
  prefersReducedMotion,
} from "@/lib/gsap/mood-animations"

interface MoodFeedAnimatedProps {
  children: React.ReactNode
  /** `activeMood` query or `"all"` for default feed. */
  feedKey: string
  loading: boolean
  videoCount: number
  isMoodFeed: boolean
}

export function MoodFeedAnimated({
  children,
  feedKey,
  loading,
  videoCount,
  isMoodFeed,
}: MoodFeedAnimatedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevFeedKey = useRef(feedKey)
  const prevVideoCount = useRef(videoCount)

  // Dim while an empty mood feed loads. Cleanup must restore opacity —
  // killing the tween alone leaves the grid stuck at ~0.35 (the "faded home" bug
  // when switching back to All mid-load).
  useEffect(() => {
    if (!isMoodFeed || !loading || videoCount > 0) return
    const el = containerRef.current
    const tween = dimFeedLoading(el)
    return () => {
      tween?.kill()
      clearFeedMotion(el)
    }
  }, [isMoodFeed, loading, videoCount])

  // Leaving mood mix → always clear residual GSAP opacity/transform on the grid.
  useEffect(() => {
    if (isMoodFeed) return
    clearFeedMotion(containerRef.current)
  }, [isMoodFeed])

  // Stagger cards when mood feed content arrives
  useGSAP(
    () => {
      if (!containerRef.current || !isMoodFeed || prefersReducedMotion()) return

      const feedChanged = prevFeedKey.current !== feedKey
      const videosJustLoaded =
        videoCount > 0 && prevVideoCount.current === 0 && !loading

      if (videosJustLoaded || (feedChanged && videoCount > 0 && !loading)) {
        resetFeedContainer(containerRef.current)
        staggerFeedCards(containerRef.current)
      }

      prevFeedKey.current = feedKey
      prevVideoCount.current = videoCount
    },
    { scope: containerRef, dependencies: [feedKey, loading, videoCount, isMoodFeed] },
  )

  return (
    <div ref={containerRef} className="will-change-transform">
      {children}
    </div>
  )
}
