"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { VideoPlayer } from "@/components/video/video-player"
import { CommentSection } from "@/components/video/comment-section"
import { VideoCard } from "@/components/video/video-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ThumbsUp, ThumbsDown, MoreVertical, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { cn, getColorFromName, getAvatarLetter, getProfilePictureUrl } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"
import { getThumbnailUrl } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { getSeed } from "@/lib/seed-manager"
import { DeleteVideoDialog } from "@/components/video/delete-video-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock video data
const MOCK_VIDEO = {
  videoId: "1",
  videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  videoThumbnail: "/placeholder.svg?key=uvova",
  videoTitle: "Big Buck Bunny - Official Trailer",
  videoDescription:
    "Big Buck Bunny tells the story of a giant rabbit with a heart bigger than himself. When one sunny day three rodents rudely harass him, something snaps... and the bunny ain't no bunny anymore! In the typical cartoon tradition he prepares the nasty rodents a comical revenge.\n\nLicensed under the Creative Commons Attribution license\nhttp://www.bigbuckbunny.org",
  videoViews: 12453,
  videoLikes: 1240,
  userUsername: "blender_foundation",
  userAvatar: "/placeholder.svg?key=blender",
  userFollowers: 54000,
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  tags: ["animation", "short film", "blender", "3d"],
}

const RELATED_VIDEOS = [
  {
    videoId: "2",
    videoUrl: "video2.mp4",
    videoThumbnail: "/placeholder.svg?key=cxy6v",
    videoTitle: "Epic Gaming Moments - Best Highlights This Week",
    videoDescription: "Check out the most insane gaming moments from this week",
    videoViews: 45231,
    userUsername: "pro_gamer_x",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    videoId: "3",
    videoUrl: "video3.mp4",
    videoThumbnail: "/placeholder.svg?key=p72zr",
    videoTitle: "Beautiful Beach Sunset | Travel Vlog Day 5",
    videoDescription: "Exploring the most beautiful beaches in Bali",
    videoViews: 8934,
    userUsername: "wanderlust_jen",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    videoId: "4",
    videoUrl: "video4.mp4",
    videoThumbnail: "/placeholder.svg?key=gbfmy",
    videoTitle: "Music Production 101: Creating Your First Beat",
    videoDescription: "Complete beginner guide to music production",
    videoViews: 23467,
    userUsername: "beat_maker_pro",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export default function WatchPage() {
  const params = useParams()
  const router = useRouter()
  const { user, userData } = useAuth()
  const { toast } = useToast()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isCheckingFollow, setIsCheckingFollow] = useState(false)
  const [isFollowingAction, setIsFollowingAction] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [video, setVideo] = useState<any>(null)
  const [videoCreator, setVideoCreator] = useState<any>(null)
  const [relatedVideos, setRelatedVideos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [upvoteState, setUpvoteState] = useState<{ upvoted: boolean; downvoted: boolean }>({
    upvoted: false,
    downvoted: false,
  })
  const hasFetchedVideoRef = useRef<string | null>(null)
  const isFetchingRef = useRef<boolean>(false)

  useEffect(() => {
    async function fetchVideoData() {
      if (!params.videoId) return

      const videoId = Array.isArray(params.videoId) ? params.videoId[0] : params.videoId

      // Prevent duplicate calls - check synchronously before any async operations
      if (hasFetchedVideoRef.current === videoId || isFetchingRef.current) {
        console.log("[hiffi] Video already fetched or currently fetching, skipping duplicate call")
        return
      }

      // Mark that we're fetching this video - set synchronously
      isFetchingRef.current = true
      hasFetchedVideoRef.current = videoId

      try {
        setIsLoading(true)
        console.log("[hiffi] Fetching video data for:", videoId)

        // Call GET /videos/{videoID} directly - this is called ONCE ONLY
        let videoResponse
        try {
          videoResponse = await apiClient.getVideo(videoId)
          console.log("[hiffi] Video streaming URL from API:", videoResponse)
          
          if (!videoResponse.success || !videoResponse.video_url) {
            throw new Error("Failed to get video data")
          }
        } catch (videoError) {
          console.error("[hiffi] Failed to get video:", videoError)
          // Reset refs on error so we can retry
          hasFetchedVideoRef.current = null
          isFetchingRef.current = false
          setUrlError("Video not found")
          setIsLoading(false)
          return
        }

        // Get basic video info from video list for metadata (title, description, etc.)
        // We'll search a few pages to find the video metadata
        let foundVideo = null
        let allVideos: any[] = []
        const maxPagesToSearch = 5
        const videosPerPage = 50

        const seed = getSeed()
        for (let page = 1; page <= maxPagesToSearch; page++) {
          const videosResponse = await apiClient.getVideoList({ page, limit: videosPerPage, seed })
          const videosArray = videosResponse.videos || []
          
          if (videosArray.length === 0) {
            break
          }

          // Add to all videos for related videos
          allVideos = [...allVideos, ...videosArray]

          // Check if the requested video is in this page
          foundVideo = videosArray.find((v: any) => (v.video_id || v.videoId) === videoId)
          
          if (foundVideo) {
            console.log("[hiffi] Found video metadata from list on page", page)
            break
          }

          // If we got fewer videos than requested, we've reached the end
          if (videosArray.length < videosPerPage) {
            break
          }
        }

        if (foundVideo) {
          // Update video with streaming URL from getVideo response
          foundVideo.video_url = videoResponse.video_url
          foundVideo.streaming_url = videoResponse.video_url
          
          // Update vote state from getVideo API response
          setUpvoteState({
            upvoted: videoResponse.upvoted || false,
            downvoted: videoResponse.downvoted || false,
          })
          setIsLiked(videoResponse.upvoted || false)
          setIsDisliked(videoResponse.downvoted || false)
          
          // Update follow state from getVideo API response
          // Set UNCONDITIONALLY from API response (just like upvote/downvote)
          const followingStatus = videoResponse.following || false
          console.log(`[hiffi] Setting follow state from getVideo API: following=${followingStatus}`)
          setIsFollowing(followingStatus)
          
          // Get video creator username for fetching creator data
          const videoCreatorUsername = foundVideo.userUsername || foundVideo.user_username
          
          setVideo(foundVideo)
          
          // Set related videos (exclude the current video)
          setRelatedVideos(allVideos.filter((v: any) => (v.video_id || v.videoId) !== videoId))
          
          // Fetch video creator data to get follower count
          // Only fetch if user is logged in (endpoint requires authentication)
          if (videoCreatorUsername && user) {
            try {
              const creatorResponse = await apiClient.getUserByUsername(videoCreatorUsername)
              console.log("[hiffi] Creator data from API:", creatorResponse);
              // Handle API response format: { success: true, user: {...}, following?: boolean }
              const creatorProfile = (creatorResponse?.success && creatorResponse?.user) ? creatorResponse.user : (creatorResponse?.user || creatorResponse);
              console.log("[hiffi] Creator profile:", creatorProfile);
              console.log("[hiffi] Creator followers:", creatorProfile?.followers);
              setVideoCreator(creatorProfile)
              // Update following status from API response if available
              if (creatorResponse?.following !== undefined) {
                console.log("[hiffi] Setting follow state from getUserByUsername:", creatorResponse.following);
                setIsFollowing(creatorResponse.following);
              }
            } catch (creatorError: any) {
              // Only log as warning if it's not a 401 (expected when not authenticated)
              if (creatorError?.status !== 401) {
                console.warn("[hiffi] Failed to fetch creator data:", creatorError)
              }
              // Continue without creator data
            }
          } else if (videoCreatorUsername) {
            // User not logged in - use basic info from video object
            setVideoCreator({
              username: videoCreatorUsername,
              name: videoCreatorUsername,
            })
          }
        } else {
          // If we couldn't find video metadata, create a minimal video object from getVideo response
          // This shouldn't happen often, but handle gracefully
          console.warn("[hiffi] Video metadata not found in list, using minimal data")
          const minimalVideo = {
            video_id: videoId,
            video_url: videoResponse.video_url,
            streaming_url: videoResponse.video_url,
            video_title: "Video",
            video_description: "",
            video_views: 0,
            video_upvotes: 0,
            video_downvotes: 0,
            video_comments: 0,
          }
          
          // Update vote and follow state from getVideo API response
          setUpvoteState({
            upvoted: videoResponse.upvoted || false,
            downvoted: videoResponse.downvoted || false,
          })
          setIsLiked(videoResponse.upvoted || false)
          setIsDisliked(videoResponse.downvoted || false)
          
          // Update follow state from getVideo API response (minimal video case)
          const followingStatus = videoResponse.following || false
          console.log(`[hiffi] Setting follow state from getVideo API (minimal): following=${followingStatus}`)
          setIsFollowing(followingStatus)
          
          setVideo(minimalVideo)
          setRelatedVideos(allVideos.slice(0, 6))
        }
      } catch (error) {
        console.error("[hiffi] Failed to fetch video data:", error)
        // Reset refs on error
        hasFetchedVideoRef.current = null
        isFetchingRef.current = false
        setUrlError("Failed to load video")
      } finally {
        setIsLoading(false)
        isFetchingRef.current = false
      }
    }

    fetchVideoData()
    
    // Reset refs when videoId changes
    return () => {
      if (params.videoId) {
        const videoId = Array.isArray(params.videoId) ? params.videoId[0] : params.videoId
        // Reset refs when navigating to a different video
        if (hasFetchedVideoRef.current !== videoId) {
          hasFetchedVideoRef.current = null
          isFetchingRef.current = false
        }
      }
    }
  }, [params.videoId]) // Removed userData from dependencies - we'll handle it separately

  // NOTE: Follow status is now primarily fetched from the getVideo API response
  // which includes the 'following' boolean field. This eliminates the need for 
  // a separate API call to check following status on page load.

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upvote videos",
      })
      return
    }

    if (!video) return

    try {
      const videoId = video.video_id || video.videoId
      await apiClient.upvoteVideo(videoId)
      
      // Update state
      const wasLiked = isLiked
      const wasDisliked = isDisliked
      setIsLiked(!wasLiked)
      setIsDisliked(false)
      setUpvoteState({ upvoted: !wasLiked, downvoted: false })
      
      // Update video counts optimistically while refreshing
      if (video) {
        const currentUpvotes = video.video_upvotes || video.videoUpvotes || video.videoLikes || 0
        const currentDownvotes = video.video_downvotes || video.videoDownvotes || 0
        
        setVideo({
          ...video,
          video_upvotes: wasLiked ? currentUpvotes - 1 : (wasDisliked ? currentUpvotes + 1 : currentUpvotes + 1),
          video_downvotes: wasDisliked ? currentDownvotes - 1 : currentDownvotes,
          uservotestatus: wasLiked ? null : "upvoted",
        })
      }

      // Refresh video data from API to get accurate counts
      try {
        const seed = getSeed()
        const videosResponse = await apiClient.getVideoList({ offset: 0, limit: 6, seed })
        const updatedVideo = videosResponse.videos.find((v: any) => (v.video_id || v.videoId) === videoId)
        if (updatedVideo) {
          console.log("[hiffi] Updated video data after upvote:", updatedVideo);
          setVideo(updatedVideo)
          // Sync vote state with refreshed video data
          // Note: /videos/list endpoint may not include upvoted/downvoted status
          // So we keep the optimistic state unless the API provides it
          if (updatedVideo.upvoted !== undefined || updatedVideo.downvoted !== undefined) {
            setIsLiked(updatedVideo.upvoted || false)
            setIsDisliked(updatedVideo.downvoted || false)
            setUpvoteState({
              upvoted: updatedVideo.upvoted || false,
              downvoted: updatedVideo.downvoted || false,
            })
          }
        }
      } catch (refreshError) {
        console.error("[hiffi] Failed to refresh video data:", refreshError)
        // Keep optimistic update if refresh fails
      }

      toast({
        title: "Success",
        description: wasLiked ? "Upvote removed" : "Video upvoted",
      })
    } catch (error) {
      console.error("[hiffi] Failed to upvote video:", error)
      toast({
        title: "Error",
        description: "Failed to upvote video",
        variant: "destructive",
      })
    }
  }

  const handleDislike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to downvote videos",
      })
      return
    }

    if (!video) return

    try {
      const videoId = video.video_id || video.videoId
      await apiClient.downvoteVideo(videoId)
      
      // Update state
      const wasDisliked = isDisliked
      const wasLiked = isLiked
      setIsDisliked(!wasDisliked)
      setIsLiked(false)
      setUpvoteState({ upvoted: false, downvoted: !wasDisliked })
      
      // Update video counts optimistically while refreshing
      if (video) {
        const currentUpvotes = video.video_upvotes || video.videoUpvotes || video.videoLikes || 0
        const currentDownvotes = video.video_downvotes || video.videoDownvotes || 0
        
        setVideo({
          ...video,
          video_downvotes: wasDisliked ? currentDownvotes - 1 : (wasLiked ? currentDownvotes + 1 : currentDownvotes + 1),
          video_upvotes: wasLiked ? currentUpvotes - 1 : currentUpvotes,
          uservotestatus: wasDisliked ? null : "downvoted",
        })
      }

      // Refresh video data from API to get accurate counts
      try {
        const seed = getSeed()
        const videosResponse = await apiClient.getVideoList({ offset: 0, limit: 6, seed })
        const updatedVideo = videosResponse.videos.find((v: any) => (v.video_id || v.videoId) === videoId)
        if (updatedVideo) {
          console.log("[hiffi] Updated video data after downvote:", updatedVideo);
          setVideo(updatedVideo)
          // Sync vote state with refreshed video data
          // Note: /videos/list endpoint may not include upvoted/downvoted status
          // So we keep the optimistic state unless the API provides it
          if (updatedVideo.upvoted !== undefined || updatedVideo.downvoted !== undefined) {
            setIsLiked(updatedVideo.upvoted || false)
            setIsDisliked(updatedVideo.downvoted || false)
            setUpvoteState({
              upvoted: updatedVideo.upvoted || false,
              downvoted: updatedVideo.downvoted || false,
            })
          }
        }
      } catch (refreshError) {
        console.error("[hiffi] Failed to refresh video data:", refreshError)
        // Keep optimistic update if refresh fails
      }

      toast({
        title: "Success",
        description: wasDisliked ? "Downvote removed" : "Video downvoted",
      })
    } catch (error) {
      console.error("[hiffi] Failed to downvote video:", error)
      toast({
        title: "Error",
        description: "Failed to downvote video",
        variant: "destructive",
      })
    }
  }

  const handleFollow = async () => {
    if (!user || !userData) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow users",
      })
      return
    }

    if (!video) return

    const username = video.userUsername || video.user_username
    if (!username || userData.username === username) return

    // Prevent double-clicks
    if (isFollowingAction) return

    // Store previous state for rollback
    const previousFollowingState = isFollowing
    const previousFollowersCount = videoCreator?.followers || videoCreator?.user?.followers || 0

    try {
      setIsFollowingAction(true)
      
      // Optimistic update
      const newFollowingState = !isFollowing
      setIsFollowing(newFollowingState)

      if (previousFollowingState) {
        // Unfollowing
        const response = await apiClient.unfollowUser(username)
        
        if (!response.success) {
          throw new Error("Failed to unfollow user")
        }
        
        // Refresh recipient user's (creator's) profile data to get updated follower count
        try {
          const creatorResponse = await apiClient.getUserByUsername(username)
          console.log("[hiffi] Refreshed creator data after unfollow:", creatorResponse);
          // Handle API response format: { success: true, user: {...}, following?: boolean }
          const creatorProfile = (creatorResponse?.success && creatorResponse?.user) ? creatorResponse.user : (creatorResponse?.user || creatorResponse);
          setVideoCreator(creatorProfile)
          // Update following status from API response
          if (creatorResponse?.following !== undefined) {
            setIsFollowing(creatorResponse.following);
          }
        } catch (refreshError: any) {
          // Only log as warning if it's not a 401 (expected when not authenticated)
          if (refreshError?.status !== 401) {
            console.warn("[hiffi] Failed to refresh creator data:", refreshError)
          }
          // Update optimistically if refresh fails
          if (videoCreator) {
            setVideoCreator({
              ...videoCreator,
              followers: Math.max(previousFollowersCount - 1, 0),
            })
          }
        }
        
        toast({
          title: "Success",
          description: "Unfollowed user",
        })
      } else {
        // Following
        const response = await apiClient.followUser(username)
        
        if (!response.success) {
          throw new Error("Failed to follow user")
        }
        
        // Refresh recipient user's (creator's) profile data to get updated follower count
        try {
          const creatorResponse = await apiClient.getUserByUsername(username)
          console.log("[hiffi] Refreshed creator data after follow:", creatorResponse);
          // Handle API response format: { success: true, user: {...}, following?: boolean }
          const creatorProfile = (creatorResponse?.success && creatorResponse?.user) ? creatorResponse.user : (creatorResponse?.user || creatorResponse);
          setVideoCreator(creatorProfile)
          // Update following status from API response
          if (creatorResponse?.following !== undefined) {
            setIsFollowing(creatorResponse.following);
          }
        } catch (refreshError: any) {
          // Only log as warning if it's not a 401 (expected when not authenticated)
          if (refreshError?.status !== 401) {
            console.warn("[hiffi] Failed to refresh creator data:", refreshError)
          }
          // Update optimistically if refresh fails
          if (videoCreator) {
            setVideoCreator({
              ...videoCreator,
              followers: previousFollowersCount + 1,
            })
          }
        }
        
        toast({
          title: "Success",
          description: "Following user",
        })
      }
      
      // State is already optimistically updated above
      // No need to verify since the follow/unfollow API calls are reliable
      // If needed, the state will be synced on next page refresh via getVideo API
    } catch (error) {
      console.error("[hiffi] Failed to follow/unfollow user:", error)
      
      // Revert optimistic update on error
      setIsFollowing(previousFollowingState)
      if (videoCreator) {
        setVideoCreator({
          ...videoCreator,
          followers: previousFollowersCount,
        })
      }
      
      toast({
        title: "Error",
        description: `Failed to ${previousFollowingState ? "unfollow" : "follow"} user`,
        variant: "destructive",
      })
    } finally {
      setIsFollowingAction(false)
    }
  }

  if (isLoading || !video) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
            <Sidebar className="hidden lg:block w-64 shrink-0" />
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto flex items-center justify-center">
            <div className="text-center">
              {urlError ? (
                <>
                  <div className="text-4xl mb-4">😕</div>
                  <h2 className="text-2xl font-bold mb-2">Video Not Found</h2>
                  <p className="text-muted-foreground mb-6">{urlError}</p>
                  <Button onClick={() => router.push("/")} variant="default">
                    Go to Home
                  </Button>
                </>
              ) : (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading video...</p>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Use streaming_url if available (from getVideo), otherwise fall back to video_url
  const videoUrl = video.streaming_url || video.video_url || video.videoUrl || ""
  const thumbnailUrl = getThumbnailUrl(video.video_thumbnail || video.videoThumbnail || "")
  
  // Check if current user owns this video
  const isOwner = userData?.username === (video.userUsername || video.user_username)
  const videoId = video.video_id || video.videoId || ""
  
  const handleVideoDeleted = () => {
    // Redirect to home after deletion
    router.push("/")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto w-full min-w-0">
          <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              <VideoPlayer videoUrl={videoUrl} poster={thumbnailUrl} autoPlay />

              <div className="space-y-4">
                <h1 className="text-xl md:text-2xl font-bold">{video.videoTitle || video.video_title}</h1>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {user ? (
                      <Link href={`/profile/${video.userUsername || video.user_username}`}>
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={getProfilePictureUrl(video)} />
                          <AvatarFallback 
                            className="text-white font-semibold"
                            style={{ 
                              backgroundColor: getColorFromName(
                                (video.userName || video.user_name || video.userUsername || video.user_username || "U")
                              ) 
                            }}
                          >
                            {getAvatarLetter({ 
                              name: video.userName || video.user_name, 
                              username: video.userUsername || video.user_username 
                            }, "U")}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                    ) : (
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={getProfilePictureUrl(video)} />
                        <AvatarFallback 
                          className="text-white font-semibold"
                          style={{ 
                            backgroundColor: getColorFromName(
                              (video.userName || video.user_name || video.userUsername || video.user_username || "U")
                            ) 
                          }}
                        >
                          {getAvatarLetter({ 
                            name: video.userName || video.user_name, 
                            username: video.userUsername || video.user_username 
                          }, "U")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="min-w-0">
                      {user ? (
                        <Link
                          href={`/profile/${video.userUsername || video.user_username}`}
                          className="font-semibold hover:text-primary block truncate"
                        >
                          {video.userUsername || video.user_username}
                        </Link>
                      ) : (
                        <span className="font-semibold block truncate">
                          {video.userUsername || video.user_username}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {(videoCreator?.followers ?? 0).toLocaleString()} followers
                      </span>
                    </div>
                    {user && userData && (userData?.username) !== (video.userUsername || video.user_username) && (
                      <Button
                        variant={isFollowing ? "secondary" : "default"}
                        size="sm"
                        className="ml-0 sm:ml-4 rounded-full flex-shrink-0"
                        onClick={handleFollow}
                        disabled={isCheckingFollow || isFollowingAction}
                      >
                        {isCheckingFollow ? "Checking..." : isFollowingAction ? (isFollowing ? "Unfollowing..." : "Following...") : isFollowing ? "Following" : "Follow"}
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center bg-secondary/50 rounded-full p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("rounded-l-full px-3 hover:bg-secondary", isLiked && "text-primary")}
                        onClick={handleLike}
                      >
                        <ThumbsUp className={cn("mr-2 h-4 w-4", isLiked && "fill-current")} />
                        {(video.video_upvotes || video.videoUpvotes || 0).toLocaleString()}
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("rounded-r-full px-3 hover:bg-secondary", isDisliked && "text-destructive")}
                        onClick={handleDislike}
                      >
                        <ThumbsDown className={cn("h-4 w-4", isDisliked && "fill-current")} />
                        {(video.video_downvotes || video.videoDownvotes || 0).toLocaleString()}
                      </Button>
                    </div>
                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="rounded-full">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Video options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteDialogOpen(true)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Video
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                <div className="bg-secondary/30 rounded-xl p-3 text-sm">
                  <div className="flex gap-2 font-medium mb-2">
                    <span>{(video.videoViews || video.video_views || 0).toLocaleString()} views</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(video.createdAt || video.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className={cn("whitespace-pre-wrap", !showFullDescription && "line-clamp-2")}>
                    {video.videoDescription || video.video_description}
                  </div>
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-primary font-medium mt-1 hover:underline"
                  >
                    {showFullDescription ? "Show less" : "Show more"}
                  </button>

                  {video.tags && video.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {video.tags.map((tag: string) => (
                        <Link key={tag} href={`/search?q=${tag}`} className="text-blue-500 hover:underline">
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                <CommentSection videoId={video.videoId || video.video_id} />
              </div>
            </div>

            {/* Sidebar / Related Videos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Up Next</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {relatedVideos.slice(0, 6).map((video) => (
                  <VideoCard key={video.videoId || video.video_id} video={video} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <DeleteVideoDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        videoId={videoId}
        videoTitle={video.videoTitle || video.video_title}
        onDeleted={handleVideoDeleted}
      />
    </div>
  )
}
