"use client"

import * as Tooltip from "@radix-ui/react-tooltip"
import { BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"

type VerifiedBadgeProps = {
  /** Icon size and colour, e.g. `h-4 w-4 text-[#4F7AE1]`. */
  className?: string
  strokeWidth?: number
  /** Leave false inside links and buttons so the badge doesn't add a nested tab stop. */
  focusable?: boolean
}

/** Blue check for claimed artist profiles, with a short explanation on hover. */
export function VerifiedBadge({ className, strokeWidth, focusable = false }: VerifiedBadgeProps) {
  return (
    <Tooltip.Provider delayDuration={120} skipDelayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span
            tabIndex={focusable ? 0 : undefined}
            className="pointer-events-auto inline-flex shrink-0 cursor-default rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#6F95F0]/60"
          >
            <BadgeCheck className={cn("h-4 w-4", className)} strokeWidth={strokeWidth} aria-hidden />
            <span className="sr-only">Verified artist</span>
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={8}
            collisionPadding={12}
            className="z-[100] max-w-[240px] rounded-xl border border-white/10 bg-[#0B0B0C] px-3.5 py-2.5 text-left font-sans normal-case tracking-normal text-[#F4F1EA] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95"
          >
            <p className="flex items-center gap-1.5 text-[13px] font-semibold">
              <BadgeCheck className="h-3.5 w-3.5 text-[#6F95F0]" aria-hidden />
              Verified artist
            </p>
            <p className="mt-1 text-xs leading-5 text-white/60">
              The artist has claimed this profile and runs it on Hiffi.
            </p>
            <Tooltip.Arrow className="fill-[#0B0B0C]" width={10} height={5} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
