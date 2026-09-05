"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Cookie } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  acceptAllCookies,
  getCookieConsent,
  hasCookieDecision,
  OPEN_COOKIE_SETTINGS_EVENT,
  rejectNonEssentialCookies,
  saveCookieConsent,
} from "@/lib/cookie-consent"
import { cn } from "@/lib/utils"

type CustomizeState = {
  functional: boolean
  analytics: boolean
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const [customize, setCustomize] = useState(false)
  const [prefs, setPrefs] = useState<CustomizeState>({
    functional: true,
    analytics: true,
  })

  const showBanner = useCallback((forceCustomize = false) => {
    const existing = getCookieConsent()
    if (existing) {
      setPrefs({
        functional: existing.functional,
        analytics: existing.analytics,
      })
    } else {
      setPrefs({ functional: true, analytics: true })
    }
    setCustomize(forceCustomize || Boolean(existing))
    setVisible(true)
  }, [])

  useEffect(() => {
    if (!hasCookieDecision()) {
      setVisible(true)
    }
    const onOpenSettings = () => showBanner(true)
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings)
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings)
  }, [showBanner])

  const dismiss = () => {
    setVisible(false)
    setCustomize(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4 pointer-events-none"
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto w-full max-w-3xl rounded-xl border border-border bg-background shadow-lg",
          "ring-1 ring-black/5",
        )}
      >
        <div className="flex gap-3 p-4 sm:p-5">
          <div className="mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex">
            <Cookie className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1.5">
              <h2 id="cookie-consent-title" className="text-base font-semibold text-foreground">
                We use cookies
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Necessary cookies keep Hiffi working (sign-in and security). Optional cookies help
                with preferences and analytics. Read our{" "}
                <Link href="/cookie-policy" className="font-medium text-primary hover:underline">
                  Cookie Policy
                </Link>
                .
              </p>
            </div>

            {customize && (
              <div className="space-y-3 rounded-lg border border-border/80 bg-muted/40 p-3">
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox checked disabled className="mt-0.5" aria-label="Necessary cookies always on" />
                  <span>
                    <span className="font-medium text-foreground">Necessary</span>
                    <span className="block text-muted-foreground">
                      Required for login, security, and remembering this choice. Always on.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <Checkbox
                    checked={prefs.functional}
                    onCheckedChange={(v) =>
                      setPrefs((p) => ({ ...p, functional: v === true }))
                    }
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium text-foreground">Functional</span>
                    <span className="block text-muted-foreground">
                      Player mute/volume, mood mix, referrals, and similar preferences.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <Checkbox
                    checked={prefs.analytics}
                    onCheckedChange={(v) =>
                      setPrefs((p) => ({ ...p, analytics: v === true }))
                    }
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium text-foreground">Analytics</span>
                    <span className="block text-muted-foreground">
                      Helps us understand usage (e.g. Umami, Google Analytics, Microsoft Clarity).
                    </span>
                  </span>
                </label>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              {!customize ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="sm:mr-auto"
                    onClick={() => setCustomize(true)}
                  >
                    Customize
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      rejectNonEssentialCookies()
                      dismiss()
                    }}
                  >
                    Reject non-essential
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      acceptAllCookies()
                      dismiss()
                    }}
                  >
                    Accept all
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="sm:mr-auto"
                    onClick={() => {
                      if (!hasCookieDecision()) setCustomize(false)
                      else dismiss()
                    }}
                  >
                    {hasCookieDecision() ? "Close" : "Back"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      rejectNonEssentialCookies()
                      dismiss()
                    }}
                  >
                    Reject non-essential
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      saveCookieConsent(prefs)
                      dismiss()
                    }}
                  >
                    Save preferences
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Footer / policy link to reopen the preference panel. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={cn(
        "text-sm text-foreground/90 underline-offset-4 hover:text-foreground hover:underline",
        className,
      )}
      onClick={() => {
        window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT))
      }}
    >
      Cookie settings
    </button>
  )
}
