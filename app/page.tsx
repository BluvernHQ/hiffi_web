"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { VideoGrid } from "@/components/video/video-grid"
import { FollowingEmptyState } from "@/components/video/following-empty-state"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"

type FilterType = 'all' | 'trending' | 'following'

const VIDEOS_PER_PAGE = 10

export default function HomePage() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all')
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set())
  const [loadingFollowing, setLoadingFollowing] = useState(false)
  const [isFetching, setIsFetching] = useState(false) // Prevent duplicate requests
  const { user, userData } = useAuth()

  const fetchVideos = async (pageNum: number, isInitialLoad: boolean = false) => {
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
      
      console.log(`[hiffi] Fetching videos - Page: ${pageNum}, Limit: ${VIDEOS_PER_PAGE}`)
      
      const response = await apiClient.getVideoList({
        page: pageNum,
        limit: VIDEOS_PER_PAGE,
      })

      // Handle null or undefined videos array
      const videosArray = response.videos || []
      
      console.log(`[hiffi] Received ${videosArray.length} videos for page ${pageNum}`)

      if (pageNum === 1) {
        setVideos(videosArray)
      } else {
        // Append new videos to existing ones
        setVideos((prev) => {
          // Prevent duplicates by checking video IDs
          const existingIds = new Set(prev.map(v => v.videoId || v.video_id))
          const newVideos = videosArray.filter(v => !existingIds.has(v.videoId || v.video_id))
          return [...prev, ...newVideos]
        })
      }

      // If we got fewer videos than requested, there are no more pages
      setHasMore(videosArray.length === VIDEOS_PER_PAGE)
      
      if (videosArray.length < VIDEOS_PER_PAGE) {
        console.log(`[hiffi] Reached end of pagination. Got ${videosArray.length} videos, expected ${VIDEOS_PER_PAGE}`)
      }
    } catch (error) {
      console.error("[hiffi] Failed to fetch videos:", error)
      
      // Retry logic for pagination (but not for initial load)
      if (pageNum > 1) {
        console.log("[hiffi] Retrying pagination request...")
        // Don't retry immediately, let user try scrolling again
        // Just set hasMore to false to prevent infinite retry loops
        setHasMore(false)
      } else {
        // Set empty array on error for initial load
        setVideos([])
        setHasMore(false)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setIsFetching(false)
    }
  }

  // Fetch following list when user is logged in and filter is 'following'
  const fetchFollowingList = async () => {
    if (!userData?.username) return

    try {
      setLoadingFollowing(true)
      // Get current user's following list (private endpoint - no username parameter)
      const response = await apiClient.getFollowingList(100, 0)
      if (response.success && response.following) {
        const followingArray = response.following
        const followingSet = new Set(
          followingArray.map((follow: any) => follow.followed_to)
        )
        setFollowedUsers(followingSet)
      } else {
        setFollowedUsers(new Set())
      }
    } catch (error) {
      console.error("[hiffi] Failed to fetch following list:", error)
      setFollowedUsers(new Set())
    } finally {
      setLoadingFollowing(false)
    }
  }

  // Reset and fetch videos when filter changes
  useEffect(() => {
    setPage(1)
    setHasMore(true)
    setVideos([])
    fetchVideos(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilter])

  // Fetch following list when filter changes to 'following' and user is logged in
  useEffect(() => {
    if (currentFilter === 'following' && userData?.username) {
      fetchFollowingList()
    } else {
      setFollowedUsers(new Set())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilter, userData?.username])

  const loadMoreVideos = () => {
    // Only load more if:
    // 1. Not currently loading (initial or more)
    // 2. Not already fetching
    // 3. There are more videos available
    // 4. Filter is 'all' (pagination only works for all videos)
    if (!loading && !loadingMore && !isFetching && hasMore && currentFilter === 'all') {
      const nextPage = page + 1
      console.log(`[hiffi] Loading more videos - Moving to page ${nextPage}`)
      setPage(nextPage)
      fetchVideos(nextPage, false)
    } else {
      console.log(`[hiffi] Cannot load more - loading: ${loading}, loadingMore: ${loadingMore}, isFetching: ${isFetching}, hasMore: ${hasMore}, filter: ${currentFilter}`)
    }
  }

  // Get filtered/sorted videos based on current filter
  const getDisplayVideos = () => {
    switch (currentFilter) {
      case 'trending':
        return [...videos].sort((a, b) => (b.video_views || b.videoViews || 0) - (a.video_views || a.videoViews || 0))
      case 'following':
        if (!userData?.username || followedUsers.size === 0) {
          return []
        }
        // Filter videos to only show those from followed users
        return videos.filter((video) => {
          const videoUsername = video.user_username || video.userUsername
          return videoUsername && followedUsers.has(videoUsername)
        })
      default:
        return videos
    }
  }

  const displayVideos = getDisplayVideos()
  const shouldShowLoadMore = currentFilter === 'all' && hasMore
  // Show loading state: initial load OR loading more OR loading following list
  const isLoadingVideos = loading || loadingMore || (currentFilter === 'following' && loadingFollowing)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        currentFilter={currentFilter}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isMobileOpen={isSidebarOpen} 
          onMobileClose={() => setIsSidebarOpen(false)}
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
        />
        <main className="flex-1 overflow-y-auto bg-background w-full min-w-0 h-[calc(100vh-4rem)]">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center justify-between mb-1 sm:justify-start">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Discover</h1>
                  </div>
                  {currentFilter !== 'all' && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentFilter === 'trending' && 'Most viewed videos'}
                      {currentFilter === 'following' && 'Videos from users you follow'}
                    </p>
                  )}
                </div>
              </div>

              {/* Video count indicator (optional, subtle) */}
              {displayVideos.length > 0 && !loading && (
                <div className="text-xs text-muted-foreground mb-4 text-center sm:text-left">
                  Showing {displayVideos.length} {displayVideos.length === 1 ? 'video' : 'videos'}
                  {currentFilter === 'all' && hasMore && ' • Scroll for more'}
                </div>
              )}

              {/* Show custom empty state for Following filter */}
              {currentFilter === 'following' && !isLoadingVideos && displayVideos.length === 0 ? (
                <FollowingEmptyState 
                  hasFollowedUsers={followedUsers.size > 0}
                  onDiscoverClick={() => setCurrentFilter('all')}
                />
              ) : (
                <VideoGrid 
                  videos={displayVideos} 
                  loading={isLoadingVideos} 
                  hasMore={shouldShowLoadMore} 
                  onLoadMore={currentFilter === 'all' ? loadMoreVideos : undefined} 
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
