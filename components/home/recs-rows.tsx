"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { CompactVideoCard } from "@/components/video/compact-video-card"
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
import { cn } from "@/lib/utils"

export const RECS_PICKS_SAVED_EVENT = "hiffi:recs-picks-saved"

type RowsState = {
  dailyMix: Video[]
  because: BecauseRow[]
  artists: ArtistForYou[]
  uncharted: Video[]
  sounds: SoundCluster[]
}

function VideoRow({
  title,
  videos,
  openId,
  action,
}: {
  title: string
  videos: Video[]
  openId: TrackingId
  action?: ReactNode
}) {
  if (videos.length === 0) return null
  return (
    <section className="mb-5">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h2>
        {action}
      </div>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {videos.map((v) => (
          <div key={v.video_id} className="w-[260px] shrink-0 snap-start">
            <CompactVideoCard video={v as any} openVideoUiName={openId} hideTimestamp />
          </div>
        ))}
      </div>
    </section>
  )
}

/** "Explore by sound": the catalogue's sound clusters; picking one loads its mix. */
function SoundRow({ sounds }: { sounds: SoundCluster[] }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [videos, setVideos] = useState<Video[]>([])

  useEffect(() => {
    if (selected === null) return
    let cancelled = false
    getRecMix(undefined, { cluster: selected, limit: 12 })
      .then((p) => !cancelled && setVideos(p.videos))
      .catch(() => !cancelled && setVideos([]))
    return () => {
      cancelled = true
    }
  }, [selected])

  if (sounds.length < 2) return null
  return (
    <section className="mb-5">
      <h2 className="mb-2 text-base font-semibold tracking-tight text-foreground sm:text-lg">Explore by sound</h2>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {sounds.slice(0, 12).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelected(s.id === selected ? null : s.id)}
            {...trackId("rec-sound-cluster", s.label)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
              s.id === selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted/40 text-foreground hover:bg-muted",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      {selected !== null && videos.length > 0 ? (
        <div className="-mx-1 mt-2 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
          {videos.map((v) => (
            <div key={v.video_id} className="w-[260px] shrink-0 snap-start">
              <CompactVideoCard video={v as any} openVideoUiName="opened-video-from-sound-mix" hideTimestamp />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

/** Personal rows above Discover: daily mix, "Because you watched", uncharted, sounds, artists. */
export function RecsRows() {
  const { user } = useAuth()
  const [rows, setRows] = useState<RowsState | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const onSaved = () => setRefreshKey((k) => k + 1)
    window.addEventListener(RECS_PICKS_SAVED_EVENT, onSaved)
    return () => window.removeEventListener(RECS_PICKS_SAVED_EVENT, onSaved)
  }, [])

  useEffect(() => {
    let cancelled = false
    const safe = <T,>(p: Promise<T>, empty: T) =>
      p.catch((err) => {
        if (!(err instanceof RecsUnavailableError)) console.warn("[hiffi] recommendation row failed:", err)
        return empty
      })
    void Promise.all([
      safe(getRecMix(undefined, { limit: 12 }).then((p) => p.videos), [] as Video[]),
      safe(getBecauseRows(10), [] as BecauseRow[]),
      safe(getArtistsForYou(8), [] as ArtistForYou[]),
      safe(getRecUncharted({ limit: 12 }).then((p) => p.videos), [] as Video[]),
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
    <div className="mb-2">
      <VideoRow title="Your daily mix" videos={rows.dailyMix} openId="opened-video-from-daily-mix" />
      {rows.because.map((row) => (
        <VideoRow
          key={row.feedId}
          title={`Because you watched ${row.seed.video_title || "this"}`}
          videos={row.videos}
          openId="opened-video-from-because"
        />
      ))}
      <VideoRow
        title="Uncharted this week"
        videos={rows.uncharted}
        openId="opened-video-from-uncharted"
        action={
          <Link
            href="/taste"
            {...trackId("rec-taste-link")}
            className="shrink-0 text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Your evolving taste
          </Link>
        }
      />
      <SoundRow sounds={rows.sounds} />
      {rows.artists.length > 0 ? (
        <section className="mb-5">
          <h2 className="mb-2 text-base font-semibold tracking-tight text-foreground sm:text-lg">Artists for you</h2>
          <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
            {rows.artists.map((a) => (
              <Link
                key={a.uid}
                href={`/profile/${encodeURIComponent(a.username)}`}
                {...trackId("rec-artist-card", a.username)}
                className="flex w-28 shrink-0 flex-col items-center gap-2 text-center"
              >
                <ProfilePicture user={{ username: a.username, name: a.name, profile_picture: a.profile_picture }} size="xl" />
                <span className="w-full truncate text-sm font-medium">{a.name || a.username}</span>
                <span className="text-xs text-muted-foreground">
                  {a.followers.toLocaleString()} follower{a.followers === 1 ? "" : "s"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
