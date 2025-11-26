"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { VideoGrid } from "@/components/video/video-grid"
import { Button } from "@/components/ui/button"
import { Upload, Plus } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"

type FilterType = 'all' | 'trending' | 'following'

export default function HomePage() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all')
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set())
  const [loadingFollowing, setLoadingFollowing] = useState(false)
  const { user, userData } = useAuth()

  const fetchVideos = async (pageNum: number) => {
    try {
      setLoading(true)
      const response = await apiClient.getVideoList({
        page: pageNum,
        limit: 10,
      })

      // Handle null or undefined videos array
      const videosArray = response.videos || []

      if (pageNum === 1) {
        setVideos(videosArray)
      } else {
        setVideos((prev) => [...prev, ...videosArray])
      }

      setHasMore(videosArray.length === 10)
    } catch (error) {
      console.error("[hiffi] Failed to fetch videos:", error)
      // Set empty array on error to prevent null reference errors
      if (pageNum === 1) {
        setVideos([])
      }
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  // Fetch following list when user is logged in and filter is 'following'
  const fetchFollowingList = async () => {
    if (!userData?.username) return

    try {
      setLoadingFollowing(true)
      const response = await apiClient.getFollowingList(userData.username, 1, 100)
      const followingArray = response.following || []
      const followingSet = new Set(
        followingArray.map((follow: any) => follow.followed_to)
      )
      setFollowedUsers(followingSet)
    } catch (error) {
      console.error("[hiffi] Failed to fetch following list:", error)
      setFollowedUsers(new Set())
    } finally {
      setLoadingFollowing(false)
    }
  }

  useEffect(() => {
    fetchVideos(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchVideos(nextPage)
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
  const isLoadingVideos = loading || (currentFilter === 'following' && loadingFollowing)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isMobileOpen={isSidebarOpen} 
          onMobileClose={() => setIsSidebarOpen(false)}
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
        />
        <main className="flex-1 overflow-y-auto bg-background w-full min-w-0">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center justify-between mb-1 sm:justify-start">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Discover</h1>
                    {user && (
                      <Button asChild size="icon" className="h-10 w-10 rounded-full sm:hidden ml-auto">
                        <Link href="/upload">
                          <Plus className="h-5 w-5" />
                          <span className="sr-only">Upload Video</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                  {currentFilter !== 'all' && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentFilter === 'trending' && 'Most viewed videos'}
                      {currentFilter === 'following' && 'Videos from users you follow'}
                    </p>
                  )}
                </div>
                {user && (
                  <Button asChild size="sm" className="hidden sm:flex w-fit">
                    <Link href="/upload">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Video
                    </Link>
                  </Button>
                )}
              </div>

              <VideoGrid 
                videos={displayVideos} 
                loading={isLoadingVideos} 
                hasMore={shouldShowLoadMore} 
                onLoadMore={currentFilter === 'all' ? loadMoreVideos : undefined} 
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
