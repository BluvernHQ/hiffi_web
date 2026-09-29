"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import * as Dialog from "@radix-ui/react-dialog"
import { ArrowDownRight, ArrowLeft, ArrowUpRight, BadgeCheck, Share2, X } from "lucide-react"
import { topArtistSocialLinks, topArtistTier, type TopArtist } from "@/lib/top-artists"
import { getArtistImageUrl } from "@/lib/artist-directory"
import { signalNarrow } from "@/lib/fonts/signal"
import { cn } from "@/lib/utils"
import { ArtistPortrait } from "@/components/artists/detail/ArtistPortrait"
import { TopChartSharePanel } from "@/components/top-artists/premium/TopChartShare"
import { DEFAULT_SHARE_SCOPE, type ChartShareScope } from "@/lib/top-chart-share"
import {
  chartArtistHref,
  artistMomentum,
  chartMovement,
  chartPlace,
  formatCount,
  formatMomentum,
} from "@/components/top-artists/premium/chart-format"

type Selection = { artist: TopArtist; context: string; scope: ChartShareScope }

type DrawerContextValue = { open: (artist: TopArtist, context?: string, scope?: ChartShareScope) => void }

const DrawerContext = createContext<DrawerContextValue | null>(null)

function syncArtistParam(username: string | null) {
  if (typeof window === "undefined") return
  const url = new URL(window.location.href)
  if (username) url.searchParams.set("artist", username)
  else url.searchParams.delete("artist")
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
}

export function TopChartDrawerProvider({
  children,
  initialArtist = null,
  initialContext = "Hiffi Hip-Hop 500",
  initialScope = DEFAULT_SHARE_SCOPE,
}: {
  children: ReactNode
  initialArtist?: TopArtist | null
  initialContext?: string
  initialScope?: ChartShareScope
}) {
  const [selection, setSelection] = useState<Selection | null>(
    initialArtist ? { artist: initialArtist, context: initialContext, scope: initialScope } : null,
  )

  const open = useCallback((artist: TopArtist, context = "Hiffi Hip-Hop 500", scope = DEFAULT_SHARE_SCOPE) => {
    setSelection({ artist, context, scope })
    syncArtistParam(artist.username)
  }, [])

  const close = useCallback(() => {
    setSelection(null)
    syncArtistParam(null)
  }, [])

  const value = useMemo(() => ({ open }), [open])

  return (
    <DrawerContext.Provider value={value}>
      {children}
      <Dialog.Root open={selection !== null} onOpenChange={(next) => (next ? null : close())}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content
            className={cn(
              signalNarrow.variable,
              "fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-y-auto border-l border-white/10 bg-[#0E0E10] text-[#F4F1EA] [color-scheme:dark] shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:duration-200 data-[state=open]:duration-300 sm:max-w-[460px]",
            )}
            aria-describedby={undefined}
          >
            {selection ? <DrawerBody key={selection.artist.username} selection={selection} /> : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </DrawerContext.Provider>
  )
}

export function useTopChartDrawer(): DrawerContextValue {
  const value = useContext(DrawerContext)
  if (!value) throw new Error("useTopChartDrawer must be used inside TopChartDrawerProvider")
  return value
}

/** Any artist surface on the chart page that opens the drawer. */
export function TopChartArtistButton({
  artist,
  context,
  scope,
  className,
  children,
}: {
  artist: TopArtist
  context?: string
  scope?: ChartShareScope
  className?: string
  children: ReactNode
}) {
  const { open } = useTopChartDrawer()
  return (
    <button
      type="button"
      onClick={() => open(artist, context, scope)}
      className={className}
      aria-label={`${artist.artist_name}, open chart details`}
    >
      {children}
    </button>
  )
}

type MetricEntry = { label: string; value: string; trend?: "up" | "down" }

/** Zero and missing figures format as "—"; those are left out rather than shown empty. */
function withValues(metrics: MetricEntry[]): MetricEntry[] {
  return metrics.filter((metric) => metric.value !== "—")
}

function MetricSection({ label, metrics, columns = 2 }: { label: string; metrics: MetricEntry[]; columns?: 2 | 3 }) {
  if (metrics.length === 0) return null
  return (
    <section aria-label={label}>
      <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">{label}</h3>
      <dl className={cn("mt-3 grid gap-x-6", columns === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {metrics.map((metric) => (
          <Metric key={metric.label} {...metric} />
        ))}
      </dl>
    </section>
  )
}

function Metric({ label, value, trend }: MetricEntry) {
  const Arrow = trend === "up" ? ArrowUpRight : ArrowDownRight
  return (
    <div className="border-t border-white/10 py-3.5">
      <dt className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/45">{label}</dt>
      <dd
        className={cn(
          "mt-1.5 flex items-center gap-1 text-lg font-semibold tabular-nums",
          trend === "up" ? "text-[#7BD88F]" : trend === "down" ? "text-[#FF6B78]" : "text-[#F4F1EA]",
        )}
      >
        {trend ? <Arrow className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {value}
      </dd>
    </div>
  )
}

const headerButton =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"

function DrawerBody({ selection }: { selection: Selection }) {
  const [view, setView] = useState<"profile" | "share">("profile")
  const { artist, context, scope } = selection
  const show = (next: "profile" | "share", from: HTMLElement) => {
    setView(next)
    from.closest('[role="dialog"]')?.scrollTo({ top: 0 })
  }

  if (view === "share") {
    return (
      <>
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#0E0E10]/95 px-6 py-4 backdrop-blur sm:px-8">
          <button type="button" onClick={(event) => show("profile", event.currentTarget)} className={cn(headerButton, "px-3.5 text-xs font-semibold")}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Profile
          </button>
          <Dialog.Title className="font-signal min-w-0 truncate text-xl font-bold uppercase leading-none">
            {artist.artist_name}
          </Dialog.Title>
          <Dialog.Close className={cn(headerButton, "w-9")}>
            <X className="h-4 w-4" aria-hidden />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        </header>
        <div className="flex-1 px-6 py-7 sm:px-8">
          <TopChartSharePanel artist={artist} scope={scope} />
        </div>
      </>
    )
  }

  return <DrawerProfile artist={artist} context={context} onShare={(from) => show("share", from)} />
}

function DrawerProfile({
  artist,
  context,
  onShare,
}: {
  artist: TopArtist
  context: string
  onShare: (from: HTMLElement) => void
}) {
  const place = chartPlace(artist)
  const tier = topArtistTier(artist.global_rank ?? artist.rank)
  const socials = topArtistSocialLinks(artist.other_socials)
  const youtube = socials.find((link) => link.key === "youtube")
  const instagram = socials.find((link) => link.key === "instagram")
  const movement = chartMovement(artist)
  const claimed = artist.claim_status === "claimed"
  const photo = getArtistImageUrl(artist.image ?? null)
  const gold = artist.rank <= 3

  const youtubeMetrics = withValues([
    { label: "Subscribers", value: formatCount(artist.youtube_subscriber_count) },
    { label: "Lifetime views", value: formatCount(artist.youtube_view_count) },
    { label: "Recent avg views", value: formatCount(artist.youtube_recent_avg_views) },
    { label: "Videos", value: formatCount(artist.youtube_video_count) },
  ])
  const momentum = withValues(
    ([7, 30, 90] as const).map((window) => {
      const value = artistMomentum(artist, window)
      return {
        label: `${window} days`,
        value: formatMomentum(value),
        trend: value > 0 ? ("up" as const) : value < 0 ? ("down" as const) : undefined,
      }
    }),
  )
  const weekMomentum = artistMomentum(artist, 7)
  const hasRankMove = movement?.kind === "up" || movement?.kind === "down" || movement?.kind === "new"
  const instagramMetrics = withValues([
    { label: "Followers", value: formatCount(artist.instagram_follower_count) },
    { label: "Recent avg likes", value: formatCount(artist.instagram_recent_avg_likes) },
  ])

  return (
    <>
      <header className="relative isolate overflow-hidden border-b border-white/10 bg-[#0B0B0C] px-6 pb-7 pt-6 text-[#F4F1EA] sm:px-8">
        {photo ? (
          <div
            className="absolute inset-0 -z-10 scale-125 bg-cover bg-center opacity-35 blur-2xl"
            style={{ backgroundImage: `url(${photo})` }}
            aria-hidden
          />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0B0B0C]/40 via-[#0B0B0C]/70 to-[#0E0E10]" aria-hidden />

        <div className="flex items-center justify-between gap-4">
          <p className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.3em] text-white/55">{context}</p>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={(event) => onShare(event.currentTarget)} className={cn(headerButton, "px-3.5 text-xs font-semibold")}>
              <Share2 className="h-3.5 w-3.5" aria-hidden />
              Share
            </button>
            <Dialog.Close className={cn(headerButton, "w-9")}>
              <X className="h-4 w-4" aria-hidden />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
        </div>

        <div className="mt-6 flex items-end gap-5">
          <ArtistPortrait
            artist={{ name: artist.artist_name, image: artist.image ?? null }}
            className="h-24 w-24 shrink-0 rounded-2xl ring-1 ring-white/15"
          />
          <div className="min-w-0">
            <p
              className={cn(
                "font-signal text-[3.5rem] font-bold leading-[0.8] tabular-nums",
                gold ? "bg-gradient-to-b from-[#FFF4CF] via-[#F2C662] to-[#C28A2A] bg-clip-text text-transparent" : "text-white",
              )}
            >
              #{artist.rank}
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/55">{tier.label}</p>
          </div>
        </div>

        <Dialog.Title className="font-signal mt-6 flex items-center gap-2 text-[2.4rem] font-bold uppercase leading-[0.9]">
          <span className="min-w-0 break-words">{artist.artist_name}</span>
          {claimed ? <BadgeCheck className="h-6 w-6 shrink-0 text-[#6F95F0]" aria-label="Verified artist" /> : null}
        </Dialog.Title>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60">
          {place ? <span>{place}</span> : null}
          {movement?.kind === "up" ? <span className="font-semibold text-[#7BD88F]">Up {movement.value} this week</span> : null}
          {movement?.kind === "down" ? <span className="font-semibold text-[#FF6B78]">Down {movement.value} this week</span> : null}
          {movement?.kind === "new" ? <span className="font-semibold text-[#F2C662]">New this week</span> : null}
          {!hasRankMove && weekMomentum !== 0 ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-semibold",
                weekMomentum > 0 ? "text-[#7BD88F]" : "text-[#FF6B78]",
              )}
            >
              {weekMomentum > 0 ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownRight className="h-4 w-4" aria-hidden />}
              {formatMomentum(weekMomentum)} this week
            </span>
          ) : null}
        </p>
      </header>

      <div className="flex-1 space-y-8 px-6 py-7 sm:px-8">
        <MetricSection label="YouTube" metrics={youtubeMetrics} />
        <MetricSection label="Momentum" metrics={momentum} columns={momentum.length === 3 ? 3 : 2} />
        <MetricSection label="Instagram" metrics={instagramMetrics} />

        <div className="flex flex-col gap-2.5">
          {!claimed ? (
            <Link
              href={chartArtistHref(artist)}
              className="inline-flex items-center justify-center rounded-full bg-[#E8192C] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#d01528]"
            >
              Claim this profile
            </Link>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {youtube ? (
              <a
                href={youtube.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/75 transition-colors hover:border-white/40 hover:text-white"
              >
                YouTube <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : null}
            {instagram ? (
              <a
                href={instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/75 transition-colors hover:border-white/40 hover:text-white"
              >
                Instagram <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : null}
            <button
              type="button"
              onClick={(event) => onShare(event.currentTarget)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/75 transition-colors hover:border-white/40 hover:text-white"
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden />
              Share card
            </button>
          </div>
        </div>

        <p className="text-xs leading-5 text-white/40">
          Ranked from blended YouTube and Instagram signal. Figures may lag the platforms; verify on each one.
        </p>
      </div>
    </>
  )
}
