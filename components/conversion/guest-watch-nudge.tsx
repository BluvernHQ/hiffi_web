"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { buildSignupUrl } from "@/lib/auth-utils"
import { captureConversionEvent } from "@/lib/conversion-tracking"
import {
  canShowPassiveNudge,
  dismissGuestConversionTrigger,
  resolvePassiveNudgeTrigger,
} from "@/lib/guest-conversion/session"
import { cn } from "@/lib/utils"

const WATCH_DWELL_MS = 60_000

type GuestWatchNudgeProps = {
  videoId?: string
  className?: string
}

/** Slides in below the player after 60s on watch — does not block playback */
export function GuestWatchNudge({ videoId, className }: GuestWatchNudgeProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString() ? `?${searchParams.toString()}` : undefined
  const signupUrl = buildSignupUrl(pathname, searchParamsString)
  const [visible, setVisible] = useState(false)
  const shownRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setVisible(false)
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const trigger = resolvePassiveNudgeTrigger(["watch_60s", "rec_ready"])
      if (trigger === "watch_60s" && canShowPassiveNudge("watch_60s")) {
        setVisible(true)
      }
    }, WATCH_DWELL_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [videoId])

  useEffect(() => {
    if (!visible || shownRef.current) return
    shownRef.current = true
    captureConversionEvent("conversion_passive_nudge_shown", {
      trigger: "watch_60s",
      video_id: videoId,
      source_path: pathname,
    })
  }, [visible, videoId, pathname])

  const dismiss = () => {
    setVisible(false)
    dismissGuestConversionTrigger("watch_60s")
    captureConversionEvent("conversion_passive_nudge_dismissed", {
      trigger: "watch_60s",
      source_path: pathname,
    })
  }

  if (!visible) return null

  return (
    <div
      className={cn(
        "mt-3 flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 animate-in slide-in-from-bottom-2 fade-in duration-300",
        className,
      )}
      role="region"
      aria-label="Sign up to save this track"
    >
      <p className="min-w-0 flex-1 text-sm text-foreground">
        Sign up to save this track and get personalised picks
      </p>
      <Button asChild size="sm" variant="default" className="shrink-0 rounded-full">
        <Link href={signupUrl} data-analytics-name="guest-watch-60s-signup">
          Sign up free
        </Link>
      </Button>
      <button
        type="button"
        onClick={dismiss}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-background/80"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
