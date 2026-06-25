"use client"

import { Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type ArtistShareButtonProps = {
  title: string
  url: string
}

export function ArtistShareButton({ title, url }: ArtistShareButtonProps) {
  const { toast } = useToast()

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // User cancelled or share failed — fall through to copy.
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      toast({ title: "Link copied", description: "Artist profile link copied to clipboard." })
    } catch {
      toast({
        title: "Could not share",
        description: "Copy the URL from your browser address bar.",
        variant: "destructive",
      })
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
      aria-label={`Share ${title}`}
    >
      <Share2 className="h-4 w-4" aria-hidden />
    </button>
  )
}
