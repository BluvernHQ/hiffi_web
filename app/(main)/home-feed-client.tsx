"use client"

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from "react"
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
  /** Lightweight server-rendered cards shown until the interactive feed is ready. */
  initialSnapshot?: ReactNode
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

export function HomeFeedClient({ initialVideos, seed, initialSnapshot }: HomeFeedClientProps) {
  const router = useRouter()
  const { user, userData, loading: authLoading } = useAuth()
  const [videos, setVideos] = useState<any[]>(() => initialVideos)
  // Cold mount has no SSR videos now — start in loading so VideoGrid shows
  // skeletons instead of the “No videos yet” empty state before fetch/restore.
  const [loading, setLoading] = useState(() => initialVideos.length === 0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialVideos.length === VIDEOS_PER_PAGE)
  const [isFetching, setIsFetching] = useState(false)
  const [feedError, setFeedError] = useState<string | null>(null)
  const [feedSeed, setFeedSeed] = useState(seed)
  const [recommendEmpty, setRecommendEmpty] = useState(false)

  const [activeMood, setActiveMood] = useState<string | null>(null)
  const [moodEmpty, setMoodEmpty] = useState(false)
  const [pendingMoodQuery, setPendingMoodQuery] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [heroReloadToken, setHeroReloadToken] = useState(0)

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
  const userRef = useRef(user)
  const wasAuthenticatedRef = useRef<boolean | null>(null)
  const sessionSavedAuthenticatedRef = useRef<boolean | null>(null)
  const restoredFromSessionRef = useRef(false)
  const pendingRestoreScrollRef = useRef<number | null>(null)
  /** When false, block page-0 recommend refetch if a cached feed exists (watch → back). */
  const forceRecommendFetchRef = useRef(false)

  const activeMoodDef = activeMood ? moodByQuery(activeMood) : undefined
  const isMoodFeed = activeMood !== null
  // Always start false so SSR HTML matches the first client render. Session restore
  // flips this in useLayoutEffect before paint (reading sessionStorage here caused
  // Suspense vs MoodFeedAnimated hydration mismatches).
  const skipSsrSnapshotRef = useRef(false)

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
  }, [heroReloadToken])

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

  const showInitialSnapshot =
    Boolean(initialSnapshot) &&
    !skipSsrSnapshotRef.current &&
    videos.length === 0 &&
    loading &&
    activeMood === null &&
    !feedError

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

  useEffect(() => {
    userRef.current = user
  }, [user])

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
          authenticated: Boolean(userRef.current),
          scrollTop: mainContent.scrollTop,
        })
      }
    }

    const onPageHide = () => {
      if (videosRef.current.length === 0) return
      saveHomeFeedPersistedState({
        videos: videosRef.current,
        hasMore: hasMoreRef.current,
        seed: feedSeedRef.current,
        activeMood: activeMoodRef.current,
        authenticated: Boolean(userRef.current),
        scrollTop: getLastKnownHomeScrollTop() || mainContent.scrollTop,
      })
    }

    onScroll()
    mainContent.addEventListener("scroll", onScroll, { passive: true })
    mainContent.addEventListener("mousedown", onPointerDown, { capture: true })
    mainContent.addEventListener("touchstart", onPointerDown, { passive: true, capture: true })
    window.addEventListener("pagehide", onPageHide)
    return () => {
      mainContent.removeEventListener("scroll", onScroll)
      mainContent.removeEventListener("mousedown", onPointerDown, { capture: true })
      mainContent.removeEventListener("touchstart", onPointerDown, { capture: true })
      window.removeEventListener("pagehide", onPageHide)
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

      if (
        isInitialLoad &&
        currentOffset === 0 &&
        !forceRecommendFetchRef.current &&
        (restoredFromSessionRef.current || loadHomeFeedPersistedState())
      ) {
        return
      }

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
        setRecommendEmpty(false)
        setIsFetching(true)
        if (isInitialLoad) setLoading(true)
        else setLoadingMore(true)

        const response = await apiClient.getVideoRecommendations({
          offset: currentOffset,
          limit: VIDEOS_PER_PAGE,
        })
        if (generation !== fetchGeneration.current) return

        const videosArray = response.videos || []
        const enhanced = enhanceVideos(videosArray, userData)
        const returnedCount = response.count ?? enhanced.length
        const pageHasMore = returnedCount === VIDEOS_PER_PAGE

        const merged = currentOffset === 0 ? enhanced : mergeVideos(videosRef.current, enhanced)

        setVideos(merged)
        setHasMore(pageHasMore)
        setRecommendEmpty(currentOffset === 0 && merged.length === 0 && response.success)

        const scrollTop = currentOffset === 0 ? readMainScrollTop() : allFeedCache.current.scrollTop
        writeCache(null, {
          videos: merged,
          offset: merged.length,
          hasMore: pageHasMore,
          scrollTop,
        })

        if (currentOffset === 0) {
          saveHomeFeedPersistedState({
            videos: merged,
            hasMore: pageHasMore,
            seed: feedSeedRef.current,
            activeMood: activeMoodRef.current,
            authenticated: Boolean(userRef.current),
            scrollTop,
          })
        }
      } catch (err) {
        if (generation !== fetchGeneration.current) return
        console.error("[hiffi] Failed to fetch videos:", err)
        if (currentOffset > 0) setHasMore(false)
        else {
          setVideos([])
          setHasMore(false)
          setRecommendEmpty(false)
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

  /** Refetch recommend when auth changes (login: co-watch → history; logout: reverse). */
  const refreshRecommendFeedForAuthChange = useCallback(() => {
    forceRecommendFetchRef.current = true
    restoredFromSessionRef.current = false
    sessionSavedAuthenticatedRef.current = Boolean(userRef.current)
    clearHomeFeedPersistedState()
    allFeedCache.current = { videos: [], offset: 0, hasMore: true, scrollTop: 0 }
    setRecommendEmpty(false)
    setFeedError(null)
    setVideos([])
    setHasMore(true)
    setLoading(true)
    void fetchDefaultFeed(0, true)
  }, [fetchDefaultFeed])

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
  }

  const restoreMoodMixUi = useCallback(() => {
    setPendingMoodQuery(null)
  }, [])

  const hardReloadHomeFeed = useCallback(() => {
    forceRecommendFetchRef.current = true
    consumeHomeHardReloadFlag()
    const nextSeed = resetSeed()
    setFeedSeed(nextSeed)
    feedSeedRef.current = nextSeed
    fetchGeneration.current += 1
    isFetchingRef.current = false

    setPersistedActiveMood(null)
    setActiveMood(null)
    setPendingMoodQuery(null)
    setMoodEmpty(false)
    setRecommendEmpty(false)
    setFeedError(null)
    setHeroCards([])
    setHeroSource("pending")
    curatedHeroIdsRef.current = null
    setHeroReloadToken((token) => token + 1)
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
      forceRecommendFetchRef.current = true
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
      skipSsrSnapshotRef.current = true
      restoredFromSessionRef.current = true
      sessionSavedAuthenticatedRef.current =
        restored.authenticated === true
          ? true
          : restored.authenticated === false
            ? false
            : null
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
      authenticated: Boolean(user),
      scrollTop:
        pendingScroll != null && pendingScroll > 0
          ? pendingScroll
          : getLastKnownHomeScrollTop() || readMainScrollTop(),
    })
  }, [hydrated, videos, hasMore, feedSeed, activeMood, user])

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
        authenticated: Boolean(userRef.current),
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

  // Refetch only when auth changes while the user is already on home — never after watch → back restore.
  useEffect(() => {
    if (!hydrated || activeMood !== null || authLoading) return

    const isAuth = Boolean(user)

    if (restoredFromSessionRef.current) {
      if (wasAuthenticatedRef.current === null) {
        wasAuthenticatedRef.current = isAuth
      }
      return
    }

    const prev = wasAuthenticatedRef.current
    if (prev === null) {
      wasAuthenticatedRef.current = isAuth
      return
    }

    wasAuthenticatedRef.current = isAuth
    if (prev === isAuth) return

    refreshRecommendFeedForAuthChange()
  }, [user, authLoading, hydrated, activeMood, refreshRecommendFeedForAuthChange])

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
      <div className="w-full px-3 py-4 sm:px-4 md:px-4 lg:pl-4 lg:pr-6">
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
              forceRecommendFetchRef.current = true
              if (activeMood === null) {
                void fetchDefaultFeed(0, true)
              } else {
                void fetchMoodFeed(activeMood, 0, true)
              }
            }}
          />
        ) : null}

        {showInitialSnapshot ? (
          initialSnapshot
        ) : (
          <FeedVideoPreviewProvider
            enabled={isMoodFeed || heroCards.length === 0 || !heroInView}
          >
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
                emptyTitle={
                  recommendEmpty && !isMoodFeed
                    ? "No recommendations yet"
                    : moodEmpty && isMoodFeed
                      ? "No tracks yet"
                      : undefined
                }
                emptyDescription={
                  recommendEmpty && !isMoodFeed
                    ? "Videos may still be indexing, or nothing matched yet. Try a mood mix above or check back soon."
                    : undefined
                }
                onVideoDeleted={handleVideoDeleted}
              />
            </MoodFeedAnimated>
          </FeedVideoPreviewProvider>
        )}
      </div>
    </div>
  )
}
