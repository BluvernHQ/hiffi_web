"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, Loader2 } from "lucide-react"
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { adminApiClient } from "@/lib/admin-api-client"
import { describeTag } from "@/lib/analytics/describe-session-event"
import { TRACKING_IDS, type TrackingIdInfo } from "@/lib/analytics/tracking-ids"
import type { FeatureTrendDay, FeatureUsage, FeaturesResponse } from "@/lib/types/analytics-journey-paths"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  JourneyFiltersBar,
  PeopleList,
  Stat,
  apiErrorMessage,
  formatAbsolute,
  formatNumber,
  formatPercent,
  formatRelative,
  toApiFilters,
  useJourneyUrlFilters,
  usePeople,
} from "@/components/admin/journey-paths-shared"

type FeatureRow = {
  id: string
  info: TrackingIdInfo | null
  usage: FeatureUsage | null
  people: number
}

const MAX_PAGES = 20

/** How many people use each tracked control, with adoption against everyone active in the period. */
export function AnalyticsFeaturesPanel({ onOpenSession }: { onOpenSession: (sessionId: string) => void }) {
  const { filters, update } = useJourneyUrlFilters()
  const filtersKey = JSON.stringify(filters)
  const [usage, setUsage] = useState<FeatureUsage[]>([])
  const [totals, setTotals] = useState<Pick<FeaturesResponse, "active_users" | "active_guests" | "active_sessions"> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [showUnregistered, setShowUnregistered] = useState(false)
  const [selected, setSelected] = useState<FeatureRow | null>(null)
  const requestRef = useRef(0)

  const load = useCallback(
    async () => {
      const request = ++requestRef.current
      setLoading(true)
      setError(null)
      try {
        const api = toApiFilters(filters)
        const all: FeatureUsage[] = []
        let page: FeaturesResponse | null = null
        for (let i = 0; i < MAX_PAGES; i++) {
          page = await adminApiClient.adminGetFeatures({ ...api, max_steps: undefined, contains: undefined, limit: 100, offset: all.length })
          all.push(...page.features)
          if (!page.has_more) break
        }
        if (request !== requestRef.current || !page) return
        setUsage(all)
        setTotals({ active_users: page.active_users, active_guests: page.active_guests, active_sessions: page.active_sessions })
      } catch (err) {
        if (request === requestRef.current) setError(apiErrorMessage(err, "Failed to load features"))
      } finally {
        if (request === requestRef.current) setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtersKey],
  )

  useEffect(() => {
    setSelected(null)
    void load()
  }, [load])

  const activePeople = (totals?.active_users ?? 0) + (filters.includeGuests ? totals?.active_guests ?? 0 : 0)

  const rows = useMemo((): FeatureRow[] => {
    const byId = new Map(usage.map((u) => [u.id, u]))
    const people = (u: FeatureUsage | null) => (u ? u.users + (filters.includeGuests ? u.guests : 0) : 0)
    const registered: FeatureRow[] = Object.entries(TRACKING_IDS).map(([id, info]) => {
      const u = byId.get(id) ?? null
      return { id, info, usage: u, people: people(u) }
    })
    const unregistered: FeatureRow[] = usage
      .filter((u) => !(u.id in TRACKING_IDS))
      .map((u) => ({ id: u.id, info: null, usage: u, people: people(u) }))
    const q = query.trim().toLowerCase()
    return [...registered, ...(showUnregistered ? unregistered : [])]
      .filter((r) => !q || r.id.toLowerCase().includes(q) || (r.info?.label ?? "").toLowerCase().includes(q) || (r.info?.feature ?? "").includes(q))
      .sort((a, b) => b.people - a.people || (b.usage?.sessions ?? 0) - (a.usage?.sessions ?? 0))
  }, [usage, query, showUnregistered, filters.includeGuests])

  const unregisteredCount = useMemo(() => usage.filter((u) => !(u.id in TRACKING_IDS)).length, [usage])
  const usedCount = rows.filter((r) => r.info && r.people > 0).length

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Features</h3>
        <p className="text-sm text-muted-foreground">
          How many people used each tracked button or link. Adoption is the share of everyone active in the period. New
          features show their launch date; click a row for the daily trend and the people who used it.
        </p>
      </div>

      <JourneyFiltersBar filters={filters} update={update} onRefresh={() => void load()} loading={loading} />

      {totals ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Active users" value={formatNumber(totals.active_users)} />
          <Stat label="Active guests" value={filters.includeGuests ? formatNumber(totals.active_guests) : "—"} />
          <Stat label="Sessions" value={formatNumber(totals.active_sessions)} />
          <Stat label="Features used" value={`${usedCount} / ${Object.keys(TRACKING_IDS).length}`} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="h-9 w-[260px]"
          placeholder="Search features"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={showUnregistered} onCheckedChange={setShowUnregistered} />
          Show unregistered tags ({unregisteredCount})
        </label>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>
      ) : null}

      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 font-medium">Feature</th>
                <th className="px-3 py-2.5 font-medium">Launched</th>
                <th className="px-3 py-2.5 text-right font-medium">Users</th>
                <th className="px-3 py-2.5 text-right font-medium">Guests</th>
                <th className="px-3 py-2.5 text-right font-medium">Sessions</th>
                <th className="px-3 py-2.5 text-right font-medium">Adoption</th>
                <th className="px-3 py-2.5 font-medium">Last used</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={cn("cursor-pointer border-b last:border-0 hover:bg-muted/40", r.people === 0 && "text-muted-foreground")}
                  onClick={() => setSelected(r)}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.info?.label ?? describeTag(r.id)}</span>
                      {r.info ? (
                        <Badge variant="outline" className="text-[10px]">
                          {r.info.feature}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          unregistered
                        </Badge>
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-muted-foreground">{r.id}</p>
                  </td>
                  <td className="px-3 py-2 text-xs">{r.info?.since ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNumber(r.usage?.users ?? 0)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNumber(r.usage?.guests ?? 0)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNumber(r.usage?.sessions ?? 0)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {activePeople > 0 ? formatPercent(r.people / activePeople) : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground" title={r.usage ? formatAbsolute(r.usage.last_seen) : ""}>
                    {r.usage ? formatRelative(r.usage.last_seen) : "never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /> : null}

      <FeatureSheet
        row={selected}
        onClose={() => setSelected(null)}
        onOpenSession={onOpenSession}
        onShowJourneys={(id) => update({ tab: "paths", contains: id })}
      />
    </div>
  )
}

function FeatureSheet({
  row,
  onClose,
  onOpenSession,
  onShowJourneys,
}: {
  row: FeatureRow | null
  onClose: () => void
  onOpenSession: (sessionId: string) => void
  onShowJourneys: (id: string) => void
}) {
  const { filters } = useJourneyUrlFilters()
  const filtersKey = JSON.stringify(filters)
  const [days, setDays] = useState<FeatureTrendDay[]>([])
  const [trendError, setTrendError] = useState<string | null>(null)
  const [trendLoading, setTrendLoading] = useState(false)
  const id = row?.id

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setTrendLoading(true)
    setTrendError(null)
    adminApiClient
      .adminGetFeatureTrend(id, { ...toApiFilters(filters), max_steps: undefined, contains: undefined })
      .then((res) => !cancelled && setDays(res.days))
      .catch((err) => !cancelled && setTrendError(apiErrorMessage(err, "Failed to load trend")))
      .finally(() => !cancelled && setTrendLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, filtersKey])

  const fetchPeople = useCallback(
    (offset: number, limit: number) =>
      adminApiClient.adminGetFeatureUsers(id!, {
        ...toApiFilters(filters),
        max_steps: undefined,
        contains: undefined,
        limit,
        offset,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, filtersKey],
  )
  const people = usePeople(id ? fetchPeople : null)

  const chartData = days.map((d) => {
    const using = d.users + (filters.includeGuests ? d.guests : 0)
    const active = d.active_users + (filters.includeGuests ? d.active_guests : 0)
    return { day: d.day.slice(5), using, adoption: active > 0 ? Math.round((using / active) * 1000) / 10 : 0 }
  })

  return (
    <Sheet open={Boolean(row)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {row ? (
          <>
            <SheetHeader>
              <SheetTitle>{row.info?.label ?? describeTag(row.id)}</SheetTitle>
              <SheetDescription>
                <span className="font-mono">{row.id}</span>
                {row.info?.since ? ` · launched ${row.info.since}` : ""}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 pt-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">People using it per day</p>
                {trendError ? <p className="text-sm text-destructive">{trendError}</p> : null}
                {trendLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                {!trendLoading && !trendError && chartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No usage in this period.</p>
                ) : null}
                {chartData.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="people" tick={{ fontSize: 11 }} width={36} allowDecimals={false} />
                        <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 11 }} width={40} unit="%" />
                        <Tooltip />
                        <Bar yAxisId="people" dataKey="using" name="People" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                        <Line yAxisId="pct" dataKey="adoption" name="Adoption %" stroke="#f59e0b" dot={false} strokeWidth={2} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : null}
              </div>

              <Button variant="outline" size="sm" onClick={() => onShowJourneys(row.id)}>
                Journeys including this <ArrowRight className="ml-1 h-4 w-4" />
              </Button>

              <div className="space-y-2">
                <p className="text-sm font-medium">Who used it</p>
                <PeopleList
                  people={people.people}
                  loading={people.loading}
                  error={people.error}
                  hasMore={people.hasMore}
                  onLoadMore={people.loadMore}
                  onOpenSession={onOpenSession}
                />
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
