"use client"

import { useState, useEffect, useRef, useMemo, startTransition } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { VideoPlayer } from "@/components/video/video-player"
import { CommentSection } from "@/components/video/comment-section"
import { VideoCard } from "@/components/video/video-card"
import { CompactVideoCard } from "@/components/video/compact-video-card"
import { AuthenticatedImage } from "@/components/video/authenticated-image"
import { ProfilePicture } from "@/components/profile/profile-picture"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Drawer, DrawerContent, DrawerDescription, DrawerHandle, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { ChevronRight, Heart, ListPlus, MessageSquare, SendHorizontal, Share2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import { useGlobalVideo } from "@/lib/video-context"
import Link from "next/link"
import { cn, getColorFromName, getAvatarLetter, getProfilePictureUrl } from "@/lib/utils"
import { shareUrl } from "@/lib/share"
import { apiClient } from "@/lib/api-client"
import { getThumbnailUrl } from "@/lib/storage"
import { getPlaylistSession, setPlaylistSession } from "@/lib/playlist-session"
import { useToast } from "@/hooks/use-toast"
import { isVideoProcessing, PROCESSING_VIDEO_TOAST } from "@/lib/video-utils"
import { getSeed, resetSeed } from "@/lib/seed-manager"
import { captureConversionEvent } from "@/lib/conversion-tracking"
import dynamic from "next/dynamic"
import { ShareVideoDialog } from "@/components/video/share-video-dialog"
import { AuthDialog } from "@/components/auth/auth-dialog"

const AddToPlaylistDialog = dynamic(
  () =>
    import("@/components/video/add-to-playlist-dialog").then((m) => ({
      default: m.AddToPlaylistDialog,
    })),
  { ssr: false },
)

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

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
const URL_EXACT_REGEX = /^(https?:\/\/[^\s]+|www\.[^\s]+)$/i

function resolveVoteState(
  source: any,
  fallback: { upvoted: boolean; downvoted: boolean } = { upvoted: false, downvoted: false },
) {
  if (!source) return fallback

  if (typeof source.upvoted === "boolean" || typeof source.downvoted === "boolean") {
    return {
      upvoted: source.upvoted === true,
      downvoted: source.downvoted === true,
    }
  }

  const voteStatus = source.uservotestatus || source.user_vote_status
  if (typeof voteStatus === "string") {
    if (voteStatus === "upvoted") return { upvoted: true, downvoted: false }
    if (voteStatus === "downvoted") return { upvoted: false, downvoted: true }
  }

  if (source.upvoted_at || source.liked_at) {
    return { upvoted: true, downvoted: false }
  }

  return fallback
}

function hasVoteMetadata(source: any): boolean {
  if (!source) return false
  if (typeof source.upvoted === "boolean" || typeof source.downvoted === "boolean") return true
  if (typeof source.uservotestatus === "string" || typeof source.user_vote_status === "string") return true
  if (source.upvoted_at || source.liked_at) return true
  return false
}

function getSourceVideoId(source: any): string {
  if (!source) return ""
  return source.video_id || source.videoId || ""
}

function resolveVoteStateForVideo(
  source: any,
  expectedVideoId: string,
  fallback: { upvoted: boolean; downvoted: boolean } = { upvoted: false, downvoted: false },
) {
  if (!source) return fallback
  const sourceId = getSourceVideoId(source)
  if (!sourceId || sourceId !== expectedVideoId) return fallback
  return resolveVoteState(source, fallback)
}

function renderDescriptionWithClickableLinks(text?: string | null) {
  if (!text) {
    return null
  }

  const parts = text.split(URL_REGEX)

  return parts.map((part, index) => {
    const trimmedPart = part.trim()
    const isUrl = URL_EXACT_REGEX.test(trimmedPart)

    if (!isUrl) {
      return <span key={`text-${index}`}>{part}</span>
    }

    // Keep punctuation outside the link to avoid malformed URLs.
    const match = part.match(/^(.*?)([.,!?;:)]*)$/)
    const urlText = match?.[1] ?? part
    const trailingPunctuation = match?.[2] ?? ""
    const href = urlText.startsWith("http://") || urlText.startsWith("https://") ? urlText : `https://${urlText}`

    return (
      <span key={`link-${index}`}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
        >
          {urlText}
        </a>
        {trailingPunctuation}
      </span>
    )
  })
}

async function getVideoResponseOnce(videoId: string, forceFresh = false) {
  if (!forceFresh && videoResponseCache.has(videoId)) {
    return videoResponseCache.get(videoId)
  }

  const inFlight = !forceFresh ? inFlightVideoResponse.get(videoId) : undefined
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
  const searchParams = useSearchParams()

  // ?t=<seconds> — populated by Google SeekToAction deep-links in search results.
  // Only applied on initial mount; stored in a ref so it never re-triggers on re-renders.
  const _tParam = searchParams.get("t")
  const _tParsed = _tParam ? parseFloat(_tParam) : NaN
  const initialSeekSeconds = useRef<number | undefined>(isFinite(_tParsed) && _tParsed > 0 ? _tParsed : undefined)

  const { user, userData } = useAuth()
  const { activeVideo } = useGlobalVideo()
  const { toast } = useToast()

  const routeVideoId = useMemo(() => {
    const p = params.videoId
    return (Array.isArray(p) ? p[0] : (p as string)) || ""
  }, [params.videoId])

  const persistedRouteVideoId = persistedWatchUiState?.video
    ? persistedWatchUiState.video.video_id || persistedWatchUiState.video.videoId
    : null
  const shouldUsePersistedUiState = !!persistedRouteVideoId && persistedRouteVideoId === routeVideoId

  // Drives all fetches and the player source. Initialized from the URL param but updated
  // in-place on next/previous so the VideoPlayer never unmounts (preserves fullscreen).
  const [currentVideoId, setCurrentVideoId] = useState<string>(() => {
    const p = params.videoId
    return (Array.isArray(p) ? p[0] : p as string) || ""
  })

  // Sync currentVideoId when the URL param changes via real Next.js navigation
  // (deep links, browser address bar, etc.) so those paths still work correctly.
  useEffect(() => {
    const p = params.videoId
    const id = (Array.isArray(p) ? p[0] : p as string) || ""
    if (id && id !== currentVideoId) {
      setCurrentVideoId(id)
      videoHistoryRef.current = [] // External navigation resets internal history
      setPlayerBackStackEpoch((n) => n + 1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.videoId])

  // Stack of previously played video IDs for in-place back navigation.
  const videoHistoryRef = useRef<string[]>([])
  /** Bumped whenever the stack is pushed/popped/cleared so we can derive UI from ref length. */
  const [playerBackStackEpoch, setPlayerBackStackEpoch] = useState(0)
  const isInPlaceNavigationRef = useRef(false)
  const [playlistContext, setPlaylistContext] = useState<{
    playlistId: string
    title: string
    videoIds: string[]
    currentIndex: number
    autoplay: boolean
  } | null>(null)
  const [playlistVideoMeta, setPlaylistVideoMeta] = useState<Record<string, { title?: string; thumbnail?: string }>>({})
  const canNavigateToPreviousVideo = useMemo(() => {
    if (playlistContext && playlistContext.currentIndex > 0) return true
    return videoHistoryRef.current.length > 0
  }, [playlistContext, playerBackStackEpoch])

  const navigateToVideo = (nextId: string, nextIndex?: number, pushHistory = true) => {
    if (!nextId || nextId === currentVideoId) return
    isInPlaceNavigationRef.current = true
    if (pushHistory) {
      videoHistoryRef.current.push(currentVideoId)
      setPlayerBackStackEpoch((n) => n + 1)
    }
    setCurrentVideoId(nextId)
    if (typeof window !== "undefined") {
      const url = nextIndex !== undefined && playlistContext
        ? `/watch/${nextId}?playlist=${encodeURIComponent(playlistContext.playlistId)}&pindex=${nextIndex}`
        : `/watch/${nextId}`
      window.history.pushState({}, "", url)
    }
  }

  // Called by VideoPlayer's Next button. Swaps source in-place → player stays mounted.
  const handlePlayerNext = (nextId: string) => {
    // Use a fresh recommendation seed whenever the user advances to next.
    resetSeed()
    if (playlistContext && playlistContext.currentIndex < playlistContext.videoIds.length - 1) {
      const nextIndex = playlistContext.currentIndex + 1
      const playlistNextId = playlistContext.videoIds[nextIndex]
      if (playlistNextId) {
        captureConversionEvent("conversion_next_clicked", {
          video_id: currentVideoId,
          next_video_id: playlistNextId,
          source: "playlist",
          playlist_id: playlistContext.playlistId,
          is_autoplay: false,
        })
        const nextSession = { ...playlistContext, currentIndex: nextIndex }
        setPlaylistContext(nextSession)
        setPlaylistSession(nextSession)
        navigateToVideo(playlistNextId, nextIndex)
        return
      }
    }
    captureConversionEvent("conversion_next_clicked", {
      video_id: currentVideoId,
      next_video_id: nextId,
      source: "recommended",
      is_autoplay: false,
    })
    navigateToVideo(nextId)
  }

  // Called by VideoPlayer's Previous button. Pops internal history stack first;
  // falls back to browser history when stack is empty.
  const handlePlayerPrevious = () => {
    if (playlistContext && playlistContext.currentIndex > 0) {
      const prevIndex = playlistContext.currentIndex - 1
      const prevId = playlistContext.videoIds[prevIndex]
      if (prevId) {
        const nextSession = { ...playlistContext, currentIndex: prevIndex }
        setPlaylistContext(nextSession)
        setPlaylistSession(nextSession)
        navigateToVideo(prevId, prevIndex, false)
        return
      }
    }
    const prevId = videoHistoryRef.current.pop()
    if (prevId) {
      isInPlaceNavigationRef.current = true
      setCurrentVideoId(prevId)
      if (typeof window !== "undefined") {
        const stored = getPlaylistSession()
        let url = `/watch/${prevId}`
        if (stored?.playlistId && Array.isArray(stored.videoIds) && stored.videoIds.includes(prevId)) {
          const prevIndex = stored.videoIds.indexOf(prevId)
          url = `/watch/${encodeURIComponent(prevId)}?playlist=${encodeURIComponent(stored.playlistId)}&pindex=${prevIndex}`
          setPlaylistContext((prev) => {
            if (!prev || prev.playlistId !== stored.playlistId) return prev
            if (prevIndex === prev.currentIndex) return prev
            const next = { ...prev, currentIndex: prevIndex }
            setPlaylistSession(next)
            return next
          })
        }
        window.history.pushState({}, "", url)
        setPlayerBackStackEpoch((n) => n + 1)
      }
    } else {
      router.back()
    }
  }

  // In-watch navigation uses history.pushState so the player stays mounted. The App Router
  // does not observe that stack, so browser Back/Forward must sync React state from the URL.
  useEffect(() => {
    if (typeof window === "undefined") return

    const readWatchIdFromLocation = () => {
      const m = window.location.pathname.match(/^\/watch\/([^/]+)/)
      return m ? decodeURIComponent(m[1]) : ""
    }

    const onPopState = () => {
      const newId = readWatchIdFromLocation()
      if (!newId) return

      if (videoHistoryRef.current.length > 0) {
        const top = videoHistoryRef.current[videoHistoryRef.current.length - 1]
        if (top === newId) {
          videoHistoryRef.current.pop()
        } else {
          videoHistoryRef.current = []
        }
        setPlayerBackStackEpoch((n) => n + 1)
      }

      isInPlaceNavigationRef.current = true
      setCurrentVideoId(newId)

      const pathWithSearch = window.location.pathname + window.location.search
      startTransition(() => {
        router.replace(pathWithSearch)
      })
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [router])

  const activeVideoMatchesRoute = !!activeVideo && (activeVideo.videoId || activeVideo.video_id) === routeVideoId
  const activeVideoInitialVoteState = activeVideoMatchesRoute
    ? resolveVoteState(activeVideo)
    : { upvoted: false, downvoted: false }
  const [isFollowing, setIsFollowing] = useState(() =>
    shouldUsePersistedUiState ? (persistedWatchUiState?.isFollowing ?? false) : false,
  )
  const [isCheckingFollow, setIsCheckingFollow] = useState(false)
  const [isFollowingAction, setIsFollowingAction] = useState(false)
  const [followActionType, setFollowActionType] = useState<"follow" | "unfollow" | null>(null)
  const [isLiked, setIsLiked] = useState(
    () => (shouldUsePersistedUiState ? persistedWatchUiState?.isLiked : undefined) ?? activeVideoInitialVoteState.upvoted,
  )
  const [isDisliked, setIsDisliked] = useState(
    () =>
      (shouldUsePersistedUiState ? persistedWatchUiState?.isDisliked : undefined) ?? activeVideoInitialVoteState.downvoted,
  )
  const [showFullDescription, setShowFullDescription] = useState(false)
  
  // currentVideo: what is currently rendered in title/description/channel UI.
  const [video, setVideo] = useState<any>(() => {
    const persistedVideo = persistedWatchUiState?.video
    if (!persistedVideo) return null
    const persistedId = persistedVideo.video_id || persistedVideo.videoId
    const routeId = (Array.isArray(params.videoId) ? params.videoId[0] : (params.videoId as string)) || ""
    return persistedId && routeId && persistedId === routeId ? persistedVideo : null
  })
  const [playerVideo, setPlayerVideo] = useState<any>(() => {
    if (activeVideo && (activeVideo.videoId === params.videoId || activeVideo.video_id === params.videoId)) {
      return activeVideo
    }
    return null
  })
  
  const [videoCreator, setVideoCreator] = useState<any>(() => {
    const persistedVideo = persistedWatchUiState?.video
    const persistedId = persistedVideo?.video_id || persistedVideo?.videoId
    if (!persistedId || persistedId !== routeVideoId) return null
    return persistedWatchUiState?.videoCreator ?? null
  })
  const [relatedVideos, setRelatedVideos] = useState<any[]>(() => {
    const persistedVideo = persistedWatchUiState?.video
    const persistedId = persistedVideo?.video_id || persistedVideo?.videoId
    if (!persistedId || persistedId !== routeVideoId) return []
    return persistedWatchUiState?.relatedVideos ?? []
  })
  
  // Only show initial loading spinner if we don't even have context data
  const [isLoading, setIsLoading] = useState(!video)
  const [isMetadataLoading, setIsMetadataLoading] = useState(false)
  const [isRelatedLoading, setIsRelatedLoading] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false)
  const [commentsSheetOpen, setCommentsSheetOpen] = useState(false)
  const [commentsPreviewLoading, setCommentsPreviewLoading] = useState(false)
  const [commentsCount, setCommentsCount] = useState(0)
  const [commentsPreviewProfiles, setCommentsPreviewProfiles] = useState<Record<string, any>>({})
  const [latestComment, setLatestComment] = useState<{
    comment_id: string
    comment_by_username: string
    comment: string
    commented_at: string
    comment_by_avatar?: string
    profile_picture?: string
    comment_by_name?: string
  } | null>(null)
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
    () => (shouldUsePersistedUiState ? persistedWatchUiState?.upvoteState : undefined) ?? activeVideoInitialVoteState,
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
  const playerSuggestedVideos = useMemo(() => {
    const playlistQueue =
      playlistContext && playlistContext.currentIndex < playlistContext.videoIds.length - 1
        ? playlistContext.videoIds
            .slice(playlistContext.currentIndex + 1)
            .map((id, idx) => ({
              videoId: id,
              video_id: id,
              videoTitle: playlistVideoMeta[id]?.title || `Video ${playlistContext.currentIndex + idx + 2}`,
              video_title: playlistVideoMeta[id]?.title || `Video ${playlistContext.currentIndex + idx + 2}`,
              videoThumbnail: playlistVideoMeta[id]?.thumbnail || "",
              video_thumbnail: playlistVideoMeta[id]?.thumbnail || "",
            }))
        : []

    if (playlistQueue.length > 0) {
      return playlistQueue
    }

    return visibleRelatedVideos.slice(0, 8)
  }, [playlistContext, playlistVideoMeta, visibleRelatedVideos])

  useEffect(() => {
    currentVideoIdRef.current = video ? (video.video_id || video.videoId) : null
  }, [video])

  useEffect(() => {
    pendingVideoIdRef.current = pendingVideo?.videoId || null
  }, [pendingVideo])

  useEffect(() => {
    if (!video) return
    // Only persist when this page is showing the route's initial video.
    // In-place navigation (Next/Previous/suggestions) should not overwrite persisted state,
    // so returning to Home/History and opening a new video starts from a fresh state.
    const currentId = video.video_id || video.videoId
    if (!currentId || currentId !== routeVideoId) return
    if (isInPlaceNavigationRef.current) return

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

  useEffect(() => {
    // Route changes (real Next navigation) are considered "fresh" for persistence.
    isInPlaceNavigationRef.current = false
  }, [routeVideoId])

  useEffect(() => {
    // When opening from lists (e.g. Liked Videos), apply immediate vote hint from activeVideo
    // so the heart state doesn't wait for a later API refresh cycle.
    if (!routeVideoId) return
    if (!activeVideo) return
    const activeId = activeVideo.videoId || activeVideo.video_id
    if (!activeId || activeId !== routeVideoId) return
    if (!hasVoteMetadata(activeVideo)) return

    const hintedVote = resolveVoteState(activeVideo)
    setUpvoteState(hintedVote)
    setIsLiked(hintedVote.upvoted)
    setIsDisliked(hintedVote.downvoted)
  }, [routeVideoId, activeVideo])

  useEffect(() => {
    const playlistId = searchParams.get("playlist")
    const pIndex = Number(searchParams.get("pindex") || "0")
    if (!playlistId) {
      setPlaylistContext(null)
      return
    }

    const stored = getPlaylistSession()
    if (stored && stored.playlistId === playlistId && stored.videoIds.length > 0) {
      const indexFromVideo = stored.videoIds.indexOf(currentVideoId)
      const resolvedIndex = indexFromVideo >= 0 ? indexFromVideo : Math.max(0, Math.min(stored.videoIds.length - 1, pIndex))
      const nextSession = {
        playlistId,
        title: stored.title || "Playlist",
        videoIds: stored.videoIds,
        currentIndex: resolvedIndex,
        autoplay: stored.autoplay !== false,
      }
      setPlaylistContext(nextSession)
      setPlaylistSession(nextSession)
      return
    }

    let cancelled = false
    ;(async () => {
      const buildSession = (res: {
        success: boolean
        playlist?: { title?: string }
        items?: Array<{ position: number; video_id: string }>
      }) => {
        if (cancelled || !res.success || !res.playlist || !Array.isArray(res.items)) return null
        const ordered = [...res.items]
          .sort((a, b) => a.position - b.position)
          .map((it) => it.video_id)
          .filter(Boolean)
        if (!ordered.length) return null

        const indexFromVideo = ordered.indexOf(currentVideoId)
        const resolvedIndex = indexFromVideo >= 0 ? indexFromVideo : Math.max(0, Math.min(ordered.length - 1, pIndex))
        return {
          playlistId,
          title: res.playlist.title || "Playlist",
          videoIds: ordered,
          currentIndex: resolvedIndex,
          autoplay: true,
        }
      }

      try {
        const res = await apiClient.getPlaylist(playlistId)
        const nextSession = buildSession(res as any)
        if (nextSession) {
          setPlaylistContext(nextSession)
          setPlaylistSession(nextSession)
          return
        }
      } catch {
        // fall through to curated playlist fallback
      }

      try {
        const curated = await apiClient.getCuratedPlaylist(playlistId, { limit: 100, offset: 0 })
        const nextSession = buildSession(curated as any)
        if (nextSession) {
          setPlaylistContext(nextSession)
          setPlaylistSession(nextSession)
        }
      } catch {
        // no-op; keep watch page usable without playlist context
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, currentVideoId])

  useEffect(() => {
    if (!playlistContext) return
    const indexFromCurrent = playlistContext.videoIds.indexOf(currentVideoId)
    if (indexFromCurrent < 0 || indexFromCurrent === playlistContext.currentIndex) return
    const nextSession = { ...playlistContext, currentIndex: indexFromCurrent }
    setPlaylistContext(nextSession)
    setPlaylistSession(nextSession)
  }, [currentVideoId, playlistContext])

  useEffect(() => {
    if (!playlistContext?.videoIds?.length) return
    const startIndex = Math.max(0, playlistContext.currentIndex)
    const orderedIds = playlistContext.videoIds.slice(startIndex)
    const idsToFetch = orderedIds.filter((id) => !playlistVideoMeta[id])
    if (!idsToFetch.length) return

    let cancelled = false
    const fetchMetaEntries = async (ids: string[]) =>
      Promise.all(
        ids.map(async (id) => {
          try {
            const res = await apiClient.getVideo(id)
            if (!res.success) return [id, {}] as const
            return [
              id,
              {
                title: res.video?.video_title || res.video?.videoTitle,
                thumbnail: getThumbnailUrl(res.video?.video_thumbnail || res.video?.videoThumbnail || ""),
              },
            ] as const
          } catch {
            return [id, {}] as const
          }
        }),
      )

    ;(async () => {
      // Prioritize the first visible set, then progressively hydrate the rest.
      const immediateIds = idsToFetch.slice(0, 6)
      const remainingIds = idsToFetch.slice(6)

      const pushEntries = (entries: Array<readonly [string, { title?: string; thumbnail?: string }]>) => {
        if (cancelled || entries.length === 0) return
        setPlaylistVideoMeta((prev) => {
          const next = { ...prev }
          for (const [id, meta] of entries) next[id] = meta
          return next
        })
      }

      const immediateEntries = await fetchMetaEntries(immediateIds)
      pushEntries(immediateEntries)

      const batchSize = 4
      for (let i = 0; i < remainingIds.length && !cancelled; i += batchSize) {
        const batch = remainingIds.slice(i, i + batchSize)
        const batchEntries = await fetchMetaEntries(batch)
        pushEntries(batchEntries)
        if (!cancelled && i + batchSize < remainingIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 120))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [playlistContext, playlistVideoMeta])

  useEffect(() => {
    if (!currentVideoId) {
      setCommentsCount(0)
      setLatestComment(null)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        setCommentsPreviewLoading(true)
        const response = await apiClient.getComments(currentVideoId, 1, 1)
        if (cancelled) return
        if (!response.success) {
          setCommentsCount(0)
          setLatestComment(null)
          return
        }

        const fetched = response.comments || []
        setCommentsCount(typeof response.count === "number" ? response.count : fetched.length)
        setLatestComment(fetched[0] || null)
      } catch {
        if (cancelled) return
        setCommentsCount(0)
        setLatestComment(null)
      } finally {
        if (!cancelled) {
          setCommentsPreviewLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [currentVideoId, commentsSheetOpen])

  useEffect(() => {
    if (!latestComment?.comment_by_username) return
    const username = latestComment.comment_by_username
    if (commentsPreviewProfiles[username]) return

    let cancelled = false
    ;(async () => {
      try {
        const response = await apiClient.getUserByUsername(username)
        if (cancelled || !response.success || !response.user) return
        setCommentsPreviewProfiles((prev) => ({ ...prev, [username]: response.user }))
      } catch {
        // no-op: fallback avatar/initials will render
      }
    })()

    return () => {
      cancelled = true
    }
  }, [latestComment?.comment_by_username, commentsPreviewProfiles])

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
      if (!currentVideoId) return

      const videoId = currentVideoId

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
          const activeVoteHint =
            activeVideoMatchesRoute && hasVoteMetadata(activeVideo) ? resolveVoteState(activeVideo) : null
          const cachedVote = videoResponseCache.get(videoId)
          const cachedVoteMismatch =
            !!activeVoteHint &&
            !!cachedVote &&
            hasVoteMetadata(cachedVote) &&
            (resolveVoteState(cachedVote).upvoted !== activeVoteHint.upvoted ||
              resolveVoteState(cachedVote).downvoted !== activeVoteHint.downvoted)
          const shouldForceFreshVoteFetch =
            !!user ||
            (activeVideoMatchesRoute && hasVoteMetadata(activeVideo) && !hasVoteMetadata(videoResponseCache.get(videoId))) ||
            cachedVoteMismatch
          videoResponse = await getVideoResponseOnce(videoId, shouldForceFreshVoteFetch)
          if (latestVideoRequestIdRef.current !== videoId) return
          console.log("[hiffi] Video response from API:", videoResponse)
          
          // Use video object directly from API response (no need to search through lists)
          const videoData = videoResponse.video
          if (!videoResponse.success || !videoResponse.video_url) {
            if (videoResponse.success && isVideoProcessing(videoData)) {
              videoResponseCache.delete(videoId)
              hasFetchedVideoRef.current = null
              isFetchingRef.current = false
              toast(PROCESSING_VIDEO_TOAST)
              router.replace("/")
              setIsLoading(false)
              setIsMetadataLoading(false)
              setPendingVideo((pending) => (pending?.videoId === videoId ? null : pending))
              setIsPlayerReadyForPending(false)
              return
            }
            throw new Error("Failed to get video data")
          }

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
          const voteFallbackFromCurrentContext = resolveVoteStateForVideo(
            activeVideo,
            videoId,
            resolveVoteStateForVideo(
              playerVideo,
              videoId,
              resolveVoteStateForVideo(video, videoId, upvoteState),
            ),
          )
          const nextVoteState = resolveVoteState(
            videoResponse,
            resolveVoteState(
              videoData,
              voteFallbackFromCurrentContext,
            ),
          )
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
  }, [currentVideoId]) // currentVideoId drives all fetches; synced from params.videoId for external nav

  // Effect for related videos.
  useEffect(() => {
    if (!currentVideoId || lastFetchedRelatedIdRef.current === currentVideoId) return
    const videoId = currentVideoId

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
  }, [currentVideoId])

  // NOTE: Follow status is now primarily fetched from the getVideo API response
  // which includes the 'following' boolean field. This eliminates the need for 
  // a separate API call to check following status on page load.

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Sign in to save videos to your Liked library.",
      })
      return
    }

    if (!video) return

    try {
      const videoId = video.video_id || video.videoId
      const wasLiked = isLiked
      const wasDisliked = isDisliked
      const isRemovingLike = wasLiked

      if (isRemovingLike) {
        // Product requirement: heart button must toggle using downvote endpoint when already upvoted.
        await apiClient.downvoteVideo(videoId)
      } else {
        await apiClient.upvoteVideo(videoId)
      }
      // Invalidate cached vote payload so subsequent opens don't reuse stale vote state.
      videoResponseCache.delete(videoId)
      
      // Update state
      setIsLiked(!isRemovingLike)
      setIsDisliked(false)
      setUpvoteState({ upvoted: !isRemovingLike, downvoted: false })
      
      // Update video counts optimistically while refreshing
      if (video) {
        const currentUpvotes = video.video_upvotes || video.videoUpvotes || video.videoLikes || 0
        const currentDownvotes = video.video_downvotes || video.videoDownvotes || 0
        
        setVideo({
          ...video,
          video_upvotes: isRemovingLike ? currentUpvotes - 1 : (wasDisliked ? currentUpvotes + 1 : currentUpvotes + 1),
          // Keep dislike count unchanged for "remove liked" UX even though backend toggle uses downvote endpoint.
          video_downvotes: isRemovingLike ? currentDownvotes : (wasDisliked ? currentDownvotes - 1 : currentDownvotes),
          uservotestatus: isRemovingLike ? null : "upvoted",
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
          const refreshedVoteState = resolveVoteState(updatedVideo, { upvoted: !isRemovingLike, downvoted: false })
          setIsLiked(refreshedVoteState.upvoted)
          setIsDisliked(refreshedVoteState.downvoted)
          setUpvoteState(refreshedVoteState)
        }
      } catch (refreshError) {
        console.error("[hiffi] Failed to refresh video data:", refreshError)
        // Keep optimistic update if refresh fails
      }

      toast({
        title: isRemovingLike ? "Removed from Liked" : "Saved to Liked",
        description: isRemovingLike
          ? "This video is no longer in your Liked library."
          : "You can find it anytime under Liked videos.",
      })
      if (!isRemovingLike) {
        captureConversionEvent("conversion_like_success", {
          video_id: videoId,
          source: playlistContext ? "playlist" : "recommended",
          playlist_id: playlistContext?.playlistId,
        })
      }
    } catch (error) {
      console.error("[hiffi] Failed to toggle like for video:", error)
      toast({
        title: "Error",
        description: "Couldn’t update Liked videos. Try again.",
        variant: "destructive",
      })
    }
  }

  const handleDislike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Sign in to give feedback on recommendations.",
      })
      return
    }

    if (!video) return

    try {
      const videoId = video.video_id || video.videoId
      await apiClient.downvoteVideo(videoId)
      // Invalidate cached vote payload so subsequent opens don't reuse stale vote state.
      videoResponseCache.delete(videoId)
      
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
          const refreshedVoteState = resolveVoteState(updatedVideo, { upvoted: false, downvoted: !wasDisliked })
          setIsLiked(refreshedVoteState.upvoted)
          setIsDisliked(refreshedVoteState.downvoted)
          setUpvoteState(refreshedVoteState)
        }
      } catch (refreshError) {
        console.error("[hiffi] Failed to refresh video data:", refreshError)
        // Keep optimistic update if refresh fails
      }

      toast({
        title: wasDisliked ? "Feedback removed" : "Thanks for the feedback",
        description: wasDisliked
          ? "We won’t tune recommendations from that signal anymore."
          : "We’ll show you fewer recommendations like this one.",
      })
    } catch (error) {
      console.error("[hiffi] Failed to downvote video:", error)
      toast({
        title: "Error",
        description: "Couldn’t save that feedback. Try again.",
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
    const actionType: "follow" | "unfollow" = previousFollowingState ? "unfollow" : "follow"
    setFollowActionType(actionType)
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
      setFollowActionType(null)
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
  
  const videoId = currentVideo?.video_id || currentVideo?.videoId || currentVideoId || ""

  const handleVideoEnd = () => {
    if (playlistContext?.autoplay && playlistContext.currentIndex < playlistContext.videoIds.length - 1) {
      const nextIndex = playlistContext.currentIndex + 1
      const nextId = playlistContext.videoIds[nextIndex]
      if (nextId) {
        resetSeed()
        const nextSession = { ...playlistContext, currentIndex: nextIndex }
        setPlaylistContext(nextSession)
        setPlaylistSession(nextSession)
        navigateToVideo(nextId, nextIndex)
        return
      }
    }

    // Autoplay next video from suggested videos
    if (sidebarSuggestedVideos && sidebarSuggestedVideos.length > 0) {
      const nextVideo = sidebarSuggestedVideos[0]
      const nextVideoId = nextVideo.videoId || nextVideo.video_id
      if (nextVideoId) {
        resetSeed()
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
    )
  }

  return (
    <>
      <div className="px-0 pt-0 pb-0 lg:p-6">
        <div className="max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-3 md:space-y-4 min-w-0">
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
                onNext={handlePlayerNext}
                onPrevious={handlePlayerPrevious}
                previousVideoDisabled={!canNavigateToPreviousVideo}
                initialSeekSeconds={initialSeekSeconds.current}
              />

              <div className={cn("px-4 lg:px-0 space-y-4 min-w-0 transition-opacity duration-300", shouldShowMetadataSkeleton ? "opacity-50" : "opacity-100")}>
                <div className="flex items-start gap-2 sm:gap-3">
                  {shouldShowMetadataSkeleton ? (
                    <div className="h-9 flex-1 bg-muted/40 rounded-md max-w-2xl animate-pulse" />
                  ) : (
                    <h1 className="line-clamp-2 text-xl md:text-2xl font-bold break-words min-w-0 flex-1 pr-1">
                      {currentVideo?.videoTitle || currentVideo?.video_title}
                    </h1>
                  )}
                  {!shouldShowMetadataSkeleton && currentVideo && (
                    <div className="hidden shrink-0 items-center gap-0.5 pt-0.5 md:flex">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        data-analytics-name={isLiked ? "unliked" : "liked"}
                        className={cn(
                          "h-9 w-9 rounded-full text-muted-foreground hover:text-foreground",
                          isLiked && "text-primary hover:text-primary",
                        )}
                        onClick={handleLike}
                        aria-pressed={isLiked}
                        aria-label={isLiked ? "Remove from Liked videos" : "Save to Liked videos"}
                        title={isLiked ? "Remove from Liked" : "Save to Liked"}
                      >
                        <Heart className={cn("h-5 w-5", isLiked && "fill-primary text-primary")} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        data-analytics-name="shared-video"
                        className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                        onClick={() => setShareDialogOpen(true)}
                        aria-label="Share video"
                        title="Share"
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                      {user ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          data-analytics-name="added-to-playlist"
                          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                          onClick={() => setAddToPlaylistOpen(true)}
                          aria-label="Add to playlist"
                          title="Add to playlist"
                        >
                          <ListPlus className="h-5 w-5" />
                        </Button>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Mobile metadata layout */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {currentVideo ? (
                          <Link href={`/profile/${currentVideo?.userUsername || currentVideo?.user_username}`}>
                            <ProfilePicture user={creatorUser} size="md" />
                          </Link>
                        ) : (
                          <div className={cn(
                            "h-10 w-10 rounded-full bg-muted/40",
                            shouldShowMetadataSkeleton && "animate-pulse"
                          )} />
                        )}
                        <div className="min-w-0">
                          {shouldShowMetadataSkeleton ? (
                            <div className="space-y-2">
                              <div className="h-4 bg-muted/40 rounded w-24 animate-pulse" />
                              <div className="h-3 bg-muted/40 rounded w-16 animate-pulse" />
                            </div>
                          ) : (
                            <>
                              <Link
                                href={`/profile/${currentVideo?.userUsername || currentVideo?.user_username}`}
                                className="font-semibold hover:text-primary block truncate"
                              >
                                {currentVideo?.userUsername || currentVideo?.user_username}
                              </Link>
                              <span className="text-xs text-muted-foreground">
                                {((videoCreator?.followers ?? videoCreator?.followers_count ?? videoCreator?.followersCount ?? videoCreator?.user?.followers ?? videoCreator?.user?.followers_count ?? 0)).toLocaleString()} followers
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {!shouldShowMetadataSkeleton && currentVideo && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-analytics-name={isLiked ? "unliked" : "liked"}
                            className={cn(
                              "h-9 w-9 rounded-full text-muted-foreground hover:text-foreground",
                              isLiked && "text-primary hover:text-primary",
                            )}
                            onClick={handleLike}
                            aria-pressed={isLiked}
                            aria-label={isLiked ? "Remove from Liked videos" : "Save to Liked videos"}
                            title={isLiked ? "Remove from Liked" : "Save to Liked"}
                          >
                            <Heart className={cn("h-5 w-5", isLiked && "fill-primary text-primary")} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-analytics-name="shared-video"
                            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                            onClick={() => setShareDialogOpen(true)}
                            aria-label="Share video"
                            title="Share"
                          >
                            <Share2 className="h-5 w-5" />
                          </Button>
                          {user ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              data-analytics-name="added-to-playlist"
                              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                              onClick={() => setAddToPlaylistOpen(true)}
                              aria-label="Add to playlist"
                              title="Add to playlist"
                            >
                              <ListPlus className="h-5 w-5" />
                            </Button>
                          ) : null}
                          {(userData?.username) !== (currentVideo?.userUsername || currentVideo?.user_username) ? (
                            <Button
                              variant={isFollowing ? "secondary" : "default"}
                              size="sm"
                              data-analytics-name={isFollowing ? "unfollowed_creator" : "followed_creator"}
                              className="rounded-full flex-shrink-0 px-4"
                              onClick={handleFollow}
                              disabled={isCheckingFollow || isFollowingAction}
                            >
                              {isCheckingFollow
                                ? "Checking..."
                                : isFollowingAction
                                  ? (followActionType === "unfollow" ? "Unfollowing..." : "Following...")
                                  : isFollowing
                                    ? "Following"
                                    : "Follow"}
                            </Button>
                          ) : null}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Desktop/tablet metadata layout */}
                  <div className="hidden md:flex flex-row items-center justify-between gap-2 sm:gap-4 flex-wrap">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0 flex-1">
                      {currentVideo ? (
                        <Link href={`/profile/${currentVideo?.userUsername || currentVideo?.user_username}`}>
                          <ProfilePicture user={creatorUser} size="md" />
                        </Link>
                      ) : (
                        <div className={cn(
                          "h-10 w-10 rounded-full bg-muted/40",
                          shouldShowMetadataSkeleton && "animate-pulse"
                        )} />
                      )}
                      <div className="min-w-0">
                        {shouldShowMetadataSkeleton ? (
                          <div className="space-y-2">
                            <div className="h-4 bg-muted/40 rounded w-24 animate-pulse" />
                            <div className="h-3 bg-muted/40 rounded w-16 animate-pulse" />
                          </div>
                        ) : (
                          <>
                            <Link
                              href={`/profile/${currentVideo?.userUsername || currentVideo?.user_username}`}
                              className="font-semibold hover:text-primary block truncate"
                            >
                              {currentVideo?.userUsername || currentVideo?.user_username}
                            </Link>
                            <span className="text-xs text-muted-foreground">
                              {((videoCreator?.followers ?? videoCreator?.followers_count ?? videoCreator?.followersCount ?? videoCreator?.user?.followers ?? videoCreator?.user?.followers_count ?? 0)).toLocaleString()} followers
                            </span>
                          </>
                        )}
                      </div>
                      {(userData?.username) !== (currentVideo?.userUsername || currentVideo?.user_username) && !shouldShowMetadataSkeleton && (
                        <Button
                          variant={isFollowing ? "secondary" : "default"}
                          size="sm"
                          data-analytics-name={isFollowing ? "unfollowed_creator" : "followed_creator"}
                          className="ml-0 sm:ml-4 rounded-full flex-shrink-0"
                          onClick={handleFollow}
                          disabled={isCheckingFollow || isFollowingAction}
                        >
                          {isCheckingFollow
                            ? "Checking..."
                            : isFollowingAction
                              ? (followActionType === "unfollow" ? "Unfollowing..." : "Following...")
                              : isFollowing
                                ? "Following"
                                : "Follow"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-none sm:rounded-xl p-3 text-sm">
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
                        {renderDescriptionWithClickableLinks(currentVideo?.videoDescription || currentVideo?.video_description)}
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

                {playlistContext && (
                  <div className="md:hidden rounded-xl border border-primary/25 bg-primary/5 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/90">Active playlist</p>
                        <p className="line-clamp-1 text-xs font-semibold">{playlistContext.title}</p>
                      </div>
                      <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground">
                        {playlistContext.currentIndex + 1}/{playlistContext.videoIds.length}
                      </span>
                    </div>
                    <div className="mt-2 max-h-[14.5rem] space-y-1.5 overflow-y-auto pr-1">
                      {playlistContext.videoIds.map((id, absoluteIndex) => {
                        const isActive = absoluteIndex === playlistContext.currentIndex
                        const isPlayed = absoluteIndex < playlistContext.currentIndex
                        const meta = playlistVideoMeta[id]
                        return (
                          <button
                            key={id}
                            type="button"
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors",
                              isActive
                                ? "border-primary/35 bg-primary/10"
                                : isPlayed
                                  ? "border-border/45 bg-background/55 hover:bg-accent/30"
                                  : "border-border/60 bg-background/80 hover:bg-accent/40",
                            )}
                            onClick={() => {
                              if (isActive) return
                              const nextSession = { ...playlistContext, currentIndex: absoluteIndex }
                              setPlaylistContext(nextSession)
                              setPlaylistSession(nextSession)
                              navigateToVideo(id, absoluteIndex)
                            }}
                          >
                            <div className="relative h-8 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                              {meta?.thumbnail ? <AuthenticatedImage src={meta.thumbnail} alt="" fill className="object-cover" /> : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={cn("line-clamp-1 text-[11px]", isActive ? "font-semibold" : "text-muted-foreground")}>
                                {meta?.title || `Video ${absoluteIndex + 1}`}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {isActive ? "Now playing" : absoluteIndex === playlistContext.currentIndex + 1 ? "Up next" : ""}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <Separator className="my-6" />

                {(videoId || currentVideoId) && (
                  <>
                    <div className="hidden md:block">
                      <CommentSection videoId={(videoId || currentVideoId) as string} />
                    </div>
                    <div className="md:hidden">
                      <button
                        type="button"
                        data-analytics-name="opened-comments"
                        onClick={() => setCommentsSheetOpen(true)}
                        className="w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Comments</h3>
                            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-sm text-muted-foreground">
                              {commentsCount}
                            </span>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {commentsCount > 0
                            ? "Preview below. Tap to read the full thread."
                            : "Start the conversation - add a comment below."}
                        </p>

                        <div className="mt-3 rounded-xl border border-border/60 bg-background p-3">
                          {commentsPreviewLoading ? (
                            <div className="space-y-2">
                              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                              <div className="h-4 w-full animate-pulse rounded bg-muted" />
                            </div>
                          ) : latestComment ? (
                            <div className="flex items-start gap-3">
                              <ProfilePicture
                                user={
                                  commentsPreviewProfiles[latestComment.comment_by_username] || {
                                    username: latestComment.comment_by_username,
                                    name: latestComment.comment_by_name,
                                    profile_picture: latestComment.profile_picture || latestComment.comment_by_avatar,
                                  }
                                }
                                size="sm"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-base font-semibold">{latestComment.comment_by_username}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(latestComment.commented_at), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="mt-1 line-clamp-2 text-base">{latestComment.comment}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No comments yet. Be the first to share what you think.</div>
                          )}
                        </div>

                        <div className="mt-3 flex items-center gap-3 rounded-xl border border-border/60 bg-background p-3">
                          <ProfilePicture user={userData || { username: "U" }} size="sm" />
                          <div className="flex-1 rounded-full border border-primary/30 px-4 py-2 text-sm text-muted-foreground">
                            Add a comment...
                          </div>
                          <SendHorizontal className="h-5 w-5 text-primary" />
                        </div>
                      </button>

                      <Drawer open={commentsSheetOpen} onOpenChange={setCommentsSheetOpen}>
                        <DrawerContent className="max-h-[90dvh]">
                          <DrawerHandle className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />
                          <DrawerHeader className="px-4 pb-2 pt-3">
                            <DrawerTitle>Comments</DrawerTitle>
                            <DrawerDescription>Read the thread and add your comment.</DrawerDescription>
                          </DrawerHeader>
                          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                            <CommentSection videoId={(videoId || currentVideoId) as string} />
                          </div>
                        </DrawerContent>
                      </Drawer>
                    </div>
                  </>
                )}
              </div>
            </div>

              {/* Sidebar / Related Videos - YouTube Style */}
             <div className="space-y-2 px-4 lg:px-0 pb-4 lg:pb-0">
               {playlistContext && (
                 <div className="mb-3 hidden rounded-xl border border-primary/25 bg-primary/5 p-2.5 md:mb-4 md:block md:p-3">
                   <div className="flex items-center justify-between gap-2">
                     <div>
                       <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/90 md:text-[11px]">Active playlist</p>
                       <p className="line-clamp-1 text-xs font-semibold md:text-sm">{playlistContext.title}</p>
                     </div>
                     <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground md:text-xs">
                       {playlistContext.currentIndex + 1}/{playlistContext.videoIds.length}
                     </span>
                   </div>
                  <div className="mt-2 max-h-[14.5rem] space-y-1.5 overflow-y-auto pr-1 md:mt-2.5 md:max-h-[24rem]">
                     {playlistContext.videoIds.map((id, absoluteIndex) => {
                         const isActive = absoluteIndex === playlistContext.currentIndex
                         const isPlayed = absoluteIndex < playlistContext.currentIndex
                         const meta = playlistVideoMeta[id]
                         return (
                           <button
                             key={id}
                             type="button"
                             className={cn(
                               "flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors md:px-2 md:py-1.5",
                               isActive
                                 ? "border-primary/35 bg-primary/10"
                                 : isPlayed
                                   ? "border-border/45 bg-background/55 hover:bg-accent/30"
                                   : "border-border/60 bg-background/80 hover:bg-accent/40",
                             )}
                             onClick={() => {
                               if (isActive) return
                               const nextSession = { ...playlistContext, currentIndex: absoluteIndex }
                               setPlaylistContext(nextSession)
                               setPlaylistSession(nextSession)
                               navigateToVideo(id, absoluteIndex)
                             }}
                           >
                             <div className="relative h-8 w-12 shrink-0 overflow-hidden rounded-md bg-muted md:h-10 md:w-16">
                               {meta?.thumbnail ? (
                                 <AuthenticatedImage src={meta.thumbnail} alt="" fill className="object-cover" />
                               ) : null}
                             </div>
                             <div className="min-w-0 flex-1">
                               <p className={cn("line-clamp-1 text-[11px] md:text-xs", isActive ? "font-semibold" : "text-muted-foreground")}>
                                 {meta?.title || `Video ${absoluteIndex + 1}`}
                               </p>
                              <p className="text-[10px] text-muted-foreground md:text-[11px]">
                                {isActive ? "Now playing" : absoluteIndex === playlistContext.currentIndex + 1 ? "Up next" : ""}
                              </p>
                             </div>
                           </button>
                         )
                       })}
                   </div>
                 </div>
               )}
               <h3 className="font-semibold text-sm mb-3 px-1">Up Next</h3>
               <div className={cn("flex flex-col gap-1 transition-opacity duration-500", (isRelatedLoading && shouldShowRelatedSkeleton) ? "opacity-100" : (isRelatedLoading ? "opacity-60" : "opacity-100"))}>
                 {sidebarSuggestedVideos.length > 0 ? (
                   sidebarSuggestedVideos.map((v) => (
                    <CompactVideoCard
                      key={v.videoId || v.video_id}
                      video={v}
                      openVideoUiName="opened-video-from-recommended"
                    />
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
      
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        title="Sign in to follow creators"
        description="Create an account or sign in to follow creators and stay updated with their latest videos."
      />
      <ShareVideoDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        url={
          (() => {
            const id = currentVideo?.video_id || currentVideo?.videoId || currentVideoId
            if (typeof window === "undefined" || !id) return ""
            return `${window.location.origin}/watch/${id}`
          })()
        }
        title={currentVideo?.videoTitle || currentVideo?.video_title || "Video"}
      />
      <AddToPlaylistDialog
        open={addToPlaylistOpen}
        onOpenChange={setAddToPlaylistOpen}
        videoId={String(playerVideoId || currentVideoId || "")}
        videoTitle={currentVideo?.videoTitle || currentVideo?.video_title}
        thumbnailUrl={thumbnailUrl || undefined}
      />
    </>
  )
}
