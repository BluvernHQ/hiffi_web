"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { VideoGrid } from "@/components/video/video-grid"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"
import { getSeed } from "@/lib/seed-manager"

type FilterType = 'all'

const VIDEOS_PER_PAGE = 10
const STORAGE_KEY = 'hiffi_home_state'
const SCROLL_KEY = 'hiffi_home_scroll'

// Validate filter type
function isValidFilter(filter: string | null): filter is FilterType {
  return filter === 'all'
}

// State persistence helpers
function saveStateToStorage(videos: any[], offset: number, hasMore: boolean, filter: FilterType) {
  if (typeof window === 'undefined') return
  try {
    // Store current seed with state so we can detect refreshes
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
    // Only restore if filter matches and state is recent (within 5 minutes)
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
    const scrollY = window.scrollY || document.documentElement.scrollTop
    sessionStorage.setItem(SCROLL_KEY, scrollY.toString())
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
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: scrollY, behavior: 'auto' })
          }
        })
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
  const [isFetching, setIsFetching] = useState(false) // Prevent duplicate requests
  const { user, userData } = useAuth()

  // Initialize filter from URL or default to 'all'
  const getFilterFromUrl = (): FilterType => {
    try {
      const filterParam = searchParams?.get('filter')
      return isValidFilter(filterParam) ? filterParam : 'all'
    } catch (error) {
      console.error('[hiffi] Error getting filter from URL:', error)
      return 'all'
    }
  }

  // Home page always shows 'all' videos - no filters needed
  const currentFilter: FilterType = 'all'

  // Save scroll position on scroll
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleScroll = () => {
      saveScrollPosition()
    }
    
    // Throttle scroll events to avoid excessive storage writes
    let timeoutId: NodeJS.Timeout | null = null
    const throttledHandleScroll = () => {
      if (timeoutId) return
      timeoutId = setTimeout(() => {
        handleScroll()
        timeoutId = null
      }, 100)
    }
    
    window.addEventListener('scroll', throttledHandleScroll, { passive: true })
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      window.removeEventListener('scroll', throttledHandleScroll)
    }
  }, [])

  const fetchVideos = async (currentOffset: number, isInitialLoad: boolean = false) => {
    // Prevent duplicate requests
    if (isFetching) {
      console.log("[hiffi] Already fetching, skipping duplicate request")
      return
    }

    try {
      setIsFetching(true)
      
      if (isInitialLoad) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      
      // Get seed - this will be the same across all routes for this session
      const seed = getSeed()
      
      console.log(`[hiffi] Fetching videos - Offset: ${currentOffset}, Limit: ${VIDEOS_PER_PAGE}, Seed: ${seed}`)
      
      const response = await apiClient.getVideoList({
        offset: currentOffset,
        limit: VIDEOS_PER_PAGE,
        seed: seed,
      })

      // Handle null or undefined videos array
      const videosArray = response.videos || []
      
      // Enhance videos with current user's profile picture if video belongs to them
      // This ensures profile pictures show even when API returns empty string
      const enhancedVideos = videosArray.map((video: any) => {
        const videoUsername = video.user_username || video.userUsername
        const isCurrentUserVideo = userData?.username && videoUsername === userData.username
        
        // If video doesn't have profile picture and belongs to current user, add it
        if (isCurrentUserVideo && !video.user_profile_picture && (userData.profile_picture || userData.image)) {
          video.user_profile_picture = userData.profile_picture || userData.image
          video.user_updated_at = userData.updated_at
        }
        
        return video
      })
      
      console.log(`[hiffi] Received ${enhancedVideos.length} videos at offset ${currentOffset}`)

      if (currentOffset === 0) {
        // Initial load - replace videos
        setVideos(enhancedVideos)
        setOffset(0)
        // Save state after initial load
        setTimeout(() => {
          saveStateToStorage(enhancedVideos, enhancedVideos.length, enhancedVideos.length === VIDEOS_PER_PAGE, currentFilter)
        }, 0)
      } else {
        // Append new videos to existing ones
        setVideos((prev) => {
          // Prevent duplicates by checking video IDs
          const existingIds = new Set(prev.map(v => (v as any).videoId || (v as any).video_id))
          const newVideos = enhancedVideos.filter(v => !existingIds.has((v as any).videoId || (v as any).video_id))
          const updatedVideos = [...prev, ...newVideos]
          const newOffset = prev.length + newVideos.length
          setOffset(newOffset)
          // Save updated state
          setTimeout(() => {
            saveStateToStorage(updatedVideos, newOffset, videosArray.length === VIDEOS_PER_PAGE, currentFilter)
          }, 0)
          return updatedVideos
        })
      }

      // If we got fewer videos than requested, there are no more pages
      setHasMore(enhancedVideos.length === VIDEOS_PER_PAGE)
      
      if (enhancedVideos.length < VIDEOS_PER_PAGE) {
        console.log(`[hiffi] Reached end of pagination. Got ${enhancedVideos.length} videos, expected ${VIDEOS_PER_PAGE}`)
      }
    } catch (error) {
      console.error("[hiffi] Failed to fetch videos:", error)
      
      // Retry logic for pagination (but not for initial load)
      if (currentOffset > 0) {
        console.log("[hiffi] Retrying pagination request...")
        // Don't retry immediately, let user try scrolling again
        // Just set hasMore to false to prevent infinite retry loops
        setHasMore(false)
      } else {
        // Set empty array on error for initial load
        setVideos([])
        setHasMore(false)
        // Clear saved state on error
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(STORAGE_KEY)
        }
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setIsFetching(false)
    }
  }


  // Update videos with current user's profile picture when userData is available
  // This ensures profile pictures show even if videos were loaded before userData
  useEffect(() => {
    if (userData?.username && userData?.profile_picture && videos.length > 0) {
      setVideos((prevVideos) => 
        prevVideos.map((video: any) => {
          const videoUsername = video.user_username || video.userUsername
          const isCurrentUserVideo = videoUsername === userData.username
          
          // If video belongs to current user and doesn't have profile picture, add it
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

  // Initial load on mount - check if this is a page refresh
  useEffect(() => {
    try {
      // Get the current seed - this will generate a new one if page was refreshed
      // The seed manager clears the seed on refresh, so getSeed() will generate a new seed
      const currentSeed = getSeed()
      
      // Check if there's saved state
      const restoredState = loadStateFromStorage('all')
      
      // Check if saved state has a seed stored (from previous session)
      let savedStateSeed: string | null = null
      if (restoredState && typeof window !== 'undefined') {
        try {
          const stored = sessionStorage.getItem(STORAGE_KEY)
          if (stored) {
            const state = JSON.parse(stored)
            savedStateSeed = state.seed || null
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
      
      // If saved state exists but seed doesn't match (or wasn't stored), it's a refresh
      // Clear saved state and fetch fresh videos with new seed
      if (restoredState && savedStateSeed && savedStateSeed !== currentSeed) {
        console.log('[hiffi] Page refresh detected - seed changed, clearing saved state and fetching fresh videos')
        console.log('[hiffi] Old seed:', savedStateSeed, 'New seed:', currentSeed)
        sessionStorage.removeItem(STORAGE_KEY)
        sessionStorage.removeItem(SCROLL_KEY)
        setOffset(0)
        setHasMore(true)
        setVideos([])
        fetchVideos(0, true)
        return
      }
      
      // If saved state exists and seed matches (or no seed was stored), restore state
      if (restoredState && (!savedStateSeed || savedStateSeed === currentSeed)) {
        // Store current seed with state for next comparison
        if (typeof window !== 'undefined') {
          try {
            const stored = sessionStorage.getItem(STORAGE_KEY)
            if (stored) {
              const state = JSON.parse(stored)
              state.seed = currentSeed
              sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
            }
          } catch (e) {
            // Ignore errors
          }
        }
        
        // Restore state from sessionStorage (same session, just navigating back)
        console.log('[hiffi] Restoring state from storage:', {
          videos: restoredState.videos.length,
          offset: restoredState.offset,
          hasMore: restoredState.hasMore
        })
        setVideos(restoredState.videos)
        setOffset(restoredState.offset)
        setHasMore(restoredState.hasMore)
        setLoading(false)
        
        // Restore scroll position after a short delay to ensure DOM is ready
        setTimeout(() => {
          restoreScrollPosition()
        }, 100)
      } else {
        // No saved state, fetch fresh
        setOffset(0)
        setHasMore(true)
        setVideos([])
        fetchVideos(0, true)
      }
    } catch (error) {
      console.error('[hiffi] Error in initial load:', error)
      // Fallback to fresh fetch on error
      setOffset(0)
      setHasMore(true)
      setVideos([])
      setLoading(false)
      fetchVideos(0, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])



  const loadMoreVideos = () => {
    // Only load more if:
    // 1. Not currently loading (initial or more)
    // 2. Not already fetching
    // 3. There are more videos available
    if (!loading && !loadingMore && !isFetching && hasMore) {
      // Offset should be the number of items to skip, not page number
      // Calculate next offset based on current number of videos loaded
      const nextOffset = videos.length
      console.log(`[hiffi] Loading more videos - Current videos: ${videos.length}, Next offset: ${nextOffset}`)
      setOffset(nextOffset)
      fetchVideos(nextOffset, false)
    } else {
      console.log(`[hiffi] Cannot load more - loading: ${loading}, loadingMore: ${loadingMore}, isFetching: ${isFetching}, hasMore: ${hasMore}, filter: ${currentFilter}`)
    }
  }

  const displayVideos = videos
  const shouldShowLoadMore = hasMore
  const isLoadingVideos = loading || loadingMore

  return (
    <AppLayout 
      currentFilter={currentFilter}
    >
      <div className="w-full px-3 py-4 sm:px-4 md:px-4 lg:pl-4 lg:pr-6">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <div className="flex items-center justify-between mb-1 sm:justify-start">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Discover</h1>
              </div>
            </div>
          </div>

          {/* Video count indicator (optional, subtle) */}
          {displayVideos.length > 0 && !loading && (
            <div className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 text-center sm:text-left">
              Showing {displayVideos.length} {displayVideos.length === 1 ? 'video' : 'videos'}
              {hasMore && ' • Scroll for more'}
            </div>
          )}

          <VideoGrid 
            videos={displayVideos} 
            loading={isLoadingVideos} 
            hasMore={shouldShowLoadMore} 
            onLoadMore={loadMoreVideos}
            onVideoDeleted={(videoId) => {
              // Remove deleted video from the list
              setVideos((prev) => 
                prev.filter((v) => ((v as any).videoId || (v as any).video_id) !== videoId)
              )
            }}
          />
        </div>
      </div>
    </AppLayout>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="w-full px-3 py-4 sm:px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          </div>
        </div>
      </AppLayout>
    }>
      <HomePageContent />
    </Suspense>
  )
}
