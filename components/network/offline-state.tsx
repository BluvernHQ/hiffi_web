"use client"

import { WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type OfflineStateProps = {
  /** Main heading (e.g. “You’re offline”). */
  title?: string
  /** Supporting copy — keep user-facing, no raw URLs. */
  description: string
  /** Optional reassuring follow-up sentence. */
  supportText?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
  /**
   * `page` — feed / full-page empty states (card on app background).
   * `embed` — inside video player (dark chrome, high contrast).
   */
  variant?: "page" | "embed"
}

/**
 * YouTube-inspired offline / connectivity empty state: soft icon tile, clear hierarchy, pill actions.
 */
export function OfflineState({
  title = "You're offline",
  description,
  supportText,
  onRetry,
  retryLabel = "Try again",
  className,
  variant = "page",
}: OfflineStateProps) {
  const embed = variant === "embed"

  return (
    <div className={cn("relative w-full max-w-lg", className)} role="alert">
      <div
        className={cn(
          "flex w-full flex-col items-center text-center",
          embed
            ? "rounded-xl border border-white/10 bg-zinc-900/95 px-6 py-9 shadow-2xl backdrop-blur-sm sm:px-8 sm:py-10"
            : "px-6 py-8 sm:px-10 sm:py-10",
        )}
      >
        <div
          className={cn(
            "mb-5 mt-2 flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full sm:mb-6 sm:h-[4.5rem] sm:w-[4.5rem]",
            embed ? "bg-white/[0.08]" : "bg-muted/70 ring-1 ring-border/70",
          )}
        >
          <WifiOff
            className={cn("h-9 w-9 sm:h-10 sm:w-10", embed ? "text-white/80" : "text-muted-foreground")}
            strokeWidth={1.35}
            aria-hidden
          />
        </div>
        <h2
          className={cn(
            "text-lg font-semibold leading-snug tracking-tight sm:text-xl",
            embed ? "text-white" : "text-foreground",
          )}
        >
          {title}
        </h2>
        <p
          className={cn(
            "mt-2 max-w-sm text-sm leading-relaxed sm:text-[0.9375rem]",
            embed ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
        {supportText ? (
          <p
            className={cn(
              "mt-2 text-xs leading-relaxed sm:text-sm",
              embed ? "text-white/65" : "text-muted-foreground/90",
            )}
          >
            {supportText}
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2 sm:mt-8 sm:gap-3">
          {onRetry ? (
            <Button
              type="button"
              variant="default"
              size="default"
              className={cn(
                "rounded-full px-6 font-medium sm:px-7",
                embed
                  ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                  : "shadow-sm hover:shadow-md",
              )}
              onClick={onRetry}
            >
              {retryLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
