"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format, formatDistanceToNow, formatDuration, intervalToDuration, isValid, parseISO } from "date-fns"
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  MapPin,
  RefreshCw,
  Route,
  X,
} from "lucide-react"
import { describeSessionEvent } from "@/lib/analytics/describe-session-event"
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

function formatSessionDuration(startIso: string, endIso: string): string {
  try {
    const start = parseISO(startIso)
    const end = parseISO(endIso)
    if (!isValid(start) || !isValid(end) || end < start) return "—"
    const ms = end.getTime() - start.getTime()
    if (ms < 1000) return "<1s"
    const duration = intervalToDuration({ start, end })
    return (
      formatDuration(duration, {
        format: ["hours", "minutes", "seconds"],
        zero: false,
        delimiter: " ",
      }) || "—"
    )
  } catch {
    return "—"
  }
}

function shortSessionId(id: string): string {
  if (!id) return "—"
  return id.length <= 12 ? id : `${id.slice(0, 10)}…`
}

function stubSession(sessionId: string): AnalyticsSession {
  return {
    session_id: sessionId,
    client_ip: "",
    geo_lat: 0,
    geo_lng: 0,
    platform: "",
    build_id: "",
    started_at: "",
    last_seen_at: "",
    event_count: 0,
    status: "inactive",
  }
}

function readCachedSession(sessionId: string): AnalyticsSession | null {
  try {
    const raw = sessionStorage.getItem(`hiffi_analytics_session:${sessionId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AnalyticsSession
    if (!parsed?.session_id) return null
    return parsed
  } catch {
    return null
  }
}

function formatClockTime(iso: string): string {
  if (!iso) return "—"
  try {
    const date = parseISO(iso)
    if (!isValid(date)) return iso
    return format(date, "HH:mm:ss")
  } catch {
    return iso
  }
}

type FlowStep = {
  key: string
  startIndex: number
  endIndex: number
  count: number
  first: AnalyticsEvent
  last: AnalyticsEvent
  title: string
  place: string
}

function buildUserFlow(events: AnalyticsEvent[]): FlowStep[] {
  const steps: FlowStep[] = []
  for (let i = 0; i < events.length; i++) {
    const event = events[i]!
    const described = describeSessionEvent(event)
    const prev = steps[steps.length - 1]
    if (prev && prev.title === described.title && prev.place === described.place) {
      prev.count += 1
      prev.endIndex = i
      prev.last = event
      continue
    }
    steps.push({
      key: `${described.signature}-${i}`,
      startIndex: i,
      endIndex: i,
      count: 1,
      first: event,
      last: event,
      title: described.title,
      place: described.place,
    })
  }
  return steps
}

function FlowOverview({
  steps,
  duration,
  eventCount,
  hasMore,
}: {
  steps: FlowStep[]
  duration: string
  eventCount: number
  hasMore: boolean
}) {
  if (steps.length === 0) return null
  const enter = steps[0]!
  const exit = steps[steps.length - 1]!

  return (
    <div className="rounded-lg border bg-background px-3 py-3 sm:px-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium">User flow</p>
          <p className="text-xs text-muted-foreground">
            {duration} · {eventCount.toLocaleString()} action{eventCount === 1 ? "" : "s"}
            {hasMore ? "+" : ""} · {steps.length} step{steps.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
        {steps.map((step, index) => (
          <div key={step.key} className="contents">
            {index > 0 ? (
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
            ) : null}
            <span
              className={cn(
                "inline-flex max-w-[16rem] items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
                index === 0 && "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
                index === steps.length - 1 &&
                  index !== 0 &&
                  "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200",
                index !== 0 && index !== steps.length - 1 && "bg-muted/60 text-foreground",
              )}
              title={`${step.title}${step.count > 1 ? ` ×${step.count}` : ""}`}
            >
              <span className="truncate">
                {index === 0 ? "Started: " : index === steps.length - 1 ? "Ended: " : ""}
                {step.title}
              </span>
              {step.count > 1 ? (
                <span className="shrink-0 tabular-nums text-muted-foreground">×{step.count}</span>
              ) : null}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {enter.place === exit.place
          ? `Stayed on ${enter.place}`
          : `Moved ${enter.place} → ${exit.place}`}
      </p>
    </div>
  )
}

function FlowStepRow({
  step,
  stepNumber,
  isEnter,
  isExit,
  isLastLoaded,
}: {
  step: FlowStep
  stepNumber: number
  isEnter: boolean
  isExit: boolean
  isLastLoaded: boolean
}) {
  return (
    <div className="relative pb-3 pl-8">
      <span
        className={cn(
          "absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-[11px] font-semibold tabular-nums",
          isEnter && "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
          (isExit || isLastLoaded) && "border-amber-500/40 text-amber-800 dark:text-amber-300",
          !isEnter && !isExit && !isLastLoaded && "border-border text-muted-foreground",
        )}
      >
        {stepNumber}
      </span>
      <div
        className={cn(
          "rounded-lg border bg-background px-3 py-2.5",
          isEnter && "border-emerald-500/25",
          (isExit || isLastLoaded) && "border-amber-500/25",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {isEnter ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Start
            </span>
          ) : null}
          {isExit ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
              End
            </span>
          ) : null}
          {isLastLoaded ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
              Last loaded
            </span>
          ) : null}
          <p className="text-sm font-medium">{step.title}</p>
          {step.count > 1 ? (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
              {step.count} times
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{step.place}</span>
          <span aria-hidden>·</span>
          <time dateTime={step.first.timestamp} title={formatAbsoluteTime(step.first.timestamp)}>
            {formatClockTime(step.first.timestamp)}
            {step.count > 1 ? ` → ${formatClockTime(step.last.timestamp)}` : ""}
          </time>
        </div>
      </div>
    </div>
  )
}

/** Events for one session only — loaded from GET /analytics/sessions/{id}/events */
function SessionEventsPanel({
  session,
  compactHeader = false,
}: {
  session: AnalyticsSession
  compactHeader?: boolean
}) {
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

  const flowSteps = useMemo(() => buildUserFlow(events), [events])
  const lastEventIndex = events.length - 1
  const duration =
    events.length > 0
      ? formatSessionDuration(events[0]!.timestamp, events[events.length - 1]!.timestamp)
      : "—"

  return (
    <div className={cn("space-y-3", !compactHeader && "border-t bg-muted/20 px-4 py-4")}>
      {!compactHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Session story</p>
            <p className="text-xs text-muted-foreground">
              What this visitor did, in order ·{" "}
              <span className="font-mono">{shortSessionId(session.session_id)}</span>
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
            Refresh
          </Button>
        </div>
      ) : (
        <div className="flex justify-end">
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
      )}

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
        <>
          <FlowOverview
            steps={flowSteps}
            duration={duration}
            eventCount={events.length}
            hasMore={hasMore}
          />

          <div className="relative before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-px before:bg-border">
            {flowSteps.map((step, index) => (
              <FlowStepRow
                key={step.key}
                step={step}
                stepNumber={index + 1}
                isEnter={step.startIndex === 0}
                isExit={step.endIndex === lastEventIndex && !hasMore}
                isLastLoaded={step.endIndex === lastEventIndex && hasMore}
              />
            ))}
          </div>
        </>
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
 * Sessions inspector (drill-down from Funnels):
 * 1) GET /analytics/sessions — visitor list with client_ip / geo
 * 2) Expand a session → GET /analytics/sessions/{id}/events for that session only
 */
export function AnalyticsJourneySessionsPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } = useAdminNetworkError()

  const sessionIdParam = searchParams.get("sessionId") || ""
  // Primitive deps so expanding a session (URL sessionId only) does not refetch the list.
  const uidFilter = searchParams.get("uid") || ""
  const platformFilter = searchParams.get("platform") || ""
  const statusFilterRaw = searchParams.get("status") || ""
  const timestampAfterFilter = searchParams.get("timestamp_after") || ""
  const timestampBeforeFilter = searchParams.get("timestamp_before") || ""
  const offsetParam = searchParams.get("offset") || "0"

  const filters = useMemo((): JourneyFilters => {
    const status: JourneyFilters["status"] =
      statusFilterRaw === "active" || statusFilterRaw === "inactive" ? statusFilterRaw : ""
    return {
      uid: uidFilter,
      platform: platformFilter,
      status,
      timestamp_after: timestampAfterFilter,
      timestamp_before: timestampBeforeFilter,
    }
  }, [uidFilter, platformFilter, statusFilterRaw, timestampAfterFilter, timestampBeforeFilter])

  const offset = useMemo(() => {
    const raw = Number(offsetParam)
    if (!Number.isFinite(raw) || raw < 0) return 0
    return Math.floor(raw)
  }, [offsetParam])

  const [draftFilters, setDraftFilters] = useState<JourneyFilters>(filters)
  const [sessions, setSessions] = useState<AnalyticsSession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [errorKind, setErrorKind] = useState<"auth" | "unavailable" | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    setDraftFilters(filters)
  }, [filters])

  useEffect(() => {
    const active = Object.values(filters).some(Boolean)
    if (active) setFiltersOpen(true)
  }, [filters])

  const updateQuery = useCallback(
    (
      patch: Record<string, string | null | undefined>,
      options?: { replace?: boolean; scroll?: boolean },
    ) => {
      const next = new URLSearchParams(searchParams.toString())
      next.set("section", "journeys")
      next.set("journeys_tab", "sessions")
      for (const [key, value] of Object.entries(patch)) {
        if (value == null || value === "") next.delete(key)
        else next.set(key, value)
      }
      const href = `/admin/dashboard?${next.toString()}`
      const navOpts = { scroll: options?.scroll ?? false }
      if (options?.replace === false) router.push(href, navOpts)
      else router.replace(href, navOpts)
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
      updateQuery({ sessionId: null }, { replace: true, scroll: false })
      return
    }
    try {
      sessionStorage.setItem(`hiffi_analytics_session:${session.session_id}`, JSON.stringify(session))
    } catch {
      // ignore
    }
    updateQuery({ sessionId: session.session_id }, { replace: true, scroll: false })
  }

  const clearFocusedSession = () => updateQuery({ sessionId: null }, { replace: true, scroll: false })

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((v) => Boolean(v)).length,
    [filters],
  )

  const page = Math.floor(offset / PAGE_SIZE) + 1

  const focusedInList = useMemo(
    () => (sessionIdParam ? sessions.find((s) => s.session_id === sessionIdParam) : undefined),
    [sessions, sessionIdParam],
  )

  const orphanFocusedSession = useMemo(() => {
    if (!sessionIdParam || focusedInList || loading) return null
    return readCachedSession(sessionIdParam) ?? stubSession(sessionIdParam)
  }, [sessionIdParam, focusedInList, loading])

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
        Expand a visitor to see their step-by-step flow — what they did, in plain language.
      </div>

      {orphanFocusedSession ? (
        <div className="space-y-3 rounded-lg border border-primary/25 bg-primary/5 p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Focused session</p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground" title={orphanFocusedSession.session_id}>
                {orphanFocusedSession.session_id}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Opened from Funnels (or a deep link). Not on the current list page.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={clearFocusedSession}>
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
          <SessionEventsPanel session={orphanFocusedSession} compactHeader />
        </div>
      ) : null}

      <div className="rounded-lg border bg-background shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <button
            type="button"
            className="flex items-center gap-2 text-left"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
          >
            <Route className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Filters</span>
            {activeFilterCount > 0 ? (
              <Badge variant="secondary" className="text-[11px]">
                {activeFilterCount} active
              </Badge>
            ) : null}
            {filtersOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters} disabled={activeFilterCount === 0}>
              Clear
            </Button>
            <Button type="button" size="sm" onClick={applyFilters}>
              Apply
            </Button>
          </div>
        </div>

        {filtersOpen ? (
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyFilters()
                }}
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
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Page {page}
          {hasMore ? " · more available" : ""}
          {sessionIdParam && focusedInList ? " · viewing one session flow" : ""}
          {!sessionIdParam ? " · expand a row to see the visitor’s flow" : ""}
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
          Refresh
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
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-8 px-3 py-2.5 font-medium" aria-hidden />
                  <th className="px-3 py-2.5 font-medium">Visitor</th>
                  <th className="px-3 py-2.5 font-medium">Platform</th>
                  <th className="px-3 py-2.5 font-medium">Started</th>
                  <th className="px-3 py-2.5 font-medium">Last active</th>
                  <th className="px-3 py-2.5 font-medium text-right">Events</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Location</th>
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
          <div className="max-w-[220px]">
            <p className="truncate font-medium" title={session.uid || session.session_id}>
              {session.uid || "Anonymous"}
            </p>
            <p className="truncate font-mono text-[11px] text-muted-foreground" title={session.session_id}>
              {shortSessionId(session.session_id)}
              {session.client_ip ? ` · ${session.client_ip}` : ""}
            </p>
          </div>
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
        <td className="px-3 py-2.5 text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {formatGeoLabel(session.geo_lat, session.geo_lng)}
          </span>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b">
          <td colSpan={8} className="p-0">
            <SessionEventsPanel session={session} />
          </td>
        </tr>
      ) : null}
    </>
  )
}
