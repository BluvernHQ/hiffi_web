"use client"

import { useState, useEffect } from "react"
import { VideoGrid } from "@/components/video/video-grid"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"
import { getSeed } from "@/lib/seed-manager"

const VIDEOS_PER_PAGE = 10
const STORAGE_KEY = "hiffi_home_state"
const SCROLL_KEY = "hiffi_home_scroll"

function saveStateToStorage(videos: any[], offset: number, hasMore: boolean) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ videos, offset, hasMore, seed: getSeed(), timestamp: Date.now() }),
    )
  } catch {}
}

function loadStateFromStorage(): { videos: any[]; offset: number; hasMore: boolean } | null {
  if (typeof window === "undefined") return null
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const state = JSON.parse(stored)
    const age = Date.now() - (state.timestamp || 0)
    if (state.seed === getSeed() && age < 5 * 60 * 1000) {
      return { videos: state.videos || [], offset: state.offset || 0, hasMore: state.hasMore ?? true }
    }
  } catch {}
  return null
}

function saveScrollPosition() {
  if (typeof window === "undefined") return
  try {
    const el = document.getElementById("main-content")
    if (el) sessionStorage.setItem(SCROLL_KEY, String(el.scrollTop))
  } catch {}
}

function restoreScrollPosition() {
  if (typeof window === "undefined") return
  try {
    const saved = sessionStorage.getItem(SCROLL_KEY)
    if (!saved) return
    const y = parseInt(saved, 10)
    if (isNaN(y) || y < 0) return
    const tryRestore = () => {
      const el = document.getElementById("main-content")
      if (el) { el.scrollTo({ top: y, behavior: "auto" }); return true }
      return false
    }
    if (!tryRestore()) [10, 50, 150, 300].forEach((d) => setTimeout(tryRestore, d))
  } catch {}
}

export interface HomeFeedClientProps {
  /** First page of videos pre-fetched on the server (may be empty on error). */
  initialVideos: any[]
}

export function HomeFeedClient({ initialVideos }: HomeFeedClientProps) {
  const { userData } = useAuth()
  const [videos, setVideos] = useState<any[]>(() => initialVideos)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(initialVideos.length)
  const [hasMore, setHasMore] = useState(initialVideos.length === VIDEOS_PER_PAGE)
  const [isFetching, setIsFetching] = useState(false)
  // Whether we have restored client-session state (takes over from SSR initial data)
  const [hydrated, setHydrated] = useState(false)

  // Scroll tracking
  useEffect(() => {
    let tid: ReturnType<typeof setTimeout> | null = null
    const handle = () => {
      if (tid) return
      tid = setTimeout(() => { saveScrollPosition(); tid = null }, 100)
    }
    const el = document.getElementById("main-content")
    el?.addEventListener("scroll", handle, { passive: true })
    return () => {
      if (tid) clearTimeout(tid)
      el?.removeEventListener("scroll", handle)
    }
  }, [])

  const fetchVideos = async (currentOffset: number, isInitialLoad = false) => {
    if (isFetching) return
    try {
      setIsFetching(true)
      if (isInitialLoad) setLoading(true)
      else setLoadingMore(true)

      const seed = getSeed()
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
        setTimeout(() => saveStateToStorage(enhanced, enhanced.length, enhanced.length === VIDEOS_PER_PAGE), 0)
      } else {
        setVideos((prev) => {
          const seen = new Set(prev.map((v: any) => v.videoId || v.video_id))
          const fresh = enhanced.filter((v: any) => !seen.has(v.videoId || v.video_id))
          const merged = [...prev, ...fresh]
          const newOff = merged.length
          setOffset(newOff)
          setTimeout(() => saveStateToStorage(merged, newOff, videosArray.length === VIDEOS_PER_PAGE), 0)
          return merged
        })
      }
      setHasMore(enhanced.length === VIDEOS_PER_PAGE)
    } catch (err) {
      console.error("[hiffi] Failed to fetch videos:", err)
      if (currentOffset > 0) setHasMore(false)
      else { setVideos([]); setHasMore(false) }
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setIsFetching(false)
    }
  }

  // On mount: try to restore session state; if none, fall back to SSR initial data.
  useEffect(() => {
    if (hydrated) return
    setHydrated(true)
    const restored = loadStateFromStorage()
    if (restored) {
      setVideos(restored.videos)
      setOffset(restored.offset)
      setHasMore(restored.hasMore)
      setTimeout(restoreScrollPosition, 100)
    } else if (initialVideos.length === 0) {
      // SSR returned nothing (API error), retry on the client
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <div className="flex items-center justify-between mb-1 sm:justify-start">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Discover</h1>
            </div>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Independent creators, high-fidelity video &amp; lossless audio
            </p>
          </div>
        </div>

        {videos.length > 0 && !loading && (
          <div className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 text-center sm:text-left">
            Showing {videos.length} {videos.length === 1 ? "video" : "videos"}
            {hasMore && " · Scroll for more"}
          </div>
        )}

        <VideoGrid
          videos={videos}
          loading={loading || loadingMore}
          hasMore={hasMore}
          openVideoUiName="opened-video-from-home"
          onLoadMore={loadMore}
          onVideoDeleted={(videoId) =>
            setVideos((prev) => prev.filter((v: any) => (v.videoId || v.video_id) !== videoId))
          }
        />
      </div>
    </div>
  )
}
