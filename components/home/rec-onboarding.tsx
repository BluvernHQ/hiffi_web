"use client"

import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProfilePicture } from "@/components/profile/profile-picture"
import { trackId } from "@/lib/analytics/tracking-ids"
import { useAuth } from "@/lib/auth-context"
import { MOODS } from "@/lib/mood-tabs"
import {
  getOnboardingOptions,
  localPicks,
  saveOnboardingPicks,
  type OnboardingOptions,
} from "@/lib/recs/client"
import { RECS_PICKS_SAVED_EVENT } from "@/components/home/recs-rows"
import { cn } from "@/lib/utils"

const DONE_KEY = "hiffi_rec_onboarded_v1"
const SHOW_DELAY_MS = 4000
const MIN_ARTISTS = 3

/**
 * "Pick three artists" (advisory: progressive onboarding). Shown once, after the first few seconds
 * on home, never blocking playback; skipping is remembered. Picks seed the taste until real
 * listening takes over.
 */
export function RecOnboarding() {
  const { user, loading: authLoading } = useAuth()
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<OnboardingOptions | null>(null)
  const [artists, setArtists] = useState<string[]>([])
  const [moods, setMoods] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (authLoading || typeof window === "undefined") return
    try {
      if (localStorage.getItem(DONE_KEY)) return
    } catch {
      return
    }
    if (localPicks().artists.length > 0) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      getOnboardingOptions()
        .then((opts) => {
          if (cancelled || opts.artists.length < MIN_ARTISTS) return
          if (opts.picked.artists.length > 0) {
            localStorage.setItem(DONE_KEY, "server")
            return
          }
          setOptions(opts)
          setOpen(true)
        })
        .catch(() => {
          // v2 disabled or offline: no onboarding
        })
    }, SHOW_DELAY_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [authLoading, user?.uid])

  const finish = (value: string) => {
    try {
      localStorage.setItem(DONE_KEY, value)
    } catch {
      // ignore
    }
    setOpen(false)
  }

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  const save = async () => {
    setSaving(true)
    try {
      await saveOnboardingPicks({ artists, moods })
      window.dispatchEvent(new CustomEvent(RECS_PICKS_SAVED_EVENT))
      finish("saved")
    } catch (err) {
      console.warn("[hiffi] saving picks failed:", err)
      finish("saved-local")
    } finally {
      setSaving(false)
    }
  }

  if (!options) return null
  const moodLabels = new Map(MOODS.map((m) => [m.query.toLowerCase(), m.label]))

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : finish("dismissed"))}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pick 3 artists you like</DialogTitle>
          <DialogDescription>
            We'll tune your feed to them right away. What you watch next keeps shaping it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {options.artists.map((a) => {
            const key = a.username.toLowerCase()
            const picked = artists.includes(key)
            return (
              <button
                key={a.uid}
                type="button"
                {...trackId("rec-onboarding-artist", key)}
                onClick={() => toggle(artists, setArtists, key)}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition-colors",
                  picked ? "border-primary bg-primary/10" : "hover:bg-muted/60",
                )}
                aria-pressed={picked}
              >
                <ProfilePicture user={{ username: a.username, name: a.name, profile_picture: a.profile_picture }} size="xl" />
                <span className="w-full truncate text-xs font-medium">{a.name || a.username}</span>
                {picked ? (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-primary p-0.5 text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Any moods? (optional)</p>
          <div className="flex flex-wrap gap-2">
            {options.moods.map((m) => {
              const picked = moods.includes(m)
              return (
                <button
                  key={m}
                  type="button"
                  {...trackId("rec-onboarding-mood", m)}
                  onClick={() => toggle(moods, setMoods, m)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition-colors",
                    picked ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted/60",
                  )}
                  aria-pressed={picked}
                >
                  {moodLabels.get(m) ?? m}
                </button>
              )
            })}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" {...trackId("rec-onboarding-skip")} onClick={() => finish("skipped")}>
            Skip
          </Button>
          <Button
            {...trackId("rec-onboarding-save")}
            disabled={artists.length < MIN_ARTISTS || saving}
            onClick={() => void save()}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {artists.length < MIN_ARTISTS ? `Pick ${MIN_ARTISTS - artists.length} more` : "Tune my feed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
