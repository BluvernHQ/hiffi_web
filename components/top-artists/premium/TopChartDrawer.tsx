"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import * as Dialog from "@radix-ui/react-dialog"
import { ArrowUpRight, BadgeCheck, X } from "lucide-react"
import { topArtistSocialLinks, topArtistTier, type TopArtist } from "@/lib/top-artists"
import { getArtistImageUrl } from "@/lib/artist-directory"
import { signalNarrow } from "@/lib/fonts/signal"
import { cn } from "@/lib/utils"
import { ArtistPortrait } from "@/components/artists/detail/ArtistPortrait"
import { Hiffi500ShareButton } from "@/components/artists/top500/hiffi500-share-button"
import {
  chartArtistHref,
  chartMovement,
  chartPlace,
  formatCount,
  formatMomentum,
} from "@/components/top-artists/premium/chart-format"

type Selection = { artist: TopArtist; context: string }

type DrawerContextValue = { open: (artist: TopArtist, context?: string) => void }

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
}: {
  children: ReactNode
  initialArtist?: TopArtist | null
}) {
  const [selection, setSelection] = useState<Selection | null>(
    initialArtist ? { artist: initialArtist, context: "Hiffi Hip-Hop 500" } : null,
  )

  const open = useCallback((artist: TopArtist, context = "Hiffi Hip-Hop 500") => {
    setSelection({ artist, context })
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
              "fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-y-auto bg-[#F4F1EA] text-[#0B0B0C] shadow-2xl outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:duration-200 data-[state=open]:duration-300 sm:max-w-[460px]",
            )}
            aria-describedby={undefined}
          >
            {selection ? <DrawerBody selection={selection} /> : null}
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
  className,
  children,
}: {
  artist: TopArtist
  context?: string
  className?: string
  children: ReactNode
}) {
  const { open } = useTopChartDrawer()
  return (
    <button
      type="button"
      onClick={() => open(artist, context)}
      className={className}
      aria-label={`${artist.artist_name}, open chart details`}
    >
      {children}
    </button>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-[#0B0B0C]/12 py-3.5">
      <dt className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#77726A]">{label}</dt>
      <dd className="mt-1.5 text-lg font-semibold tabular-nums text-[#0B0B0C]">{value}</dd>
    </div>
  )
}

function DrawerBody({ selection }: { selection: Selection }) {
  const { artist, context } = selection
  const place = chartPlace(artist)
  const tier = topArtistTier(artist.global_rank ?? artist.rank)
  const socials = topArtistSocialLinks(artist.other_socials)
  const youtube = socials.find((link) => link.key === "youtube")
  const instagram = socials.find((link) => link.key === "instagram")
  const movement = chartMovement(artist)
  const claimed = artist.claim_status === "claimed"
  const photo = getArtistImageUrl(artist.image ?? null)
  const gold = artist.rank <= 3

  const youtubeMetrics = [
    { label: "Subscribers", value: formatCount(artist.youtube_subscriber_count) },
    { label: "Lifetime views", value: formatCount(artist.youtube_view_count) },
    { label: "Recent avg views", value: formatCount(artist.youtube_recent_avg_views) },
    { label: "Videos", value: formatCount(artist.youtube_video_count) },
  ]
  const momentum = [
    { label: "7 days", value: formatMomentum(artist.youtube_momentum_7d) },
    { label: "30 days", value: formatMomentum(artist.youtube_momentum_30d) },
    { label: "90 days", value: formatMomentum(artist.youtube_momentum_90d) },
  ]
  const hasInstagram = Boolean(artist.instagram_follower_count)

  return (
    <>
      <header className="relative isolate overflow-hidden bg-[#0B0B0C] px-6 pb-7 pt-6 text-[#F4F1EA] sm:px-8">
        {photo ? (
          <div
            className="absolute inset-0 -z-10 scale-125 bg-cover bg-center opacity-35 blur-2xl"
            style={{ backgroundImage: `url(${photo})` }}
            aria-hidden
          />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0B0B0C]/40 via-[#0B0B0C]/70 to-[#0B0B0C]" aria-hidden />

        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/55">{context}</p>
          <Dialog.Close className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
            <X className="h-4 w-4" aria-hidden />
            <span className="sr-only">Close</span>
          </Dialog.Close>
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
        </p>
      </header>

      <div className="flex-1 space-y-8 px-6 py-7 sm:px-8">
        <section aria-label="YouTube">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#0B0B0C]/55">YouTube</h3>
          <dl className="mt-3 grid grid-cols-2 gap-x-6">
            {youtubeMetrics.map((metric) => (
              <Metric key={metric.label} {...metric} />
            ))}
          </dl>
        </section>

        <section aria-label="Momentum">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#0B0B0C]/55">Momentum</h3>
          <dl className="mt-3 grid grid-cols-3 gap-x-6">
            {momentum.map((metric) => (
              <Metric key={metric.label} {...metric} />
            ))}
          </dl>
        </section>

        {hasInstagram ? (
          <section aria-label="Instagram">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#0B0B0C]/55">Instagram</h3>
            <dl className="mt-3 grid grid-cols-2 gap-x-6">
              <Metric label="Followers" value={formatCount(artist.instagram_follower_count)} />
              <Metric label="Recent avg likes" value={formatCount(artist.instagram_recent_avg_likes)} />
            </dl>
          </section>
        ) : null}

        <div className="flex flex-col gap-2.5">
          <Link
            href={chartArtistHref(artist)}
            className="inline-flex items-center justify-center rounded-full bg-[#0B0B0C] px-5 py-3 text-sm font-semibold text-[#F4F1EA] transition-colors hover:bg-[#26262a]"
          >
            View artist profile
          </Link>
          {!claimed ? (
            <Link
              href={`${chartArtistHref(artist)}/claim`}
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
                className="inline-flex items-center gap-1.5 rounded-full border border-[#0B0B0C]/15 px-4 py-2 text-xs font-semibold text-[#0B0B0C]/75 transition-colors hover:border-[#0B0B0C]/40 hover:text-[#0B0B0C]"
              >
                YouTube <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : null}
            {instagram ? (
              <a
                href={instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#0B0B0C]/15 px-4 py-2 text-xs font-semibold text-[#0B0B0C]/75 transition-colors hover:border-[#0B0B0C]/40 hover:text-[#0B0B0C]"
              >
                Instagram <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : null}
            <Hiffi500ShareButton
              artist={artist}
              className="border-[#0B0B0C]/15 bg-transparent px-4 py-2 text-xs text-[#0B0B0C]/75 hover:border-[#0B0B0C]/40 hover:text-[#0B0B0C]"
            />
          </div>
        </div>

        <p className="text-xs leading-5 text-[#77726A]">
          Ranked from blended YouTube and Instagram signal. Figures may lag the platforms; verify on each one.
        </p>
      </div>
    </>
  )
}
