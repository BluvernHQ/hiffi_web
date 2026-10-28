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
  type ArtistForYou,
  type BecauseRow,
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

export const RECS_PICKS_SAVED_EVENT = "hiffi:recs-picks-saved"

type RowsState = {
  dailyMix: Video[]
  because: BecauseRow[]
  artists: ArtistForYou[]
  uncharted: Video[]
}

function uniqueVideos(videos: Video[]): Video[] {
  const seenIds = new Set<string>()
  const seenContent = new Set<string>()
  return videos.filter((video) => {
    const videoId = video.video_id?.trim()
    const contentKey = [video.video_title, video.user_uid || video.user_username, video.video_thumbnail]
      .map((value) => value?.trim().toLocaleLowerCase() || "")
      .join("\u001f")

    if (videoId && seenIds.has(videoId)) return false
    if (contentKey !== "\u001f\u001f" && seenContent.has(contentKey)) return false
    if (videoId) seenIds.add(videoId)
    if (contentKey !== "\u001f\u001f") seenContent.add(contentKey)
    return true
  })
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
}: {
  video: Video
  openId: TrackingId
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
      className="relative aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-black/5 transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_28px_rgba(0,0,0,0.14)]"
    >
      {thumbnailUrl ? (
        <AuthenticatedImage
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          sizes="228px"
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

  return (
    <article className="w-[200px] shrink-0 snap-start sm:w-[228px]">
      <Link
        href={watchPath}
        prefetch={!isEncoding}
        {...trackId(openId)}
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
  const unique = uniqueVideos(videos)
  if (unique.length === 0) return null
  return (
    <section className="mb-8">
      <SectionHeading title={title} hint={hint} action={action} />
      <Rail label={title}>
        {unique.map((video) => (
          <RailVideo key={video.video_id} video={video} openId={openId} />
        ))}
      </Rail>
    </section>
  )
}

/** Personal rows above Discover: daily mix, "Because you watched", uncharted, artists. */
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
    ]).then(([dailyMix, because, artists, uncharted]) => {
      if (!cancelled) setRows({ dailyMix, because, artists, uncharted })
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
