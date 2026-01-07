'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { VideoGrid } from '@/components/video/video-grid'
import { FollowingEmptyState } from '@/components/video/following-empty-state'
import { useAuth } from '@/lib/auth-context'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Video } from 'lucide-react'

const VIDEOS_PER_PAGE = 10

export default function FollowingPage() {
  const router = useRouter()
  const { userData, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isFetching, setIsFetching] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!userData?.username) {
        // Redirect to login if not authenticated
        router.push('/login')
        return
      }
      // Reset and fetch videos on mount
      setOffset(0)
      setHasMore(true)
      setVideos([])
      fetchVideos(0, true)
    }
  }, [userData, authLoading, router])

  const fetchVideos = async (currentOffset: number, isInitialLoad: boolean = false) => {
    // Prevent duplicate requests
    if (isFetching) {
      console.log("[hiffi] Already fetching following videos, skipping duplicate request")
      return
    }

    try {
      setIsFetching(true)
      
      if (isInitialLoad) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      
      console.log(`[hiffi] Fetching following videos - Offset: ${currentOffset}, Limit: ${VIDEOS_PER_PAGE}`)
      
      const response = await apiClient.getFollowingVideos({
        offset: currentOffset,
        limit: VIDEOS_PER_PAGE,
      })

      // Handle null or undefined videos array
      const videosArray = response.videos || []
      
      console.log(`[hiffi] Received ${videosArray.length} following videos at offset ${currentOffset}`)

      if (currentOffset === 0) {
        // Initial load - replace videos
        setVideos(videosArray)
      } else {
        // Append new videos to existing ones
        setVideos((prev) => {
          // Prevent duplicates by checking video IDs
          const existingIds = new Set(prev.map(v => (v as any).videoId || (v as any).video_id))
          const newVideos = videosArray.filter(v => !existingIds.has((v as any).videoId || (v as any).video_id))
          return [...prev, ...newVideos]
        })
      }

      // If we got fewer videos than requested, there are no more pages
      setHasMore(videosArray.length === VIDEOS_PER_PAGE)
      
      if (videosArray.length < VIDEOS_PER_PAGE) {
        console.log(`[hiffi] Reached end of pagination. Got ${videosArray.length} videos, expected ${VIDEOS_PER_PAGE}`)
      }
    } catch (error) {
      console.error("[hiffi] Failed to fetch following videos:", error)
      
      // Retry logic for pagination (but not for initial load)
      if (currentOffset > 0) {
        console.log("[hiffi] Retrying pagination request...")
        setHasMore(false)
      } else {
        // Set empty array on error for initial load
        setVideos([])
        setHasMore(false)
        toast({
          title: "Error",
          description: "Failed to load videos from creators you follow",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setIsFetching(false)
    }
  }

  const loadMoreVideos = () => {
    // Only load more if:
    // 1. Not currently loading (initial or more)
    // 2. Not already fetching
    // 3. There are more videos available
    if (!loading && !loadingMore && !isFetching && hasMore) {
      // Offset should be the number of items to skip, not page number
      // Calculate next offset based on current number of videos loaded
      const nextOffset = videos.length
      console.log(`[hiffi] Loading more following videos - Current videos: ${videos.length}, Next offset: ${nextOffset}`)
      setOffset(nextOffset)
      fetchVideos(nextOffset, false)
    } else {
      console.log(`[hiffi] Cannot load more - loading: ${loading}, loadingMore: ${loadingMore}, isFetching: ${isFetching}, hasMore: ${hasMore}`)
    }
  }

  const shouldShowLoadMore = hasMore
  const isLoadingVideos = loading || loadingMore

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar 
            isMobileOpen={isSidebarOpen} 
            onMobileClose={() => setIsSidebarOpen(false)}
          />
          <main className="flex-1 overflow-y-auto w-full min-w-0 h-[calc(100dvh-4rem)]">
            <div className="container mx-auto px-4 py-6 sm:py-8">
              <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Show empty state if not authenticated
  if (!userData?.username) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isMobileOpen={isSidebarOpen} 
          onMobileClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto w-full min-w-0 h-[calc(100dvh-4rem)]">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Video className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Following</h1>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Videos from creators you follow
                  </p>
                </div>
              </div>

              {/* Video count indicator */}
              {videos.length > 0 && !loading && (
                <div className="text-xs text-muted-foreground mb-4 text-center sm:text-left">
                  Showing {videos.length} {videos.length === 1 ? 'video' : 'videos'}
                  {hasMore && ' • Scroll for more'}
                </div>
              )}

              {/* Show custom empty state for Following filter */}
              {!isLoadingVideos && videos.length === 0 ? (
                <FollowingEmptyState 
                  hasFollowedUsers={true}
                  onDiscoverClick={() => router.push('/')}
                />
              ) : (
                <VideoGrid 
                  videos={videos} 
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
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
