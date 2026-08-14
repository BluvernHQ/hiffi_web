import { gsap } from "@/lib/gsap/register"

/** Snappy hip-hop timing — quick attack, smooth settle. */
export const MOOD_EASE = {
  in: "power3.out",
  out: "power2.in",
  punch: "back.out(2)",
  elastic: "elastic.out(1, 0.55)",
} as const

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** Slide card down from above (mount). */
export function slideCardIn(el: Element | null | undefined): gsap.core.Tween | void {
  if (!el || prefersReducedMotion()) return
  return gsap.fromTo(
    el,
    { yPercent: -100 },
    { yPercent: 0, duration: 0.9, ease: MOOD_EASE.in, clearProps: "transform" },
  )
}

/** Slide card up and away (dismiss / run mix). */
export function slideCardOut(
  el: Element | null | undefined,
  onComplete?: () => void,
): gsap.core.Tween | void {
  if (!el || prefersReducedMotion()) {
    onComplete?.()
    return
  }
  return gsap.to(el, {
    yPercent: -100,
    duration: 0.5,
    ease: MOOD_EASE.out,
    onComplete,
  })
}

/** Stagger mood orbs after card lands. */
export function staggerMoodOrbs(container: Element | null | undefined): gsap.core.Tween | void {
  if (!container || prefersReducedMotion()) return
  const items = container.querySelectorAll("[data-mood-item]")
  if (items.length === 0) return
  return gsap.from(items, {
    opacity: 0,
    scale: 0.65,
    y: 16,
    duration: 0.42,
    stagger: 0.055,
    ease: MOOD_EASE.punch,
    delay: 0.35,
  })
}

/** Pop the selected mood orb. */
export function punchOrb(orb: Element | null | undefined) {
  if (!orb || prefersReducedMotion()) return
  gsap.fromTo(
    orb,
    { scale: 1 },
    { scale: 1.1, duration: 0.18, ease: MOOD_EASE.punch, yoyo: true, repeat: 1 },
  )
}

/** Fade + slide detail copy when mood changes. */
export function revealMoodDetail(panel: Element | null | undefined) {
  if (!panel || prefersReducedMotion()) return
  gsap.fromTo(
    panel,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.4, ease: MOOD_EASE.in },
  )
}

/** CTA ready pulse when a mood is locked in. */
export function pulseCta(button: Element | null | undefined) {
  if (!button || prefersReducedMotion()) return
  gsap.fromTo(
    button,
    { boxShadow: "0 0 0 0 rgba(237, 28, 47, 0.45)" },
    {
      boxShadow: "0 0 0 10px rgba(237, 28, 47, 0)",
      duration: 0.65,
      ease: "power2.out",
    },
  )
}

/** Dim feed while mood playlist loads. */
export function dimFeedLoading(container: Element | null | undefined): gsap.core.Tween | void {
  if (!container || prefersReducedMotion()) return
  return gsap.to(container, { opacity: 0.35, y: 10, duration: 0.28, ease: MOOD_EASE.out })
}

/** Reset feed container after load. */
export function resetFeedContainer(container: Element | null | undefined): gsap.core.Tween | void {
  if (!container || prefersReducedMotion()) return
  return gsap.to(container, { opacity: 1, y: 0, duration: 0.32, ease: MOOD_EASE.in })
}

/** Stagger track cards when mood feed arrives. */
export function staggerFeedCards(container: Element | null | undefined): gsap.core.Tween | void {
  if (!container || prefersReducedMotion()) return
  const cells = container.querySelectorAll("[data-video-card-cell]")
  if (cells.length === 0) return
  gsap.set(cells, { opacity: 0, y: 22 })
  return gsap.to(cells, {
    opacity: 1,
    y: 0,
    duration: 0.48,
    stagger: 0.04,
    ease: MOOD_EASE.in,
    clearProps: "transform,opacity",
  })
}

/** Crossfade feed on mood switch. */
export function crossfadeFeed(
  container: Element | null | undefined,
  onMidpoint?: () => void,
): gsap.core.Timeline | void {
  if (!container || prefersReducedMotion()) {
    onMidpoint?.()
    return
  }
  const tl = gsap.timeline()
  tl.to(container, { opacity: 0, y: 14, duration: 0.22, ease: MOOD_EASE.out })
    .call(() => onMidpoint?.())
    .to(container, { opacity: 1, y: 0, duration: 0.35, ease: MOOD_EASE.in })
  return tl
}
