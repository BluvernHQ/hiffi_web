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
import { useGlobalVideo } from "@/lib/video-context"
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

let persistedWatchUiState: {
  video: any
  videoCreator: any
  relatedVideos: any[]
  isFollowing: boolean
  isLiked: boolean
  isDisliked: boolean
  upvoteState: { upvoted: boolean; downvoted: boolean }
} | null = null

const videoResponseCache = new Map<string, any>()
const inFlightVideoResponse = new Map<string, Promise<any>>()

async function getVideoResponseOnce(videoId: string) {
  if (videoResponseCache.has(videoId)) {
    return videoResponseCache.get(videoId)
  }

  const inFlight = inFlightVideoResponse.get(videoId)
  if (inFlight) {
    return inFlight
  }

  const request = apiClient
    .getVideo(videoId)
    .then((response) => {
      videoResponseCache.set(videoId, response)
      return response
    })
    .finally(() => {
      inFlightVideoResponse.delete(videoId)
    })

  inFlightVideoResponse.set(videoId, request)
  return request
}

const relatedVideosCache = new Map<string, any[]>()
const inFlightRelatedVideos = new Map<string, Promise<any[]>>()

async function getRelatedVideosOnce(videoId: string) {
  if (relatedVideosCache.has(videoId)) {
    return relatedVideosCache.get(videoId) || []
  }

  const inFlight = inFlightRelatedVideos.get(videoId)
  if (inFlight) {
    return inFlight
  }

  const request = (async () => {
    const seed = getSeed()
    const videosResponse = await apiClient.getVideoList({ offset: 0, limit: 50, seed })
    const videosArray = videosResponse.videos || []
    const filteredVideos = videosArray.filter((v: any) => (v.video_id || v.videoId) !== videoId)

    const shuffled = [...filteredVideos]
    for (let i: number = shuffled.length - 1; i > 0; i--) {
      const j: number = Math.floor(Math.random() * (i + 1))
      const temp = shuffled[i]
      shuffled[i] = shuffled[j]
      shuffled[j] = temp
    }

    const nextRelated = shuffled.slice(0, 12)
    relatedVideosCache.set(videoId, nextRelated)
    return nextRelated
  })().finally(() => {
    inFlightRelatedVideos.delete(videoId)
  })

  inFlightRelatedVideos.set(videoId, request)
  return request
}

export default function WatchPage() {
  const params = useParams()
  const router = useRouter()
  const { user, userData } = useAuth()
  const { activeVideo } = useGlobalVideo()
  const { toast } = useToast()
  const [isFollowing, setIsFollowing] = useState(() => persistedWatchUiState?.isFollowing ?? false)
  const [isCheckingFollow, setIsCheckingFollow] = useState(false)
  const [isFollowingAction, setIsFollowingAction] = useState(false)
  const [isLiked, setIsLiked] = useState(() => persistedWatchUiState?.isLiked ?? false)
  const [isDisliked, setIsDisliked] = useState(() => persistedWatchUiState?.isDisliked ?? false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  
  // currentVideo: what is currently rendered in title/description/channel UI.
  const [video, setVideo] = useState<any>(() => {
    if (persistedWatchUiState?.video) {
      return persistedWatchUiState.video
    }
    return null
  })
  const [playerVideo, setPlayerVideo] = useState<any>(() => {
    if (activeVideo && (activeVideo.videoId === params.videoId || activeVideo.video_id === params.videoId)) {
      return activeVideo
    }
    return null
  })
  
  const [videoCreator, setVideoCreator] = useState<any>(() => persistedWatchUiState?.videoCreator ?? null)
  const [relatedVideos, setRelatedVideos] = useState<any[]>(() => persistedWatchUiState?.relatedVideos ?? [])
  
  // Only show initial loading spinner if we don't even have context data
  const [isLoading, setIsLoading] = useState(!video)
  const [isMetadataLoading, setIsMetadataLoading] = useState(false)
  const [isRelatedLoading, setIsRelatedLoading] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const lastFetchedRelatedIdRef = useRef<string | null | undefined>(null)
  const [pendingVideo, setPendingVideo] = useState<{
    videoId: string
    video: any
    creator: any
    following: boolean
    voteState: { upvoted: boolean; downvoted: boolean }
    recommendations: any[] | null
  } | null>(null)
  const [isPlayerReadyForPending, setIsPlayerReadyForPending] = useState(false)
  const [upvoteState, setUpvoteState] = useState<{ upvoted: boolean; downvoted: boolean }>(
    () =>
      persistedWatchUiState?.upvoteState ?? {
        upvoted: false,
        downvoted: false,
      },
  )
  const hasFetchedVideoRef = useRef<string | null>(null)
  const isFetchingRef = useRef<boolean>(false)
  const latestVideoRequestIdRef = useRef<string | null>(null)
  const latestRelatedRequestIdRef = useRef<string | null>(null)
  const currentVideoIdRef = useRef<string | null>(null)
  const pendingVideoIdRef = useRef<string | null>(null)
  
  // Keep previously shown recommendations available across route transitions.
  const visibleRelatedVideos = relatedVideos.length > 0 ? relatedVideos : (persistedWatchUiState?.relatedVideos || [])

  // Memoize sliced suggested videos to prevent unnecessary re-renders and glitches 
  // when toggling description or other UI states.
  // Show more videos in YouTube-style compact layout
  const sidebarSuggestedVideos = useMemo(() => visibleRelatedVideos.slice(0, 20), [visibleRelatedVideos])
  const playerSuggestedVideos = useMemo(() => visibleRelatedVideos.slice(0, 8), [visibleRelatedVideos])

  useEffect(() => {
    currentVideoIdRef.current = video ? (video.video_id || video.videoId) : null
  }, [video])

  useEffect(() => {
    pendingVideoIdRef.current = pendingVideo?.videoId || null
  }, [pendingVideo])

  useEffect(() => {
    if (!video) return
    persistedWatchUiState = {
      video,
      videoCreator,
      relatedVideos,
      isFollowing,
      isLiked,
      isDisliked,
      upvoteState,
    }
  }, [video, videoCreator, relatedVideos, isFollowing, isLiked, isDisliked, upvoteState])

  const handlePlayerMediaReady = (readyVideoId: string) => {
    setPendingVideo((pending) => {
      if (!pending || pending.videoId !== readyVideoId) return pending
      setIsPlayerReadyForPending(true)
      return pending
    })
  }

  useEffect(() => {
    if (!pendingVideo || !isPlayerReadyForPending) return
    if (!pendingVideo.video) return

    setVideo(pendingVideo.video)
    setVideoCreator(pendingVideo.creator)
    setUpvoteState(pendingVideo.voteState)
    setIsLiked(pendingVideo.voteState.upvoted)
    setIsDisliked(pendingVideo.voteState.downvoted)
    setIsFollowing(pendingVideo.following)
    if (pendingVideo.recommendations && pendingVideo.recommendations.length > 0) {
      setRelatedVideos(pendingVideo.recommendations)
      lastFetchedRelatedIdRef.current = pendingVideo.videoId
    }

    setPendingVideo(null)
    setIsPlayerReadyForPending(false)
    setIsLoading(false)
    setIsMetadataLoading(false)
  }, [pendingVideo, isPlayerReadyForPending])

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
      latestVideoRequestIdRef.current = videoId
      const currentDisplayedVideoId = video ? (video.video_id || video.videoId) : null
      const isVideoSwitch = !!currentDisplayedVideoId && currentDisplayedVideoId !== videoId
      const isInitialVideoLoad = !video || !isVideoSwitch
      if (!isInitialVideoLoad) {
        setIsLoading(true) // Set loading true immediately for video switch
        setIsPlayerReadyForPending(false)
        setPendingVideo({
          videoId,
          video: null,
          creator: videoCreator,
          following: isFollowing,
          voteState: upvoteState,
          recommendations: null,
        })
      }

      try {
        // Only show full page spinner on initial load or if video is empty
        if (!video) {
          setIsLoading(true)
        }
        
        console.log("[hiffi] Fetching video data for:", videoId)

        // Call GET /videos/{videoID} directly - this returns full video object with metadata
        let videoResponse: any
        try {
          videoResponse = await getVideoResponseOnce(videoId)
          if (latestVideoRequestIdRef.current !== videoId) return
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
          const completeVideo = {
            ...videoData,
            video_url: videoResponse.video_url, // Streaming URL from API
            streaming_url: videoResponse.video_url, // Alias for compatibility
            userUsername: videoData.user_username, // Alias for compatibility
            user_profile_picture: videoResponse.profile_picture, // Latest profile picture from API
          }
          const nextVoteState = {
            upvoted: videoResponse.upvoted || false,
            downvoted: videoResponse.downvoted || false,
          }
          const followingStatus = videoResponse.following || false
          const videoCreatorUsername = videoData.user_username
          const creatorFallback = videoCreatorUsername
            ? {
                username: videoCreatorUsername,
                name: videoCreatorUsername,
                profile_picture: videoResponse.profile_picture || "",
              }
            : null

          if (isInitialVideoLoad) {
            setVideo(completeVideo)
            setPlayerVideo(completeVideo)
            setVideoCreator(creatorFallback)
            setUpvoteState(nextVoteState)
            setIsLiked(nextVoteState.upvoted)
            setIsDisliked(nextVoteState.downvoted)
            setIsFollowing(followingStatus)
            setIsMetadataLoading(false)
            setIsLoading(false) // Initial load is done
          } else {
            // Start loading the new media immediately in the player, but keep old metadata on screen.
            setPlayerVideo(completeVideo)
            // Keep current video details visible until player confirms new media is ready.
            setPendingVideo((pending) => {
              if (!pending || pending.videoId !== videoId) return pending
              return {
                ...pending,
                video: completeVideo,
                creator: creatorFallback,
                following: followingStatus,
                voteState: nextVoteState,
              }
            })
          }

          // Fetch video creator data in parallel
          if (videoCreatorUsername && user) {
            apiClient.getUserByUsername(videoCreatorUsername).then(creatorResponse => {
              const creatorProfile = (creatorResponse?.success && creatorResponse?.user) ? creatorResponse.user : (creatorResponse?.user || creatorResponse)
              if (isInitialVideoLoad) {
                setVideoCreator(creatorProfile)
                if (creatorResponse?.following !== undefined) {
                  setIsFollowing(creatorResponse.following)
                }
                return
              }

              setPendingVideo((pending) => {
                if (!pending || pending.videoId !== videoId) return pending
                return {
                  ...pending,
                  creator: creatorProfile,
                  following: creatorResponse?.following !== undefined ? creatorResponse.following : pending.following,
                }
              })
            }).catch(creatorError => {
              if (creatorError?.status !== 401) console.warn("[hiffi] Failed to fetch creator data:", creatorError)
              const fallbackProfile = {
                username: videoCreatorUsername,
                name: videoCreatorUsername,
                profile_picture: videoResponse.profile_picture || "",
              }

              if (isInitialVideoLoad) {
                setVideoCreator(fallbackProfile)
                return
              }

              setPendingVideo((pending) => {
                if (!pending || pending.videoId !== videoId) return pending
                return {
                  ...pending,
                  creator: fallbackProfile,
                }
              })
            })
          } else if (videoCreatorUsername) {
            if (isInitialVideoLoad) {
              setVideoCreator(creatorFallback)
            } else {
              setPendingVideo((pending) => {
                if (!pending || pending.videoId !== videoId) return pending
                return {
                  ...pending,
                  creator: creatorFallback,
                }
              })
            }
          }
        } catch (videoError) {
          console.error("[hiffi] Failed to get video:", videoError)
          hasFetchedVideoRef.current = null
          isFetchingRef.current = false
          setUrlError("Video not found")
          setPendingVideo((pending) => (pending?.videoId === videoId ? null : pending))
          setIsPlayerReadyForPending(false)
          setIsLoading(false)
          setIsMetadataLoading(false)
          return
        }
      } catch (error) {
        console.error("[hiffi] Failed to fetch video data:", error)
        hasFetchedVideoRef.current = null
        isFetchingRef.current = false
        setUrlError("Failed to load video")
        setPendingVideo((pending) => (pending?.videoId === videoId ? null : pending))
        setIsPlayerReadyForPending(false)
      } finally {
        isFetchingRef.current = false
      }
    }

    fetchVideoData()
  }, [params.videoId]) // Removed userData from dependencies - we'll handle it separately

  // Effect for related videos.
  useEffect(() => {
    const routeVideoId = Array.isArray(params.videoId) ? params.videoId[0] : params.videoId
    if (!routeVideoId || lastFetchedRelatedIdRef.current === routeVideoId) return
    const videoId = routeVideoId

    async function fetchRelated() {
      const isInitialRelatedLoad = relatedVideos.length === 0
      latestRelatedRequestIdRef.current = videoId
      try {
        if (isInitialRelatedLoad) {
          setIsRelatedLoading(true)
        }

        console.log("[hiffi] Fetching updated recommendations for:", videoId)
        const nextRelatedVideos = await getRelatedVideosOnce(videoId)
        if (latestRelatedRequestIdRef.current !== videoId) return

        if (isInitialRelatedLoad) {
          setRelatedVideos(nextRelatedVideos)
          lastFetchedRelatedIdRef.current = videoId
        } else {
          // Defer recommendation list swap until the newly selected video is playable.
          if (pendingVideoIdRef.current === videoId) {
            setPendingVideo((pending) => {
              if (!pending || pending.videoId !== videoId) return pending
              return {
                ...pending,
                recommendations: nextRelatedVideos,
              }
            })
          } else if (currentVideoIdRef.current === videoId) {
            // Pending may already be committed; apply recommendations when they arrive.
            setRelatedVideos(nextRelatedVideos)
            lastFetchedRelatedIdRef.current = videoId
          }
        }
      } catch (suggestionsError) {
        console.warn("[hiffi] Failed to fetch related videos:", suggestionsError)
      } finally {
        if (isInitialRelatedLoad) {
          setIsRelatedLoading(false)
        }
      }
    }

    fetchRelated()
  }, [params.videoId])

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

  const currentVideo = video || persistedWatchUiState?.video // Alias for readability
  const shouldShowMetadataSkeleton = !currentVideo && (isMetadataLoading || isLoading)
  const shouldShowRelatedSkeleton = sidebarSuggestedVideos.length === 0 && visibleRelatedVideos.length === 0

  // Player source is allowed to update before UI metadata to avoid visual flicker.
  const currentPlayerVideo = playerVideo || currentVideo
  const playerVideoId = currentPlayerVideo?.video_id || currentPlayerVideo?.videoId || ""
  const videoUrl = currentPlayerVideo?.streaming_url || currentPlayerVideo?.video_url || currentPlayerVideo?.videoUrl || ""
  const thumbnailUrl = getThumbnailUrl(currentPlayerVideo?.video_thumbnail || currentPlayerVideo?.videoThumbnail || "")
  
  // Check if current user owns this video
  const isOwner = userData?.username === (currentVideo?.userUsername || currentVideo?.user_username)
  const videoId = currentVideo?.video_id || currentVideo?.videoId || ""
  
  const handleVideoDeleted = () => {
    // Redirect to home after deletion
    router.push("/")
  }

  const handleVideoEnd = () => {
    // Autoplay next video from suggested videos
    if (sidebarSuggestedVideos && sidebarSuggestedVideos.length > 0) {
      const nextVideo = sidebarSuggestedVideos[0]
      const nextVideoId = nextVideo.videoId || nextVideo.video_id
      if (nextVideoId) {
        console.log("[hiffi] Autoplaying next video:", nextVideoId)
        router.push(`/watch/${nextVideoId}`)
      }
    }
  }

  // Stabilize creator user object for ProfilePicture to prevent unnecessary re-renders
  const creatorUser = useMemo(() => {
    if (videoCreator) return videoCreator
    if (!currentVideo) return null
    return {
      username: currentVideo?.userUsername || currentVideo?.user_username,
      profile_picture: currentVideo?.user_profile_picture || currentVideo?.profile_picture,
      name: currentVideo?.userName || currentVideo?.user_name,
      updated_at: currentVideo?.updated_at || currentVideo?.created_at
    }
  }, [videoCreator, currentVideo])

  if (urlError && !video) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-full p-4 lg:p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">😕</div>
            <h2 className="text-2xl font-bold mb-2">Video Not Found</h2>
            <p className="text-muted-foreground mb-6">{urlError}</p>
            <Button onClick={() => router.push("/")} variant="default">
              Go to Home
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 pb-0 lg:pb-6">
        <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 min-w-0">
              <VideoPlayer 
                videoUrl={videoUrl} 
                videoId={playerVideoId}
                poster={thumbnailUrl} 
                autoPlay 
                isLoading={isLoading}
                skipVideoLookup
                suggestedVideos={playerSuggestedVideos}
                onVideoEnd={handleVideoEnd}
                onMediaReady={handlePlayerMediaReady}
                availableProfiles={currentPlayerVideo?.profiles}
              />

              <div className={cn("space-y-4 min-w-0 transition-opacity duration-300", shouldShowMetadataSkeleton ? "opacity-50" : "opacity-100")}>
                {shouldShowMetadataSkeleton ? (
                  <div className="h-8 bg-muted/40 rounded-md w-3/4 animate-pulse" />
                ) : (
                  <h1 className="text-xl md:text-2xl font-bold break-words">{currentVideo?.videoTitle || currentVideo?.video_title}</h1>
                )}

                <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0 flex-1">
                    {user && currentVideo ? (
                      <Link href={`/profile/${currentVideo?.userUsername || currentVideo?.user_username}`}>
                        <ProfilePicture 
                          user={creatorUser} 
                          size="md" 
                        />
                      </Link>
                    ) : (
                      <div className={cn(
                        "h-10 w-10 rounded-full bg-muted/40",
                        shouldShowMetadataSkeleton && "animate-pulse"
                      )}>
                        {!shouldShowMetadataSkeleton && currentVideo && (
                          <ProfilePicture 
                            user={creatorUser} 
                            size="md" 
                          />
                        )}
                      </div>
                    )}
                    <div className="min-w-0">
                      {shouldShowMetadataSkeleton ? (
                        <div className="space-y-2">
                          <div className="h-4 bg-muted/40 rounded w-24 animate-pulse" />
                          <div className="h-3 bg-muted/40 rounded w-16 animate-pulse" />
                        </div>
                      ) : (
                        <>
                          {user ? (
                            <Link
                              href={`/profile/${currentVideo?.userUsername || currentVideo?.user_username}`}
                              className="font-semibold hover:text-primary block truncate"
                            >
                              {currentVideo?.userUsername || currentVideo?.user_username}
                            </Link>
                          ) : (
                            <span className="font-semibold block truncate">
                              {currentVideo?.userUsername || currentVideo?.user_username}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {(videoCreator?.followers ?? 0).toLocaleString()} followers
                          </span>
                        </>
                      )}
                    </div>
                    {(userData?.username) !== (currentVideo?.userUsername || currentVideo?.user_username) && !shouldShowMetadataSkeleton && (
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
                    <div className="flex items-center bg-muted/50 rounded-full p-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("rounded-l-full px-3 hover:bg-muted", isLiked && "text-primary")}
                        onClick={handleLike}
                        disabled={shouldShowMetadataSkeleton}
                      >
                        <ThumbsUp className={cn("mr-2 h-4 w-4", isLiked && "fill-current")} />
                        {(currentVideo?.video_upvotes || currentVideo?.videoUpvotes || 0).toLocaleString()}
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("rounded-r-full px-3 hover:bg-muted", isDisliked && "text-destructive")}
                        onClick={handleDislike}
                        disabled={shouldShowMetadataSkeleton}
                      >
                        <ThumbsDown className={cn("h-4 w-4", isDisliked && "fill-current")} />
                        {(currentVideo?.video_downvotes || currentVideo?.videoDownvotes || 0).toLocaleString()}
                      </Button>
                    </div>
                    {isOwner && !shouldShowMetadataSkeleton && (
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

                <div className="bg-muted/30 rounded-xl p-3 text-sm">
                  {shouldShowMetadataSkeleton ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-muted/40 rounded w-1/3 animate-pulse" />
                      <div className="h-4 bg-muted/40 rounded w-full animate-pulse" />
                      <div className="h-4 bg-muted/40 rounded w-full animate-pulse" />
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2 font-medium mb-2">
                        <span>{(currentVideo?.videoViews || currentVideo?.video_views || 0).toLocaleString()} views</span>
                        <span>•</span>
                        <span>
                          {currentVideo?.createdAt || currentVideo?.created_at ? formatDistanceToNow(new Date(currentVideo.createdAt || currentVideo.created_at), { addSuffix: true }) : ""}
                        </span>
                      </div>
                      <div className={cn("whitespace-pre-wrap", !showFullDescription && "line-clamp-2")}>
                        {currentVideo?.videoDescription || currentVideo?.video_description}
                      </div>
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="text-primary font-medium mt-1 hover:underline"
                      >
                        {showFullDescription ? "Show less" : "Show more"}
                      </button>

                      {currentVideo?.tags && currentVideo?.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {currentVideo.tags.map((tag: string) => (
                            <Link key={tag} href={`/search?q=${tag}`} className="text-blue-500 hover:underline">
                              #{tag}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <Separator className="my-6" />

                {(videoId || params.videoId) && <CommentSection videoId={(videoId || params.videoId) as string} />}
              </div>
            </div>

              {/* Sidebar / Related Videos - YouTube Style */}
             <div className="space-y-2">
               <h3 className="font-semibold text-sm mb-3 px-1">Up Next</h3>
               <div className={cn("flex flex-col gap-1 transition-opacity duration-500", (isRelatedLoading && shouldShowRelatedSkeleton) ? "opacity-100" : (isRelatedLoading ? "opacity-60" : "opacity-100"))}>
                 {sidebarSuggestedVideos.length > 0 ? (
                   sidebarSuggestedVideos.map((v) => (
                     <CompactVideoCard key={v.videoId || v.video_id} video={v} />
                   ))
                 ) : (
                   shouldShowRelatedSkeleton ? <div className="space-y-4">
                     {[1, 2, 3, 4, 5, 6].map((i) => (
                       <div key={i} className="flex gap-2">
                         <div className="h-20 w-32 bg-muted/40 rounded-lg animate-pulse flex-shrink-0" />
                         <div className="flex-1 space-y-2">
                           <div className="h-4 bg-muted/40 rounded w-full animate-pulse" />
                           <div className="h-3 bg-muted/40 rounded w-1/2 animate-pulse" />
                         </div>
                       </div>
                     ))}
                   </div> : null
                 )}
               </div>
             </div>
          </div>
        </div>
      
      {currentVideo && (
        <DeleteVideoDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          videoId={videoId}
          videoTitle={currentVideo.videoTitle || currentVideo.video_title}
          onDeleted={handleVideoDeleted}
        />
      )}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        title="Sign in to follow creators"
        description="Create an account or sign in to follow creators and stay updated with their latest videos."
      />
    </AppLayout>
  )
}
