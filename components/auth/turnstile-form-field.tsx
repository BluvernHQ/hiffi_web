"use client"

import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/auth/turnstile-widget"
import { isTurnstileEnabled } from "@/lib/turnstile/config"
import { cn } from "@/lib/utils"
import type { RefObject } from "react"

type TurnstileFormFieldProps = {
  action: string
  widgetRef: RefObject<TurnstileWidgetHandle | null>
  onToken: (token: string | null) => void
  className?: string
  size?: "normal" | "compact" | "flexible"
}

/** Cloudflare Turnstile block for public forms. Renders nothing when disabled (local dev). */
export function TurnstileFormField({
  action,
  widgetRef,
  onToken,
  className,
  size = "normal",
}: TurnstileFormFieldProps) {
  if (!isTurnstileEnabled()) return null

  return (
    <div className={cn("flex justify-center max-w-full overflow-x-auto", className)}>
      <TurnstileWidget ref={widgetRef} action={action} onToken={onToken} size={size} />
    </div>
  )
}
