"use client"

import Link from "next/link"
import { History } from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CompactVideoCard } from "@/components/video/compact-video-card"
import { buildSignupUrl } from "@/lib/auth-utils"
import { dismissGuestConversionTrigger } from "@/lib/guest-conversion/session"
import { getGuestHistory } from "@/lib/guest-conversion/guest-history"
import { captureConversionEvent } from "@/lib/conversion-tracking"
import { useEffect, useRef } from "react"

export function GuestHistoryView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString() ? `?${searchParams.toString()}` : undefined
  const signupUrl = buildSignupUrl(pathname, searchParamsString)
  const history = getGuestHistory()
  const shown = history.slice(0, 2)
  const shownRef = useRef(false)

  useEffect(() => {
    if (shownRef.current) return
    shownRef.current = true
    dismissGuestConversionTrigger("history_visit")
    captureConversionEvent("conversion_passive_nudge_shown", {
      trigger: "history_visit",
      source_path: pathname,
    })
  }, [pathname])

  return (
    <div className="w-full px-3 py-4 sm:px-4 md:px-4 lg:pl-4 lg:pr-6">
      <div className="mb-6 flex items-center gap-2">
        <History className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Watch history</h1>
      </div>

      {shown.length > 0 ? (
        <div className="mb-8 space-y-2">
          {shown.map((entry) => (
            <CompactVideoCard
              key={entry.videoId}
              video={{
                videoId: entry.videoId,
                videoTitle: entry.title,
                videoThumbnail: entry.thumbnail,
                userUsername: entry.artistUsername,
              }}
              hideTimestamp
            />
          ))}
          {history.length > 2 ? (
            <div
              className="relative mt-4 overflow-hidden rounded-xl border border-dashed border-border/60"
              aria-hidden
            >
              <div className="pointer-events-none space-y-2 p-2 opacity-40 blur-[2px]">
                {history.slice(2, 4).map((entry) => (
                  <div key={`fade-${entry.videoId}`} className="h-16 rounded-lg bg-muted/50" />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          Tracks you play this session will show up here until you close the tab.
        </p>
      )}

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-6 text-center">
        <p className="text-sm font-semibold text-foreground">Sign up to keep your history</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your session clears when you close the tab.
        </p>
        <Button asChild className="mt-4 rounded-full px-6" size="lg">
          <Link href={signupUrl} data-analytics-name="guest-history-signup">
            Create free account
          </Link>
        </Button>
      </div>
    </div>
  )
}
