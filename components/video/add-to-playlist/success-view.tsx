"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function SuccessView({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        "animate-in fade-in-0 zoom-in-95 duration-300",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full",
          "bg-primary/15 text-primary ring-1 ring-primary/25",
          "shadow-[0_0_32px_-8px_rgba(237,28,47,0.45)]",
        )}
      >
        <Check className="h-7 w-7 stroke-[2.5]" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">Saved</p>
        <p className="text-sm text-muted-foreground">Playlist updated</p>
      </div>
    </div>
  )
}
