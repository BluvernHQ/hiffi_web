"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { VideoGrid } from "@/components/video/video-grid"
import { MoodPickerCard } from "@/components/home/mood-picker-card"
import { ActiveMoodBar } from "@/components/home/active-mood-bar"
import { MoodPickerTeaser } from "@/components/home/mood-picker-teaser"
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
  isMoodPickerDismissed,
  setMoodPickerDismissed,
} from "@/lib/mood-tabs"
import {
  getPersistedActiveMood,
  HOME_FEED_RESET_EVENT,
  setPersistedActiveMood,
} from "@/lib/mood-session"
import { OPENED_VIDEO_FROM_MOOD } from "@/lib/analytics/mood-mix-analytics"
import { playlistVideoMetaFromFeedVideos } from "@/lib/playlist-session"
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
  const { userData } = useAuth()
  const [videos, setVideos] = useState<any[]>(() => initialVideos)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(initialVideos.length)
  const [hasMore, setHasMore] = useState(initialVideos.length === VIDEOS_PER_PAGE)
  const [isFetching, setIsFetching] = useState(false)
  const [feedError, setFeedError] = useState<string | null>(null)

  const [activeMood, setActiveMood] = useState<string | null>(null)
  const [moodEmpty, setMoodEmpty] = useState(false)
  const [pendingMoodQuery, setPendingMoodQuery] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerDismissed, setPickerDismissed] = useState(true)
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
  const tabRevertRef = useRef<{ mood: string | null; cache: FeedCache } | null>(null)
  const videosRef = useRef(videos)
  const hasMoreRef = useRef(hasMore)
  const activeMoodRef = useRef(activeMood)

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
      setOffset(cache.offset)
      setHasMore(cache.hasMore)
      setMoodEmpty(cache.videos.length === 0 && activeMoodRef.current !== null)
      setLoading(false)
      setLoadingMore(false)
      scheduleScrollRestore(cache.scrollTop)
    },
    [scheduleScrollRestore],
  )

  // Hydrate picker + persisted mood on client
  useEffect(() => {
    const dismissed = isMoodPickerDismissed()
    setPickerDismissed(dismissed)

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
    } else if (!dismissed) {
      setPickerOpen(true)
    }

    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchDefaultFeed = async (currentOffset: number, isInitialLoad = false) => {
    if (isFetching) return

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

      const merged =
        currentOffset === 0 ? enhanced : mergeVideos(videosRef.current, enhanced)

      setVideos(merged)
      setOffset(merged.length)
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
        setFeedError(isConnectivityError(err) ? userFacingNetworkMessage() : "Could not load videos. Please try again.")
      }
    } finally {
      if (generation === fetchGeneration.current) {
        setLoading(false)
        setLoadingMore(false)
        setIsFetching(false)
        if (currentOffset > 0) requestAnimationFrame(restoreScrollPosition)
      }
    }
  }

  const fetchMoodFeed = async (moodQuery: string, currentOffset: number, isInitialLoad = false) => {
    if (isFetching) return

    const generation = ++fetchGeneration.current

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
      const merged =
        currentOffset === 0 ? enhanced : mergeVideos(videosRef.current, enhanced)

      setVideos(merged)
      setOffset(merged.length)
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
      }
    } finally {
      if (generation === fetchGeneration.current) {
        setLoading(false)
        setLoadingMore(false)
        setIsFetching(false)
        if (!isInitialLoad) requestAnimationFrame(restoreScrollPosition)
      }
    }
  }

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
    if (moodCache && moodCache.videos.length > 0) {
      applyCacheToUi(moodCache)
      tabRevertRef.current = null
      return
    }

    setVideos([])
    setOffset(0)
    setHasMore(true)
    void fetchMoodFeed(query, 0, true)
  }

  const handleStartMix = () => {
    if (!pendingMoodQuery) return
    applyMood(pendingMoodQuery)
    setPickerOpen(false)
  }

  const restoreMoodMixUi = useCallback(() => {
    const dismissed = isMoodPickerDismissed()
    setPickerDismissed(dismissed)
    setPickerOpen(!dismissed)
    setPendingMoodQuery(null)
  }, [])

  const switchToFullFeed = useCallback(() => {
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

  const handleOpenPicker = () => {
    setMoodPickerDismissed(false)
    setPickerDismissed(false)
    setPendingMoodQuery(activeMood)
    setPickerOpen(true)
  }

  const handleDismissPicker = () => {
    setMoodPickerDismissed(true)
    setPickerDismissed(true)
    setPickerOpen(false)
  }

  useEffect(() => {
    if (!hydrated) return
    if (initialVideos.length === 0 && activeMood === null) {
      void fetchDefaultFeed(0, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  useEffect(() => {
    if (!userData?.username || !userData?.profile_picture) return
    setVideos((prev) =>
      prev.map((video: any) => {
        const uname = video.user_username || video.userUsername
        if (uname === userData.username && !video.user_profile_picture) {
          return { ...video, user_profile_picture: userData.profile_picture || userData.image, user_updated_at: userData.updated_at }
        }
        return video
      }),
    )
  }, [userData?.username, userData?.profile_picture, userData?.image, userData?.updated_at])

  const loadMore = () => {
    if (loading || loadingMore || isFetching || !hasMore) return
    const nextOffset = videosRef.current.length
    if (activeMood === null) {
      void fetchDefaultFeed(nextOffset, false)
    } else {
      void fetchMoodFeed(activeMood, nextOffset, false)
    }
  }

  const isMoodFeed = activeMood !== null
  const showTeaser = hydrated && !pickerOpen && !activeMood && pickerDismissed

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

  return (
    <div className="w-full">
      {activeMoodDef && !pickerOpen ? (
        <div className="sticky top-0 z-10">
          <ActiveMoodBar
            mood={activeMoodDef}
            onChangeVibe={handleOpenPicker}
            onShowAll={handleShowAll}
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
              onDismiss={handleDismissPicker}
              loading={loading && pendingMoodQuery !== null && !activeMood}
            />
          </div>
        ) : null}

        {showTeaser ? (
          <div className="mb-5 sm:mb-6">
            <MoodPickerTeaser onOpen={handleOpenPicker} />
          </div>
        ) : null}

        {feedError && videos.length === 0 && activeMood === null ? (
          <OfflineState
            className="mx-auto w-full max-w-lg"
            title={feedError === userFacingNetworkMessage() ? "No internet connection" : "Couldn’t load videos"}
            description={feedError}
            onRetry={() => {
              setFeedError(null)
              void fetchDefaultFeed(0, true)
            }}
          />
        ) : null}

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
            openVideoUiName={isMoodFeed ? OPENED_VIDEO_FROM_MOOD : "opened-video-from-home"}
            playlistNavigation={moodPlaylistNavigation}
            onLoadMore={loadMore}
            suppressEmptyState={Boolean(feedError && videos.length === 0 && activeMood === null)}
            emptyTitle={moodEmpty && isMoodFeed ? "No tracks yet" : undefined}
            onVideoDeleted={(videoId) => {
              setVideos((prev) => {
                const next = prev.filter((v: any) => (v.videoId || v.video_id) !== videoId)
                const moodKey = activeMoodRef.current
                const cache = readCache(moodKey)
                if (cache) {
                  writeCache(moodKey, { ...cache, videos: next, offset: next.length })
                }
                return next
              })
            }}
          />
        </MoodFeedAnimated>
      </div>
    </div>
  )
}
