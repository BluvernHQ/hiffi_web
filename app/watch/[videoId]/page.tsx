"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { VideoPlayer } from "@/components/video/video-player"
import { CommentSection } from "@/components/video/comment-section"
import { VideoCard } from "@/components/video/video-card"
import { CompactVideoCard } from "@/components/video/compact-video-card"
import { ProfilePicture } from "@/components/profile/profile-picture"
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
import { AuthDialog } from "@/components/auth/auth-dialog"
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
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [upvoteState, setUpvoteState] = useState<{ upvoted: boolean; downvoted: boolean }>({
    upvoted: false,
    downvoted: false,
  })
  const hasFetchedVideoRef = useRef<string | null>(null)
  const isFetchingRef = useRef<boolean>(false)
  
  // Memoize sliced suggested videos to prevent unnecessary re-renders and glitches 
  // when toggling description or other UI states.
  // Show more videos in YouTube-style compact layout
  const sidebarSuggestedVideos = useMemo(() => relatedVideos.slice(0, 20), [relatedVideos])
  const playerSuggestedVideos = useMemo(() => relatedVideos.slice(0, 8), [relatedVideos])

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

        // Call GET /videos/{videoID} directly - this returns full video object with metadata
        let videoResponse
        try {
          videoResponse = await apiClient.getVideo(videoId)
          console.log("[hiffi] Video response from API:", videoResponse)
          
          if (!videoResponse.success || !videoResponse.video_url) {
            throw new Error("Failed to get video data")
          }

          // Use video object directly from API response (no need to search through lists)
          const videoData = videoResponse.video
          if (!videoData) {
            throw new Error("Video data not found in API response")
          }

          // Build complete video object with streaming URL and all metadata
          // Build complete video object with streaming URL and all metadata
          const completeVideo = {
            ...videoData,
            video_url: videoResponse.video_url, // Streaming URL from API
            streaming_url: videoResponse.video_url, // Alias for compatibility
            userUsername: videoData.user_username, // Alias for compatibility
            user_profile_picture: videoResponse.profile_picture, // Latest profile picture from API
          }

          // Update vote state from getVideo API response
          setUpvoteState({
            upvoted: videoResponse.upvoted || false,
            downvoted: videoResponse.downvoted || false,
          })
          setIsLiked(videoResponse.upvoted || false)
          setIsDisliked(videoResponse.downvoted || false)
          
          // Update follow state from getVideo API response
          const followingStatus = videoResponse.following || false
          console.log(`[hiffi] Setting follow state from getVideo API: following=${followingStatus}`)
          setIsFollowing(followingStatus)
          
          setVideo(completeVideo)
          
          // Get video creator username for fetching creator data
          const videoCreatorUsername = videoData.user_username

          // Fetch video creator data to get follower count and profile picture
          // Only fetch if user is logged in (endpoint requires authentication)
          if (videoCreatorUsername && user) {
            try {
              const creatorResponse = await apiClient.getUserByUsername(videoCreatorUsername)
              console.log("[hiffi] Creator data from API:", creatorResponse)
              // Handle API response format: { success: true, user: {...}, following?: boolean }
              const creatorProfile = (creatorResponse?.success && creatorResponse?.user) ? creatorResponse.user : (creatorResponse?.user || creatorResponse)
              console.log("[hiffi] Creator profile fetched:", {
                username: creatorProfile?.username,
                profile_picture: creatorProfile?.profile_picture,
                image: creatorProfile?.image,
                updated_at: creatorProfile?.updated_at
              })
              setVideoCreator(creatorProfile)
              // Update following status from API response if available
              if (creatorResponse?.following !== undefined) {
                console.log("[hiffi] Setting follow state from getUserByUsername:", creatorResponse.following)
                setIsFollowing(creatorResponse.following)
              }
            } catch (creatorError: any) {
              // Only log as warning if it's not a 401 (expected when not authenticated)
              if (creatorError?.status !== 401) {
                console.warn("[hiffi] Failed to fetch creator data:", creatorError)
              }
              // Use profile picture from getVideo response if available
              if (videoResponse.profile_picture) {
                setVideoCreator({
                  username: videoCreatorUsername,
                  name: videoCreatorUsername,
                  profile_picture: videoResponse.profile_picture,
                })
              } else {
                setVideoCreator({
                  username: videoCreatorUsername,
                  name: videoCreatorUsername,
                })
              }
            }
          } else if (videoCreatorUsername) {
            // User not logged in - use basic info from video object and profile picture from API
            setVideoCreator({
              username: videoCreatorUsername,
              name: videoCreatorUsername,
              profile_picture: videoResponse.profile_picture || "",
            })
          }

          // Fetch related videos for suggestions (using video list)
          try {
            const seed = getSeed()
            const videosResponse = await apiClient.getVideoList({ offset: 0, limit: 50, seed })
            const videosArray = videosResponse.videos || []
            
            // Remove current video and shuffle for variety
            const filteredVideos = videosArray.filter((v: any) => (v.video_id || v.videoId) !== videoId)
            
            // Shuffle for variety
            const shuffleArray = (array: any[]) => {
              const shuffled = [...array]
              for (let i: number = shuffled.length - 1; i > 0; i--) {
                const j: number = Math.floor(Math.random() * (i + 1))
                const temp = shuffled[i]
                shuffled[i] = shuffled[j]
                shuffled[j] = temp
              }
              return shuffled
            }
            
            setRelatedVideos(shuffleArray(filteredVideos).slice(0, 12))
          } catch (suggestionsError) {
            console.warn("[hiffi] Failed to fetch related videos:", suggestionsError)
            setRelatedVideos([])
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
      setAuthDialogOpen(true)
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
      <AppLayout>
        <div className="flex items-center justify-center min-h-full p-4 lg:p-6">
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
        </div>
      </AppLayout>
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
    <AppLayout>
      <div className="p-4 lg:p-6 pb-0 lg:pb-6">
        <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 min-w-0">
              <VideoPlayer 
                videoUrl={videoUrl} 
                poster={thumbnailUrl} 
                autoPlay 
                suggestedVideos={playerSuggestedVideos}
              />

              <div className="space-y-4 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold break-words">{video.videoTitle || video.video_title}</h1>

                <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0 flex-1">
                    {user ? (
                      <Link href={`/profile/${video.userUsername || video.user_username}`}>
                        <ProfilePicture 
                          user={videoCreator || {
                            username: video.userUsername || video.user_username,
                            profile_picture: video.user_profile_picture || video.profile_picture,
                            name: video.userName || video.user_name,
                            updated_at: video.updated_at || video.created_at
                          }} 
                          size="md" 
                        />
                      </Link>
                    ) : (
                      <ProfilePicture 
                        user={videoCreator || {
                          username: video.userUsername || video.user_username,
                          profile_picture: video.profile_picture || video.user_profile_picture,
                          name: video.userName || video.user_name,
                          updated_at: video.updated_at || video.created_at
                        }} 
                        size="md" 
                      />
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
                    {(userData?.username) !== (video.userUsername || video.user_username) && (
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

                  <div className="flex items-center gap-2 flex-shrink-0 ml-auto sm:ml-0">
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

              {/* Sidebar / Related Videos - YouTube Style */}
             <div className="space-y-2">
               <h3 className="font-semibold text-sm mb-3 px-1">Up Next</h3>
               <div className="flex flex-col gap-1">
                 {sidebarSuggestedVideos.map((video) => (
                   <CompactVideoCard key={video.videoId || video.video_id} video={video} />
                 ))}
               </div>
             </div>
          </div>
        </div>
      
      <DeleteVideoDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        videoId={videoId}
        videoTitle={video.videoTitle || video.video_title}
        onDeleted={handleVideoDeleted}
      />
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        title="Sign in to follow creators"
        description="Create an account or sign in to follow creators and stay updated with their latest videos."
      />
    </AppLayout>
  )
}
