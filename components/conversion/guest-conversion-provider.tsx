"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  GUEST_CONVERSION_SESSION_CHANGED,
  GUEST_PLAY_COUNT_CHANGED_EVENT,
  shouldShowThirdTrackBottomBar,
} from "@/lib/guest-conversion/session"
import { GuestNudgeBottomBar } from "./guest-nudge-bottom-bar"

type GuestConversionProviderProps = {
  children: React.ReactNode
}

/**
 * Global guest conversion shell: shows the 3rd-track bottom bar when eligible.
 * Play count lives in sessionStorage (survives full page reloads). Re-checks on
 * route change and when a new guest play is recorded.
 * Page-specific nudges (watch 60s, up next) are mounted on those routes.
 */
export function GuestConversionProvider({ children }: GuestConversionProviderProps) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const [showThirdTrackBar, setShowThirdTrackBar] = useState(false)

  const syncThirdTrackBar = useCallback(() => {
    if (loading || user) {
      setShowThirdTrackBar(false)
      return
    }
    setShowThirdTrackBar(shouldShowThirdTrackBottomBar(pathname))
  }, [loading, user, pathname])

  useEffect(() => {
    syncThirdTrackBar()
  }, [syncThirdTrackBar])

  useEffect(() => {
    if (typeof window === "undefined") return
    const onSessionChanged = () => syncThirdTrackBar()
    window.addEventListener(GUEST_PLAY_COUNT_CHANGED_EVENT, onSessionChanged)
    window.addEventListener(GUEST_CONVERSION_SESSION_CHANGED, onSessionChanged)
    return () => {
      window.removeEventListener(GUEST_PLAY_COUNT_CHANGED_EVENT, onSessionChanged)
      window.removeEventListener(GUEST_CONVERSION_SESSION_CHANGED, onSessionChanged)
    }
  }, [syncThirdTrackBar])

  return (
    <>
      {children}
      {!user && showThirdTrackBar ? <GuestNudgeBottomBar /> : null}
    </>
  )
}
