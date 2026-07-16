"use client"

import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { VideoGrid } from "@/components/video/video-grid"
import { FeedVideoPreviewProvider } from "@/components/video/feed-video-preview-provider"
import { MoodPickerCard } from "@/components/home/mood-picker-card"
import { ActiveMoodBar } from "@/components/home/active-mood-bar"
import { MoodFeedAnimated } from "@/components/home/mood-feed-animated"
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
import {
  HOME_FEED_HARD_RELOAD_EVENT,
  clearHomeFeedPersistedState,
  clearHomeScrollPersistence,
  consumeHomeHardReloadFlag,
  getLastKnownHomeScrollTop,
  loadHomeFeedPersistedState,
  restoreHomeFeedScroll,
  saveHomeFeedPersistedState,
  setLastKnownHomeScrollTop,
} from "@/lib/home-feed-session"
import { resetSeed } from "@/lib/seed-manager"
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
  // Cold mount has no SSR videos now — start in loading so VideoGrid shows
  // skeletons instead of the “No videos yet” empty state before fetch/restore.
  const [loading, setLoading] = useState(() => initialVideos.length === 0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialVideos.length === VIDEOS_PER_PAGE)
  const [isFetching, setIsFetching] = useState(false)
  const [feedError, setFeedError] = useState<string | null>(null)
  const [feedSeed, setFeedSeed] = useState(seed)

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
  const feedSeedRef = useRef(feedSeed)
  const restoredFromSessionRef = useRef(false)
  const pendingRestoreScrollRef = useRef<number | null>(null)

  const activeMoodDef = activeMood ? moodByQuery(activeMood) : undefined

  useEffect(() => {
    videosRef.current = videos
  }, [videos])

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  useEffect(() => {
    activeMoodRef.current = activeMood
  }, [activeMood])

  useEffect(() => {
    feedSeedRef.current = feedSeed
  }, [feedSeed])

  // Keep home scroll in memory continuously — watch page zeroes #main-content on enter,
  // which would otherwise wipe the DOM value before home unmount cleanup runs.
  useEffect(() => {
    const mainContent = document.getElementById("main-content")
    if (!mainContent) return

    const onScroll = () => {
      setLastKnownHomeScrollTop(mainContent.scrollTop)
    }
    const onPointerDown = (event: Event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest("a[href]")
      if (!anchor) return
      setLastKnownHomeScrollTop(mainContent.scrollTop)
      if (videosRef.current.length > 0) {
        saveHomeFeedPersistedState({
          videos: videosRef.current,
          hasMore: hasMoreRef.current,
          seed: feedSeedRef.current,
          activeMood: activeMoodRef.current,
          scrollTop: mainContent.scrollTop,
        })
      }
    }

    onScroll()
    mainContent.addEventListener("scroll", onScroll, { passive: true })
    mainContent.addEventListener("mousedown", onPointerDown, { capture: true })
    mainContent.addEventListener("touchstart", onPointerDown, { passive: true, capture: true })
    return () => {
      mainContent.removeEventListener("scroll", onScroll)
      mainContent.removeEventListener("mousedown", onPointerDown, { capture: true })
      mainContent.removeEventListener("touchstart", onPointerDown, { capture: true })
    }
  }, [])

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

        const response = await apiClient.getVideoList({
          offset: currentOffset,
          limit: VIDEOS_PER_PAGE,
          seed: feedSeedRef.current,
        })
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
    [userData, writeCache, restoreScrollPosition],
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

  const hardReloadHomeFeed = useCallback(() => {
    consumeHomeHardReloadFlag()
    const nextSeed = resetSeed()
    setFeedSeed(nextSeed)
    feedSeedRef.current = nextSeed
    fetchGeneration.current += 1
    isFetchingRef.current = false

    setPersistedActiveMood(null)
    setActiveMood(null)
    setPendingMoodQuery(null)
    setPickerOpen(true)
    setMoodEmpty(false)
    setFeedError(null)
    clearHomeFeedPersistedState()
    clearHomeScrollPersistence()
    moodFeedCaches.current.clear()
    allFeedCache.current = { videos: [], offset: 0, hasMore: true, scrollTop: 0 }

    setVideos([])
    setHasMore(true)
    setLoading(true)
    document.getElementById("main-content")?.scrollTo({ top: 0, behavior: "auto" })
    void fetchDefaultFeed(0, true)
  }, [fetchDefaultFeed])

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
  }, [applyCacheToUi, snapshotCurrentFeed, writeCache, readCache, restoreMoodMixUi, fetchDefaultFeed])

  const handleShowAll = () => {
    switchToFullFeed()
  }

  // Hydrate from session (back-nav), hard-reload flag, or SSR + mood
  useLayoutEffect(() => {
    const hardReload = consumeHomeHardReloadFlag()
    if (hardReload) {
      hardReloadHomeFeed()
      setHydrated(true)
      return
    }

    const restored = loadHomeFeedPersistedState()
    if (restored) {
      restoredFromSessionRef.current = true
      setFeedSeed(restored.seed)
      feedSeedRef.current = restored.seed
      const scrollTop = restored.scrollTop > 0 ? restored.scrollTop : getLastKnownHomeScrollTop()
      pendingRestoreScrollRef.current = scrollTop > 0 ? scrollTop : null
      const cache: FeedCache = {
        videos: restored.videos as any[],
        offset: restored.videos.length,
        hasMore: restored.hasMore,
        scrollTop,
      }

      if (restored.activeMood && moodByQuery(restored.activeMood)) {
        setActiveMood(restored.activeMood)
        setPendingMoodQuery(restored.activeMood)
        setPickerOpen(false)
        setPersistedActiveMood(restored.activeMood)
        moodFeedCaches.current.set(restored.activeMood, cache)
        allFeedCache.current = {
          videos: initialVideos,
          offset: initialVideos.length,
          hasMore: initialVideos.length === VIDEOS_PER_PAGE,
          scrollTop: 0,
        }
      } else {
        setActiveMood(null)
        setPickerOpen(true)
        setPersistedActiveMood(null)
        allFeedCache.current = cache
      }

      setVideos(cache.videos)
      setHasMore(cache.hasMore)
      setLoading(false)
      setHydrated(true)
      if (scrollTop > 0) {
        restoreHomeFeedScroll(scrollTop)
      }
      return
    }

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
      try {
        // Keep SSR seed for this session so pagination matches the hydrated first page.
        sessionStorage.setItem("hiffi_video_seed", seed)
        setFeedSeed(seed)
        feedSeedRef.current = seed
      } catch {
        /* ignore */
      }
    }

    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onHomeReset = () => switchToFullFeed()
    const onHardReload = () => hardReloadHomeFeed()
    window.addEventListener(HOME_FEED_RESET_EVENT, onHomeReset)
    window.addEventListener(HOME_FEED_HARD_RELOAD_EVENT, onHardReload)
    return () => {
      window.removeEventListener(HOME_FEED_RESET_EVENT, onHomeReset)
      window.removeEventListener(HOME_FEED_HARD_RELOAD_EVENT, onHardReload)
    }
  }, [switchToFullFeed, hardReloadHomeFeed])

  // Persist feed so Back from watch (or other routes) can restore grid + scroll.
  useEffect(() => {
    if (!hydrated || videos.length === 0) return
    const pendingScroll = pendingRestoreScrollRef.current
    saveHomeFeedPersistedState({
      videos,
      hasMore,
      seed: feedSeed,
      activeMood,
      scrollTop:
        pendingScroll != null && pendingScroll > 0
          ? pendingScroll
          : getLastKnownHomeScrollTop() || readMainScrollTop(),
    })
  }, [hydrated, videos, hasMore, feedSeed, activeMood])

  // After restored videos paint, re-apply scroll (content height may still be growing).
  useLayoutEffect(() => {
    if (!hydrated || !restoredFromSessionRef.current) return
    const scrollTop = pendingRestoreScrollRef.current
    if (scrollTop == null || scrollTop <= 0) return
    restoreHomeFeedScroll(scrollTop)
  }, [hydrated, videos.length])

  // Once the scroller is near the target, clear the pending restore so later
  // persist snapshots track live scroll again.
  useEffect(() => {
    if (!hydrated || !restoredFromSessionRef.current) return
    const target = pendingRestoreScrollRef.current
    if (target == null || target <= 0) return

    const mainContent = document.getElementById("main-content")
    if (!mainContent) return

    const maybeClear = () => {
      if (Math.abs(mainContent.scrollTop - target) <= 4) {
        pendingRestoreScrollRef.current = null
      }
    }
    maybeClear()
    const id = window.setInterval(maybeClear, 200)
    const stop = window.setTimeout(() => {
      window.clearInterval(id)
      pendingRestoreScrollRef.current = null
    }, 3500)
    return () => {
      window.clearInterval(id)
      window.clearTimeout(stop)
    }
  }, [hydrated, videos.length])

  useEffect(() => {
    return () => {
      if (videosRef.current.length === 0) return
      saveHomeFeedPersistedState({
        videos: videosRef.current,
        hasMore: hasMoreRef.current,
        seed: feedSeedRef.current,
        activeMood: activeMoodRef.current,
        scrollTop: getLastKnownHomeScrollTop(),
      })
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (restoredFromSessionRef.current) return
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

  const isMoodFeed = activeMood !== null

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
      {activeMoodDef && !pickerOpen ? (
        <div className="sticky top-0 z-10">
          <ActiveMoodBar
            mood={activeMoodDef}
            onPlay={handlePlayMood}
            onClose={handleShowAll}
          />
        </div>
      ) : null}

      <div className="w-full px-3 py-4 sm:px-4 md:px-4 lg:pl-4 lg:pr-6">
        {pickerOpen ? (
          <div className="mb-5 sm:mb-6">
            <MoodPickerCard
              moods={MOODS}
              selectedQuery={pendingMoodQuery}
              onSelect={setPendingMoodQuery}
              onStartMix={handleStartMix}
              loading={loading && pendingMoodQuery !== null && !activeMood}
            />
          </div>
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

        <FeedVideoPreviewProvider>
          <MoodFeedAnimated
            feedKey={activeMood ?? "all"}
            loading={loading || loadingMore || (!hydrated && videos.length === 0)}
            videoCount={videos.length}
            isMoodFeed={isMoodFeed}
          >
            <VideoGrid
              videos={videos}
              loading={loading || loadingMore || (!hydrated && videos.length === 0)}
              hasMore={hasMore}
              hideTimestamp
              metadataFontDmSans={isMoodFeed}
              skipCardEntrance={isMoodFeed}
              enableHoverPreview
              alwaysShowMoreMenu
              openVideoUiName={isMoodFeed ? OPENED_VIDEO_FROM_MOOD : "opened-video-from-home"}
              playlistNavigation={moodPlaylistNavigation}
              onLoadMore={loadMore}
              suppressEmptyState={
                Boolean(feedError && videos.length === 0) ||
                !hydrated ||
                (loading && videos.length === 0)
              }
              emptyTitle={moodEmpty && isMoodFeed ? "No tracks yet" : undefined}
              onVideoDeleted={handleVideoDeleted}
            />
          </MoodFeedAnimated>
        </FeedVideoPreviewProvider>
      </div>
    </div>
  )
}
