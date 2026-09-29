"use client"

import { useState } from "react"
import { Check, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { absoluteUrl } from "@/lib/seo/site"
import { hiffi500SharePath, type TopArtist } from "@/lib/top-artists"

export function Hiffi500ShareButton({
  artist,
  className,
  variant = "pill",
}: {
  artist: TopArtist
  className?: string
  /** `icon`: round ghost button for paper chart rows. */
  variant?: "pill" | "icon"
}) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const path = hiffi500SharePath(artist.username)
    const shareUrl =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : absoluteUrl(path)
    const shareText = `${artist.artist_name} is #${artist.global_rank ?? artist.rank} on the Hiffi 500`

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: shareText, text: shareText, url: shareUrl })
        return
      }
      await navigator.clipboard.writeText(`${shareText} — ${shareUrl}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      try {
        await navigator.clipboard.writeText(`${shareText} — ${shareUrl}`)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1800)
      } catch {
        // ignore
      }
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleShare}
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#0B0B0C]/12 text-[#0B0B0C]/55 transition-colors hover:border-[#0B0B0C]/40 hover:text-[#0B0B0C]",
          className,
        )}
        data-analytics-name="hiffi500-share"
        aria-label={copied ? "Link copied" : `Share ${artist.artist_name} ranking`}
      >
        {copied ? <Check className="h-4 w-4 text-[#E8192C]" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-[#E8192C]/40 hover:text-[#E8192C]",
        className,
      )}
      data-analytics-name="hiffi500-share"
      aria-label={`Share ${artist.artist_name} ranking`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-[#E8192C]" aria-hidden />
      ) : (
        <Share2 className="h-3.5 w-3.5" aria-hidden />
      )}
      {copied ? "Copied" : "Share"}
    </button>
  )
}
