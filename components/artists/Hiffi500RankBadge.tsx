import Link from "next/link"
import { cn } from "@/lib/utils"

type Hiffi500RankBadgeProps = {
  rank: number
  /** `overlay` sits on banner imagery; `subtle` on light surfaces. */
  tone?: "overlay" | "subtle"
  /** Link to the Hiffi 500 chart. Leave off inside cards that are already one big link. */
  linked?: boolean
  className?: string
}

export function Hiffi500RankBadge({
  rank,
  tone = "overlay",
  linked = false,
  className,
}: Hiffi500RankBadgeProps) {
  if (!Number.isFinite(rank) || rank <= 0) return null

  const classes = cn(
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs leading-none",
    tone === "overlay"
      ? "bg-black/45 text-white ring-1 ring-white/15 backdrop-blur-md"
      : "border border-border bg-white text-foreground",
    linked && (tone === "overlay" ? "transition-colors hover:bg-black/60" : "transition-colors hover:border-foreground/30"),
    className,
  )

  const content = (
    <>
      <span className={cn("font-bold tabular-nums", rank <= 10 && "text-[#E8192C]")}>#{rank}</span>
      <span className={cn("font-medium", tone === "overlay" ? "text-white/70" : "text-muted-foreground")}>
        Hiffi 500
      </span>
    </>
  )

  const label = `Ranked #${rank} on the Hiffi 500`

  if (linked) {
    return (
      <Link href="/top-artists" prefetch={false} className={classes} aria-label={label} title={label}>
        {content}
      </Link>
    )
  }

  return (
    <span className={classes} aria-label={label} title={label}>
      {content}
    </span>
  )
}
