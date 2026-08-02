"use client"

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type TouchEvent,
} from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Play,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react"
import {
  AuthenticatedImage,
  VideoThumbnailPlaceholder,
} from "@/components/video/authenticated-image"
import { ProfilePicture } from "@/components/profile/profile-picture"
import { AuthDialog, AUTH_DIALOG_COPY } from "@/components/auth/auth-dialog"
import { pauseActiveHoverPreview } from "@/components/video/video-card-hover-preview"
import {
  isPreviewAudioPreferred,
  setPreviewAudioPreferred,
} from "@/lib/feed-preview/preview-audio-preference"
import { getFeedPreviewSources } from "@/lib/feed-preview/resolve-preview-url"
import type { HeroCarouselCard } from "@/lib/home/hero-carousel-data"
import { useAuth } from "@/lib/auth-context"
import { prefetchMyPlaylists } from "@/lib/playlist-picker-cache"
import { cn } from "@/lib/utils"

const ShareVideoDialog = dynamic(
  () =>
    import("@/components/video/share-video-dialog").then((m) => ({
      default: m.ShareVideoDialog,
    })),
  { ssr: false },
)

const AddToPlaylistDialog = dynamic(
  () =>
    import("@/components/video/add-to-playlist-dialog").then((m) => ({
      default: m.AddToPlaylistDialog,
    })),
  { ssr: false },
)

const SWITCH_MS = 280
/** Browse-friendly level — half of full so unmute/resume isn’t overpowering. */
const PREVIEW_VOLUME = 0.5
/** Fade-in start when unmuting — keep slightly above 0 so a cancelled fade isn’t fully silent. */
const UNMUTE_START_VOLUME = 0.08
const UNMUTE_FADE_MS = 360
/** If duration never resolves, advance after this many seconds of playback. */
const UNKNOWN_DURATION_FALLBACK_MS = 45_000

export type HeroCarouselProps = {
  cards: HeroCarouselCard[]
  className?: string
  onCardChange?: (index: number, card: HeroCarouselCard) => void
  openVideoUiName?: string
  /**
   * When false (e.g. mood tab active), pause and keep currentTime.
   * When true again, resume from the same position if still in view.
   */
  playbackActive?: boolean
  /** Fires when hero crosses the in-view threshold (~40% visible). */
  onInViewChange?: (inView: boolean) => void
}

/** Append ?t= / &t= so the watch player can resume from the hero position. */
function hrefWithStartTime(href: string, seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 1) return href
  const t = Math.floor(seconds)
  // Replace an existing t= if present; otherwise append.
  if (/[?&]t=/.test(href)) {
    return href.replace(/([?&]t=)[^&]*/, `$1${t}`)
  }
  return `${href}${href.includes("?") ? "&" : "?"}t=${t}`
}

/** Hero Watch always opens a single video — strip playlist queue params. */
function standaloneWatchHref(href: string): string {
  try {
    const url = new URL(href, "https://hiffi.local")
    url.searchParams.delete("playlist")
    url.searchParams.delete("pindex")
    const q = url.searchParams.toString()
    return `${url.pathname}${q ? `?${q}` : ""}`
  } catch {
    return href.replace(/([?&])(playlist|pindex)=[^&]*/g, "").replace(/\?&/, "?").replace(/\?$/, "")
  }
}

export function HeroCarousel({
  cards,
  className,
  onCardChange,
  openVideoUiName = "opened-video-from-home-hero",
  playbackActive = true,
  onInViewChange,
}: HeroCarouselProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [active, setActive] = useState(0)
  /** 0–100 from video playback (or fallback timer). */
  const [progress, setProgress] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [crossfading, setCrossfading] = useState(false)
  const [streamUrls, setStreamUrls] = useState<string[]>([])
  const [streamIndex, setStreamIndex] = useState(0)
  const [shareOpen, setShareOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveAuthOpen, setSaveAuthOpen] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  const activeRef = useRef(0)
  const switchLockRef = useRef(false)
  const wantSoundRef = useRef(isPreviewAudioPreferred())
  const playGenRef = useRef(0)
  const hasUserGestureRef = useRef(false)
  const fallbackStartedAtRef = useRef<number | null>(null)
  /** False while scrolled away — pause without treating as a user pause. */
  const inViewRef = useRef(true)
  const playbackActiveRef = useRef(playbackActive)
  /** After leaving a mood tab, wait for hero hover before resuming. */
  const resumeOnHoverRef = useRef(false)
  /** Force 0→normal volume ramp (mood return / soft resume). */
  const forceVolumeFadeRef = useRef(false)
  const volumeFadeRafRef = useRef<number | null>(null)

  const total = cards.length
  const activeCard = cards[active] ?? null
  const activeStreamUrl = streamUrls[streamIndex] || ""
  const canNavigate = total > 1

  const onCardChangeEvent = useEffectEvent((index: number) => {
    const card = cards[index]
    if (card) onCardChange?.(index, card)
  })

  const cancelVolumeFade = useCallback(() => {
    if (volumeFadeRafRef.current == null) return
    cancelAnimationFrame(volumeFadeRafRef.current)
    volumeFadeRafRef.current = null
  }, [])

  const fadeInVolume = useCallback(
    (el: HTMLVideoElement) => {
      cancelVolumeFade()
      el.volume = UNMUTE_START_VOLUME
      const startedAt = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - startedAt) / UNMUTE_FADE_MS)
        const eased = 1 - (1 - t) * (1 - t)
        el.volume =
          UNMUTE_START_VOLUME + (PREVIEW_VOLUME - UNMUTE_START_VOLUME) * eased
        if (t < 1) {
          volumeFadeRafRef.current = requestAnimationFrame(tick)
          return
        }
        volumeFadeRafRef.current = null
        el.volume = PREVIEW_VOLUME
      }
      volumeFadeRafRef.current = requestAnimationFrame(tick)
    },
    [cancelVolumeFade],
  )

  const applyAudio = useCallback(
    (el: HTMLVideoElement, muted: boolean) => {
      if (muted) {
        cancelVolumeFade()
        forceVolumeFadeRef.current = false
        el.defaultMuted = true
        el.muted = true
        // Keep a normal level primed so the next unmute can fade cleanly.
        el.volume = PREVIEW_VOLUME
        return
      }
      const shouldFade =
        forceVolumeFadeRef.current || el.muted || el.volume <= UNMUTE_START_VOLUME + 0.01
      forceVolumeFadeRef.current = false
      el.defaultMuted = false
      el.muted = false
      if (shouldFade) {
        fadeInVolume(el)
      } else {
        el.volume = PREVIEW_VOLUME
      }
    },
    [cancelVolumeFade, fadeInVolume],
  )

  /**
   * React's controlled `muted` prop can re-apply after we unmute in the click
   * handler, leaving muted=false in UI state but a silent (volume≈0) element.
   * Re-sync after commit so DOM matches isMuted / playbackActive.
   */
  useLayoutEffect(() => {
    const el = videoRef.current
    if (!el) return
    const wantMuted = isMuted || !playbackActive
    if (wantMuted) {
      applyAudio(el, true)
      return
    }
    applyAudio(el, false)
    // Hard guarantee after React commits muted={false}.
    el.muted = false
    el.defaultMuted = false
    if (el.volume < 0.05 && volumeFadeRafRef.current == null) {
      el.volume = PREVIEW_VOLUME
    }
  }, [activeCard?.id, applyAudio, isMuted, playbackActive, streamIndex])

  useEffect(() => () => cancelVolumeFade(), [cancelVolumeFade])

  const pauseVideo = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    el.pause()
    setIsPlaying(false)
  }, [])

  const markGesture = useCallback(() => {
    hasUserGestureRef.current = true
  }, [])

  const tryPlay = useCallback(async () => {
    const el = videoRef.current
    if (
      !el ||
      !el.getAttribute("src") ||
      userPaused ||
      !inViewRef.current ||
      !playbackActiveRef.current ||
      resumeOnHoverRef.current ||
      // Don't burn decode/bandwidth in a background tab.
      (typeof document !== "undefined" && document.hidden)
    ) {
      return
    }

    pauseActiveHoverPreview()
    const gen = ++playGenRef.current

    // Prefer muted autoplay; unmute only after a user gesture (or prior preference + gesture).
    const allowSound = hasUserGestureRef.current && wantSoundRef.current
    setIsMuted(!allowSound)
    applyAudio(el, !allowSound)

    try {
      await el.play()
      if (gen !== playGenRef.current) return
      setIsPlaying(true)
      if (allowSound) {
        // Ensure audible after play() — some browsers start muted/volume 0.
        el.muted = false
        el.defaultMuted = false
        if (el.volume < 0.05) {
          cancelVolumeFade()
          el.volume = PREVIEW_VOLUME
        }
      }
    } catch {
      if (gen !== playGenRef.current) return
      // Sound autoplay blocked: start muted, then restore sound if the user asked for it.
      applyAudio(el, true)
      try {
        await el.play()
        if (gen !== playGenRef.current) return
        setIsPlaying(true)
        if (allowSound) {
          setIsMuted(false)
          forceVolumeFadeRef.current = true
          applyAudio(el, false)
        } else {
          setIsMuted(true)
        }
      } catch {
        setIsPlaying(false)
      }
    }
  }, [applyAudio, cancelVolumeFade, userPaused])

  // Hero-only: pause when the browser tab is hidden; resume if still eligible.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        pauseVideo()
        return
      }
      if (resumeOnHoverRef.current || userPaused) return
      void tryPlay()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [pauseVideo, tryPlay, userPaused])

  const onHeroVisibilityChange = useEffectEvent((visible: boolean) => {
    inViewRef.current = visible
    onInViewChange?.(visible)
    if (!visible || !playbackActiveRef.current) {
      pauseVideo()
      return
    }
    // After mood → All, stay paused until hover; scroll leave/return still resumes.
    if (resumeOnHoverRef.current || userPaused) return
    void tryPlay()
  })

  useEffect(() => {
    const root = sectionRef.current
    if (!root || typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        onHeroVisibilityChange(
          entry.isIntersecting && entry.intersectionRatio >= 0.4,
        )
      },
      { threshold: [0, 0.15, 0.35, 0.4, 0.5, 0.75, 1] },
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  // Mood-tab leave/return: pause in place; resume only after hero hover.
  // Audio is silenced via muted={isMuted || !playbackActive} — do not set volume to 0
  // (that caused unmuted+silent until the next clip remounted).
  useEffect(() => {
    playbackActiveRef.current = playbackActive
    if (!playbackActive) {
      resumeOnHoverRef.current = true
      cancelVolumeFade()
      pauseVideo()
      return
    }

    // Hero is shown again — sync in-view from layout (IO can lag after un-hide).
    const root = sectionRef.current
    if (root) {
      const rect = root.getBoundingClientRect()
      inViewRef.current =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight
    }
  }, [cancelVolumeFade, pauseVideo, playbackActive])

  const resumeFromHover = useCallback(() => {
    if (!resumeOnHoverRef.current || userPaused) return
    if (!playbackActiveRef.current) return
    markGesture()
    // Pointer on the hero counts as in-view even if IO hasn't caught up yet.
    inViewRef.current = true
    resumeOnHoverRef.current = false
    if (wantSoundRef.current) forceVolumeFadeRef.current = true
    void tryPlay()
  }, [markGesture, tryPlay, userPaused])

  const goTo = useCallback(
    (index: number) => {
      if (!canNavigate || switchLockRef.current) return
      const next = ((index % total) + total) % total
      if (next === activeRef.current) return

      switchLockRef.current = true
      playGenRef.current += 1
      cancelVolumeFade()
      pauseVideo()
      setCrossfading(true)
      setProgress(0)
      setStreamIndex(0)
      fallbackStartedAtRef.current = null

      window.setTimeout(() => {
        activeRef.current = next
        setActive(next)
        setUserPaused(false)
        setCrossfading(false)
        switchLockRef.current = false
        onCardChangeEvent(next)
      }, SWITCH_MS)
    },
    [canNavigate, cancelVolumeFade, onCardChangeEvent, pauseVideo, total],
  )

  const goPrev = useCallback(() => {
    goTo(activeRef.current - 1)
  }, [goTo])

  const goNext = useCallback(() => {
    goTo(activeRef.current + 1)
  }, [goTo])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReducedMotion(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    if (!activeCard) {
      setStreamUrls([])
      setStreamIndex(0)
      return
    }

    const derived = getFeedPreviewSources({
      video_id: activeCard.id,
      video_url: activeCard.storagePath || activeCard.videoUrl || undefined,
      profiles: activeCard.profiles,
      original_profile: activeCard.originalProfile,
    })
    // Prefer low-bitrate ladder first; keep mapped videoUrl as a late fallback only.
    const urls = [...new Set([...derived, activeCard.videoUrl].filter(Boolean))]
    setStreamUrls(urls)
    setStreamIndex(0)
    setProgress(0)
    fallbackStartedAtRef.current = null
  }, [activeCard])

  // Drive progress from the active video; advance only when the clip finishes.
  useEffect(() => {
    if (reducedMotion || userPaused) return

    const id = window.setInterval(() => {
      const el = videoRef.current
      if (!el || el.paused) return

      const duration = el.duration
      if (Number.isFinite(duration) && duration > 0) {
        fallbackStartedAtRef.current = null
        setProgress(Math.min(100, (el.currentTime / duration) * 100))
        return
      }

      // Unknown duration — slow fallback so we don't spin cards every few seconds.
      if (fallbackStartedAtRef.current == null) {
        fallbackStartedAtRef.current = performance.now()
      }
      const elapsed = performance.now() - fallbackStartedAtRef.current
      setProgress(Math.min(100, (elapsed / UNKNOWN_DURATION_FALLBACK_MS) * 100))
      if (elapsed >= UNKNOWN_DURATION_FALLBACK_MS) {
        fallbackStartedAtRef.current = null
        goNext()
      }
    }, 100)

    return () => window.clearInterval(id)
  }, [activeCard?.id, goNext, reducedMotion, userPaused])

  /** Open watch page continuing from the hero's current playback position. */
  const openWatchFromHero = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      markGesture()
      const base = activeCard?.href
      if (!base) return
      const standalone = standaloneWatchHref(base)
      const href = hrefWithStartTime(standalone, videoRef.current?.currentTime ?? 0)
      e.preventDefault()
      router.push(href)
    },
    [activeCard?.href, markGesture, router],
  )

  const togglePlay = useCallback(() => {
    markGesture()
    const el = videoRef.current
    if (!el || !activeStreamUrl) return

    if (!el.paused) {
      el.pause()
      setIsPlaying(false)
      setUserPaused(true)
      return
    }

    setUserPaused(false)
    void tryPlay()
  }, [activeStreamUrl, markGesture, tryPlay])

  const toggleMute = useCallback(() => {
    markGesture()
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    wantSoundRef.current = !nextMuted
    setPreviewAudioPreferred(!nextMuted)
    const el = videoRef.current
    if (!el) return

    if (nextMuted) {
      applyAudio(el, true)
      return
    }

    // Unmute: set intent immediately; useLayoutEffect re-syncs after React commits
    // muted={false} so we don't lose to the controlled prop race.
    forceVolumeFadeRef.current = true
    applyAudio(el, false)
    el.muted = false
    el.defaultMuted = false
    // Snap audible if a prior cancelled fade left volume near 0.
    if (el.volume < 0.05) el.volume = PREVIEW_VOLUME
    requestAnimationFrame(() => {
      const node = videoRef.current
      if (!node || wantSoundRef.current === false) return
      node.muted = false
      node.defaultMuted = false
      if (node.volume < 0.05) node.volume = PREVIEW_VOLUME
    })
    if (el.paused && !userPaused) void tryPlay()
  }, [applyAudio, isMuted, markGesture, tryPlay, userPaused])

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        goPrev()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        goNext()
      } else if (e.key === " " || e.key === "k") {
        e.preventDefault()
        togglePlay()
      } else if (e.key === "m") {
        e.preventDefault()
        toggleMute()
      }
    },
    [goNext, goPrev, toggleMute, togglePlay],
  )

  const handleVideoError = useCallback(() => {
    setStreamIndex((i) => {
      if (i + 1 < streamUrls.length) return i + 1
      return i
    })
    setIsPlaying(false)
  }, [streamUrls.length])

  const handleEnded = useCallback(() => {
    if (userPaused || reducedMotion || !inViewRef.current || !playbackActiveRef.current) {
      return
    }
    setProgress(100)
    goNext()
  }, [goNext, reducedMotion, userPaused])

  const handleSaveClick = useCallback(() => {
    markGesture()
    if (!user) {
      setSaveAuthOpen(true)
      return
    }
    setSaveOpen(true)
  }, [markGesture, user])

  const shareUrl =
    typeof window !== "undefined" && activeCard
      ? `${window.location.origin}${standaloneWatchHref(activeCard.href)}`
      : activeCard
        ? standaloneWatchHref(activeCard.href)
        : ""

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const filmstripScrollRef = useRef<HTMLDivElement | null>(null)

  const onTouchStart = useCallback((e: TouchEvent) => {
    const t = e.changedTouches[0]
    if (!t) return
    touchStartX.current = t.clientX
    touchStartY.current = t.clientY
  }, [])

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      const startX = touchStartX.current
      const startY = touchStartY.current
      touchStartX.current = null
      touchStartY.current = null
      if (startX == null || startY == null || !canNavigate) return
      const t = e.changedTouches[0]
      if (!t) return
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return
      if (dx < 0) goNext()
      else goPrev()
    },
    [canNavigate, goNext, goPrev],
  )

  // Keep the active filmstrip thumb centered whenever the slide changes
  // (thumb tap or desktop center arrows).
  useEffect(() => {
    const scroller = filmstripScrollRef.current
    if (!scroller || total <= 1) return

    let cancelled = false
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (cancelled) return
        const thumbs = scroller.querySelectorAll<HTMLElement>('[role="tab"]')
        const thumb = thumbs[active]
        if (!thumb) return

        const scrollerRect = scroller.getBoundingClientRect()
        const thumbRect = thumb.getBoundingClientRect()
        const thumbCenter =
          thumbRect.left - scrollerRect.left + scroller.scrollLeft + thumbRect.width / 2
        const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
        if (maxScroll <= 0) return

        const target = Math.max(
          0,
          Math.min(thumbCenter - scroller.clientWidth / 2, maxScroll),
        )
        scroller.scrollTo({
          left: target,
          behavior: reducedMotion ? "auto" : "smooth",
        })
      })
    })

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
    }
  }, [active, reducedMotion, total])

  if (total === 0 || !activeCard) return null

  const creatorUser: Record<string, string> = {
    username: activeCard.handle,
    name: activeCard.artistName,
  }
  // Only set profile_picture when we have a real path — an empty string forces
  // ProfilePicture into letter-fallback mode (userHasProfilePhoto treats "" as no photo).
  if (activeCard.profilePicture) {
    creatorUser.profile_picture = activeCard.profilePicture
  }
  if (activeCard.userUpdatedAt) {
    creatorUser.updated_at = activeCard.userUpdatedAt
  }

  /** Shared 40×40 glass control — desktop action row + nav arrows. */
  const glassBtn =
    "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white shadow-sm backdrop-blur-md transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"

  /** In-player filmstrip — mobile gets side chevrons; desktop uses center hero arrows. */
  const filmstrip = canNavigate ? (
    <div className="flex shrink-0 items-center gap-1 self-end md:gap-0" role="presentation">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setProgress(0)
          goPrev()
        }}
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white backdrop-blur-md transition hover:bg-black/70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
          "md:hidden",
        )}
        aria-label="Previous featured video"
        data-analytics-name="home-hero-filmstrip-prev"
      >
        <ChevronLeft className="size-3.5" aria-hidden />
      </button>

      <div
        ref={filmstripScrollRef}
        className={cn(
          "relative scrollbar-none flex gap-1.5 overflow-x-auto overscroll-x-contain scroll-smooth pb-0.5 md:gap-2",
          // ~2.5 thumbs on mobile, ~3 on desktop
          "max-w-[9.5rem] sm:max-w-[11rem] md:max-w-[15.5rem] lg:max-w-[18.5rem] xl:max-w-[19.5rem]",
          "[mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)]",
          "[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)]",
        )}
        role="tablist"
        aria-label="Up next featured videos"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onWheel={(e) => {
          if (
            Math.abs(e.deltaX) < Math.abs(e.deltaY) &&
            e.currentTarget.scrollWidth > e.currentTarget.clientWidth
          ) {
            e.currentTarget.scrollLeft += e.deltaY
            e.preventDefault()
          }
        }}
      >
        {cards.map((card, index) => {
          const isCurrent = index === active
          return (
            <button
              key={card.id}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              aria-label={`Show ${card.title}`}
              onClick={() => {
                setProgress(0)
                goTo(index)
              }}
              className={cn(
                "relative isolate aspect-[16/10] shrink-0 overflow-hidden rounded-[5px] ring-1 transition md:rounded-[6px]",
                "w-[3.35rem] sm:w-[3.75rem] md:w-[4.75rem] lg:w-[5.5rem] xl:w-[5.75rem]",
                isCurrent ? "ring-2 ring-white" : "ring-white/30 opacity-80 hover:opacity-100",
              )}
            >
              {card.thumbnail ? (
                <AuthenticatedImage
                  src={card.thumbnail}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 92px, (min-width: 1024px) 88px, 60px"
                  authenticated
                />
              ) : (
                <VideoThumbnailPlaceholder fill />
              )}
              {isCurrent ? (
                <span
                  className="absolute inset-x-0.5 bottom-0.5 h-0.5 overflow-hidden rounded-full bg-white/25 md:inset-x-1 md:bottom-1"
                  aria-hidden
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-[#E8192C]"
                    style={{ width: `${progress}%` }}
                  />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setProgress(0)
          goNext()
        }}
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white backdrop-blur-md transition hover:bg-black/70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
          "md:hidden",
        )}
        aria-label="Next featured video"
        data-analytics-name="home-hero-filmstrip-next"
      >
        <ChevronRight className="size-3.5" aria-hidden />
      </button>
    </div>
  ) : null

  return (
    <div className={cn("w-full", className)}>
    {/* Outer shell owns ring/shadow; inner stage owns overflow clip — avoids corner flicker
        from box-shadow + transformed/video layers sharing one compositing surface. */}
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl bg-zinc-950 sm:rounded-2xl",
        "ring-1 ring-black/10 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.55)]",
      )}
    >
    <section
      ref={sectionRef}
      className={cn(
        "group/hero relative w-full overflow-hidden rounded-[inherit] outline-none isolate [contain:paint]",
        // Fixed stage height — overlays sit on top, so mobile never grows from content
        "aspect-[16/9] max-h-[232px] sm:max-h-[248px] md:aspect-[21/9] md:max-h-[min(46svh,460px)]",
      )}
      aria-roledescription="carousel"
      aria-label="Featured artist videos"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerEnter={resumeFromHover}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Media clip: paint containment + round clip-path so video never bleeds past corners. */}
      <div
        className={cn(
          "absolute inset-0 overflow-hidden rounded-[inherit] isolate",
          "[transform:translateZ(0)] [backface-visibility:hidden]",
          "[clip-path:inset(0_round_0.75rem)] sm:[clip-path:inset(0_round_1rem)]",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 origin-center",
            // Never Ken-Burns a live <video> — that is the main rounded-corner flicker source.
            // Poster-only zoom stays subtle and starts already slightly inset.
            !reducedMotion && !activeStreamUrl && "animate-hero-ken-burns",
            crossfading && "opacity-70",
          )}
        >
          {activeCard.thumbnail ? (
            <AuthenticatedImage
              src={activeCard.thumbnail}
              alt=""
              fill
              className="object-cover object-[center_30%] md:object-center"
              sizes="100vw"
              priority
              authenticated={false}
            />
          ) : (
            <VideoThumbnailPlaceholder fill />
          )}

          {activeStreamUrl ? (
            <video
              key={`${activeCard.id}-${streamIndex}`}
              ref={videoRef}
              // scale-[1.02] keeps decoded frames inside the clip so rounded edges stay clean
              className="absolute inset-0 size-full scale-[1.02] object-cover object-[center_30%] md:object-center"
              src={activeStreamUrl}
              playsInline
              // Controlled muted — useLayoutEffect re-applies volume after commit so unmute
              // isn't left silent (React muted race + cancelled 0→fade).
              muted={isMuted || !playbackActive}
              autoPlay
              // Low-bitrate hero ladder (≤480p) keeps preload=auto cheap on remote Workers.
              preload="auto"
              onLoadedData={() => {
                if (!userPaused) void tryPlay()
              }}
              onCanPlay={() => {
                if (!userPaused && videoRef.current?.paused) void tryPlay()
              }}
              onPlaying={() => setIsPlaying(true)}
              onPause={() => {
                if (userPaused) setIsPlaying(false)
              }}
              onEnded={handleEnded}
              onError={handleVideoError}
              onClick={() => {
                markGesture()
                toggleMute()
              }}
              aria-label={`${activeCard.title} by ${activeCard.artistName}`}
            />
          ) : null}
        </div>
      </div>

      {/* Left veil — width tracks the title column so the right of the clip stays open */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-black via-black/75 to-transparent md:w-[68%] md:via-black/70"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[32%] bg-gradient-to-b from-black/35 to-transparent md:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black/85 via-black/35 to-transparent md:h-[40%]"
        aria-hidden
      />

      {/* Top-right actions — mute + share on mobile; desktop also includes save */}
      <div className="absolute right-2.5 top-2.5 z-30 flex items-center gap-1.5 md:right-5 md:top-5 md:gap-3">
        <button
          type="button"
          onClick={toggleMute}
          className={cn(glassBtn, "size-8 md:size-10")}
          aria-label={isMuted ? "Unmute video" : "Mute video"}
          data-analytics-name={isMuted ? "home-hero-unmute" : "home-hero-mute"}
        >
          {isMuted ? (
            <VolumeX className="size-3.5 md:size-4" aria-hidden />
          ) : (
            <Volume2 className="size-3.5 md:size-4" aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={handleSaveClick}
          onPointerEnter={prefetchMyPlaylists}
          className={cn(glassBtn, "hidden size-8 md:inline-flex md:size-10")}
          aria-label="Save to playlist"
          data-analytics-name="home-hero-save"
        >
          <Bookmark className="size-3.5 md:size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => {
            markGesture()
            setShareOpen(true)
          }}
          className={cn(glassBtn, "size-8 md:size-10")}
          aria-label="Share video"
          data-analytics-name="home-hero-share"
        >
          <Share2 className="size-3.5 md:size-4" aria-hidden />
        </button>
      </div>

      {/* Bottom: left copy + Watch · desktop filmstrip (mobile filmstrip is below the stage) */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-2 px-3 pb-3 pt-10",
          "md:gap-4 md:px-4 md:pb-6 md:pl-[5.5rem] md:pt-8 lg:pb-7 lg:pl-24 lg:pr-6",
          crossfading && "opacity-80",
        )}
      >
        <div className="min-w-0 max-w-[min(48%,12.5rem)] flex-1 sm:max-w-[min(48%,14rem)] md:max-w-[min(48%,26rem)] lg:max-w-[38%]">
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5B9DFF] md:block md:text-[11px]">
            Featured
          </p>

          <Link
            href={standaloneWatchHref(activeCard.href)}
            data-analytics-name={openVideoUiName}
            className="group block focus-visible:outline-none md:mt-2"
            onClick={openWatchFromHero}
          >
            <h2
              className={cn(
                "line-clamp-3 text-[0.875rem] font-semibold leading-snug tracking-normal text-white drop-shadow-md transition group-hover:text-white/90",
                "md:font-[family-name:var(--font-bebas)] md:text-[2.15rem] md:font-normal md:leading-[1.05] md:tracking-wide lg:text-[2.45rem]",
              )}
              title={activeCard.title}
            >
              {activeCard.title}
            </h2>
          </Link>

          <div className="mt-1 flex min-w-0 items-center gap-1.5 md:mt-3 md:gap-2.5">
            {activeCard.handle ? (
              <Link
                href={`/profile/${encodeURIComponent(activeCard.handle)}`}
                className="shrink-0 rounded-full ring-1 ring-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                onClick={markGesture}
                aria-label={`${activeCard.artistName} profile`}
              >
                <ProfilePicture
                  user={creatorUser}
                  size="sm"
                  className="!h-6 !w-6 md:!h-10 md:!w-10"
                />
              </Link>
            ) : (
              <ProfilePicture
                user={creatorUser}
                size="sm"
                className="!h-6 !w-6 md:!h-10 md:!w-10"
              />
            )}
            <div className="min-w-0">
              {activeCard.handle ? (
                <Link
                  href={`/profile/${encodeURIComponent(activeCard.handle)}`}
                  className="block truncate text-xs font-medium text-white/90 hover:underline md:text-sm md:font-semibold"
                  onClick={markGesture}
                >
                  @{activeCard.handle}
                </Link>
              ) : (
                <span className="block truncate text-xs font-medium text-white/90 md:text-sm md:font-semibold">
                  {activeCard.artistName}
                </span>
              )}
              {activeCard.viewCountLabel ? (
                <p className="mt-0.5 hidden text-xs text-white/55 md:block">
                  {activeCard.viewCountLabel}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 md:mt-4">
            <Link
              href={standaloneWatchHref(activeCard.href)}
              data-analytics-name={openVideoUiName}
              onClick={openWatchFromHero}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-semibold leading-none text-primary-foreground shadow-sm transition hover:bg-primary/90 md:h-10 md:rounded-lg md:px-5 md:text-sm"
            >
              <Play className="size-3 fill-current md:size-3.5" aria-hidden />
              Watch
              <span className="hidden md:inline"> Now</span>
            </Link>
            <button
              type="button"
              onClick={handleSaveClick}
              onPointerEnter={prefetchMyPlaylists}
              className={cn(glassBtn, "size-8 md:hidden")}
              aria-label="Save to playlist"
              data-analytics-name="home-hero-save"
            >
              <Bookmark className="size-3.5" aria-hidden />
            </button>
          </div>
        </div>

        {filmstrip}
      </div>

      {canNavigate ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            className={cn(
              glassBtn,
              "absolute left-4 top-1/2 z-30 hidden -translate-y-1/2 md:inline-flex",
              "opacity-90 md:opacity-0 md:group-hover/hero:opacity-100",
            )}
            aria-label="Previous featured video"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={goNext}
            className={cn(
              glassBtn,
              "absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 md:inline-flex",
              "opacity-90 md:opacity-0 md:group-hover/hero:opacity-100",
            )}
            aria-label="Next featured video"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </>
      ) : null}

      <ShareVideoDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={shareUrl}
        title={activeCard.title}
      />
      <AddToPlaylistDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        videoId={activeCard.id}
        videoTitle={activeCard.title}
        artistName={activeCard.handle ? `@${activeCard.handle}` : activeCard.artistName}
        thumbnailUrl={activeCard.thumbnail || undefined}
      />
      <AuthDialog
        open={saveAuthOpen}
        onOpenChange={setSaveAuthOpen}
        title={AUTH_DIALOG_COPY.playlist.title}
        description={AUTH_DIALOG_COPY.playlist.description}
      />
    </section>
    </div>
    </div>
  )
}
