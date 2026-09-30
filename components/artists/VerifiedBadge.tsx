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
            sideOffset={6}
            collisionPadding={12}
            className="z-[100] whitespace-nowrap rounded-md bg-[#0B0B0C] px-2 py-1 font-sans text-[11px] font-medium normal-case tracking-normal text-[#F4F1EA] shadow-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0"
          >
            Verified artist
            <Tooltip.Arrow className="fill-[#0B0B0C]" width={8} height={4} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
