"use client"

import { useState, useEffect } from "react"
import { VideoGrid } from "@/components/video/video-grid"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"
import { isConnectivityError, userFacingNetworkMessage } from "@/lib/network-errors"
import { OfflineState } from "@/components/network/offline-state"

const VIDEOS_PER_PAGE = 10

export interface HomeFeedClientProps {
  /** First page of videos pre-fetched on the server (may be empty on error). */
  initialVideos: any[]
  /** Seed used by SSR; keeps the client from reshuffling after hydration. */
  seed: string
}

export function HomeFeedClient({ initialVideos, seed }: HomeFeedClientProps) {
  const { userData } = useAuth()
  const [videos, setVideos] = useState<any[]>(() => initialVideos)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(initialVideos.length)
  const [hasMore, setHasMore] = useState(initialVideos.length === VIDEOS_PER_PAGE)
  const [isFetching, setIsFetching] = useState(false)
  const [feedError, setFeedError] = useState<string | null>(null)

  const fetchVideos = async (currentOffset: number, isInitialLoad = false) => {
    if (isFetching) return

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setFeedError(userFacingNetworkMessage())
      setIsFetching(false)
      setLoading(false)
      setLoadingMore(false)
      setHasMore(false)
      if (currentOffset === 0) setVideos([])
      return
    }

    try {
      setFeedError(null)
      setIsFetching(true)
      if (isInitialLoad) setLoading(true)
      else setLoadingMore(true)

      const response = await apiClient.getVideoList({ offset: currentOffset, limit: VIDEOS_PER_PAGE, seed })
      const videosArray = response.videos || []
      const enhanced = videosArray.map((video: any) => {
        const uname = video.user_username || video.userUsername
        if (userData?.username && uname === userData.username && !video.user_profile_picture) {
          video.user_profile_picture = userData.profile_picture || userData.image
          video.user_updated_at = userData.updated_at
        }
        return video
      })

      if (currentOffset === 0) {
        setVideos(enhanced)
        setOffset(enhanced.length)
      } else {
        setVideos((prev) => {
          const seen = new Set(prev.map((v: any) => v.videoId || v.video_id))
          const fresh = enhanced.filter((v: any) => !seen.has(v.videoId || v.video_id))
          const merged = [...prev, ...fresh]
          const newOff = merged.length
          setOffset(newOff)
          return merged
        })
      }
      setHasMore(enhanced.length === VIDEOS_PER_PAGE)
    } catch (err) {
      console.error("[hiffi] Failed to fetch videos:", err)
      if (currentOffset > 0) setHasMore(false)
      else {
        setVideos([])
        setHasMore(false)
        setFeedError(isConnectivityError(err) ? userFacingNetworkMessage() : "Could not load videos. Please try again.")
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setIsFetching(false)
    }
  }

  // If SSR returned nothing (e.g. API error), retry on the client.
  useEffect(() => {
    if (initialVideos.length === 0) {
      fetchVideos(0, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep current user's avatar in sync after auth loads
  useEffect(() => {
    if (!userData?.username || !userData?.profile_picture) return
    setVideos((prev) =>
      prev.map((video: any) => {
        const uname = video.user_username || video.userUsername
        if (uname === userData.username && !video.user_profile_picture) {
          return { ...video, user_profile_picture: userData.profile_picture || userData.image, user_updated_at: userData.updated_at }
        }
        return video
      }),
    )
  }, [userData?.username, userData?.profile_picture, userData?.image, userData?.updated_at])

  const loadMore = () => {
    if (!loading && !loadingMore && !isFetching && hasMore) fetchVideos(videos.length, false)
  }

  return (
    <div className="w-full px-3 py-4 sm:px-4 md:px-4 lg:pl-4 lg:pr-6">
      <div className="w-full">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Discover</h1>
        </div>

        {feedError && videos.length === 0 ? (
          <OfflineState
            className="mx-auto w-full max-w-lg"
            title={feedError === userFacingNetworkMessage() ? "No internet connection" : "Couldn’t load videos"}
            description={feedError}
            onRetry={() => {
              setFeedError(null)
              void fetchVideos(0, true)
            }}
          />
        ) : null}

        <VideoGrid
          videos={videos}
          loading={loading || loadingMore}
          hasMore={hasMore}
          hideTimestamp
          openVideoUiName="opened-video-from-home"
          onLoadMore={loadMore}
          suppressEmptyState={Boolean(feedError && videos.length === 0)}
          onVideoDeleted={(videoId) =>
            setVideos((prev) => prev.filter((v: any) => (v.videoId || v.video_id) !== videoId))
          }
        />
      </div>
    </div>
  )
}
