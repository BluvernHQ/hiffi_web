"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { VideoGrid } from "@/components/video/video-grid"
import { FeedVideoPreviewProvider } from "@/components/video/feed-video-preview-provider"
import { pauseActiveHoverPreview } from "@/components/video/video-card-hover-preview"
import { HeroCarousel } from "@/components/home/hero-carousel"
import { HeroCarouselSkeleton } from "@/components/home/hero-carousel-skeleton"
import { MoodMixChips } from "@/components/home/mood-mix-chips"
import { MoodFeedAnimated } from "@/components/home/mood-feed-animated"
import { mapVideosToHeroCards, type HeroCarouselCard } from "@/lib/home/hero-carousel-data"
import { fetchCuratedHeroCards } from "@/lib/home/fetch-curated-hero"
import { CURATED_PLAYLISTS_UPDATED_EVENT } from "@/lib/curated-playlists-events"
import { OPENED_VIDEO_FROM_HOME_HERO } from "@/lib/analytics/video-analytics-names"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"
import { isConnectivityError, userFacingNetworkMessage } from "@/lib/network-errors"
import { OfflineState } from "@/components/network/offline-state"
import {
  MOODS,
  moodByQuery,
  moodSearchQuery,
  moodPlaylistIdForQuery,
} from "@/lib/mood-tabs"
import {
  getPersistedActiveMood,
  HOME_FEED_RESET_EVENT,
  setPersistedActiveMood,
} from "@/lib/mood-session"
import { OPENED_VIDEO_FROM_MOOD } from "@/lib/analytics/mood-mix-analytics"
import {
  onMoodMixStarted,
  onPlaylistSessionEnded,
  setMoodWatchAttribution,
} from "@/lib/analytics/journey-tracking"
import {
  activatePlaylistNavigation,
  buildPlaylistWatchPath,
  playlistVideoMetaFromFeedVideos,
} from "@/lib/playlist-session"
import { cn } from "@/lib/utils"
import { getThumbnailUrl } from "@/lib/storage"

const VIDEOS_PER_PAGE = 10

type FeedCache = {
  videos: any[]
  /** Next API offset (= loaded video count). */
  offset: number
  hasMore: boolean
  scrollTop: number
}

function mergeVideos(prev: any[], incoming: any[]) {
  const seen = new Set(prev.map((v: any) => v.videoId || v.video_id))
  const fresh = incoming.filter((v: any) => !seen.has(v.videoId || v.video_id))
  return [...prev, ...fresh]
}

function readMainScrollTop(): number {
  if (typeof document === "undefined") return 0
  return document.getElementById("main-content")?.scrollTop ?? 0
}

export interface HomeFeedClientProps {
  /** First page of videos pre-fetched on the server (may be empty on error). */
  initialVideos: any[]
  /** Seed used by SSR; keeps the client from reshuffling after hydration. */
  seed: string
}

function enhanceVideos(videos: any[], userData: ReturnType<typeof useAuth>["userData"]) {
  return videos.map((video: any) => {
    const uname = video.user_username || video.userUsername
    if (userData?.username && uname === userData.username && !video.user_profile_picture) {
      video.user_profile_picture = userData.profile_picture || userData.image
      video.user_updated_at = userData.updated_at
    }
    return video
  })
}

function playlistItemsToVideos(items: Array<{ video: Record<string, unknown> }>): any[] {
  return items.map((item) => item.video).filter(Boolean)
}

export function HomeFeedClient({ initialVideos, seed }: HomeFeedClientProps) {
  const router = useRouter()
  const { userData } = useAuth()
  const [videos, setVideos] = useState<any[]>(() => initialVideos)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialVideos.length === VIDEOS_PER_PAGE)
  const [isFetching, setIsFetching] = useState(false)
  const [feedError, setFeedError] = useState<string | null>(null)

  const [activeMood, setActiveMood] = useState<string | null>(null)
  const [moodEmpty, setMoodEmpty] = useState(false)
  const [pendingMoodQuery, setPendingMoodQuery] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  const allFeedCache = useRef<FeedCache>({
    videos: initialVideos,
    offset: initialVideos.length,
    hasMore: initialVideos.length === VIDEOS_PER_PAGE,
    scrollTop: 0,
  })
  const moodFeedCaches = useRef<Map<string, FeedCache>>(new Map())
  const scrollSnapshot = useRef<number | null>(null)
  const fetchGeneration = useRef(0)
  const isFetchingRef = useRef(false)
  const tabRevertRef = useRef<{ mood: string | null; cache: FeedCache } | null>(null)
  const videosRef = useRef(videos)
  const hasMoreRef = useRef(hasMore)
  const activeMoodRef = useRef(activeMood)

  const activeMoodDef = activeMood ? moodByQuery(activeMood) : undefined
  const isMoodFeed = Boolean(activeMood)

  const [heroCards, setHeroCards] = useState<HeroCarouselCard[]>(() =>
    mapVideosToHeroCards(initialVideos as Array<Record<string, unknown>>, 5),
  )
  const [heroSource, setHeroSource] = useState<"pending" | "curated" | "discover">(() =>
    initialVideos.length > 0 ? "discover" : "pending",
  )
  /** Scroll gate: Discover hover previews off while hero is meaningfully on screen. */
  const [heroInView, setHeroInView] = useState(true)
  const curatedHeroIdsRef = useRef<string | null>(null)

  const discoverHeroFallback = useMemo(() => {
    const source =
      allFeedCache.current.videos.length > 0 ? allFeedCache.current.videos : videos
    return mapVideosToHeroCards(source, 5)
  }, [videos])

  // Load curated hero once and keep it across mood-tab switches (no shimmer on return).
  // Discover/SSR cards paint immediately so the first MP4 can start while curated hydrates.
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const curated = await fetchCuratedHeroCards(5)
      if (cancelled) return

      if (curated.cards.length > 0) {
        curatedHeroIdsRef.current = curated.playlistId
        setHeroCards(curated.cards)
        setHeroSource("curated")
        return
      }

      curatedHeroIdsRef.current = null
      setHeroSource("discover")
    }

    void load()

    const onCuratedUpdated = () => {
      void load()
    }
    window.addEventListener(CURATED_PLAYLISTS_UPDATED_EVENT, onCuratedUpdated)
    return () => {
      cancelled = true
      window.removeEventListener(CURATED_PLAYLISTS_UPDATED_EVENT, onCuratedUpdated)
    }
  }, [])

  // Discover fallback only when curated is empty / unavailable (keep SSR seed until then).
  useEffect(() => {
    if (heroSource !== "discover") return
    setHeroCards(discoverHeroFallback)
  }, [heroSource, discoverHeroFallback])

  const handleHeroCardChange = useCallback((_index: number, card: HeroCarouselCard) => {
    if (typeof window !== "undefined" && "HifiAnalytics" in window) {
      try {
        ;(window as Window & { HifiAnalytics?: { track?: (n: string, p?: object) => void } })
          .HifiAnalytics?.track?.("home_hero_card_impression", {
            video_id: card.id,
            handle: card.handle,
            playlist_id: curatedHeroIdsRef.current,
          })
      } catch {
        // analytics optional
      }
    }
  }, [])

  const handleHeroInViewChange = useCallback((inView: boolean) => {
    setHeroInView(inView)
    if (inView) pauseActiveHoverPreview()
  }, [])

  useEffect(() => {
    videosRef.current = videos
  }, [videos])

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  useEffect(() => {
    activeMoodRef.current = activeMood
  }, [activeMood])

  const restoreScrollPosition = useCallback(() => {
    if (scrollSnapshot.current === null) return
    const el = document.getElementById("main-content")
    if (el) el.scrollTop = scrollSnapshot.current
    scrollSnapshot.current = null
  }, [])

  const scheduleScrollRestore = useCallback(
    (scrollTop: number) => {
      scrollSnapshot.current = scrollTop
      requestAnimationFrame(restoreScrollPosition)
    },
    [restoreScrollPosition],
  )

  const writeCache = useCallback((moodKey: string | null, cache: FeedCache) => {
    if (moodKey === null) {
      allFeedCache.current = cache
    } else {
      moodFeedCaches.current.set(moodKey, cache)
    }
  }, [])

  const readCache = useCallback((moodKey: string | null): FeedCache | undefined => {
    if (moodKey === null) return allFeedCache.current
    return moodFeedCaches.current.get(moodKey)
  }, [])

  const snapshotCurrentFeed = useCallback((): FeedCache => {
    return {
      videos: videosRef.current,
      offset: videosRef.current.length,
      hasMore: hasMoreRef.current,
      scrollTop: readMainScrollTop(),
    }
  }, [])

  const applyCacheToUi = useCallback(
    (cache: FeedCache) => {
      setVideos(cache.videos)
      setHasMore(cache.hasMore)
      setMoodEmpty((prev) => {
        const next = cache.videos.length === 0 && activeMoodRef.current !== null
        return prev === next ? prev : next
      })
      setLoading(false)
      setLoadingMore(false)
      scheduleScrollRestore(cache.scrollTop)
    },
    [scheduleScrollRestore],
  )

  // Hydrate picker + persisted mood on client
  useEffect(() => {
    const persisted = getPersistedActiveMood()
    if (persisted && moodByQuery(persisted)) {
      setActiveMood(persisted)
      setPendingMoodQuery(persisted)
      setPickerOpen(false)
      allFeedCache.current = {
        videos: initialVideos,
        offset: initialVideos.length,
        hasMore: initialVideos.length === VIDEOS_PER_PAGE,
        scrollTop: 0,
      }
      setVideos([])
      setLoading(true)
      setHasMore(true)
      void fetchMoodFeed(persisted, 0, true)
    } else {
      setPickerOpen(true)
    }

    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchDefaultFeed = useCallback(
    async (currentOffset: number, isInitialLoad = false) => {
      if (isFetchingRef.current) return

      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setFeedError(userFacingNetworkMessage())
        setIsFetching(false)
        setLoading(false)
        setLoadingMore(false)
        setHasMore(false)
        if (currentOffset === 0) setVideos([])
        return
      }

      const generation = ++fetchGeneration.current
      isFetchingRef.current = true

      try {
        setFeedError(null)
        setMoodEmpty(false)
        setIsFetching(true)
        if (isInitialLoad) setLoading(true)
        else setLoadingMore(true)

        const response = await apiClient.getVideoList({ offset: currentOffset, limit: VIDEOS_PER_PAGE, seed })
        if (generation !== fetchGeneration.current) return

        const videosArray = response.videos || []
        const enhanced = enhanceVideos(videosArray, userData)
        const pageHasMore = enhanced.length === VIDEOS_PER_PAGE

        const merged = currentOffset === 0 ? enhanced : mergeVideos(videosRef.current, enhanced)

        setVideos(merged)
        setHasMore(pageHasMore)

        const scrollTop = currentOffset === 0 ? readMainScrollTop() : allFeedCache.current.scrollTop
        writeCache(null, {
          videos: merged,
          offset: merged.length,
          hasMore: pageHasMore,
          scrollTop,
        })
      } catch (err) {
        if (generation !== fetchGeneration.current) return
        console.error("[hiffi] Failed to fetch videos:", err)
        if (currentOffset > 0) setHasMore(false)
        else {
          setVideos([])
          setHasMore(false)
          setFeedError(
            isConnectivityError(err) ? userFacingNetworkMessage() : "Could not load videos. Please try again.",
          )
        }
      } finally {
        if (generation === fetchGeneration.current) {
          isFetchingRef.current = false
          setLoading(false)
          setLoadingMore(false)
          setIsFetching(false)
          if (currentOffset > 0) requestAnimationFrame(restoreScrollPosition)
        }
      }
    },
    [userData, seed, readMainScrollTop, writeCache, restoreScrollPosition],
  )

  const fetchMoodFeed = useCallback(
    async (moodQuery: string, currentOffset: number, isInitialLoad = false) => {
      if (isFetchingRef.current) return

      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setFeedError(userFacingNetworkMessage())
        setIsFetching(false)
        setLoading(false)
        setLoadingMore(false)
        setHasMore(false)
        if (currentOffset === 0) setVideos([])
        return
      }

      const generation = ++fetchGeneration.current
      isFetchingRef.current = true

      try {
        setFeedError(null)
        setIsFetching(true)
        if (isInitialLoad) setLoading(true)
        else setLoadingMore(true)

        const response = await apiClient.getMoodPlaylist(moodSearchQuery(moodQuery), {
          limit: VIDEOS_PER_PAGE,
          offset: currentOffset,
        })
        if (generation !== fetchGeneration.current) return

        if (!response.success) {
          const revert = tabRevertRef.current
          if (isInitialLoad && revert) {
            setActiveMood(revert.mood)
            setPersistedActiveMood(revert.mood)
            applyCacheToUi(revert.cache)
            tabRevertRef.current = null
          }
          return
        }

        tabRevertRef.current = null

        const videosArray = playlistItemsToVideos(response.items)
        const enhanced = enhanceVideos(videosArray, userData)
        const pageHasMore = enhanced.length === VIDEOS_PER_PAGE

        const prevCache = moodFeedCaches.current.get(moodQuery)
        const merged = currentOffset === 0 ? enhanced : mergeVideos(videosRef.current, enhanced)

        setVideos(merged)
        setHasMore(pageHasMore)
        setMoodEmpty(merged.length === 0)

        const scrollTop =
          currentOffset === 0 ? readMainScrollTop() : (prevCache?.scrollTop ?? readMainScrollTop())

        writeCache(moodQuery, {
          videos: merged,
          offset: merged.length,
          hasMore: pageHasMore,
          scrollTop,
        })
      } catch (err) {
        if (generation !== fetchGeneration.current) return
        console.error("[hiffi] Failed to fetch mood playlist:", err)
        const revert = tabRevertRef.current
        if (isInitialLoad && revert) {
          setActiveMood(revert.mood)
          setPersistedActiveMood(revert.mood)
          applyCacheToUi(revert.cache)
          tabRevertRef.current = null
        } else if (currentOffset === 0) {
          setVideos([])
          setHasMore(false)
          setFeedError(
            isConnectivityError(err) ? userFacingNetworkMessage() : "Could not load videos. Please try again.",
          )
        }
      } finally {
        if (generation === fetchGeneration.current) {
          isFetchingRef.current = false
          setLoading(false)
          setLoadingMore(false)
          setIsFetching(false)
          if (!isInitialLoad) requestAnimationFrame(restoreScrollPosition)
        }
      }
    },
    [userData, applyCacheToUi, readMainScrollTop, writeCache, restoreScrollPosition],
  )

  const applyMood = (query: string | null) => {
    if (query === activeMood) return

    const currentCache = snapshotCurrentFeed()
    tabRevertRef.current = { mood: activeMood, cache: currentCache }

    writeCache(activeMood, currentCache)

    setActiveMood(query)
    setPersistedActiveMood(query)
    setMoodEmpty(false)
    setFeedError(null)

    if (query === null) {
      setPendingMoodQuery(null)
      const cached = readCache(null)
      if (cached && cached.videos.length > 0) {
        applyCacheToUi(cached)
        tabRevertRef.current = null
        return
      }
      void fetchDefaultFeed(0, true)
      return
    }

    setPendingMoodQuery(query)

    const moodCache = readCache(query)
    onMoodMixStarted({ moodQuery: query, videoCount: moodCache?.videos.length })
    if (moodCache && moodCache.videos.length > 0) {
      applyCacheToUi(moodCache)
      tabRevertRef.current = null
      return
    }

    setVideos([])
    setHasMore(true)
    void fetchMoodFeed(query, 0, true)
  }

  const handleStartMix = (query?: string) => {
    const q = query || pendingMoodQuery
    if (!q) return
    applyMood(q)
    setPickerOpen(false)
  }

  const restoreMoodMixUi = useCallback(() => {
    setPickerOpen(true)
    setPendingMoodQuery(null)
  }, [])

  const switchToFullFeed = useCallback(() => {
    if (activeMoodRef.current !== null) {
      onPlaylistSessionEnded("mood_dismissed")
    }
    setPersistedActiveMood(null)
    setMoodEmpty(false)
    setFeedError(null)
    restoreMoodMixUi()

    const currentMood = activeMoodRef.current
    if (currentMood === null) {
      document.getElementById("main-content")?.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    writeCache(currentMood, snapshotCurrentFeed())
    setActiveMood(null)

    const cached = readCache(null)
    if (cached && cached.videos.length > 0) {
      applyCacheToUi(cached)
    } else {
      void fetchDefaultFeed(0, true)
    }

    document.getElementById("main-content")?.scrollTo({ top: 0, behavior: "smooth" })
  }, [applyCacheToUi, snapshotCurrentFeed, writeCache, readCache, restoreMoodMixUi])

  const handleShowAll = () => {
    switchToFullFeed()
  }

  useEffect(() => {
    const onHomeReset = () => switchToFullFeed()
    window.addEventListener(HOME_FEED_RESET_EVENT, onHomeReset)
    return () => window.removeEventListener(HOME_FEED_RESET_EVENT, onHomeReset)
  }, [switchToFullFeed])

  useEffect(() => {
    if (!hydrated) return
    if (initialVideos.length === 0 && activeMood === null) {
      void fetchDefaultFeed(0, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  useEffect(() => {
    if (!userData?.username || !userData?.profile_picture) return
    setVideos((prev) => {
      let changed = false
      const next = prev.map((video: any) => {
        const uname = video.user_username || video.userUsername
        if (uname === userData.username && !video.user_profile_picture) {
          changed = true
          return {
            ...video,
            user_profile_picture: userData.profile_picture || userData.image,
            user_updated_at: userData.updated_at,
          }
        }
        return video
      })
      return changed ? next : prev
    })
  }, [userData?.username, userData?.profile_picture, userData?.image, userData?.updated_at])

  const loadMore = useCallback(() => {
    if (loading || loadingMore || isFetchingRef.current || !hasMore) return
    const nextOffset = videosRef.current.length
    if (activeMood === null) {
      void fetchDefaultFeed(nextOffset, false)
    } else {
      void fetchMoodFeed(activeMood, nextOffset, false)
    }
  }, [loading, loadingMore, hasMore, fetchDefaultFeed, fetchMoodFeed])

  const handleVideoDeleted = useCallback(
    (videoId: string) => {
      setVideos((prev) => {
        const next = prev.filter((v: any) => (v.videoId || v.video_id) !== videoId)
        const moodKey = activeMoodRef.current
        const cache = readCache(moodKey)
        if (cache) {
          writeCache(moodKey, { ...cache, videos: next, offset: next.length })
        }
        return next
      })
    },
    [readCache, writeCache],
  )

  const moodPlaylistNavigation = useMemo(() => {
    if (!activeMood || !activeMoodDef) return undefined
    const videoIds = videos
      .map((v: { videoId?: string; video_id?: string }) => v.videoId || v.video_id)
      .filter((id): id is string => Boolean(id))
    if (videoIds.length === 0) return undefined
    return {
      playlistId: moodPlaylistIdForQuery(activeMood),
      title: activeMoodDef.label,
      videoIds,
      videoMeta: playlistVideoMetaFromFeedVideos(videos, getThumbnailUrl),
    }
  }, [activeMood, activeMoodDef, videos])

  const handlePlayMood = useCallback(() => {
    if (!moodPlaylistNavigation || moodPlaylistNavigation.videoIds.length === 0) return
    const firstVideoId = moodPlaylistNavigation.videoIds[0]
    if (activeMood) {
      setMoodWatchAttribution({
        moodQuery: activeMood,
        playlistId: moodPlaylistNavigation.playlistId,
        videoId: firstVideoId,
        trackIndex: 0,
        queueLength: moodPlaylistNavigation.videoIds.length,
      })
    }
    activatePlaylistNavigation(moodPlaylistNavigation, firstVideoId)
    router.push(buildPlaylistWatchPath(moodPlaylistNavigation, firstVideoId))
  }, [activeMood, moodPlaylistNavigation, router])

  return (
    <div className="w-full">
      <div className="w-full px-4 py-4 sm:px-4 md:px-4 lg:pl-4 lg:pr-6">
        <div className="mb-4 sm:mb-5">
          <MoodMixChips
            moods={MOODS}
            activeQuery={activeMood}
            loading={loading}
            onSelectMood={(query) => handleStartMix(query)}
            onSelectAll={handleShowAll}
            onPlay={
              moodPlaylistNavigation && moodPlaylistNavigation.videoIds.length > 0
                ? handlePlayMood
                : undefined
            }
          />
        </div>

        {!isMoodFeed && heroSource === "pending" && heroCards.length === 0 ? (
          <div className="mb-3 sm:mb-4">
            <HeroCarouselSkeleton />
          </div>
        ) : null}

        {heroCards.length > 0 ? (
          <div
            className={cn("mb-3 sm:mb-4", isMoodFeed && "hidden")}
            aria-hidden={isMoodFeed}
          >
            <HeroCarousel
              cards={heroCards}
              playbackActive={!isMoodFeed}
              onCardChange={handleHeroCardChange}
              onInViewChange={handleHeroInViewChange}
              openVideoUiName={OPENED_VIDEO_FROM_HOME_HERO}
            />
          </div>
        ) : null}

        {!isMoodFeed && (heroSource === "pending" || heroCards.length > 0) ? (
          <h2 className="mb-1.5 text-base font-semibold tracking-tight text-foreground sm:text-lg">
            Discover
          </h2>
        ) : isMoodFeed && activeMoodDef ? (
          <h2 className="mb-1.5 text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {activeMoodDef.label}
          </h2>
        ) : null}

        {feedError && videos.length === 0 ? (
          <OfflineState
            className="mx-auto w-full max-w-lg"
            title={feedError === userFacingNetworkMessage() ? "No internet connection" : "Couldn’t load videos"}
            description={feedError}
            onRetry={() => {
              setFeedError(null)
              if (activeMood === null) {
                void fetchDefaultFeed(0, true)
              } else {
                void fetchMoodFeed(activeMood, 0, true)
              }
            }}
          />
        ) : null}

        <FeedVideoPreviewProvider
          // One stage at a time: no grid hover while the featured hero is in view.
          enabled={isMoodFeed || heroCards.length === 0 || !heroInView}
        >
          <MoodFeedAnimated
            feedKey={activeMood ?? "all"}
            loading={loading || loadingMore}
            videoCount={videos.length}
            isMoodFeed={isMoodFeed}
          >
            <VideoGrid
              videos={videos}
              loading={loading || loadingMore}
              hasMore={hasMore}
              hideTimestamp
              metadataFontDmSans={isMoodFeed}
              skipCardEntrance={isMoodFeed}
              enableHoverPreview
              alwaysShowMoreMenu
              openVideoUiName={isMoodFeed ? OPENED_VIDEO_FROM_MOOD : "opened-video-from-home"}
              playlistNavigation={moodPlaylistNavigation}
              onLoadMore={loadMore}
              suppressEmptyState={Boolean(feedError && videos.length === 0)}
              emptyTitle={moodEmpty && isMoodFeed ? "No tracks yet" : undefined}
              onVideoDeleted={handleVideoDeleted}
            />
          </MoodFeedAnimated>
        </FeedVideoPreviewProvider>
      </div>
    </div>
  )
}
