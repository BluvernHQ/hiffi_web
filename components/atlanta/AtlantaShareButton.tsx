"use client"

import { useState } from "react"
import { Share2, Check } from "lucide-react"
import { shareUrl } from "@/lib/share"
import { cn } from "@/lib/utils"

type AtlantaShareButtonProps = {
  title: string
  text?: string
  url: string
  className?: string
}

export function AtlantaShareButton({ title, text, url, className }: AtlantaShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const result = await shareUrl({ title, text, url })
    if (result.success && result.method === "clipboard") {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary",
        className,
      )}
    >
      {copied ? <Check className="h-4 w-4" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
      {copied ? "Link copied" : "Share"}
    </button>
  )
}
