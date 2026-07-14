"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { buildSignupUrl } from "@/lib/auth-utils"
import { captureConversionEvent } from "@/lib/conversion-tracking"
import {
  dismissGuestConversionTrigger,
  getGuestPlayCount,
} from "@/lib/guest-conversion/session"
import { cn } from "@/lib/utils"

type GuestNudgeBottomBarProps = {
  className?: string
}

/** Fixed bottom bar after 3rd unique track in a guest session */
export function GuestNudgeBottomBar({ className }: GuestNudgeBottomBarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString() ? `?${searchParams.toString()}` : undefined
  const playCount = getGuestPlayCount()
  const signupUrl = buildSignupUrl(pathname, searchParamsString)
  const shownRef = useRef(false)
  const [dismissed, setDismissed] = useState(false)

  const dismiss = () => {
    setDismissed(true)
    dismissGuestConversionTrigger("third_track")
    captureConversionEvent("conversion_passive_nudge_dismissed", {
      trigger: "third_track",
      source_path: pathname,
    })
  }

  useEffect(() => {
    if (shownRef.current) return
    shownRef.current = true
    captureConversionEvent("conversion_passive_nudge_shown", {
      trigger: "third_track",
      play_count: playCount,
      source_path: pathname,
    })
  }, [pathname, playCount])

  if (dismissed) return null

  return (
    <div
      role="region"
      aria-label="Sign up suggestion"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[110] border-t border-border/80 bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-300",
        className,
      )}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground">
          You&apos;ve played {playCount} tracks — sign up for picks tailored to you
        </p>
        <Button asChild size="sm" className="shrink-0 rounded-full px-4 font-semibold">
          <Link href={signupUrl} data-analytics-name="guest-third-track-signup">
            Sign up free
          </Link>
        </Button>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
