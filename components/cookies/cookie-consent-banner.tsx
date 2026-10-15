"use client"

import { useCallback, useEffect, useId, useState } from "react"
import Link from "next/link"
import { Cookie, ChevronUp, X } from "lucide-react"
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

type PanelMode = "chip" | "panel"

export function CookieConsentBanner() {
  const titleId = useId()
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<PanelMode>("chip")
  const [customize, setCustomize] = useState(false)
  const [prefs, setPrefs] = useState<CustomizeState>({
    functional: true,
    analytics: true,
  })

  const showBanner = useCallback((forceOpen = false) => {
    const existing = getCookieConsent()
    if (existing) {
      setPrefs({
        functional: existing.functional,
        analytics: existing.analytics,
      })
      setCustomize(true)
      setMode("panel")
    } else {
      setPrefs({ functional: true, analytics: true })
      setCustomize(false)
      setMode(forceOpen ? "panel" : "chip")
    }
    setVisible(true)
  }, [])

  useEffect(() => {
    if (!hasCookieDecision()) {
      setVisible(true)
      setMode("chip")
    }
    const onOpenSettings = () => showBanner(true)
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings)
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, onOpenSettings)
  }, [showBanner])

  const dismiss = () => {
    setVisible(false)
    setCustomize(false)
    setMode("chip")
  }

  if (!visible) return null

  const isChip = mode === "chip"

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] pointer-events-none sm:right-auto sm:w-full sm:max-w-sm">
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        className={cn(
          "pointer-events-auto overflow-hidden rounded-2xl border border-border/80",
          "bg-background/95 shadow-lg ring-1 ring-black/5 backdrop-blur-md",
          "animate-in fade-in slide-in-from-bottom-2 duration-300",
        )}
      >
        {isChip ? (
          <div className="flex items-center gap-2 p-2">
            <button
              type="button"
              onClick={() => setMode("panel")}
              className={cn(
                "group flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-0.5 text-left",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              )}
              aria-expanded={false}
            >
              <span
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
                aria-hidden
              >
                <Cookie className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
              </span>
              <span className="min-w-0 flex-1">
                <span id={titleId} className="block truncate text-sm font-semibold text-foreground">
                  Cookies on deck
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  Tap for details
                </span>
              </span>
              <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>

            <Button
              type="button"
              size="sm"
              className="h-9 shrink-0 rounded-xl px-3 text-xs"
              onClick={() => {
                acceptAllCookies()
                dismiss()
              }}
            >
              Accept
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-start gap-3 border-b border-border/60 px-3.5 pb-3 pt-3.5">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
                aria-hidden
              >
                <Cookie className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Hiffi · backstage note
                </p>
                <h2 id={titleId} className="text-base font-semibold text-foreground">
                  We use cookies
                </h2>
              </div>
              {!hasCookieDecision() && (
                <button
                  type="button"
                  className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Minimize cookie notice"
                  onClick={() => {
                    setCustomize(false)
                    setMode("chip")
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-3 p-3.5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Necessary ones keep sign-in and security working. Optional ones remember prefs and
                help us improve Hiffi.{" "}
                <Link href="/cookie-policy" className="font-medium text-primary hover:underline">
                  Cookie Policy
                </Link>
              </p>

              {customize && (
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
                  <label className="flex items-start gap-3 text-sm">
                    <Checkbox checked disabled className="mt-0.5" aria-label="Necessary cookies always on" />
                    <span>
                      <span className="font-medium text-foreground">Necessary</span>
                      <span className="block text-muted-foreground">
                        Login, security, and remembering this choice. Always on.
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
                        Mute, volume, mood mix, referrals.
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
                        Usage insights so we can improve the product.
                      </span>
                    </span>
                  </label>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {!customize ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => {
                          rejectNonEssentialCookies()
                          dismiss()
                        }}
                      >
                        Reject optional
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => {
                          acceptAllCookies()
                          dismiss()
                        }}
                      >
                        Accept all
                      </Button>
                    </div>
                    <button
                      type="button"
                      className="text-center text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      onClick={() => setCustomize(true)}
                    >
                      Customize what we use
                    </button>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => {
                          rejectNonEssentialCookies()
                          dismiss()
                        }}
                      >
                        Reject optional
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => {
                          saveCookieConsent(prefs)
                          dismiss()
                        }}
                      >
                        Save choices
                      </Button>
                    </div>
                    <button
                      type="button"
                      className="text-center text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      onClick={() => {
                        if (!hasCookieDecision()) setCustomize(false)
                        else dismiss()
                      }}
                    >
                      {hasCookieDecision() ? "Close" : "Back"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
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
