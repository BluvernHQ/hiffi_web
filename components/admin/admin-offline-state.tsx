"use client"

import { OfflineState } from "@/components/network/offline-state"
import { cn } from "@/lib/utils"

type AdminOfflineStateProps = {
  message: string
  onRetry?: () => void
  className?: string
}

export function AdminOfflineState({ message, onRetry, className }: AdminOfflineStateProps) {
  return (
    <div
      className={cn("flex min-h-[280px] w-full items-center justify-center rounded-lg border bg-background py-12", className)}
      role="alert"
    >
      <OfflineState
        title="You're offline"
        description={message}
        supportText="Reconnect to the internet, then try again."
        onRetry={onRetry}
      />
    </div>
  )
}
