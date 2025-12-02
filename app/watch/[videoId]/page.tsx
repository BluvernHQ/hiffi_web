"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { VideoPlayer } from "@/components/video/video-player"
import { CommentSection } from "@/components/video/comment-section"
import { VideoCard } from "@/components/video/video-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { cn, getColorFromName, getAvatarLetter, getProfilePictureUrl } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"
import { getThumbnailUrl } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"

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
  const { user, userData } = useAuth()
  const { toast } = useToast()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isCheckingFollow, setIsCheckingFollow] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isDisliked, setIsDisliked] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [video, setVideo] = useState<any>(null)
  const [videoCreator, setVideoCreator] = useState<any>(null)
  const [relatedVideos, setRelatedVideos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [upvoteState, setUpvoteState] = useState<{ upvoted: boolean; downvoted: boolean }>({
    upvoted: false,
    downvoted: false,
  })

  const currentVideoIdRef = useRef<string | null>(null)
  const isFetchingRef = useRef(false)

  useEffect(() => {
    async function fetchVideoData() {
      if (!params.videoId) return

      const videoId = params.videoId as string

      // Prevent duplicate calls for the same videoId
      if (isFetchingRef.current && currentVideoIdRef.current === videoId) {
        console.log("[hiffi] Already fetching video data for:", videoId, "- skipping duplicate call")
        return
      }

      // Mark as fetching and set current videoId
      isFetchingRef.current = true
      currentVideoIdRef.current = videoId

      try {
        setIsLoading(true)
        console.log("[hiffi] Fetching video data for:", videoId)

        const videosResponse = await apiClient.getVideoList({ page: 1, limit: 6 })
        
        // Check if videoId changed during fetch (component unmounted or videoId changed)
        if (currentVideoIdRef.current !== videoId) {
          console.log("[hiffi] VideoId changed during fetch, ignoring response")
          return
        }

        const videosArray = videosResponse.videos || []
        setRelatedVideos(videosArray.filter((v: any) => (v.video_id || v.videoId) !== videoId))

        const videoFromList = videosArray.find((v: any) => (v.video_id || v.videoId) === videoId)

        if (videoFromList) {
          console.log("[hiffi] Found video from list:", videoFromList)
          setVideo(videoFromList)
          
          // Sync vote state with video data
          const voteStatus = videoFromList.uservotestatus || videoFromList.user_vote_status
          setUpvoteState({
            upvoted: voteStatus === "upvoted",
            downvoted: voteStatus === "downvoted",
          })
          setIsLiked(voteStatus === "upvoted")
          setIsDisliked(voteStatus === "downvoted")
          
          // Fetch video creator data to get follower count
          const videoCreatorUsername = videoFromList.userUsername || videoFromList.user_username
          if (videoCreatorUsername) {
            try {
              const creatorResponse = await apiClient.getUserByUsername(videoCreatorUsername)
              
              // Check if videoId changed during fetch
              if (currentVideoIdRef.current !== videoId) {
                return
              }

              console.log("[hiffi] Creator data from API:", creatorResponse);
              // Handle API response format: { success: true, user: {...} }
              const creatorProfile = (creatorResponse?.success && creatorResponse?.user) ? creatorResponse.user : (creatorResponse?.user || creatorResponse);
              console.log("[hiffi] Creator profile:", creatorProfile);
              console.log("[hiffi] Creator followers:", creatorProfile?.followers);
              setVideoCreator(creatorProfile)
            } catch (creatorError: any) {
              // Only log error if videoId hasn't changed and not 401 (unauthorized is expected for non-authenticated users)
              if (currentVideoIdRef.current === videoId && creatorError?.status !== 401) {
                console.error("[hiffi] Failed to fetch creator data:", creatorError)
              }
              // Continue without creator data
            }
            
            // Check if current user is following the video creator
            if (userData?.username && userData.username !== videoCreatorUsername) {
              setIsCheckingFollow(true)
              try {
                const isFollowingStatus = await apiClient.checkFollowingStatus(
                  userData.username,
                  videoCreatorUsername
                )
                
                // Check if videoId changed during fetch
                if (currentVideoIdRef.current !== videoId) {
                  return
                }

                setIsFollowing(isFollowingStatus)
              } catch (followError) {
                if (currentVideoIdRef.current === videoId) {
                  console.error("[hiffi] Failed to check following status:", followError)
                }
                setIsFollowing(videoFromList.isfollowing || false)
              } finally {
                if (currentVideoIdRef.current === videoId) {
                  setIsCheckingFollow(false)
                }
              }
            } else {
              setIsFollowing(false)
            }
          }
        } else {
          console.log("[hiffi] Video not found in list, showing first video as fallback")
          if (videosResponse.videos.length > 0) {
            setVideo(videosResponse.videos[0])
          } else {
            throw new Error("No videos found")
          }
        }
      } catch (error: any) {
        // Don't log errors if videoId changed
        if (currentVideoIdRef.current === videoId) {
          console.error("[hiffi] Failed to fetch video data:", error)
          setUrlError("Failed to load video")
        }
      } finally {
        // Only update loading state if this is still the current videoId
        if (currentVideoIdRef.current === videoId) {
          setIsLoading(false)
        }
        // Reset fetching flag only if this is still the current videoId
        if (currentVideoIdRef.current === videoId) {
          isFetchingRef.current = false
        }
      }
    }

    fetchVideoData()

    // Cleanup function to reset fetching flag if component unmounts or videoId changes
    return () => {
      // Only reset if this is still the current videoId (component unmounting)
      if (currentVideoIdRef.current === params.videoId) {
        isFetchingRef.current = false
        currentVideoIdRef.current = null
      }
    }
  }, [params.videoId, userData?.username])

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
        const videosResponse = await apiClient.getVideoList({ page: 1, limit: 6 })
        const updatedVideo = videosResponse.videos.find((v: any) => (v.video_id || v.videoId) === videoId)
        if (updatedVideo) {
          console.log("[hiffi] Updated video data after upvote:", updatedVideo);
          setVideo(updatedVideo)
          // Sync vote state with refreshed video data
          const voteStatus = updatedVideo.uservotestatus || updatedVideo.user_vote_status
          setIsLiked(voteStatus === "upvoted")
          setIsDisliked(voteStatus === "downvoted")
          setUpvoteState({
            upvoted: voteStatus === "upvoted",
            downvoted: voteStatus === "downvoted",
          })
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
        const videosResponse = await apiClient.getVideoList({ page: 1, limit: 6 })
        const updatedVideo = videosResponse.videos.find((v: any) => (v.video_id || v.videoId) === videoId)
        if (updatedVideo) {
          console.log("[hiffi] Updated video data after downvote:", updatedVideo);
          setVideo(updatedVideo)
          // Sync vote state with refreshed video data
          const voteStatus = updatedVideo.uservotestatus || updatedVideo.user_vote_status
          setIsLiked(voteStatus === "upvoted")
          setIsDisliked(voteStatus === "downvoted")
          setUpvoteState({
            upvoted: voteStatus === "upvoted",
            downvoted: voteStatus === "downvoted",
          })
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

    try {
      if (isFollowing) {
        await apiClient.unfollowUser(username)
        setIsFollowing(false)
        
        // Refresh recipient user's (creator's) profile data to get updated follower count
        try {
          const creatorResponse = await apiClient.getUserByUsername(username)
          console.log("[hiffi] Refreshed creator data after unfollow:", creatorResponse);
          // Handle API response format: { success: true, user: {...} }
          const creatorProfile = (creatorResponse?.success && creatorResponse?.user) ? creatorResponse.user : (creatorResponse?.user || creatorResponse);
          setVideoCreator(creatorProfile)
        } catch (refreshError) {
          console.error("[hiffi] Failed to refresh creator data:", refreshError)
          // Update optimistically if refresh fails
          if (videoCreator) {
            setVideoCreator({
              ...videoCreator,
              followers: Math.max((videoCreator.followers || videoCreator.user?.followers || 0) - 1, 0),
            })
          }
        }
        
        toast({
          title: "Success",
          description: "Unfollowed user",
        })
      } else {
        await apiClient.followUser(username)
        setIsFollowing(true)
        
        // Refresh recipient user's (creator's) profile data to get updated follower count
        try {
          const creatorResponse = await apiClient.getUserByUsername(username)
          console.log("[hiffi] Refreshed creator data after follow:", creatorResponse);
          // Handle API response format: { success: true, user: {...} }
          const creatorProfile = (creatorResponse?.success && creatorResponse?.user) ? creatorResponse.user : (creatorResponse?.user || creatorResponse);
          setVideoCreator(creatorProfile)
        } catch (refreshError) {
          console.error("[hiffi] Failed to refresh creator data:", refreshError)
          // Update optimistically if refresh fails
          if (videoCreator) {
            setVideoCreator({
              ...videoCreator,
              followers: (videoCreator.followers || videoCreator.user?.followers || 0) + 1,
            })
          }
        }
        
        toast({
          title: "Success",
          description: "Following user",
        })
      }
      
      // Verify follow status
      try {
        const verifiedStatus = await apiClient.checkFollowingStatus(
          userData.username,
          username
        )
        setIsFollowing(verifiedStatus)
      } catch (verifyError) {
        console.error("[hiffi] Failed to verify following status:", verifyError)
      }
    } catch (error) {
      console.error("[hiffi] Failed to follow/unfollow user:", error)
      toast({
        title: "Error",
        description: `Failed to ${isFollowing ? "unfollow" : "follow"} user`,
        variant: "destructive",
      })
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>{urlError ? urlError : "Loading video..."}</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const videoUrl = video.video_url || video.videoUrl || ""
  const thumbnailUrl = getThumbnailUrl(video.video_thumbnail || video.videoThumbnail || "")

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
                        disabled={isCheckingFollow}
                      >
                        {isCheckingFollow ? "Checking..." : isFollowing ? "Following" : "Follow"}
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
    </div>
  )
}
