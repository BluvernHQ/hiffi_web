"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CompactVideoCard } from "@/components/video/compact-video-card"
import { useAuth } from "@/lib/auth-context"
import { trackId } from "@/lib/analytics/tracking-ids"
import {
  getArtistsForYou,
  getBecauseRows,
  getRecMix,
  type ArtistForYou,
  type BecauseRow,
  RecsUnavailableError,
} from "@/lib/recs/client"
import type { Video } from "@/lib/api-client"
import { getProfilePictureUrl } from "@/lib/storage"

export const RECS_PICKS_SAVED_EVENT = "hiffi:recs-picks-saved"

type RowsState = {
  dailyMix: Video[]
  because: BecauseRow[]
  artists: ArtistForYou[]
}

function VideoRow({ title, videos, openId }: { title: string; videos: Video[]; openId: "opened-video-from-daily-mix" | "opened-video-from-because" }) {
  if (videos.length === 0) return null
  return (
    <section className="mb-5">
      <h2 className="mb-2 truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h2>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {videos.map((v) => (
          <div key={v.video_id || v.videoId} className="w-[260px] shrink-0 snap-start">
            <CompactVideoCard video={v as any} openVideoUiName={openId} hideTimestamp />
          </div>
        ))}
      </div>
    </section>
  )
}

/** Personal rows above Discover: daily mix, "Because you watched", artists for you. */
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
    ]).then(([dailyMix, because, artists]) => {
      if (!cancelled) setRows({ dailyMix, because, artists })
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
          title={`Because you watched ${row.seed.videoTitle || row.seed.video_title || "this"}`}
          videos={row.videos}
          openId="opened-video-from-because"
        />
      ))}
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
                <img
                  src={getProfilePictureUrl(a.profile_picture) || "/placeholder-user.jpg"}
                  alt=""
                  className="h-20 w-20 rounded-full border object-cover"
                  loading="lazy"
                />
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
