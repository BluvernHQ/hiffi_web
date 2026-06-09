"use client"

import { useRef } from "react"
import { gsap, useGSAP } from "@/lib/gsap/register"
import { MOOD_EASE, prefersReducedMotion } from "@/lib/gsap/mood-animations"

interface MoodPickerTeaserProps {
  onOpen: () => void
}

export function MoodPickerTeaser({ onOpen }: MoodPickerTeaserProps) {
  const teaserRef = useRef<HTMLButtonElement>(null)
  const stripeRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!teaserRef.current || prefersReducedMotion()) return

      gsap.from(teaserRef.current, {
        opacity: 0,
        y: 16,
        duration: 0.5,
        ease: MOOD_EASE.in,
      })
      gsap.from(stripeRef.current, {
        scaleY: 0,
        transformOrigin: "top center",
        duration: 0.4,
        delay: 0.15,
        ease: MOOD_EASE.in,
      })
    },
    { scope: teaserRef },
  )

  const handleHover = () => {
    if (!teaserRef.current || prefersReducedMotion()) return
    gsap.to(teaserRef.current, { x: 3, duration: 0.25, ease: MOOD_EASE.in })
  }

  const handleLeave = () => {
    if (!teaserRef.current || prefersReducedMotion()) return
    gsap.to(teaserRef.current, { x: 0, duration: 0.3, ease: "power2.out" })
  }

  return (
    <button
      ref={teaserRef}
      type="button"
      onClick={onOpen}
      onMouseEnter={handleHover}
      onMouseLeave={handleLeave}
      className="group relative flex w-full items-center gap-3 overflow-hidden border border-border bg-card px-4 py-3.5 text-left shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div
        ref={stripeRef}
        className="absolute left-0 top-0 h-full w-1 bg-primary transition-colors group-hover:bg-primary/80"
        aria-hidden
      />

      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10">
        <span className="font-[family-name:var(--font-bebas)] text-lg text-primary">♪</span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-[family-name:var(--font-bebas)] text-xl tracking-wide text-foreground">
          What&apos;s the move?
        </p>
        <p className="font-[family-name:var(--font-dm-sans)] text-xs text-muted-foreground">
          Seven moods. One tap. Your lane.
        </p>
      </div>

      <span className="shrink-0 font-[family-name:var(--font-bebas)] text-sm tracking-widest text-primary">
        OPEN
      </span>
    </button>
  )
}
