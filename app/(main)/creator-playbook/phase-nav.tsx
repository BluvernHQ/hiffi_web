"use client"

import type { MouseEvent } from "react"
import { cn } from "@/lib/utils"

type PhaseNavItem = { label: string; targetId: string; highlight?: boolean }

export function PhaseNav({ items }: { items: PhaseNavItem[] }) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>, targetId: string) => {
    const target = document.getElementById(targetId)
    if (!target) return
    event.preventDefault()
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })
    window.history.replaceState(null, "", `#${targetId}`)
  }

  return (
    <nav aria-label="Playbook phases">
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:gap-x-4">
        {items.map(({ label, targetId, highlight }, index) => (
          <li key={targetId + label} className="flex items-center gap-3 sm:gap-4">
            {index > 0 && <span className="h-1 w-1 rounded-full bg-white/25" aria-hidden />}
            <a
              href={`#${targetId}`}
              onClick={(event) => handleClick(event, targetId)}
              className={cn(
                "inline-flex items-center gap-2 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0f]",
                highlight ? "font-semibold text-white hover:text-white/80" : "text-white/60 hover:text-white",
              )}
            >
              {highlight && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />}
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
