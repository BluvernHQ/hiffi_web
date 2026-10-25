"use client"

import { trackId } from "@/lib/analytics/tracking-ids"
import { useEffect, useState, type CSSProperties } from "react"
import { ArrowRight, Check, Clock, Mail } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { getArtistImageUrl } from "@/lib/artist-directory"

/** How long the welcome stays up before handing off to the destination. */
export const CLAIM_WELCOME_REDIRECT_MS = 5200

type ClaimWelcomeProps = {
  artist: Artist
  email: string
  phase: "signing_in" | "ready"
  destinationLabel: string
  onContinue: () => void
}

function rise(delayMs: number): CSSProperties {
  return { animationDelay: `${delayMs}ms` }
}

/** Full-screen hand-off after a password claim: shimmer while the session is set up, then a short welcome. */
export function ClaimWelcome({ artist, email, phase, destinationLabel, onContinue }: ClaimWelcomeProps) {
  const photo = getArtistImageUrl(artist.image) ?? getArtistImageUrl(artist.banner_image)
  const [progressStarted, setProgressStarted] = useState(false)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    if (phase !== "ready") return
    const frame = requestAnimationFrame(() => setProgressStarted(true))
    const timer = window.setTimeout(onContinue, CLAIM_WELCOME_REDIRECT_MS)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [phase, onContinue])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-label={phase === "ready" ? `Welcome to Hiffi, ${artist.name}` : "Setting up your account"}
      className="fixed inset-0 z-[95] isolate flex items-center justify-center overflow-y-auto bg-[#070708] px-6 py-12 text-[#F4F1EA]"
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          aria-hidden
          className="absolute inset-0 -z-10 h-full w-full scale-125 object-cover opacity-25 blur-3xl saturate-[1.3]"
        />
      ) : null}
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(232,25,44,0.22),transparent_60%)]"
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#070708]/40 via-[#070708]/80 to-[#070708]" aria-hidden />

      {phase === "signing_in" ? (
        <div className="flex w-full max-w-md flex-col items-center text-center" aria-busy="true">
          <div className="ink-skeleton h-24 w-24 rounded-full" />
          <div className="ink-skeleton mt-8 h-2.5 w-28 rounded-full" />
          <div className="ink-skeleton mt-5 h-9 w-72 max-w-full rounded-lg" />
          <div className="ink-skeleton mt-3 h-9 w-56 max-w-full rounded-lg" />
          <div className="mt-10 w-full space-y-3">
            <div className="ink-skeleton h-16 w-full rounded-2xl" />
          </div>
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">
            Setting up your account
          </p>
        </div>
      ) : (
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <div className="artist-rise relative" style={rise(0)}>
            <div className="h-24 w-24 overflow-hidden rounded-full bg-white/5 ring-1 ring-[#F2C662]/40 ring-offset-4 ring-offset-[#070708]">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-signal flex h-full w-full items-center justify-center text-3xl font-bold uppercase">
                  {artist.name.slice(0, 1)}
                </span>
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#F2C662] text-[#0B0B0C] shadow-lg">
              <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
            </span>
          </div>

          <p
            className="artist-rise mt-8 font-mono text-[10px] uppercase tracking-[0.32em] text-[#F2C662]"
            style={rise(120)}
          >
            Claim received
          </p>
          <h1
            className="artist-rise font-signal mt-3 text-[2.5rem] font-bold uppercase leading-[0.9] tracking-[-0.005em] sm:text-[3.25rem]"
            style={rise(200)}
          >
            Welcome to Hiffi, {artist.name}.
          </h1>
          <p className="artist-rise mt-4 max-w-sm text-sm leading-6 text-white/60" style={rise(300)}>
            You&apos;re signed in as <span className="font-semibold text-[#F4F1EA]">@{artist.slug}</span>. Your
            profile is on its way to being yours.
          </p>

          <ul
            className="artist-rise mt-8 w-full divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03] text-left backdrop-blur-sm"
            style={rise(420)}
          >
            <li className="flex items-start gap-3 px-4 py-3.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#E8192C]" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-semibold">Confirm your email</p>
                <p className="truncate text-xs text-white/50">Link sent to {email}</p>
              </div>
            </li>
            <li className="flex items-start gap-3 px-4 py-3.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-white/50" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-semibold">Hiffi team review</p>
                <p className="text-xs text-white/50">Usually 24–48 hours. Owner tools unlock once approved.</p>
              </div>
            </li>
          </ul>

          <div className="artist-rise mt-10 w-full" style={rise(560)}>
            <div className="h-px w-full overflow-hidden bg-white/10">
              <div
                className="h-full bg-[#F2C662] ease-linear motion-reduce:transition-none"
                style={{
                  width: progressStarted ? "100%" : "0%",
                  transitionProperty: "width",
                  transitionDuration: `${CLAIM_WELCOME_REDIRECT_MS}ms`,
                }}
              />
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                Taking you to {destinationLabel}
              </p>
              <button
                type="button"
                onClick={onContinue}
                {...trackId("claim-welcome-continue")}
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#F4F1EA] transition-colors hover:text-[#F2C662]"
              >
                Go now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
