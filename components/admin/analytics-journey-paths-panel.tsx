"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { adminApiClient } from "@/lib/admin-api-client"
import type { JourneyPath, JourneyPathsResponse } from "@/lib/types/analytics-journey-paths"
import { Button } from "@/components/ui/button"
import { AdminPager, usePageFor } from "@/components/admin/admin-pager"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  JourneyFiltersBar,
  PeopleList,
  Stat,
  StepChips,
  apiErrorMessage,
  formatAbsolute,
  formatNumber,
  formatPercent,
  formatRelative,
  toApiFilters,
  useJourneyUrlFilters,
  usePeople,
} from "@/components/admin/journey-paths-shared"

const PAGE = 50

/** Every distinct journey (ordered pages + tracked ids) in the period, and who went through each. */
export function AnalyticsJourneyPathsPanel({ onOpenSession }: { onOpenSession: (sessionId: string) => void }) {
  const { filters, update } = useJourneyUrlFilters()
  const filtersKey = JSON.stringify(filters)
  const [data, setData] = useState<JourneyPathsResponse | null>(null)
  const [journeys, setJourneys] = useState<JourneyPath[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<JourneyPath | null>(null)
  const requestRef = useRef(0)
  const [page, setPage] = usePageFor(filtersKey)

  const load = useCallback(
    async (pageNumber: number) => {
      const request = ++requestRef.current
      setLoading(true)
      setError(null)
      try {
        const res = await adminApiClient.adminGetJourneyPaths({
          ...toApiFilters(filters),
          limit: PAGE,
          offset: (pageNumber - 1) * PAGE,
        })
        if (request !== requestRef.current) return
        setData(res)
        setJourneys(res.journeys)
      } catch (err) {
        if (request === requestRef.current) setError(apiErrorMessage(err, "Failed to load journeys"))
      } finally {
        if (request === requestRef.current) setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtersKey],
  )

  useEffect(() => {
    setSelected(null)
  }, [filtersKey])

  useEffect(() => {
    void load(page)
  }, [load, page])

  const fetchPeople = useCallback(
    (offset: number, limit: number) =>
      adminApiClient.adminGetJourneyPathUsers(selected!.journey_id, { ...toApiFilters(filters), limit, offset }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected?.journey_id, filtersKey],
  )
  const people = usePeople(selected ? fetchPeople : null, `${selected?.journey_id ?? ""}|${filtersKey}`)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">All journeys</h3>
        <p className="text-sm text-muted-foreground">
          Every session as the pages and tracked actions it went through, in order (repeats collapsed). Click a journey to
          see who took it.
        </p>
      </div>

      <JourneyFiltersBar filters={filters} update={update} showJourneyOptions onRefresh={() => void load(page)} loading={loading} />

      {data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Sessions in period" value={formatNumber(data.total_sessions)} />
          <Stat label="Sessions matched" value={formatNumber(data.matched_sessions)} />
          <Stat label="Distinct journeys" value={formatNumber(data.journey_count)} />
          <Stat
            label="Top journey share"
            value={page === 1 && journeys[0] ? formatPercent(journeys[0].share) : "—"}
          />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>
      ) : null}

      {!error && !loading && journeys.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No journeys in this period{filters.contains ? ` containing "${filters.contains}"` : ""}.
        </div>
      ) : null}

      {journeys.length > 0 ? (
        <div className="overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-2.5 font-medium">#</th>
                  <th className="px-3 py-2.5 font-medium">Journey</th>
                  <th className="px-3 py-2.5 text-right font-medium">Sessions</th>
                  <th className="px-3 py-2.5 text-right font-medium">Users</th>
                  <th className="px-3 py-2.5 text-right font-medium">Guests</th>
                  <th className="px-3 py-2.5 text-right font-medium">Share</th>
                  <th className="px-3 py-2.5 font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {journeys.map((j, i) => (
                  <tr
                    key={j.journey_id}
                    className="cursor-pointer border-b align-top last:border-0 hover:bg-muted/40"
                    onClick={() => setSelected(j)}
                  >
                    <td className="px-3 py-2.5 text-muted-foreground tabular-nums">{(page - 1) * PAGE + i + 1}</td>
                    <td className="px-3 py-2.5">
                      <StepChips steps={j.steps} highlight={filters.contains || undefined} />
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(j.sessions)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(j.users)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(j.guests)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatPercent(j.share)}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground" title={formatAbsolute(j.last_seen)}>
                      {formatRelative(j.last_seen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /> : null}
      {data ? (
        <AdminPager page={page} pageSize={PAGE} total={data.journey_count} loading={loading} onPage={setPage} />
      ) : null}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>Who went through this journey</SheetTitle>
                <SheetDescription>
                  {formatNumber(selected.sessions)} sessions · {formatNumber(selected.users)} users ·{" "}
                  {formatNumber(selected.guests)} guests
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 pt-4">
                <StepChips steps={selected.steps} />
                <PeopleList
                  people={people.people}
                  loading={people.loading}
                  error={people.error}
                  hasMore={people.hasMore}
                  page={people.page}
                  onPage={people.setPage}
                  onOpenSession={onOpenSession}
                />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
