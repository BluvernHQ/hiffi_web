"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns"
import { ExternalLink, Loader2 } from "lucide-react"
import { describePage, describeTag } from "@/lib/analytics/describe-session-event"
import { TRACKING_IDS, trackingIdInfo } from "@/lib/analytics/tracking-ids"
import type {
  JourneyFilters,
  JourneyPeopleResponse,
  JourneyPerson,
  JourneyPlatform,
} from "@/lib/types/analytics-journey-paths"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { AdminPager, usePageFor } from "@/components/admin/admin-pager"

export type JourneyRange = "24h" | "7d" | "30d" | "90d" | "custom"

const RANGE_HOURS: Record<Exclude<JourneyRange, "custom">, number> = { "24h": 24, "7d": 168, "30d": 720, "90d": 2160 }

/** Filter state kept in the URL (jp_* params) so views can be shared and survive reloads. */
export interface JourneyUrlFilters {
  range: JourneyRange
  from: string
  to: string
  platform: JourneyPlatform | ""
  maxSteps: number
  contains: string
  includeGuests: boolean
}

export function useJourneyUrlFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters = useMemo((): JourneyUrlFilters => {
    const range = searchParams.get("jp_range") as JourneyRange | null
    const steps = Number(searchParams.get("jp_steps"))
    const platform = searchParams.get("jp_platform")
    return {
      range: range && (range === "custom" || range in RANGE_HOURS) ? range : "7d",
      from: searchParams.get("jp_from") ?? "",
      to: searchParams.get("jp_to") ?? "",
      platform: platform === "web" || platform === "ios" || platform === "android" ? platform : "",
      maxSteps: Number.isFinite(steps) && steps >= 2 && steps <= 20 ? steps : 8,
      contains: searchParams.get("jp_contains") ?? "",
      includeGuests: searchParams.get("jp_guests") !== "0",
    }
  }, [searchParams])

  const update = useCallback(
    (patch: Partial<JourneyUrlFilters> & { tab?: string }) => {
      const next = new URLSearchParams(searchParams.toString())
      const set = (key: string, value: string, fallback: string) => {
        if (value === fallback) next.delete(key)
        else next.set(key, value)
      }
      if (patch.tab) next.set("journeys_tab", patch.tab)
      if (patch.range !== undefined) set("jp_range", patch.range, "7d")
      if (patch.from !== undefined) set("jp_from", patch.from, "")
      if (patch.to !== undefined) set("jp_to", patch.to, "")
      if (patch.platform !== undefined) set("jp_platform", patch.platform, "")
      if (patch.maxSteps !== undefined) set("jp_steps", String(patch.maxSteps), "8")
      if (patch.contains !== undefined) set("jp_contains", patch.contains, "")
      if (patch.includeGuests !== undefined) set("jp_guests", patch.includeGuests ? "1" : "0", "1")
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  return { filters, update }
}

/** API filters for the URL state; preset ranges end now. */
export function toApiFilters(f: JourneyUrlFilters): JourneyFilters {
  let from: string | undefined
  let to: string | undefined
  if (f.range === "custom") {
    from = f.from || undefined
    // The API treats `to` as exclusive; include the whole end day.
    if (f.to) {
      const end = parseISO(f.to)
      if (isValid(end)) to = new Date(end.getTime() + 24 * 3600 * 1000).toISOString().slice(0, 10)
    }
  } else {
    const now = Date.now()
    from = new Date(now - RANGE_HOURS[f.range] * 3600 * 1000).toISOString()
    to = new Date(now).toISOString()
  }
  return {
    from,
    to,
    platform: f.platform || undefined,
    max_steps: f.maxSteps,
    contains: f.contains || undefined,
    include_guests: f.includeGuests,
  }
}

export function JourneyFiltersBar({
  filters,
  update,
  showJourneyOptions,
  onRefresh,
  loading,
}: {
  filters: JourneyUrlFilters
  update: (patch: Partial<JourneyUrlFilters>) => void
  showJourneyOptions?: boolean
  onRefresh: () => void
  loading: boolean
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/20 p-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Period</Label>
        <Select value={filters.range} onValueChange={(v) => update({ range: v as JourneyRange })}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="custom">Custom dates</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {filters.range === "custom" ? (
        <>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input type="date" className="h-9 w-[150px]" value={filters.from} onChange={(e) => update({ from: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input type="date" className="h-9 w-[150px]" value={filters.to} onChange={(e) => update({ to: e.target.value })} />
          </div>
        </>
      ) : null}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Platform</Label>
        <Select value={filters.platform || "all"} onValueChange={(v) => update({ platform: v === "all" ? "" : (v as JourneyPlatform) })}>
          <SelectTrigger className="h-9 w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="web">Web</SelectItem>
            <SelectItem value="ios">iOS</SelectItem>
            <SelectItem value="android">Android</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {showJourneyOptions ? (
        <>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Steps</Label>
            <Select value={String(filters.maxSteps)} onValueChange={(v) => update({ maxSteps: Number(v) })}>
              <SelectTrigger className="h-9 w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 4, 5, 6, 8, 10, 12, 15, 20].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    First {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Contains step</Label>
            <ContainsInput value={filters.contains} onChange={(contains) => update({ contains })} />
          </div>
        </>
      ) : null}
      <label className="flex h-9 items-center gap-2 text-sm">
        <Switch checked={filters.includeGuests} onCheckedChange={(v) => update({ includeGuests: v })} />
        Include guests
      </label>
      <Button variant="outline" size="sm" className="ml-auto h-9" onClick={onRefresh} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Refresh
      </Button>
    </div>
  )
}

function ContainsInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      <Input
        key={value}
        list="journey-step-options"
        className="h-9 w-[230px] font-mono text-xs"
        placeholder="any (e.g. comment-post)"
        defaultValue={value}
        onBlur={(e) => e.target.value.trim() !== value && onChange(e.target.value.trim())}
        onKeyDown={(e) => {
          if (e.key === "Enter") onChange((e.target as HTMLInputElement).value.trim())
        }}
      />
      {value ? (
        <Button variant="ghost" size="sm" className="h-9 px-2" onClick={() => onChange("")}>
          Clear
        </Button>
      ) : null}
      <TrackingIdOptions />
    </div>
  )
}

function TrackingIdOptions() {
  return (
    <datalist id="journey-step-options">
      {Object.entries(TRACKING_IDS).map(([id, info]) => (
        <option key={id} value={id}>
          {info.label}
        </option>
      ))}
    </datalist>
  )
}

/** Human label for a journey step: `page:/watch/:id` or a tracking id. */
export function stepLabel(step: string): { label: string; isPage: boolean } {
  if (step.startsWith("page:")) {
    const path = step.slice(5)
    const label = path.startsWith("/profile/") ? "Profile" : describePage(path)
    return { label, isPage: true }
  }
  return { label: trackingIdInfo(step)?.label ?? describeTag(step), isPage: false }
}

export function StepChips({ steps, highlight }: { steps: string[]; highlight?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {steps.map((step, i) => {
        const { label, isPage } = stepLabel(step)
        return (
          <span key={`${i}-${step}`} className="flex items-center gap-1">
            {i > 0 ? <span className="text-muted-foreground">›</span> : null}
            <span
              title={step}
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-xs",
                isPage ? "border-sky-500/30 bg-sky-500/10" : "border-violet-500/30 bg-violet-500/10",
                highlight && step === highlight && "ring-2 ring-primary",
              )}
            >
              {label}
            </span>
          </span>
        )
      })}
    </div>
  )
}

export function formatRelative(iso: string): string {
  const date = parseISO(iso)
  return isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : "—"
}

export function formatAbsolute(iso: string): string {
  const date = parseISO(iso)
  return isValid(date) ? format(date, "PPpp") : ""
}

export function formatNumber(n: number): string {
  return Number(n || 0).toLocaleString("en-US")
}

export function formatPercent(rate: number): string {
  if (!Number.isFinite(rate)) return "—"
  return `${Math.round(rate * 1000) / 10}%`
}

function personLabel(p: JourneyPerson): string {
  if (p.kind === "user") return p.username ? `@${p.username}` : p.uid || p.identity
  if (p.kind === "guest") return `Guest #${(p.visitor_id || p.identity.replace(/^guest:/, "")).slice(0, 6)}`
  return `Session ${p.last_session_id.slice(0, 8)}`
}

export function PeopleList({
  people,
  loading,
  error,
  hasMore,
  page,
  onPage,
  onOpenSession,
}: {
  people: JourneyPerson[]
  loading: boolean
  error: string | null
  hasMore: boolean
  page: number
  onPage: (page: number) => void
  onOpenSession: (sessionId: string) => void
}) {
  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!loading && people.length === 0 && page === 1) {
    return <p className="text-sm text-muted-foreground">Nobody in this period.</p>
  }
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Who</th>
              <th className="px-3 py-2 font-medium">Sessions</th>
              <th className="px-3 py-2 font-medium">Last seen</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.identity} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium" title={p.identity}>
                      {personLabel(p)}
                    </span>
                    <Badge variant={p.kind === "user" ? "default" : "secondary"} className="text-[10px]">
                      {p.kind}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.platform} · first {formatRelative(p.first_seen)}
                  </p>
                </td>
                <td className="px-3 py-2 tabular-nums">{formatNumber(p.sessions)}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground" title={formatAbsolute(p.last_seen)}>
                  {formatRelative(p.last_seen)}
                </td>
                <td className="px-3 py-2 text-right">
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onOpenSession(p.last_session_id)}>
                    Open session <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" /> : null}
      <AdminPager page={page} pageSize={PEOPLE_PAGE} hasNext={hasMore} loading={loading} onPage={onPage} />
    </div>
  )
}

export const PEOPLE_PAGE = 25

/**
 * One page of people for a journey or feature. `fetchPage` must be memoized by the caller;
 * `resetKey` (selection + filters) sends the list back to page 1 when it changes.
 */
export function usePeople(
  fetchPage: ((offset: number, limit: number) => Promise<JourneyPeopleResponse>) | null,
  resetKey: string,
) {
  const [page, setPage] = usePageFor(resetKey)
  const [people, setPeople] = useState<JourneyPerson[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const requestRef = useRef(0)

  useEffect(() => {
    const request = ++requestRef.current
    if (!fetchPage) {
      setPeople([])
      setHasMore(false)
      return
    }
    setLoading(true)
    setError(null)
    fetchPage((page - 1) * PEOPLE_PAGE, PEOPLE_PAGE)
      .then((data) => {
        if (request !== requestRef.current) return
        setPeople(data.users)
        setHasMore(Boolean(data.has_more))
      })
      .catch((err) => {
        if (request === requestRef.current) setError(apiErrorMessage(err, "Failed to load people"))
      })
      .finally(() => {
        if (request === requestRef.current) setLoading(false)
      })
  }, [fetchPage, page])

  return { people, loading, error, hasMore, page, setPage }
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  const status = (error as { status?: number })?.status
  if (status === 403) return "Your admin role needs the analytics.journeys:read permission."
  if (status === 503) return "Analytics storage (ClickHouse) is not available right now."
  if (status === 400 && error instanceof Error) return error.message
  return error instanceof Error && error.message ? error.message : fallback
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}
