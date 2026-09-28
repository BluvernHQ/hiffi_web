import Link from "next/link"
import {
  Award,
  Crown,
  Flame,
  MapPin,
  Music2,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import type { Artist } from "@/lib/artists"
import { topArtistTier } from "@/lib/hiffi500-tier"
import type { PublicRanking, RankBand } from "@/lib/types/inventory"
import { cn } from "@/lib/utils"

type RankStyle = {
  Icon: LucideIcon
  /** Gradient fill for the value (used with bg-clip-text). */
  metal: string
  /** Gradient hairline border. */
  edge: string
  glow: string
  icon: string
  /** Light-surface variant. */
  subtle: string
  subtleIcon: string
}

function hiffi500Style(rank: number): RankStyle & { label: string } {
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

type PercentBand = Exclude<RankBand, "hiffi_500" | "none">

const BAND_LABEL: Record<PercentBand, string> = {
  top_5: "Top 5%",
  top_10: "Top 10%",
  top_25: "Top 25%",
}

function isPercentBand(band: RankBand | undefined): band is PercentBand {
  return band === "top_5" || band === "top_10" || band === "top_25"
}

function bandStyle(band: PercentBand): RankStyle {
  if (band === "top_5") {
    return {
      Icon: Sparkles,
      metal: "bg-gradient-to-b from-white via-[#E7E6F5] to-[#A8A6C8]",
      edge: "bg-gradient-to-br from-white/60 via-white/10 to-[#A8A6C8]/50",
      glow: "shadow-[0_0_20px_-8px_rgba(200,198,235,0.45)]",
      icon: "text-[#DCDAF5]",
      subtle: "border-[#CFCDE6] bg-gradient-to-b from-white to-[#F6F5FC] text-[#3F3D5C]",
      subtleIcon: "text-[#8E8BB5]",
    }
  }
  if (band === "top_10") {
    return {
      Icon: Sparkles,
      metal: "bg-gradient-to-b from-white to-zinc-300",
      edge: "bg-gradient-to-br from-white/45 via-white/5 to-white/25",
      glow: "",
      icon: "text-zinc-200",
      subtle: "border-zinc-300 bg-white text-zinc-800",
      subtleIcon: "text-zinc-500",
    }
  }
  return {
    Icon: Sparkles,
    metal: "bg-gradient-to-b from-white to-white/80",
    edge: "bg-gradient-to-br from-white/30 via-white/5 to-white/15",
    glow: "",
    icon: "text-white/65",
    subtle: "border-border bg-white text-foreground",
    subtleIcon: "text-muted-foreground",
  }
}

function highlightStyle(kind: "city" | "genre"): RankStyle {
  return {
    Icon: kind === "genre" ? Music2 : MapPin,
    metal: "bg-gradient-to-b from-white to-white/80",
    edge: "bg-gradient-to-br from-white/35 via-white/5 to-white/20",
    glow: "",
    icon: "text-[#FF6B78]",
    subtle: "border-border bg-white text-foreground",
    subtleIcon: "text-[#E8192C]",
  }
}

const MOVEMENT_STYLE: RankStyle = {
  Icon: TrendingUp,
  metal: "bg-gradient-to-b from-[#ECFDF5] to-[#6EE7B7]",
  edge: "bg-gradient-to-br from-[#6EE7B7]/60 via-white/5 to-[#34D399]/40",
  glow: "",
  icon: "text-[#6EE7B7]",
  subtle: "border-emerald-200 bg-emerald-50 text-emerald-800",
  subtleIcon: "text-emerald-600",
}

type ChipProps = {
  style: RankStyle
  value: string
  label: string
  title: string
  tone?: "overlay" | "subtle"
  className?: string
}

function RankChip({ style, value, label, title, tone = "overlay", className }: ChipProps) {
  if (tone === "subtle") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 leading-none",
          style.subtle,
          className,
        )}
        aria-label={title}
        title={title}
      >
        <style.Icon className={cn("h-3 w-3 shrink-0", style.subtleIcon)} aria-hidden />
        <span className="text-xs font-bold tabular-nums">{value}</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] opacity-60">{label}</span>
      </span>
    )
  }

  return (
    <span
      className={cn("inline-flex rounded-full p-px normal-case tracking-normal", style.edge, style.glow, className)}
      aria-label={title}
      title={title}
    >
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-zinc-950/80 px-2.5 py-1 leading-none backdrop-blur-md">
        <style.Icon className={cn("h-3 w-3 shrink-0", style.icon)} aria-hidden />
        <span className={cn("bg-clip-text text-xs font-extrabold tabular-nums text-transparent", style.metal)}>
          {value}
        </span>
        <span className="h-2.5 w-px bg-white/20" aria-hidden />
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/70">{label}</span>
      </span>
    </span>
  )
}

type PlateSegment = {
  eyebrow: string
  value: string
  label?: string
  title: string
}

type PlateProps = {
  style: RankStyle
  eyebrow: string
  value: string
  label?: string
  title: string
  /** Second reading on the same plate, e.g. the city rank. */
  secondary?: PlateSegment
  href?: string
  className?: string
}

function RankPlate({ style, eyebrow, value, label, title, secondary, href, className }: PlateProps) {
  const classes = cn(
    "group inline-flex rounded-2xl p-px normal-case tracking-normal transition-transform duration-300",
    style.edge,
    style.glow,
    href && "hover:-translate-y-0.5",
    className,
  )

  const content = (
    <span className="rank-sheen flex items-center gap-3 rounded-[15px] bg-zinc-950/80 px-3.5 py-2 backdrop-blur-md sm:px-4 sm:py-2.5">
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/10 sm:h-9 sm:w-9",
          style.icon,
        )}
        aria-hidden
      >
        <style.Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/55 sm:text-[10px]">
          {eyebrow}
        </span>
        <span className="mt-1 flex items-baseline gap-2">
          <span
            className={cn(
              "bg-clip-text text-xl font-black tabular-nums tracking-tight text-transparent sm:text-2xl",
              style.metal,
            )}
          >
            {value}
          </span>
          {label ? (
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75 sm:text-[11px]">
              {label}
            </span>
          ) : null}
        </span>
      </span>
      {secondary ? (
        <>
          <span className="ml-1 h-9 w-px self-center bg-white/12 sm:ml-2 sm:h-10" aria-hidden />
          <span className="flex flex-col pr-1 leading-none" title={secondary.title}>
            <span className="max-w-[9rem] truncate text-[9px] font-semibold uppercase tracking-[0.3em] text-white/55 sm:text-[10px]">
              {secondary.eyebrow}
            </span>
            <span className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black tabular-nums tracking-tight text-[#F4F1EA] sm:text-2xl">
                {secondary.value}
              </span>
              {secondary.label ? (
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50 sm:text-[11px]">
                  {secondary.label}
                </span>
              ) : null}
            </span>
          </span>
        </>
      ) : null}
    </span>
  )

  const fullTitle = secondary ? `${title} · ${secondary.title}` : title

  if (href) {
    return (
      <Link href={href} prefetch={false} className={classes} aria-label={fullTitle} title={fullTitle}>
        {content}
      </Link>
    )
  }

  return (
    <span className={classes} aria-label={fullTitle} title={fullTitle}>
      {content}
    </span>
  )
}

function isRanked(rank: number) {
  return Number.isFinite(rank) && rank > 0
}

function hiffi500Title(rank: number, tier: string) {
  return `Ranked #${rank} on the Hiffi 500 · ${tier}`
}

function bandTitle(band: PercentBand) {
  return `${BAND_LABEL[band]} of the Artist Index`
}

type Hiffi500RankBadgeProps = {
  rank: number
  /** `overlay` sits on banner imagery; `subtle` on light surfaces. */
  tone?: "overlay" | "subtle"
  className?: string
}

/** Compact Hiffi 500 chip (never a link — cards are already one). */
export function Hiffi500RankBadge({ rank, tone = "overlay", className }: Hiffi500RankBadgeProps) {
  if (!isRanked(rank)) return null
  const style = hiffi500Style(rank)
  return (
    <RankChip
      style={style}
      value={`#${rank}`}
      label="Hiffi 500"
      title={hiffi500Title(rank, style.label)}
      tone={tone}
      className={className}
    />
  )
}

type Hiffi500RankPlateProps = {
  rank: number
  /** Link to the Hiffi 500 chart. */
  linked?: boolean
  secondary?: PlateSegment
  className?: string
}

/** Medal-style Hiffi 500 plate for heroes. */
export function Hiffi500RankPlate({ rank, linked = true, secondary, className }: Hiffi500RankPlateProps) {
  if (!isRanked(rank)) return null
  const style = hiffi500Style(rank)
  return (
    <RankPlate
      style={style}
      eyebrow="Hiffi 500"
      value={`#${rank}`}
      label={style.label}
      title={hiffi500Title(rank, style.label)}
      secondary={secondary}
      href={linked ? "/top-artists" : undefined}
      className={className}
    />
  )
}

type ArtistRankProps = {
  artist: Pick<Artist, "rank" | "ranking">
  className?: string
}

/** Hero plate: Hiffi 500 rank, else the Top 5/10/25% band. Nothing for everyone else. */
export function ArtistRankPlate({
  artist,
  linked = true,
  secondary,
  className,
}: ArtistRankProps & { linked?: boolean; secondary?: PlateSegment }) {
  if (isRanked(artist.rank)) {
    return <Hiffi500RankPlate rank={artist.rank} linked={linked} secondary={secondary} className={className} />
  }
  const band = artist.ranking?.status === "ranked" ? artist.ranking.band : undefined
  if (!isPercentBand(band)) return null
  return (
    <RankPlate
      style={bandStyle(band)}
      eyebrow="Artist Index"
      value={BAND_LABEL[band]}
      title={bandTitle(band)}
      secondary={secondary}
      className={className}
    />
  )
}

function HighlightChip({
  highlight,
  tone,
  className,
}: {
  highlight: NonNullable<PublicRanking["highlight"]>
  tone?: "overlay" | "subtle"
  className?: string
}) {
  return (
    <RankChip
      style={highlightStyle(highlight.kind)}
      value={`#${highlight.rank}`}
      label={`in ${highlight.label}`}
      title={`#${highlight.rank} of ${highlight.total} ranked artists in ${highlight.label}`}
      tone={tone}
      className={className}
    />
  )
}

function MovementChip({
  movement,
  tone,
  className,
}: {
  movement: NonNullable<PublicRanking["movement"]>
  tone?: "overlay" | "subtle"
  className?: string
}) {
  const { spots_30d: spots, streak_weeks: streak } = movement
  if (!spots && !streak) return null
  const title = [
    spots ? `Up ${spots} spots this month` : null,
    streak ? `Climbing ${streak} weeks in a row` : null,
  ]
    .filter(Boolean)
    .join(" · ")
  return (
    <RankChip
      style={MOVEMENT_STYLE}
      value={spots ? `▲ ${spots}` : `${streak} wks`}
      label={spots ? "This month" : "Climbing"}
      title={title}
      tone={tone}
      className={className}
    />
  )
}

/** One-sentence public rank line, e.g. "Nova is in the top 10% of the Artist Index." */
export function publicRankSummary(artist: Pick<Artist, "name" | "rank" | "ranking">): string | null {
  if (isRanked(artist.rank)) return `${artist.name} is #${artist.rank} on the Hiffi 500.`
  const ranking = artist.ranking?.status === "ranked" ? artist.ranking : null
  if (ranking && isPercentBand(ranking.band)) {
    return `${artist.name} is in the ${BAND_LABEL[ranking.band].toLowerCase()} of the Artist Index.`
  }
  if (ranking?.highlight) {
    return `${artist.name} is #${ranking.highlight.rank} in ${ranking.highlight.label}.`
  }
  return null
}

/** Best single public signal for compact surfaces (cards, rows). */
export function ArtistRankChip({
  artist,
  tone = "overlay",
  className,
}: ArtistRankProps & { tone?: "overlay" | "subtle" }) {
  if (isRanked(artist.rank)) {
    return <Hiffi500RankBadge rank={artist.rank} tone={tone} className={className} />
  }
  const ranking = artist.ranking
  if (!ranking || ranking.status !== "ranked") return null
  if (isPercentBand(ranking.band)) {
    return (
      <RankChip
        style={bandStyle(ranking.band)}
        value={BAND_LABEL[ranking.band]}
        label="Artist Index"
        title={bandTitle(ranking.band)}
        tone={tone}
        className={className}
      />
    )
  }
  if (ranking.highlight) {
    return <HighlightChip highlight={ranking.highlight} tone={tone} className={className} />
  }
  return null
}

function highlightSegment(highlight: NonNullable<PublicRanking["highlight"]>): PlateSegment {
  return {
    eyebrow: highlight.label,
    value: `#${highlight.rank}`,
    label: `of ${highlight.total.toLocaleString()}`,
    title: `#${highlight.rank} of ${highlight.total.toLocaleString()} ranked artists in ${highlight.label}`,
  }
}

/** Hero rank cluster: one plate (Hiffi 500 or band, with the city/genre rank alongside), then movement. */
export function ArtistRankSignals({ artist, className }: ArtistRankProps) {
  const ranking = artist.ranking?.status === "ranked" ? artist.ranking : null
  const hasPlate = isRanked(artist.rank) || isPercentBand(ranking?.band)
  const highlight = ranking?.highlight ?? null
  if (!hasPlate && !highlight && !ranking?.movement) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {hasPlate ? (
        <ArtistRankPlate artist={artist} secondary={highlight ? highlightSegment(highlight) : undefined} />
      ) : highlight ? (
        <RankPlate
          style={highlightStyle(highlight.kind)}
          eyebrow={highlight.label}
          value={`#${highlight.rank}`}
          label={`of ${highlight.total.toLocaleString()}`}
          title={highlightSegment(highlight).title}
        />
      ) : null}
      {ranking?.movement ? <MovementChip movement={ranking.movement} /> : null}
    </div>
  )
}
