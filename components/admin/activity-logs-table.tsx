"use client"

import { useEffect, useMemo, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { Loader2, RefreshCw, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type AnalyticsEvent = {
  timestamp: string
  event: string
  distinct_id?: string
  session_id?: string
  platform?: string
  url?: string
  path?: string
  properties?: Record<string, any>
  device_type?: string
}

type VideoMeta = {
  title: string
  creator: string
}

const HOUR_OPTIONS = [1, 6, 12, 24, 48, 72, 168]
const LIMIT_OPTIONS = [25, 50, 100, 200]

/** Activity type presets for admin filtering (beyond raw event names). */
type ActivityLogFilter =
  | "all"
  | "conversions"
  | "play"
  | "next"
  | "like"
  | "unlike"
  | "signup"
  | "pageview"
  | "share"
  | "follow"
  | "playlist"
  | "comment"
  | "login"
  | "search"
  | "upload"
  | "player"

const PLAYER_UI_NAMES = new Set([
  "backward",
  "fast-forward",
  "next",
  "played_video",
  "paused_video",
  "played-video",
  "unmuted-video",
  "muted_video",
  "unmuted_video",
  "entered_fullscreen",
  "exited_fullscreen",
  "opened-quality-settings",
])

function toTitleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
}

function normalizeUiAction(
  uiName?: string,
  elementText?: string,
  elementTag?: string,
  elementChain?: string,
  targetPath?: string,
): string {
  const raw = String(uiName || "").trim().toLowerCase()
  const text = String(elementText || "").trim().toLowerCase()
  const tag = String(elementTag || "").trim().toLowerCase()
  const chain = String(elementChain || "").trim().toLowerCase()
  const path = String(targetPath || "").trim()

  if (raw === "liked" || raw === "like" || text === "like") return "Liked video"
  if (raw === "disliked" || raw === "dislike" || text === "dislike") return "Disliked video"
  if (raw === "shared-video" || raw === "share" || text === "share") return "Shared video"
  if (raw.includes("copy") || text === "copy") return "Copied share link"
  if (raw.includes("comment")) return "Comment interaction"
  if (raw.includes("playlist")) return "Playlist interaction"
  if (raw.includes("follow")) return "Follow interaction"
  if (raw) return toTitleCase(raw)
  if (text) return toTitleCase(text)

  // Heuristic interaction labels from DOM chain when ui_name is missing.
  if (path.startsWith("/watch/")) {
    if (chain.includes("button")) return "Watch page action"
    if (chain.includes("a.")) return "Opened link on watch page"
  }

  const tagLabel = tag ? `Clicked ${tag}` : "Clicked"
  if (path.startsWith("/watch/")) return `${tagLabel} on watch page`
  if (path.startsWith("/profile/")) return `${tagLabel} on profile page`
  if (path.startsWith("/search")) return `${tagLabel} on search page`
  if (path.startsWith("/playlists")) return `${tagLabel} in playlists`
  if (path.startsWith("/upload")) return `${tagLabel} on upload page`
  if (path) return `${tagLabel} on ${path}`
  return tagLabel
}

function describeEvent(item: AnalyticsEvent): { title: string; detail: string } {
  const eventName = item.event || "unknown_event"
  const titleFromPage = String(item.properties?.title || "").trim()
  const targetPath = item.path || safePathFromUrl(item.url)
  const uiName = String((item as any).element_ui_name || item.properties?.element_ui_name || "").trim()
  const elementText = String((item as any).element_text || item.properties?.element_text || "").trim()
  const elementTag = String((item as any).element_tag || item.properties?.element_tag || "").trim()
  const elementChain = String((item as any).element_chain || item.properties?.element_chain || "").trim()

  if (eventName === "conversion_play_started") {
    return {
      title: "Started playback",
      detail: targetPath || "Playback started",
    }
  }

  if (eventName === "opened-video") {
    return {
      title: "Opened video (play intent)",
      detail: targetPath || "Video opened from feed",
    }
  }

  if (eventName === "conversion_next_clicked") {
    return {
      title: "Played next video",
      detail: targetPath || "Next video clicked",
    }
  }

  if (eventName === "conversion_like_success") {
    return {
      title: "Liked video",
      detail: targetPath || "Video liked successfully",
    }
  }

  if (eventName === "conversion_unlike_success") {
    return {
      title: "Unliked video",
      detail: targetPath || "Video unliked successfully",
    }
  }

  if (eventName === "conversion_dislike_success") {
    return {
      title: "Disliked video",
      detail: targetPath || "Video disliked successfully",
    }
  }

  if (eventName === "conversion_signup_completed") {
    return {
      title: "Completed signup",
      detail: targetPath || "Signup completed",
    }
  }

  if (eventName === "$pageview") {
    return {
      title: "Viewed page",
      detail: titleFromPage || targetPath || "Page view",
    }
  }

  if (eventName === "$click") {
    return {
      title: normalizeUiAction(uiName, elementText, elementTag, elementChain, targetPath),
      detail: targetPath || "Click interaction",
    }
  }

  const clean = eventName.replace(/^\$/, "")
  return {
    title: toTitleCase(clean),
    detail: targetPath || titleFromPage || "User activity event",
  }
}

function matchesActivityLogFilter(item: AnalyticsEvent, filter: ActivityLogFilter): boolean {
  if (filter === "all") return true

  const eventName = String(item.event || "").toLowerCase()
  const uiRaw = String((item as any).element_ui_name || item.properties?.element_ui_name || "")
  const uiName = uiRaw.toLowerCase()

  if (filter === "conversions") {
    return eventName.startsWith("conversion_")
  }

  if (filter === "pageview") {
    return eventName === "$pageview"
  }

  if (filter === "share") {
    return uiName === "shared-video"
  }

  if (filter === "follow") {
    return uiName === "followed_creator" || uiName === "unfollowed_creator"
  }

  if (filter === "playlist") {
    return uiName === "added-to-playlist" || uiName.includes("opened-video-from-playlist")
  }

  if (filter === "comment") {
    return uiName === "opened-comments"
  }

  if (filter === "login") {
    return (
      uiName.includes("login-") ||
      uiName.includes("navbar-login") ||
      uiName === "login-submit-button" ||
      (eventName === "$click" && uiName.endsWith("login-button") && !uiName.includes("signup"))
    )
  }

  if (filter === "search") {
    return uiName.startsWith("search-overlay") || (eventName === "$click" && uiName.includes("search-overlay"))
  }

  if (filter === "upload") {
    return (
      uiName.includes("upload-") ||
      uiName.includes("creator-studio") ||
      uiName.includes("creator-become") ||
      uiName.includes("navbar-open-hiffi-studio") ||
      uiName.includes("navbar-open-become-creator") ||
      uiName.includes("navbar-user-menu-hiffi-studio") ||
      uiName.includes("navbar-user-menu-become-creator")
    )
  }

  if (filter === "player") {
    return eventName === "$click" && (PLAYER_UI_NAMES.has(uiName) || uiName.startsWith("opened-quality"))
  }

  if (filter === "play") {
    return (
      eventName === "conversion_play_started" ||
      eventName === "opened-video" ||
      uiName === "played_video" ||
      uiName === "played-video"
    )
  }

  if (filter === "next") {
    return (
      eventName === "conversion_next_clicked" ||
      uiName === "fast-forward" ||
      uiName === "next"
    )
  }

  if (filter === "like") {
    return (
      eventName === "conversion_like_success" ||
      uiName === "liked" ||
      uiName === "like"
    )
  }

  if (filter === "unlike") {
    return eventName === "conversion_unlike_success" || uiName === "unliked"
  }

  if (filter === "signup") {
    return eventName === "conversion_signup_completed" || uiName.includes("signup")
  }

  return true
}

/** Page numbers for navigation with ellipses (1 … 4 5 6 … 20). */
function getVisiblePageNumbers(current: number, total: number, maxButtons = 7): Array<number | "gap"> {
  if (total <= maxButtons) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages: Array<number | "gap"> = []
  const half = Math.floor(maxButtons / 2)
  let start = Math.max(1, current - half)
  let end = Math.min(total, start + maxButtons - 1)
  start = Math.max(1, end - maxButtons + 1)

  if (start > 1) {
    pages.push(1)
    if (start > 2) pages.push("gap")
  }
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < total) {
    if (end < total - 1) pages.push("gap")
    pages.push(total)
  }
  return pages
}

function safePathFromUrl(url?: string): string {
  if (!url) return ""
  try {
    return new URL(url).pathname
  } catch {
    return ""
  }
}

function getVideoIdFromEvent(item: AnalyticsEvent): string | null {
  const fromProps = String(item.properties?.video_id || item.properties?.videoId || "").trim()
  if (fromProps) return fromProps

  const path = item.path || safePathFromUrl(item.url)
  if (!path) return null
  const match = path.match(/\/watch\/([^/?#]+)/)
  return match?.[1] || null
}

function isAdminLoginEvent(item: AnalyticsEvent): boolean {
  const eventName = String(item.event || "").toLowerCase()
  const path = (item.path || safePathFromUrl(item.url) || "").toLowerCase()
  const sourcePath = String(item.properties?.source_path || "").toLowerCase()

  const isAdminEntryPage = path === "/admin" || path.startsWith("/admin?")
  const isAuthLikeEvent = eventName.includes("login") || eventName.includes("auth")
  const cameFromAdmin = sourcePath.startsWith("/admin")

  // Hide all admin-surface noise from activity report.
  if (path.startsWith("/admin") || sourcePath.startsWith("/admin")) return true
  if (isAdminEntryPage) return true
  if (isAuthLikeEvent && (path.startsWith("/admin") || cameFromAdmin)) return true
  return false
}

function isLowSignalAutocaptureClick(item: AnalyticsEvent): boolean {
  const eventName = String(item.event || "").toLowerCase()
  if (eventName !== "$click") return false

  const uiName = String((item as any).element_ui_name || item.properties?.element_ui_name || "").trim()
  const elementText = String((item as any).element_text || item.properties?.element_text || "").trim()
  const elementTag = String((item as any).element_tag || item.properties?.element_tag || "").toLowerCase().trim()
  const elementChain = String((item as any).element_chain || item.properties?.element_chain || "").toLowerCase().trim()
  const targetPath = item.path || safePathFromUrl(item.url)

  if (uiName || elementText) return false

  // Keep button/link clicks if chain indicates a likely actionable element.
  if (elementTag === "button" || elementTag === "a") return false
  if (elementChain.includes("button") || elementChain.includes("> a")) return false

  // Noise clicks from wrapper div/span are not actionable in logs.
  if (elementTag === "div" || elementTag === "span") return true

  // On watch pages, unknown unlabeled clicks are usually bubbling noise.
  if (targetPath.startsWith("/watch/")) return true

  return false
}

export function AdminActivityLogsTable() {
  const { toast } = useToast()
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hours, setHours] = useState(24)
  const [limit, setLimit] = useState(100)
  const [offset, setOffset] = useState(0)
  const [count, setCount] = useState(0)
  const [query, setQuery] = useState("")
  const [activityFilter, setActivityFilter] = useState<ActivityLogFilter>("all")
  const [videoMetaById, setVideoMetaById] = useState<Record<string, VideoMeta>>({})
  const [pageJump, setPageJump] = useState("")

  const fetchEvents = async (isRefresh = false) => {
    let refreshSucceeded = false
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      const response = await apiClient.adminGetAnalyticsEvents({ hours, limit, offset })
      const normalizedEvents = (response.events || [])
        .filter((item) => !isAdminLoginEvent(item))
        .filter((item) => !isLowSignalAutocaptureClick(item))
      setEvents(normalizedEvents)
      setCount(response.count || 0)
      refreshSucceeded = true
    } catch (error) {
      console.error("[admin] Failed to fetch activity logs:", error)
      toast({
        title: "Error",
        description: "Failed to fetch activity logs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
    if (isRefresh && refreshSucceeded) {
      toast({
        title: "Activity logs refreshed",
        description: "The latest events are now shown.",
      })
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [hours, limit, offset])

  useEffect(() => {
    setPageJump("")
  }, [offset, limit])

  useEffect(() => {
    const ids = Array.from(
      new Set(
        events
          .map((item) => getVideoIdFromEvent(item))
          .filter((id): id is string => Boolean(id)),
      ),
    ).filter((id) => !videoMetaById[id])

    if (ids.length === 0) return

    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        ids.map(async (videoId) => {
          try {
            const response = await apiClient.getVideo(videoId)
            const video = response.video || {}
            const title = String(video.video_title || video.videoTitle || "").trim()
            const creator = String(video.user_username || video.userUsername || "").trim()
            return [videoId, { title: title || `Video ${videoId}`, creator: creator || "Unknown creator" }] as const
          } catch {
            return [videoId, { title: `Video ${videoId}`, creator: "Unknown creator" }] as const
          }
        }),
      )

      if (cancelled) return
      setVideoMetaById((prev) => {
        const next = { ...prev }
        for (const [videoId, meta] of entries) {
          next[videoId] = meta
        }
        return next
      })
    })()

    return () => {
      cancelled = true
    }
  }, [events, videoMetaById])

  const { currentPage, totalPages, visiblePages, rangeLabel, canGoNext, canGoPrev, goToPage } = useMemo(() => {
    const limitSafe = Math.max(1, limit)
    const current = Math.floor(offset / limitSafe) + 1
    // API may return `count` as page size (or 0) instead of true total.
    // Match Users table behavior: infer "has next page" from page fullness when total unreliable.
    let totalCount = typeof count === "number" ? count : 0
    let hasReliableTotal = totalCount > 0

    if (events.length === limitSafe) {
      // Full page: if API count looks like page-size, treat as unknown total → allow next.
      if (totalCount === 0 || totalCount === limitSafe || totalCount === events.length) {
        hasReliableTotal = false
        totalCount = offset + limitSafe + 1 // sentinel: implies at least one more page
      }
    } else if (events.length < limitSafe) {
      // Partial page: this is last page.
      hasReliableTotal = true
      totalCount = offset + events.length
    }

    const total = Math.max(1, Math.ceil(Math.max(0, totalCount) / limitSafe))
    const pages = getVisiblePageNumbers(Math.min(current, total), total)
    const from = events.length === 0 ? 0 : offset + 1
    const to = offset + events.length
    const range =
      events.length === 0
        ? "No rows on this page"
        : hasReliableTotal
          ? `Rows ${from.toLocaleString()}–${to.toLocaleString()} of ${Math.max(0, totalCount).toLocaleString()}`
          : `Rows ${from.toLocaleString()}–${to.toLocaleString()} on this page`
    const next =
      hasReliableTotal ? offset + limitSafe < Math.max(0, totalCount) : events.length === limitSafe
    const prev = offset > 0

    return {
      currentPage: Math.min(current, total),
      totalPages: total,
      visiblePages: pages,
      rangeLabel: range,
      canGoNext: next,
      canGoPrev: prev,
      goToPage: (page: number) => {
        const p = Math.min(Math.max(1, page), total)
        setOffset((p - 1) * limitSafe)
      },
    }
  }, [count, offset, limit, events.length])

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase()
    return events.filter((item) => {
      if (!matchesActivityLogFilter(item, activityFilter)) return false
      if (!q) return true
      const ip = String(item.properties?._ingest_ip || "").toLowerCase()
      const title = String(item.properties?.title || "").toLowerCase()
      const composed = [
        item.event,
        item.distinct_id,
        item.session_id,
        item.path,
        item.url,
        item.device_type,
        item.platform,
        ip,
        title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return composed.includes(q)
    })
  }, [events, query, activityFilter])

  const hasClientFilter =
    query.trim() !== "" || activityFilter !== "all"
  const filteredShortfall = events.length > 0 && filteredEvents.length < events.length

  const handlePageJump = () => {
    const parsed = Number.parseInt(pageJump.replace(/\D/g, ""), 10)
    if (!Number.isFinite(parsed) || parsed < 1) {
      toast({ title: "Invalid page", description: "Enter a page number.", variant: "destructive" })
      return
    }
    goToPage(parsed)
    setPageJump(String(Math.min(parsed, totalPages)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search event, path, user id, session, IP..."
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value as ActivityLogFilter)}
              className="h-9 max-w-[min(100%,280px)] rounded-md border border-input bg-background px-3 text-sm"
              title="Filter by activity type"
              aria-label="Filter activity by type"
            >
              <option value="all">All events</option>
              <option value="conversions">All conversion_* (play, next, like, signup)</option>
              <option value="play">Play started / opened video</option>
              <option value="next">Next / skip forward</option>
              <option value="like">Like</option>
              <option value="unlike">Unlike</option>
              <option value="signup">Signup (completed + funnel clicks)</option>
              <option value="pageview">Page views</option>
              <option value="share">Share video</option>
              <option value="follow">Follow / unfollow creator</option>
              <option value="playlist">Playlist (add, open from playlist)</option>
              <option value="comment">Comments (open thread)</option>
              <option value="login">Login (navbar + form)</option>
              <option value="search">Search overlay</option>
              <option value="upload">Upload &amp; creator studio</option>
              <option value="player">Player controls (play/pause/seek/sound/fullscreen)</option>
            </select>

            <select
              value={hours}
              onChange={(e) => {
                setOffset(0)
                setHours(Number(e.target.value))
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {HOUR_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  Last {option}h
                </option>
              ))}
            </select>

            <select
              value={limit}
              onChange={(e) => {
                setOffset(0)
                setLimit(Number(e.target.value))
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {LIMIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} / page
                </option>
              ))}
            </select>

            <Button variant="outline" size="sm" onClick={() => fetchEvents(true)} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-1">Refresh</span>
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filteredEvents.length}</span> shown
          {hasClientFilter && events.length !== filteredEvents.length ? (
            <>
              {" "}
              (filtered from <span className="font-medium text-foreground">{events.length}</span> on this page)
            </>
          ) : null}
          {" · "}
          API window: <span className="font-medium text-foreground">{count.toLocaleString()}</span> events for last{" "}
          <span className="font-medium text-foreground">{hours}</span>h
        </div>
      </div>

      <div className="rounded-lg border bg-background shadow-sm">
        <div className="hidden md:block overflow-auto">
          <table className="w-full min-w-[860px] table-fixed">
            <colgroup>
              <col className="w-[19%]" />
              <col className="w-[10%]" />
              <col className="w-[33%]" />
              <col className="w-[22%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-muted/50">
              <tr className="border-b">
                <th className="h-11 px-3 text-left text-sm font-semibold">User</th>
                <th className="h-11 px-3 text-left text-sm font-semibold">IP</th>
                <th className="h-11 px-3 text-left text-sm font-semibold">Activity</th>
                <th className="h-11 px-3 text-left text-sm font-semibold">Data</th>
                <th className="sticky right-0 z-20 h-11 px-3 text-left text-sm font-semibold bg-muted/50 border-l">
                  Activity Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-28 px-3 text-center text-sm text-muted-foreground">
                    No activity logs found for current filters
                  </td>
                </tr>
              ) : (
                filteredEvents.map((item, idx) => {
                  const human = describeEvent(item)
                  const ipAddress = String(item.properties?._ingest_ip || "N/A")
                  const pathText = item.path || safePathFromUrl(item.url) || "N/A"
                  const uiName = String((item as any).element_ui_name || item.properties?.element_ui_name || "").trim()
                  const videoId = getVideoIdFromEvent(item)
                  const videoMeta = videoId ? videoMetaById[videoId] : null
                  const hideWatchPath = Boolean(videoId && pathText.startsWith("/watch/"))
                  return (
                    <tr key={`${item.session_id || "session"}-${item.timestamp}-${idx}`} className="border-b hover:bg-muted/40">
                      <td className="px-3 py-3 align-top text-sm">
                        <div
                          className="font-medium break-all"
                          title={String(item.distinct_id || "Anonymous")}
                        >
                          {item.distinct_id || "Anonymous"}
                        </div>
                        <div
                          className="mt-1 text-xs text-muted-foreground break-all"
                          title={`Session: ${String(item.session_id || "N/A")}`}
                        >
                          Session: {item.session_id || "N/A"}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top text-sm">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {ipAddress}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top text-sm min-w-0">
                        <div className="font-medium break-words" title={human.title}>
                          {human.title}
                        </div>
                        {!hideWatchPath && (
                          <div
                            className="mt-1 text-xs text-muted-foreground break-words whitespace-normal"
                            title={human.detail}
                          >
                            {human.detail}
                          </div>
                        )}
                        {videoId && (
                          <Link
                            href={`/watch/${videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 block rounded-md border border-border/70 bg-muted/30 px-2.5 py-1.5 text-xs hover:bg-primary/10 hover:border-primary/40 transition-colors"
                          >
                            <div className="font-medium text-foreground break-words" title={videoMeta?.title || `Video ${videoId}`}>
                              {videoMeta?.title || `Video ${videoId}`}
                            </div>
                            <div className="text-muted-foreground break-all" title={`by @${videoMeta?.creator || "unknown"}`}>
                              by @{videoMeta?.creator || "unknown"}
                            </div>
                          </Link>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top text-sm min-w-0">
                        {!hideWatchPath && (
                          <div
                            className="text-xs text-muted-foreground break-all whitespace-normal"
                            title={`Path: ${pathText}`}
                          >
                            Path: {pathText}
                          </div>
                        )}
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="max-w-full rounded bg-muted px-2 py-0.5 text-xs break-all" title={item.event}>
                            {item.event}
                          </span>
                          {uiName && (
                            <span className="max-w-full rounded bg-muted px-2 py-0.5 text-xs break-all" title={uiName}>
                              {uiName}
                            </span>
                          )}
                          <span
                            className="max-w-full rounded bg-muted px-2 py-0.5 text-xs break-all"
                            title={item.device_type || "unknown-device"}
                          >
                            {item.device_type || "unknown-device"}
                          </span>
                          <span className="max-w-full rounded bg-muted px-2 py-0.5 text-xs break-all" title={item.platform || "web"}>
                            {item.platform || "web"}
                          </span>
                        </div>
                      </td>
                      <td className="sticky right-0 z-10 px-3 py-3 align-top text-sm bg-background border-l">
                        <div className="font-medium whitespace-nowrap">
                          {format(new Date(item.timestamp), "MMM d, yyyy")}
                        </div>
                        <div className="text-muted-foreground whitespace-nowrap">
                          {format(new Date(item.timestamp), "h:mm:ss a")}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y">
          {filteredEvents.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No activity logs found for current filters
            </div>
          ) : (
            filteredEvents.map((item, idx) => {
              const human = describeEvent(item)
              const ipAddress = String(item.properties?._ingest_ip || "N/A")
              const pathText = item.path || safePathFromUrl(item.url) || "N/A"
              const uiName = String((item as any).element_ui_name || item.properties?.element_ui_name || "").trim()
              const videoId = getVideoIdFromEvent(item)
              const videoMeta = videoId ? videoMetaById[videoId] : null
              const hideWatchPath = Boolean(videoId && pathText.startsWith("/watch/"))
              return (
                <div key={`${item.session_id || "session"}-${item.timestamp}-${idx}`} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-sm">{item.distinct_id || "Anonymous"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 break-all">
                        Session: {item.session_id || "N/A"}
                      </div>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {ipAddress}
                    </span>
                  </div>

                  <div>
                    <div className="font-medium text-sm">{human.title}</div>
                    {!hideWatchPath && <div className="text-xs text-muted-foreground mt-1">{human.detail}</div>}
                    {videoId && (
                      <Link
                        href={`/watch/${videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block rounded-md border border-border/70 bg-muted/30 px-2.5 py-1.5 text-xs hover:bg-primary/10 hover:border-primary/40 transition-colors"
                      >
                        <div className="font-medium text-foreground">
                          {videoMeta?.title || `Video ${videoId}`}
                        </div>
                        <div className="text-muted-foreground">by @{videoMeta?.creator || "unknown"}</div>
                      </Link>
                    )}
                  </div>

                  <div className="space-y-1">
                    {!hideWatchPath && <div className="text-xs text-muted-foreground break-all">Path: {pathText}</div>}
                    <div className="flex flex-wrap gap-1">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">{item.event}</span>
                      {uiName && <span className="rounded bg-muted px-2 py-0.5 text-xs">{uiName}</span>}
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">{item.device_type || "unknown-device"}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">{item.platform || "web"}</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <div className="font-medium text-foreground">{format(new Date(item.timestamp), "MMM d, yyyy")}</div>
                    <div>{format(new Date(item.timestamp), "h:mm:ss a")}</div>
                    <div className="mt-0.5">{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t pt-4">
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <span className="font-medium text-foreground">
              Page {currentPage.toLocaleString()} of {totalPages.toLocaleString()}
            </span>
            <span className="mx-2 text-border">·</span>
            {rangeLabel}
          </div>
          {filteredShortfall && (
            <div className="text-xs text-amber-700 dark:text-amber-400">
              Search or activity filter is hiding {(events.length - filteredEvents.length).toLocaleString()} row(s) on
              this page only.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-2"
              disabled={!canGoPrev}
              onClick={() => goToPage(1)}
              title="First page"
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-2"
              disabled={!canGoPrev}
              onClick={() => goToPage(currentPage - 1)}
              title="Previous page"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="mx-1 flex flex-wrap items-center justify-center gap-1">
              {visiblePages.map((item, idx) =>
                item === "gap" ? (
                  <span key={`gap-${idx}`} className="px-1 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    type="button"
                    key={item}
                    variant={item === currentPage ? "default" : "outline"}
                    size="sm"
                    className={cn("h-9 min-w-9 px-2", item === currentPage && "pointer-events-none")}
                    onClick={() => goToPage(item)}
                    aria-label={`Page ${item}`}
                    aria-current={item === currentPage ? "page" : undefined}
                  >
                    {item.toLocaleString()}
                  </Button>
                ),
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-2"
              disabled={!canGoNext}
              onClick={() => goToPage(currentPage + 1)}
              title="Next page"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-2"
              disabled={!canGoNext}
              onClick={() => goToPage(totalPages)}
              title="Last page"
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">Go to</span>
              <Input
                inputMode="numeric"
                className="h-9 w-16 text-center"
                placeholder={String(currentPage)}
                value={pageJump}
                onChange={(e) => setPageJump(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePageJump()
                }}
                aria-label="Page number"
              />
              <Button type="button" variant="secondary" size="sm" className="h-9" onClick={handlePageJump}>
                Go
              </Button>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
