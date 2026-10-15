import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Mono eyebrow with a short red rule — the body's only use of Hiffi red. */
export function ArtistDetailEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.32em] text-[#77726A] sm:text-[11px]",
        className,
      )}
    >
      <span className="h-px w-6 bg-[#E8192C]" aria-hidden />
      {children}
    </p>
  )
}

export function ArtistDetailHeading({
  children,
  id,
  className,
}: {
  children: ReactNode
  id?: string
  className?: string
}) {
  return (
    <h2
      id={id}
      className={cn(
        "font-signal mt-3 text-[clamp(2rem,4.2vw,3.25rem)] font-bold uppercase leading-[0.9] text-[#0B0B0C]",
        className,
      )}
    >
      {children}
    </h2>
  )
}
