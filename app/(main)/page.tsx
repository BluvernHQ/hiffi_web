"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { VideoGrid } from "@/components/video/video-grid"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"
import { getSeed } from "@/lib/seed-manager"

type FilterType = 'all'

const VIDEOS_PER_PAGE = 10
const STORAGE_KEY = 'hiffi_home_state'
const SCROLL_KEY = 'hiffi_home_scroll'

function isValidFilter(filter: string | null): filter is FilterType {
  return filter === 'all'
}

function saveStateToStorage(videos: any[], offset: number, hasMore: boolean, filter: FilterType) {
  if (typeof window === 'undefined') return
  try {
    const currentSeed = getSeed()
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      videos,
      offset,
      hasMore,
      filter,
      seed: currentSeed,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.error('[hiffi] Failed to save state to storage:', error)
  }
}

function loadStateFromStorage(filter: FilterType): { videos: any[], offset: number, hasMore: boolean } | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const state = JSON.parse(stored)
    const age = Date.now() - (state.timestamp || 0)
    if (state.filter === filter && age < 5 * 60 * 1000) {
      return {
        videos: state.videos || [],
        offset: state.offset || 0,
        hasMore: state.hasMore !== undefined ? state.hasMore : true
      }
    }
  } catch (error) {
    console.error('[hiffi] Failed to load state from storage:', error)
  }
  return null
}

function saveScrollPosition() {
  if (typeof window === 'undefined') return
  try {
    const mainContent = document.getElementById('main-content')
    if (mainContent) sessionStorage.setItem(SCROLL_KEY, String(mainContent.scrollTop))
  } catch (error) {
    console.error('[hiffi] Failed to save scroll position:', error)
  }
}

function restoreScrollPosition() {
  if (typeof window === 'undefined') return
  try {
    const savedScroll = sessionStorage.getItem(SCROLL_KEY)
    if (savedScroll) {
      const scrollY = parseInt(savedScroll, 10)
      if (!isNaN(scrollY) && scrollY >= 0) {
        const tryRestore = () => {
          const mainContent = document.getElementById('main-content')
          if (mainContent) {
            mainContent.scrollTo({ top: scrollY, behavior: 'auto' })
            return true
          }
          return false
        }
        if (!tryRestore()) {
          [10, 50, 150, 300].forEach(delay => setTimeout(tryRestore, delay))
        }
      }
    }
  } catch (error) {
    console.error('[hiffi] Failed to restore scroll position:', error)
  }
}

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const { userData } = useAuth()

  const currentFilter: FilterType = 'all'

  useEffect(() => {
    if (typeof window === 'undefined') return
    let timeoutId: NodeJS.Timeout | null = null
    const throttledHandleScroll = () => {
      if (timeoutId) return
      timeoutId = setTimeout(() => { saveScrollPosition(); timeoutId = null }, 100)
    }
    const mainContent = document.getElementById('main-content')
    if (mainContent) mainContent.addEventListener('scroll', throttledHandleScroll, { passive: true })
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (mainContent) mainContent.removeEventListener('scroll', throttledHandleScroll)
    }
  }, [])

  const fetchVideos = async (currentOffset: number, isInitialLoad: boolean = false) => {
    if (isFetching) return
    try {
      setIsFetching(true)
      if (isInitialLoad) setLoading(true)
      else setLoadingMore(true)

      const seed = getSeed()
      const response = await apiClient.getVideoList({
        offset: currentOffset,
        limit: VIDEOS_PER_PAGE,
        seed: seed,
      })
      const videosArray = response.videos || []
      const enhancedVideos = videosArray.map((video: any) => {
        const videoUsername = video.user_username || video.userUsername
        const isCurrentUserVideo = userData?.username && videoUsername === userData.username
        if (isCurrentUserVideo && !video.user_profile_picture && (userData.profile_picture || userData.image)) {
          video.user_profile_picture = userData.profile_picture || userData.image
          video.user_updated_at = userData.updated_at
        }
        return video
      })

      if (currentOffset === 0) {
        setVideos(enhancedVideos)
        setOffset(0)
        setTimeout(() => saveStateToStorage(enhancedVideos, enhancedVideos.length, enhancedVideos.length === VIDEOS_PER_PAGE, currentFilter), 0)
      } else {
        setVideos((prev) => {
          const existingIds = new Set(prev.map(v => (v as any).videoId || (v as any).video_id))
          const newVideos = enhancedVideos.filter(v => !existingIds.has((v as any).videoId || (v as any).video_id))
          const updatedVideos = [...prev, ...newVideos]
          const newOffset = prev.length + newVideos.length
          setOffset(newOffset)
          setTimeout(() => saveStateToStorage(updatedVideos, newOffset, videosArray.length === VIDEOS_PER_PAGE, currentFilter), 0)
          return updatedVideos
        })
      }
      setHasMore(enhancedVideos.length === VIDEOS_PER_PAGE)
    } catch (error) {
      console.error("[hiffi] Failed to fetch videos:", error)
      if (currentOffset > 0) setHasMore(false)
      else {
        setVideos([])
        setHasMore(false)
        if (typeof window !== 'undefined') sessionStorage.removeItem(STORAGE_KEY)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setIsFetching(false)
    }
  }

  useEffect(() => {
    if (userData?.username && userData?.profile_picture && videos.length > 0) {
      setVideos((prevVideos) =>
        prevVideos.map((video: any) => {
          const videoUsername = video.user_username || video.userUsername
          const isCurrentUserVideo = videoUsername === userData.username
          if (isCurrentUserVideo && !video.user_profile_picture) {
            return {
              ...video,
              user_profile_picture: userData.profile_picture || userData.image,
              user_updated_at: userData.updated_at,
            }
          }
          return video
        })
      )
    }
  }, [userData?.username, userData?.profile_picture, userData?.image, userData?.updated_at, videos.length])

  useEffect(() => {
    try {
      const currentSeed = getSeed()
      const restoredState = loadStateFromStorage('all')
      let savedStateSeed: string | null = null
      if (restoredState && typeof window !== 'undefined') {
        try {
          const stored = sessionStorage.getItem(STORAGE_KEY)
          if (stored) {
            const state = JSON.parse(stored)
            savedStateSeed = state.seed || null
          }
        } catch (e) {}
      }

      if (restoredState && savedStateSeed && savedStateSeed !== currentSeed) {
        sessionStorage.removeItem(STORAGE_KEY)
        sessionStorage.removeItem(SCROLL_KEY)
        setOffset(0)
        setHasMore(true)
        setVideos([])
        fetchVideos(0, true)
        return
      }

      if (restoredState && (!savedStateSeed || savedStateSeed === currentSeed)) {
        if (typeof window !== 'undefined') {
          try {
            const stored = sessionStorage.getItem(STORAGE_KEY)
            if (stored) {
              const state = JSON.parse(stored)
              state.seed = currentSeed
              sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
            }
          } catch (e) {}
        }
        setVideos(restoredState.videos)
        setOffset(restoredState.offset)
        setHasMore(restoredState.hasMore)
        setLoading(false)
        setTimeout(restoreScrollPosition, 100)
      } else {
        setOffset(0)
        setHasMore(true)
        setVideos([])
        fetchVideos(0, true)
      }
    } catch (error) {
      console.error('[hiffi] Error in initial load:', error)
      setOffset(0)
      setHasMore(true)
      setVideos([])
      setLoading(false)
      fetchVideos(0, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadMoreVideos = () => {
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
            <p className="text-xs sm:text-sm text-muted-foreground">
              Hiffi Streaming Platform for creators and audiences.{" "}
              <Link href="/what-is-hiffi" className="text-primary hover:underline">
                Learn what Hiffi is
              </Link>
              .
            </p>
          </div>
        </div>
        {videos.length > 0 && !loading && (
          <div className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 text-center sm:text-left">
            Showing {videos.length} {videos.length === 1 ? 'video' : 'videos'}
            {hasMore && ' • Scroll for more'}
          </div>
        )}
        <VideoGrid
          videos={videos}
          loading={loading || loadingMore}
          hasMore={hasMore}
          onLoadMore={loadMoreVideos}
          onVideoDeleted={(videoId) => {
            setVideos((prev) =>
              prev.filter((v) => ((v as any).videoId || (v as any).video_id) !== videoId)
            )
          }}
        />
      </div>
    </div>
  )
}

export default function RootPage() {
  return (
    <Suspense fallback={
      <div className="w-full px-3 py-4 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
