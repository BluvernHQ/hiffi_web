"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { buildSignupUrl } from "@/lib/auth-utils"
import { captureConversionEvent } from "@/lib/conversion-tracking"
import {
  dismissGuestConversionTrigger,
} from "@/lib/guest-conversion/session"
import { cn } from "@/lib/utils"

type GuestUpNextNudgeProps = {
  pickCount: number
  className?: string
}

/** Inline nudge in the Up Next panel when session picks are ready */
export function GuestUpNextNudge({ pickCount, className }: GuestUpNextNudgeProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString() ? `?${searchParams.toString()}` : undefined
  const signupUrl = buildSignupUrl(pathname, searchParamsString)
  const shownRef = useRef(false)

  useEffect(() => {
    if (shownRef.current) return
    shownRef.current = true
    captureConversionEvent("conversion_passive_nudge_shown", {
      trigger: "rec_ready",
      pick_count: pickCount,
      source_path: pathname,
    })
  }, [pickCount, pathname])

  const dismiss = () => {
    dismissGuestConversionTrigger("rec_ready")
    captureConversionEvent("conversion_passive_nudge_dismissed", {
      trigger: "rec_ready",
      source_path: pathname,
    })
  }

  return (
    <div
      className={cn(
        "mb-3 rounded-xl border border-primary/25 bg-primary/5 px-3.5 py-3",
        className,
      )}
      role="region"
      aria-label="Your picks are ready"
    >
      <div className="flex gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium leading-snug text-foreground">
            Your picks are ready — we&apos;ve matched {pickCount} tracks to your session. Sign up to
            save them.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" className="h-9 rounded-full px-4">
              <Link href={signupUrl} data-analytics-name="guest-rec-ready-signup">
                Sign up free
              </Link>
            </Button>
            <button
              type="button"
              onClick={dismiss}
              className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
