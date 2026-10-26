"use client"

import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { trackId, type TrackingId } from "@/lib/analytics/tracking-ids"
import {
  getArtistsForYou,
  getBecauseRows,
  getRecMix,
  getRecUncharted,
  getSoundClusters,
  type ArtistForYou,
  type BecauseRow,
  type SoundCluster,
  RecsUnavailableError,
} from "@/lib/recs/client"
import type { Video } from "@/lib/api-client"
import { ProfilePicture } from "@/components/profile/profile-picture"
import { AuthenticatedImage, VideoThumbnailPlaceholder } from "@/components/video/authenticated-image"
import { useGlobalVideo } from "@/lib/video-context"
import { useToast } from "@/hooks/use-toast"
import { isVideoProcessing, PROCESSING_VIDEO_TOAST } from "@/lib/video-utils"
import { getThumbnailUrl, getWorkersBaseUrl } from "@/lib/storage"
import {
  mapOpenUiNameToSource,
  setPendingPlaybackContext,
} from "@/lib/analytics/video-playback-context"
import { prefetchRelatedVideos } from "@/lib/related-videos"
import { cn } from "@/lib/utils"

export const RECS_PICKS_SAVED_EVENT = "hiffi:recs-picks-saved"

type RowsState = {
  dailyMix: Video[]
  because: BecauseRow[]
  artists: ArtistForYou[]
  uncharted: Video[]
  sounds: SoundCluster[]
}

function SectionHeading({
  title,
  hint,
  action,
}: {
  title: string
  hint: string
  action?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
      </div>
      {action}
    </div>
  )
}

function Rail({ label, children }: { label: string; children: ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  const syncEdges = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdges({
      left: el.scrollLeft > 8,
      right: max > 8 && el.scrollLeft < max - 8,
    })
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    syncEdges()
    el.addEventListener("scroll", syncEdges, { passive: true })
    const observer = new ResizeObserver(syncEdges)
    observer.observe(el)
    return () => {
      el.removeEventListener("scroll", syncEdges)
      observer.disconnect()
    }
  }, [syncEdges, children])

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" })
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        aria-label={label}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-1 pb-1 scrollbar-none"
      >
        {children}
      </div>
      {edges.left ? (
        <button
          type="button"
          aria-label={`Scroll ${label} backward`}
          onClick={() => scrollByDir(-1)}
          className="absolute left-0 top-[28%] hidden h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background/95 text-foreground shadow-md hover:bg-muted sm:flex"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
      {edges.right ? (
        <button
          type="button"
          aria-label={`Scroll ${label} forward`}
          onClick={() => scrollByDir(1)}
          className="absolute right-0 top-[28%] hidden h-9 w-9 translate-x-1/2 items-center justify-center rounded-full border border-border bg-background/95 text-foreground shadow-md hover:bg-muted sm:flex"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  )
}

function RailVideo({
  video,
  openId,
  openDetail,
  layout = "poster",
}: {
  video: Video
  openId: TrackingId
  openDetail?: string
  layout?: "poster" | "row"
}) {
  const { playVideo } = useGlobalVideo()
  const { toast } = useToast()
  const videoId = video.video_id || ""
  const title = video.video_title || "Untitled Video"
  const username = video.user_username || ""
  const thumbnail = (video.video_thumbnail || "").trim()
  const watchPath = `/watch/${videoId}`
  const isEncoding = isVideoProcessing(video)
  const thumbnailUrl =
    thumbnail.length > 0
      ? getThumbnailUrl(thumbnail)
      : videoId
        ? `${getWorkersBaseUrl()}/thumbnails/videos/${videoId}.jpg`
        : null

  const openVideo = () => {
    if (typeof window === "undefined" || !videoId) return
    setPendingPlaybackContext({
      videoId,
      openSource: mapOpenUiNameToSource(openId),
      openUiName: openId,
      navigateTrigger: "card_click",
      isAutoplay: false,
    })
    ;(window as Window & { HifiAnalytics?: { capture: (name: string, props: Record<string, unknown>) => void } }).HifiAnalytics?.capture(
      "opened-video",
      {
        element_ui_name: openId,
        video_id: videoId,
        video_title: title,
        url: `${window.location.origin}${watchPath}`,
        path: watchPath,
        source_path: window.location.pathname,
        open_source: mapOpenUiNameToSource(openId),
        navigate_trigger: "card_click",
        is_click: true,
        is_autoplay: false,
      },
    )
    playVideo(video)
  }

  const onOpen = (event: MouseEvent) => {
    if (isEncoding) {
      event.preventDefault()
      toast(PROCESSING_VIDEO_TOAST)
      return
    }
    openVideo()
  }

  const thumb = (
    <div
      className={cn(
        "relative overflow-hidden bg-muted ring-1 ring-black/5",
        layout === "row"
          ? "h-14 w-[92px] shrink-0 rounded-lg"
          : "aspect-video rounded-xl transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_28px_rgba(0,0,0,0.14)]",
      )}
    >
      {thumbnailUrl ? (
        <AuthenticatedImage
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          sizes={layout === "row" ? "92px" : "228px"}
          authenticated={false}
        />
      ) : (
        <VideoThumbnailPlaceholder fill />
      )}
    </div>
  )

  const profile = username ? (
    <Link
      href={`/profile/${encodeURIComponent(username)}`}
      {...trackId("video-card-open-profile", username)}
      className="mt-0.5 block truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
    >
      @{username}
    </Link>
  ) : null

  if (layout === "row") {
    return (
      <div className="flex items-start gap-2.5">
        <Link
          href={watchPath}
          prefetch={!isEncoding}
          {...trackId(openId, openDetail)}
          aria-disabled={isEncoding}
          tabIndex={isEncoding ? -1 : undefined}
          onPointerEnter={() => {
            if (!isEncoding && videoId) prefetchRelatedVideos(videoId)
          }}
          onClick={onOpen}
          className="group shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8192C]"
        >
          {thumb}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={watchPath}
            prefetch={!isEncoding}
            {...trackId(openId, openDetail)}
            aria-disabled={isEncoding}
            tabIndex={isEncoding ? -1 : undefined}
            onClick={onOpen}
            className="line-clamp-2 text-xs font-medium leading-snug text-foreground hover:text-[#E8192C]"
          >
            {title}
          </Link>
          {profile}
        </div>
      </div>
    )
  }

  return (
    <article className="w-[200px] shrink-0 snap-start sm:w-[228px]">
      <Link
        href={watchPath}
        prefetch={!isEncoding}
        {...trackId(openId, openDetail)}
        aria-disabled={isEncoding}
        tabIndex={isEncoding ? -1 : undefined}
        onPointerEnter={() => {
          if (!isEncoding && videoId) prefetchRelatedVideos(videoId)
        }}
        onClick={onOpen}
        className="group block focus-visible:outline-none"
      >
        {thumb}
        <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-[#E8192C]">
          {title}
        </h3>
      </Link>
      {profile}
    </article>
  )
}

function VideoRow({
  title,
  hint,
  videos,
  openId,
  action,
}: {
  title: string
  hint: string
  videos: Video[]
  openId: TrackingId
  action?: ReactNode
}) {
  if (videos.length === 0) return null
  return (
    <section className="mb-8">
      <SectionHeading title={title} hint={hint} action={action} />
      <Rail label={title}>
        {videos.map((video) => (
          <RailVideo key={video.video_id} video={video} openId={openId} />
        ))}
      </Rail>
    </section>
  )
}

const SOUNDS_SHOWN = 8
const VIDEOS_PER_SOUND = 3

function SoundBoards({ sounds }: { sounds: SoundCluster[] }) {
  const catalog = sounds.slice(0, SOUNDS_SHOWN)
  const [boards, setBoards] = useState<SoundCluster[]>(() =>
    catalog.map((sound) => ({ ...sound, videos: sound.videos.slice(0, VIDEOS_PER_SOUND) })),
  )
  const [settled, setSettled] = useState(() => catalog.every((sound) => sound.videos.length > 0))

  useEffect(() => {
    const seeds = sounds.slice(0, SOUNDS_SHOWN).map((sound) => ({
      ...sound,
      videos: sound.videos.slice(0, VIDEOS_PER_SOUND),
    }))
    setBoards(seeds)
    const missing = seeds.filter((sound) => sound.videos.length === 0)
    if (missing.length === 0) {
      setSettled(true)
      return
    }
    setSettled(false)
    let cancelled = false
    void Promise.all(
      missing.map((sound) =>
        getRecMix(undefined, { cluster: sound.id, limit: VIDEOS_PER_SOUND })
          .then((page) => ({ id: sound.id, videos: page.videos.slice(0, VIDEOS_PER_SOUND) }))
          .catch(() => ({ id: sound.id, videos: [] as Video[] })),
      ),
    ).then((filled) => {
      if (cancelled) return
      const byId = new Map(filled.map((row) => [row.id, row.videos]))
      setBoards((current) =>
        current.map((sound) =>
          sound.videos.length > 0 ? sound : { ...sound, videos: byId.get(sound.id) ?? [] },
        ),
      )
      setSettled(true)
    })
    return () => {
      cancelled = true
    }
  }, [sounds])

  if (catalog.length < 2) return null
  const visible = boards.filter((sound) => sound.videos.length > 0)
  if (settled && visible.length === 0) return null

  return (
    <section className="mb-8">
      <SectionHeading title="Explore by sound" hint="Open a video from the sound it belongs to." />
      <Rail label="Explore by sound">
        {(visible.length > 0 ? visible : catalog).map((sound) => (
          <article
            key={sound.id}
            className="flex w-[272px] shrink-0 snap-start flex-col rounded-2xl border border-border bg-muted/30 p-3"
          >
            <h3 className="mb-3 line-clamp-2 min-h-10 text-sm font-semibold leading-snug text-foreground">
              {sound.label}
            </h3>
            {sound.videos.length > 0 ? (
              <div className="space-y-3">
                {sound.videos.map((video) => (
                  <RailVideo
                    key={video.video_id}
                    video={video}
                    openId="opened-video-from-sound-mix"
                    openDetail={sound.label}
                    layout="row"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3" aria-hidden>
                {Array.from({ length: VIDEOS_PER_SOUND }, (_, index) => (
                  <div key={index} className="flex gap-2.5">
                    <div className="h-14 w-[92px] animate-pulse rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </Rail>
    </section>
  )
}

/** Personal rows above Discover: daily mix, "Because you watched", uncharted, sounds, artists. */
export function RecsRows() {
  const { user } = useAuth()
  const [rows, setRows] = useState<RowsState | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const onSaved = () => setRefreshKey((key) => key + 1)
    window.addEventListener(RECS_PICKS_SAVED_EVENT, onSaved)
    return () => window.removeEventListener(RECS_PICKS_SAVED_EVENT, onSaved)
  }, [])

  useEffect(() => {
    let cancelled = false
    const safe = <T,>(promise: Promise<T>, empty: T) =>
      promise.catch((err) => {
        if (!(err instanceof RecsUnavailableError)) console.warn("[hiffi] recommendation row failed:", err)
        return empty
      })
    void Promise.all([
      safe(getRecMix(undefined, { limit: 12 }).then((page) => page.videos), [] as Video[]),
      safe(getBecauseRows(10), [] as BecauseRow[]),
      safe(getArtistsForYou(8), [] as ArtistForYou[]),
      safe(getRecUncharted({ limit: 12 }).then((page) => page.videos), [] as Video[]),
      safe(getSoundClusters(), [] as SoundCluster[]),
    ]).then(([dailyMix, because, artists, uncharted, sounds]) => {
      if (!cancelled) setRows({ dailyMix, because, artists, uncharted, sounds })
    })
    return () => {
      cancelled = true
    }
  }, [user?.uid, refreshKey])

  if (!rows) return null

  return (
    <div className="mb-6">
      <VideoRow
        title="Your daily mix"
        hint="A fresh set from what you play."
        videos={rows.dailyMix}
        openId="opened-video-from-daily-mix"
      />
      {rows.because.map((row) => (
        <VideoRow
          key={row.feedId}
          title={`Because you watched ${row.seed.video_title || "this"}`}
          hint="More in the same lane."
          videos={row.videos}
          openId="opened-video-from-because"
        />
      ))}
      <VideoRow
        title="Uncharted this week"
        hint="Loved by the few who found them. New picks every Monday."
        videos={rows.uncharted}
        openId="opened-video-from-uncharted"
        action={
          <Link
            href="/taste"
            {...trackId("rec-taste-link")}
            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:border-[#E8192C]/40 hover:text-[#E8192C]"
          >
            Your evolving taste
          </Link>
        }
      />
      <SoundBoards sounds={rows.sounds} />
      {rows.artists.length > 0 ? (
        <section className="mb-8">
          <SectionHeading title="Artists for you" hint="Creators that fit what you already watch." />
          <Rail label="Artists for you">
            {rows.artists.map((artist) => (
              <Link
                key={artist.uid}
                href={`/profile/${encodeURIComponent(artist.username)}`}
                {...trackId("rec-artist-card", artist.username)}
                className="group flex w-[7.25rem] shrink-0 snap-start flex-col items-center text-center"
              >
                <span className="rounded-full p-0.5 ring-1 ring-border transition group-hover:ring-[#E8192C]/60 group-focus-visible:ring-2 group-focus-visible:ring-[#E8192C]">
                  <ProfilePicture
                    user={{ username: artist.username, name: artist.name, profile_picture: artist.profile_picture }}
                    size="xl"
                  />
                </span>
                <span className="mt-2 line-clamp-2 w-full text-sm font-medium leading-snug text-foreground group-hover:text-[#E8192C]">
                  {artist.name || artist.username}
                </span>
                <span className="mt-0.5 w-full truncate text-xs text-muted-foreground">
                  {artist.followers.toLocaleString()} follower{artist.followers === 1 ? "" : "s"}
                </span>
              </Link>
            ))}
          </Rail>
        </section>
      ) : null}
    </div>
  )
}
