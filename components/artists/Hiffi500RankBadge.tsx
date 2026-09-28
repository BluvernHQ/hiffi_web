import Link from "next/link"
import { Award, Crown, Flame, TrendingUp, type LucideIcon } from "lucide-react"
import { topArtistTier } from "@/lib/hiffi500-tier"
import { cn } from "@/lib/utils"

type RankTierStyle = {
  label: string
  Icon: LucideIcon
  /** Gradient fill for the rank number (used with bg-clip-text). */
  metal: string
  /** Gradient hairline border. */
  edge: string
  glow: string
  icon: string
  /** Light-surface variant. */
  subtle: string
  subtleIcon: string
}

function rankTierStyle(rank: number): RankTierStyle {
  const { label } = topArtistTier(rank)
  if (rank <= 10) {
    return {
      label,
      Icon: Crown,
      metal: "bg-gradient-to-b from-[#FFF4CF] via-[#F2C662] to-[#C28A2A]",
      edge: "bg-gradient-to-br from-[#F7DC8F]/90 via-[#F7DC8F]/10 to-[#C28A2A]/70",
      glow: "shadow-[0_0_28px_-6px_rgba(242,198,98,0.6)]",
      icon: "text-[#F2C662]",
      subtle: "border-[#E9C979]/70 bg-gradient-to-b from-[#FFFBEE] to-[#FFF3D1] text-[#8A5D0E]",
      subtleIcon: "text-[#C28A2A]",
    }
  }
  if (rank <= 50) {
    return {
      label,
      Icon: Flame,
      metal: "bg-gradient-to-b from-white via-[#FFD3D7] to-[#FF6B78]",
      edge: "bg-gradient-to-br from-[#FF6B78]/80 via-white/10 to-[#E8192C]/60",
      glow: "shadow-[0_0_24px_-8px_rgba(232,25,44,0.55)]",
      icon: "text-[#FF5A67]",
      subtle: "border-[#E8192C]/25 bg-[#FFF6F7] text-[#B3121F]",
      subtleIcon: "text-[#E8192C]",
    }
  }
  if (rank <= 150) {
    return {
      label,
      Icon: TrendingUp,
      metal: "bg-gradient-to-b from-white via-zinc-100 to-zinc-400",
      edge: "bg-gradient-to-br from-white/60 via-white/10 to-white/35",
      glow: "shadow-[0_0_20px_-8px_rgba(255,255,255,0.35)]",
      icon: "text-zinc-200",
      subtle: "border-zinc-300 bg-gradient-to-b from-white to-zinc-50 text-zinc-800",
      subtleIcon: "text-zinc-500",
    }
  }
  return {
    label,
    Icon: Award,
    metal: "bg-gradient-to-b from-white to-white/75",
    edge: "bg-gradient-to-br from-white/35 via-white/5 to-white/20",
    glow: "",
    icon: "text-white/70",
    subtle: "border-border bg-white text-foreground",
    subtleIcon: "text-muted-foreground",
  }
}

function isRanked(rank: number) {
  return Number.isFinite(rank) && rank > 0
}

function rankLabel(rank: number, tier: string) {
  return `Ranked #${rank} on the Hiffi 500 · ${tier}`
}

type Hiffi500RankBadgeProps = {
  rank: number
  /** `overlay` sits on banner imagery; `subtle` on light surfaces. */
  tone?: "overlay" | "subtle"
  className?: string
}

/** Compact rank chip for cards and rows (never a link — cards are already one). */
export function Hiffi500RankBadge({ rank, tone = "overlay", className }: Hiffi500RankBadgeProps) {
  if (!isRanked(rank)) return null
  const tier = rankTierStyle(rank)
  const label = rankLabel(rank, tier.label)

  if (tone === "subtle") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 leading-none",
          tier.subtle,
          className,
        )}
        aria-label={label}
        title={label}
      >
        <tier.Icon className={cn("h-3 w-3 shrink-0", tier.subtleIcon)} aria-hidden />
        <span className="text-xs font-bold tabular-nums">#{rank}</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] opacity-60">Hiffi 500</span>
      </span>
    )
  }

  return (
    <span
      className={cn("inline-flex rounded-full p-px", tier.edge, tier.glow, className)}
      aria-label={label}
      title={label}
    >
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-950/80 px-2.5 py-1 leading-none backdrop-blur-md">
        <tier.Icon className={cn("h-3 w-3 shrink-0", tier.icon)} aria-hidden />
        <span className={cn("bg-clip-text text-xs font-extrabold tabular-nums text-transparent", tier.metal)}>
          #{rank}
        </span>
        <span className="h-2.5 w-px bg-white/20" aria-hidden />
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/70">Hiffi 500</span>
      </span>
    </span>
  )
}

type Hiffi500RankPlateProps = {
  rank: number
  /** Link to the Hiffi 500 chart. */
  linked?: boolean
  className?: string
}

/** Medal-style rank plate for artist heroes — the “pride” moment. */
export function Hiffi500RankPlate({ rank, linked = true, className }: Hiffi500RankPlateProps) {
  if (!isRanked(rank)) return null
  const tier = rankTierStyle(rank)
  const label = rankLabel(rank, tier.label)

  const classes = cn(
    "group inline-flex rounded-2xl p-px normal-case tracking-normal transition-transform duration-300",
    tier.edge,
    tier.glow,
    linked && "hover:-translate-y-0.5",
    className,
  )

  const content = (
    <span className="rank-sheen flex items-center gap-3 rounded-[15px] bg-zinc-950/80 px-3.5 py-2 backdrop-blur-md sm:px-4 sm:py-2.5">
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/10 sm:h-9 sm:w-9",
          tier.icon,
        )}
        aria-hidden
      >
        <tier.Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/55 sm:text-[10px]">
          Hiffi 500
        </span>
        <span className="mt-1 flex items-baseline gap-2">
          <span
            className={cn(
              "bg-clip-text text-xl font-black tabular-nums tracking-tight text-transparent sm:text-2xl",
              tier.metal,
            )}
          >
            #{rank}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75 sm:text-[11px]">
            {tier.label}
          </span>
        </span>
      </span>
    </span>
  )

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
