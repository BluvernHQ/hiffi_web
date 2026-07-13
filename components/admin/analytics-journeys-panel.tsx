"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  MapPin,
  RefreshCw,
  Route,
} from "lucide-react"
import { getSessionEvents, listSessions } from "@/lib/api/analytics-sessions"
import {
  AnalyticsApiError,
  formatGeoLabel,
  type AnalyticsEvent,
  type AnalyticsSession,
  type Platform,
  type SessionStatus,
} from "@/lib/types/analytics-sessions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 20
const EVENT_PAGE_SIZE = 100
const PLATFORM_OPTIONS: Platform[] = ["web", "ios", "android", "tv"]

type JourneyFilters = {
  uid: string
  platform: string
  status: "" | SessionStatus
  timestamp_after: string
  timestamp_before: string
}

const EMPTY_FILTERS: JourneyFilters = {
  uid: "",
  platform: "",
  status: "",
  timestamp_after: "",
  timestamp_before: "",
}

function isoToLocalDateTime(isoString: string): string {
  if (!isoString) return ""
  const date = new Date(isoString)
  if (!isValid(date)) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function localDateTimeToIso(local: string): string | undefined {
  if (!local.trim()) return undefined
  const date = new Date(local)
  if (!isValid(date)) return undefined
  return date.toISOString()
}

function formatRelativeTime(iso: string): string {
  if (!iso) return "—"
  try {
    const date = parseISO(iso)
    if (!isValid(date)) return iso
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return iso
  }
}

function formatAbsoluteTime(iso: string): string {
  if (!iso) return ""
  try {
    const date = parseISO(iso)
    if (!isValid(date)) return iso
    return format(date, "PPpp")
  } catch {
    return iso
  }
}

function tagBadgeClass(tag: string): string {
  if (tag === "$pageview") return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30"
  if (tag === "$click") return "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
  return "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30"
}

function readFiltersFromParams(searchParams: URLSearchParams): JourneyFilters {
  const statusRaw = searchParams.get("status") || ""
  const status: JourneyFilters["status"] =
    statusRaw === "active" || statusRaw === "inactive" ? statusRaw : ""
  return {
    uid: searchParams.get("uid") || "",
    platform: searchParams.get("platform") || "",
    status,
    timestamp_after: searchParams.get("timestamp_after") || "",
    timestamp_before: searchParams.get("timestamp_before") || "",
  }
}

function readOffsetFromParams(searchParams: URLSearchParams): number {
  const raw = Number(searchParams.get("offset") || "0")
  if (!Number.isFinite(raw) || raw < 0) return 0
  return Math.floor(raw)
}

function EventProperties({ properties }: { properties?: Record<string, unknown> }) {
  const [open, setOpen] = useState(false)
  if (!properties || Object.keys(properties).length === 0) return null

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Properties
      </button>
      {open ? (
        <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-muted/60 p-2 text-[11px] leading-relaxed font-mono">
          {JSON.stringify(properties, null, 2)}
        </pre>
      ) : null}
    </div>
  )
}

function DomPath({ path }: { path?: string }) {
  const [open, setOpen] = useState(false)
  if (!path) return null

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        DOM path
      </button>
      {open ? (
        <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{path}</p>
      ) : (
        <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground" title={path}>
          {path}
        </p>
      )}
    </div>
  )
}

/** Events for one session only — loaded from GET /analytics/sessions/{id}/events */
function SessionEventsPanel({ session }: { session: AnalyticsSession }) {
  const { toast } = useToast()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } = useAdminNetworkError()
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [errorKind, setErrorKind] = useState<"auth" | "unavailable" | null>(null)

  const loadEvents = useCallback(
    async (nextOffset: number, append: boolean) => {
      if (guardOfflineBeforeFetch()) {
        setLoading(false)
        setLoadingMore(false)
        return
      }
      try {
        if (append) setLoadingMore(true)
        else setLoading(true)
        clearNetworkError()
        setErrorKind(null)

        const data = await getSessionEvents(session.session_id, {
          order: "asc",
          limit: EVENT_PAGE_SIZE,
          offset: nextOffset,
        })

        // Only keep events that belong to this session (API already scopes; belt-and-suspenders).
        const scoped = data.events.filter((e) => !e.session_id || e.session_id === session.session_id)
        setEvents((prev) => (append ? [...prev, ...scoped] : scoped))
        setOffset(nextOffset)
        setHasMore(data.has_more)
      } catch (error) {
        if (!append) setEvents([])
        if (error instanceof AnalyticsApiError) {
          if (error.status === 401) {
            setErrorKind("auth")
            return
          }
          if (error.status === 503) {
            setErrorKind("unavailable")
            return
          }
        }
        handleFetchError(error, {
          genericMessage: "Failed to load session events",
          onGenericError: (description) => toast({ title: "Error", description, variant: "destructive" }),
        })
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [session.session_id, guardOfflineBeforeFetch, clearNetworkError, handleFetchError, toast],
  )

  useEffect(() => {
    void loadEvents(0, false)
  }, [loadEvents])

  return (
    <div className="space-y-3 border-t bg-muted/20 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Events for this session</p>
          <p className="text-xs text-muted-foreground">
            Timeline from <span className="font-mono">{session.session_id.slice(0, 8)}…</span>
            {" · "}IP/geo stay on the session row above (not on events)
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void loadEvents(0, false)}
          disabled={loading}
          className="gap-1.5"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh events
        </Button>
      </div>

      {networkError ? (
        <AdminOfflineState message={networkError} onRetry={() => void loadEvents(0, false)} />
      ) : errorKind === "auth" ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center" role="alert">
          <p className="font-medium text-destructive">Analytics auth failed</p>
          <p className="mt-1 text-sm text-muted-foreground">Check the analytics ingest key, then retry.</p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void loadEvents(0, false)}>
            Retry
          </Button>
        </div>
      ) : errorKind === "unavailable" ? (
        <div className="rounded-lg border bg-background px-4 py-6 text-center" role="alert">
          <p className="font-medium">Analytics backend unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">ClickHouse is down. Try again shortly.</p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void loadEvents(0, false)}>
            Retry
          </Button>
        </div>
      ) : loading ? (
        <div className="flex min-h-[120px] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-background px-4 py-8 text-center text-sm text-muted-foreground">
          No events recorded for this session
        </div>
      ) : (
        <div className="relative space-y-0 pl-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border">
          {events.map((event, index) => (
            <div key={`${event.timestamp}-${event.tag}-${index}`} className="relative pb-4 pl-6">
              <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary/70" />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={event.timestamp}
                    title={formatAbsoluteTime(event.timestamp)}
                  >
                    {formatRelativeTime(event.timestamp)}
                  </time>
                  <Badge variant="outline" className={cn("font-mono text-[11px]", tagBadgeClass(event.tag))}>
                    {event.tag}
                  </Badge>
                </div>
                {event.path ? (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Path:</span>{" "}
                    <span className="font-mono text-xs break-all">{event.path}</span>
                  </p>
                ) : null}
                <DomPath path={event.dom_path} />
                <EventProperties properties={event.properties} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!networkError && !errorKind && hasMore ? (
        <div className="flex justify-center pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingMore}
            onClick={() => void loadEvents(offset + EVENT_PAGE_SIZE, true)}
          >
            {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Load more events
          </Button>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Sessions-first analytics:
 * 1) GET /analytics/sessions — visitor list with client_ip / geo
 * 2) Expand a session → GET /analytics/sessions/{id}/events for that session only
 */
export function AnalyticsJourneysPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } = useAdminNetworkError()

  const sessionIdParam = searchParams.get("sessionId") || ""
  const filters = useMemo(() => readFiltersFromParams(searchParams), [searchParams])
  const offset = useMemo(() => readOffsetFromParams(searchParams), [searchParams])

  const [draftFilters, setDraftFilters] = useState<JourneyFilters>(filters)
  const [sessions, setSessions] = useState<AnalyticsSession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [errorKind, setErrorKind] = useState<"auth" | "unavailable" | null>(null)

  useEffect(() => {
    setDraftFilters(filters)
  }, [filters])

  const updateQuery = useCallback(
    (patch: Record<string, string | null | undefined>, options?: { replace?: boolean }) => {
      const next = new URLSearchParams(searchParams.toString())
      next.set("section", "journeys")
      for (const [key, value] of Object.entries(patch)) {
        if (value == null || value === "") next.delete(key)
        else next.set(key, value)
      }
      const href = `/admin/dashboard?${next.toString()}`
      if (options?.replace) router.replace(href)
      else router.push(href)
    },
    [router, searchParams],
  )

  const applyFilters = () => {
    updateQuery({
      uid: draftFilters.uid.trim() || null,
      platform: draftFilters.platform || null,
      status: draftFilters.status || null,
      timestamp_after: localDateTimeToIso(draftFilters.timestamp_after) || null,
      timestamp_before: localDateTimeToIso(draftFilters.timestamp_before) || null,
      offset: null,
      sessionId: null,
      build_id: null,
    })
  }

  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS)
    updateQuery({
      uid: null,
      platform: null,
      status: null,
      timestamp_after: null,
      timestamp_before: null,
      offset: null,
      sessionId: null,
      build_id: null,
    })
  }

  const fetchSessions = useCallback(
    async (isRefresh = false) => {
      if (guardOfflineBeforeFetch()) {
        setSessions([])
        setHasMore(false)
        setLoading(false)
        setRefreshing(false)
        return
      }
      try {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)
        clearNetworkError()
        setErrorKind(null)

        const data = await listSessions({
          limit: PAGE_SIZE,
          offset,
          uid: filters.uid.trim() || undefined,
          platform: filters.platform || undefined,
          status: filters.status || undefined,
          timestamp_after: filters.timestamp_after || undefined,
          timestamp_before: filters.timestamp_before || undefined,
        })

        setSessions(data.sessions)
        setHasMore(data.has_more)
        if (isRefresh) {
          toast({ title: "Sessions refreshed", description: "Latest visitor sessions loaded." })
        }
      } catch (error) {
        setSessions([])
        setHasMore(false)
        if (error instanceof AnalyticsApiError) {
          if (error.status === 401) {
            setErrorKind("auth")
            return
          }
          if (error.status === 503) {
            setErrorKind("unavailable")
            return
          }
        }
        handleFetchError(error, {
          genericMessage: "Failed to load analytics sessions",
          onGenericError: (description) => toast({ title: "Error", description, variant: "destructive" }),
        })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [offset, filters, guardOfflineBeforeFetch, clearNetworkError, handleFetchError, toast],
  )

  useEffect(() => {
    void fetchSessions()
  }, [fetchSessions])

  const toggleSession = (session: AnalyticsSession) => {
    if (sessionIdParam === session.session_id) {
      updateQuery({ sessionId: null })
      return
    }
    try {
      sessionStorage.setItem(`hiffi_analytics_session:${session.session_id}`, JSON.stringify(session))
    } catch {
      // ignore
    }
    updateQuery({ sessionId: session.session_id })
  }

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((v) => Boolean(v)).length,
    [filters],
  )

  const page = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">1. Sessions</span>
        {" → "}
        <span className="font-medium text-foreground">2. Events for that session only</span>
        <span className="ml-1">· IP/geo live on the session, not on event rows.</span>
      </div>

      <div className="rounded-lg border bg-background shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Session filters</span>
            {activeFilterCount > 0 ? (
              <Badge variant="secondary" className="text-[11px]">
                {activeFilterCount} active
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters} disabled={activeFilterCount === 0}>
              Clear
            </Button>
            <Button type="button" size="sm" onClick={applyFilters}>
              Apply
            </Button>
          </div>
        </div>

        <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="journeys-uid" className="text-xs">
              User ID
            </Label>
            <Input
              id="journeys-uid"
              value={draftFilters.uid}
              onChange={(e) => setDraftFilters((f) => ({ ...f, uid: e.target.value }))}
              placeholder="Exact uid"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="journeys-platform" className="text-xs">
              Platform
            </Label>
            <select
              id="journeys-platform"
              value={draftFilters.platform}
              onChange={(e) => setDraftFilters((f) => ({ ...f, platform: e.target.value }))}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All</option>
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="journeys-status" className="text-xs">
              Status
            </Label>
            <select
              id="journeys-status"
              value={draftFilters.status}
              onChange={(e) =>
                setDraftFilters((f) => ({
                  ...f,
                  status: e.target.value as JourneyFilters["status"],
                }))
              }
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="journeys-after" className="text-xs">
              Last seen after
            </Label>
            <Input
              id="journeys-after"
              type="datetime-local"
              value={isoToLocalDateTime(draftFilters.timestamp_after)}
              onChange={(e) => setDraftFilters((f) => ({ ...f, timestamp_after: e.target.value }))}
              className="h-9"
            />
            <p className="text-[10px] text-muted-foreground">Filters last_seen_at ≥</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="journeys-before" className="text-xs">
              Started before
            </Label>
            <Input
              id="journeys-before"
              type="datetime-local"
              value={isoToLocalDateTime(draftFilters.timestamp_before)}
              onChange={(e) => setDraftFilters((f) => ({ ...f, timestamp_before: e.target.value }))}
              className="h-9"
            />
            <p className="text-[10px] text-muted-foreground">Filters started_at ≤</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Sessions · page {page}
          {hasMore ? " · more available" : ""}
          {sessionIdParam ? " · one session expanded" : " · click a row to load its events"}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void fetchSessions(true)}
          disabled={loading || refreshing}
          className="gap-1.5"
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh sessions
        </Button>
      </div>

      {networkError ? (
        <AdminOfflineState message={networkError} onRetry={() => void fetchSessions()} />
      ) : errorKind === "auth" ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-10 text-center" role="alert">
          <p className="font-medium text-destructive">Analytics auth failed</p>
          <p className="mt-1 text-sm text-muted-foreground">Check the analytics ingest key configuration, then try again.</p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void fetchSessions()}>
            Retry
          </Button>
        </div>
      ) : errorKind === "unavailable" ? (
        <div className="rounded-lg border bg-muted/40 px-4 py-10 text-center" role="alert">
          <p className="font-medium">Analytics backend unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">ClickHouse is down or temporarily unreachable. Try again shortly.</p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void fetchSessions()}>
            Retry
          </Button>
        </div>
      ) : loading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-lg border">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
          No sessions match the current filters
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-8 px-3 py-2.5 font-medium" aria-hidden />
                  <th className="px-3 py-2.5 font-medium">Visitor</th>
                  <th className="px-3 py-2.5 font-medium">Session IP</th>
                  <th className="px-3 py-2.5 font-medium">Location</th>
                  <th className="px-3 py-2.5 font-medium">Platform</th>
                  <th className="px-3 py-2.5 font-medium">Started</th>
                  <th className="px-3 py-2.5 font-medium">Last active</th>
                  <th className="px-3 py-2.5 font-medium text-right">Events</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const expanded = sessionIdParam === session.session_id
                  return (
                    <SessionRow
                      key={session.session_id}
                      session={session}
                      expanded={expanded}
                      onToggle={() => toggleSession(session)}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!networkError && !errorKind ? (
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={offset <= 0 || loading}
            onClick={() => updateQuery({ offset: String(Math.max(0, offset - PAGE_SIZE)), sessionId: null })}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasMore || loading}
            onClick={() => updateQuery({ offset: String(offset + PAGE_SIZE), sessionId: null })}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function SessionRow({
  session,
  expanded,
  onToggle,
}: {
  session: AnalyticsSession
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr
        className={cn(
          "cursor-pointer border-b hover:bg-muted/40",
          expanded && "bg-primary/5 hover:bg-primary/5",
        )}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <td className="px-3 py-2.5 text-muted-foreground">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </td>
        <td className="px-3 py-2.5">
          <div className="max-w-[200px]">
            <p className="truncate font-medium" title={session.uid || session.session_id}>
              {session.uid || "Anonymous"}
            </p>
            <p className="truncate font-mono text-[11px] text-muted-foreground" title={session.session_id}>
              {session.session_id.slice(0, 8)}…
            </p>
          </div>
        </td>
        <td className="px-3 py-2.5">
          <span className="font-mono text-xs break-all">{session.client_ip || "—"}</span>
        </td>
        <td className="px-3 py-2.5 text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {formatGeoLabel(session.geo_lat, session.geo_lng)}
          </span>
        </td>
        <td className="px-3 py-2.5 capitalize">{session.platform || "—"}</td>
        <td className="px-3 py-2.5">
          <span title={formatAbsoluteTime(session.started_at)}>{formatRelativeTime(session.started_at)}</span>
        </td>
        <td className="px-3 py-2.5">
          <span title={formatAbsoluteTime(session.last_seen_at)}>{formatRelativeTime(session.last_seen_at)}</span>
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums">{session.event_count}</td>
        <td className="px-3 py-2.5">
          <Badge
            variant="outline"
            className={cn(
              "capitalize",
              session.status === "active"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-muted-foreground/30 text-muted-foreground",
            )}
          >
            {session.status}
          </Badge>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b">
          <td colSpan={9} className="p-0">
            <SessionEventsPanel session={session} />
          </td>
        </tr>
      ) : null}
    </>
  )
}
