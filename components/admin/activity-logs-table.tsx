"use client"

import { useEffect, useMemo, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { Loader2, RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

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
  const [videoMetaById, setVideoMetaById] = useState<Record<string, VideoMeta>>({})

  const fetchEvents = async (isRefresh = false) => {
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
  }

  useEffect(() => {
    fetchEvents()
  }, [hours, limit, offset])

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

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return events
    return events.filter((item) => {
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
  }, [events, query])

  const canGoPrev = offset > 0
  const canGoNext = events.length === limit

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
          Showing <span className="font-medium text-foreground">{filteredEvents.length}</span> events (fetched{" "}
          <span className="font-medium text-foreground">{count}</span>) for last{" "}
          <span className="font-medium text-foreground">{hours}</span> hours
        </div>
      </div>

      <div className="rounded-lg border bg-background shadow-sm">
        <div className="hidden md:block overflow-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="sticky top-0 z-10 bg-muted/50">
              <tr className="border-b">
                <th className="h-11 px-3 text-left text-sm font-semibold">User</th>
                <th className="h-11 px-3 text-left text-sm font-semibold">IP</th>
                <th className="h-11 px-3 text-left text-sm font-semibold">Activity</th>
                <th className="h-11 px-3 text-left text-sm font-semibold">Data</th>
                <th className="h-11 px-3 text-left text-sm font-semibold">Activity Date</th>
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
                        <div className="font-medium">{item.distinct_id || "Anonymous"}</div>
                        <div className="mt-1 text-xs text-muted-foreground">Session: {item.session_id || "N/A"}</div>
                      </td>
                      <td className="px-3 py-3 align-top text-sm">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {ipAddress}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top text-sm">
                        <div className="font-medium">{human.title}</div>
                        {!hideWatchPath && (
                          <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{human.detail}</div>
                        )}
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
                            <div className="text-muted-foreground">
                              by @{videoMeta?.creator || "unknown"}
                            </div>
                          </Link>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top text-sm">
                        {!hideWatchPath && (
                          <div className="text-xs text-muted-foreground line-clamp-1">Path: {pathText}</div>
                        )}
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="rounded bg-muted px-2 py-0.5 text-xs">{item.event}</span>
                          {uiName && <span className="rounded bg-muted px-2 py-0.5 text-xs">{uiName}</span>}
                          <span className="rounded bg-muted px-2 py-0.5 text-xs">{item.device_type || "unknown-device"}</span>
                          <span className="rounded bg-muted px-2 py-0.5 text-xs">{item.platform || "web"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top text-sm">
                        <div className="font-medium">{format(new Date(item.timestamp), "MMM d, yyyy")}</div>
                        <div className="text-muted-foreground">{format(new Date(item.timestamp), "h:mm:ss a")}</div>
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

      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Offset <span className="font-medium text-foreground">{offset}</span> to{" "}
          <span className="font-medium text-foreground">{offset + events.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!canGoPrev} onClick={() => setOffset(Math.max(0, offset - limit))}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={!canGoNext} onClick={() => setOffset(offset + limit)}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
