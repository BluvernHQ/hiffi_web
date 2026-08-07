"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns"
import {
  ArrowRight,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  ScanSearch,
  TrendingDown,
} from "lucide-react"
import {
  createJourneyChain,
  detectJourneys,
  listEventTags,
  listJourneyChains,
  listJourneyGroups,
} from "@/lib/api/analytics-journeys"
import {
  computeFunnelSummary,
  type FunnelSummary,
  type JourneyChain,
  type JourneyGroup,
} from "@/lib/types/analytics-journeys"
import { AnalyticsApiError } from "@/lib/types/analytics-sessions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { useAdminPermissions } from "@/hooks/use-admin-permissions"
import { cn } from "@/lib/utils"

function formatPercent(rate: number | null | undefined): string {
  if (rate == null || !Number.isFinite(rate)) return "—"
  return `${Math.round(rate * 1000) / 10}%`
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

function FunnelViz({ summary, chain }: { summary: FunnelSummary; chain: JourneyChain }) {
  const maxReached = Math.max(1, ...summary.stages.map((s) => s.reached), summary.entrants)

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-background px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Entered</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.entrants.toLocaleString()}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Matched {chain.display_name || chain.name}</p>
        </div>
        <div className="rounded-lg border bg-background px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.completed.toLocaleString()}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatPercent(summary.completion_rate)} of entrants finished the chain
          </p>
        </div>
        <div className="rounded-lg border bg-background px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Dropped off</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {(summary.entrants - summary.completed).toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Exited before the last step</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Drop-off by stage</p>
        </div>
        <div className="space-y-2.5">
          {summary.stages.map((stage, i) => {
            const width = Math.max(8, Math.round((stage.reached / maxReached) * 100))
            const isExitHeavy =
              stage.dropoff_rate != null && stage.dropoff_rate >= 0.25 && stage.dropped_from_previous != null
            return (
              <div key={`${stage.index}-${stage.tag}`} className="space-y-1.5">
                {i > 0 && stage.dropped_from_previous != null && stage.dropped_from_previous > 0 ? (
                  <p
                    className={cn(
                      "flex items-center gap-1.5 pl-1 text-xs",
                      isExitHeavy ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground",
                    )}
                  >
                    <ArrowRight className="h-3 w-3 rotate-90" />
                    {stage.dropped_from_previous.toLocaleString()} dropped here
                    {stage.dropoff_rate != null ? ` (${formatPercent(stage.dropoff_rate)})` : ""}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex w-8 shrink-0 items-center justify-center">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {i + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="truncate font-mono text-sm font-medium" title={stage.tag}>
                        {stage.tag}
                      </p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {stage.reached.toLocaleString()} · {formatPercent(stage.conversion_from_start)} of entrants
                      </p>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          i === 0 ? "bg-primary" : i === summary.stages.length - 1 ? "bg-emerald-500" : "bg-sky-500",
                        )}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {summary.exits.length > 0 ? (
        <div className="rounded-lg border bg-muted/20 px-4 py-3">
          <p className="text-sm font-medium">Where people exit</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Last matched step among journeys that did not complete the full chain
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.exits.map((exit) => (
              <Badge key={exit.last_step_index} variant="secondary" className="gap-1.5 font-normal">
                <span className="font-mono text-[11px]">{exit.tag ?? `step ${exit.last_step_index + 1}`}</span>
                <span className="tabular-nums text-muted-foreground">
                  {exit.count} · {formatPercent(exit.share)}
                </span>
              </Badge>
            ))}
          </div>
        </div>
      ) : summary.entrants > 0 ? (
        <p className="text-sm text-muted-foreground">All matched journeys completed every stage.</p>
      ) : null}
    </div>
  )
}

export function AnalyticsJourneyFunnelsPanel({
  onOpenSession,
}: {
  onOpenSession: (sessionId: string) => void
}) {
  const { toast } = useToast()
  const { canWrite } = useAdminPermissions()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } = useAdminNetworkError()

  const [chains, setChains] = useState<JourneyChain[]>([])
  const [selectedName, setSelectedName] = useState("")
  const [journeys, setJourneys] = useState<JourneyGroup[]>([])
  const [groupsCount, setGroupsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [sessionLimit, setSessionLimit] = useState("50")
  const [errorKind, setErrorKind] = useState<"auth" | "unavailable" | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [chainName, setChainName] = useState("")
  const [chainDisplay, setChainDisplay] = useState("")
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [draftTags, setDraftTags] = useState<string[]>([])
  const [loadingTags, setLoadingTags] = useState(false)
  const [tagQuery, setTagQuery] = useState("")

  const selectedChain = useMemo(
    () => chains.find((c) => c.name === selectedName) ?? null,
    [chains, selectedName],
  )

  const summary = useMemo(() => {
    if (!selectedChain) return null
    return computeFunnelSummary(selectedChain.tags, journeys)
  }, [selectedChain, journeys])

  const handleApiError = useCallback(
    (error: unknown, genericMessage: string) => {
      if (error instanceof AnalyticsApiError) {
        if (error.status === 401) {
          setErrorKind("auth")
          return true
        }
        if (error.status === 503) {
          setErrorKind("unavailable")
          return true
        }
      }
      handleFetchError(error, {
        genericMessage,
        onGenericError: (description) => toast({ title: "Error", description, variant: "destructive" }),
      })
      return false
    },
    [handleFetchError, toast],
  )

  const loadChains = useCallback(async () => {
    if (guardOfflineBeforeFetch()) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      clearNetworkError()
      setErrorKind(null)
      const data = await listJourneyChains()
      setChains(data.chains)
      setSelectedName((prev) => {
        if (prev && data.chains.some((c) => c.name === prev)) return prev
        return data.chains[0]?.name ?? ""
      })
    } catch (error) {
      setChains([])
      handleApiError(error, "Failed to load journey chains")
    } finally {
      setLoading(false)
    }
  }, [guardOfflineBeforeFetch, clearNetworkError, handleApiError])

  const loadGroups = useCallback(
    async (journeyName: string) => {
      if (!journeyName) {
        setJourneys([])
        setGroupsCount(0)
        return
      }
      if (guardOfflineBeforeFetch()) return
      try {
        setLoadingGroups(true)
        clearNetworkError()
        setErrorKind(null)
        const data = await listJourneyGroups({
          journey_name: journeyName,
          limit: 200,
        })
        setJourneys(data.journeys)
        setGroupsCount(data.count)
      } catch (error) {
        setJourneys([])
        setGroupsCount(0)
        handleApiError(error, "Failed to load journey matches")
      } finally {
        setLoadingGroups(false)
      }
    },
    [guardOfflineBeforeFetch, clearNetworkError, handleApiError],
  )

  useEffect(() => {
    void loadChains()
  }, [loadChains])

  useEffect(() => {
    if (!selectedName) {
      setJourneys([])
      setGroupsCount(0)
      return
    }
    void loadGroups(selectedName)
  }, [selectedName, loadGroups])

  const handleDetect = async () => {
    const n = Number(sessionLimit)
    const session_limit = Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 200) : 50
    if (guardOfflineBeforeFetch()) return
    try {
      setDetecting(true)
      clearNetworkError()
      setErrorKind(null)
      const result = await detectJourneys({ session_limit })
      toast({
        title: "Detection finished",
        description: `Scanned ${result.sessions_scanned} sessions across ${result.chains} chains · upserted ${result.matches_upserted} matches`,
      })
      await loadChains()
      if (selectedName) await loadGroups(selectedName)
    } catch (error) {
      handleApiError(error, "Journey detection failed")
    } finally {
      setDetecting(false)
    }
  }

  const openCreate = async () => {
    setCreateOpen(true)
    setChainName("")
    setChainDisplay("")
    setDraftTags([])
    setTagQuery("")
    if (guardOfflineBeforeFetch()) return
    try {
      setLoadingTags(true)
      const data = await listEventTags({ limit: 500 })
      setAvailableTags(data.tags)
    } catch (error) {
      handleApiError(error, "Failed to load event tags")
    } finally {
      setLoadingTags(false)
    }
  }

  const filteredTags = useMemo(() => {
    const q = tagQuery.trim().toLowerCase()
    if (!q) return availableTags.slice(0, 80)
    return availableTags.filter((t) => t.toLowerCase().includes(q)).slice(0, 80)
  }, [availableTags, tagQuery])

  const handleCreate = async () => {
    const name = chainName.trim()
    if (!name) {
      toast({ title: "Chain name is required", variant: "destructive" })
      return
    }
    if (draftTags.length < 2) {
      toast({ title: "Add at least 2 tags in order", variant: "destructive" })
      return
    }
    try {
      setCreating(true)
      await createJourneyChain({
        name,
        display_name: chainDisplay.trim() || name,
        tags: draftTags,
      })
      toast({ title: "Chain saved", description: `"${name}" with ${draftTags.length} steps` })
      setCreateOpen(false)
      await loadChains()
      setSelectedName(name)
    } catch (error) {
      handleApiError(error, "Failed to save chain")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
        Pick a saved tag chain to see where visitors <span className="font-medium text-foreground">enter</span>,{" "}
        <span className="font-medium text-foreground">progress</span>, and{" "}
        <span className="font-medium text-foreground">drop off</span>. Open a matched session for the raw timeline.
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-background p-3 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_140px]">
          <div className="space-y-1.5">
            <Label htmlFor="journey-chain" className="text-xs">
              Journey chain
            </Label>
            <select
              id="journey-chain"
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
              disabled={loading || chains.length === 0}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {chains.length === 0 ? <option value="">No chains saved</option> : null}
              {chains.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.display_name || c.name}
                  {c.tags.length ? ` · ${c.tags.length} steps` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="session-limit" className="text-xs">
              Detect sessions
            </Label>
            <Input
              id="session-limit"
              type="number"
              min={1}
              max={200}
              value={sessionLimit}
              onChange={(e) => setSessionLimit(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={loading}
            onClick={() => void loadChains()}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={detecting || loading}
            onClick={() => void handleDetect()}
          >
            {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
            Detect matches
          </Button>
          {canWrite ? (
            <Button type="button" size="sm" className="gap-1.5" onClick={() => void openCreate()}>
              <Plus className="h-4 w-4" />
              New chain
            </Button>
          ) : null}
        </div>
      </div>

      {networkError ? (
        <AdminOfflineState message={networkError} onRetry={() => void loadChains()} />
      ) : errorKind === "auth" ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-10 text-center" role="alert">
          <p className="font-medium text-destructive">Analytics auth failed</p>
          <p className="mt-1 text-sm text-muted-foreground">Check the analytics ingest key configuration, then try again.</p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void loadChains()}>
            Retry
          </Button>
        </div>
      ) : errorKind === "unavailable" ? (
        <div className="rounded-lg border bg-muted/40 px-4 py-10 text-center" role="alert">
          <p className="font-medium">Analytics backend unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">ClickHouse is down or temporarily unreachable.</p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void loadChains()}>
            Retry
          </Button>
        </div>
      ) : loading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-lg border">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !selectedChain ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-14 text-center">
          <Filter className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No journey chains yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Save an ordered event-tag chain (seed → next → …), run detect on recent sessions, then read enter / exit
            drop-off here.
          </p>
          {canWrite ? (
            <Button className="mt-5 gap-1.5" onClick={() => void openCreate()}>
              <Plus className="h-4 w-4" />
              Create first chain
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="rounded-lg border bg-background p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold">{selectedChain.display_name || selectedChain.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-mono text-[11px]">{selectedChain.name}</span>
                  <span aria-hidden>·</span>
                  {selectedChain.tags.map((tag, i) => (
                    <span key={`${tag}-${i}`} className="inline-flex items-center gap-1.5">
                      {i > 0 ? <ArrowRight className="h-3 w-3" /> : null}
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {tag}
                      </Badge>
                    </span>
                  ))}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5"
                disabled={loadingGroups}
                onClick={() => void loadGroups(selectedChain.name)}
              >
                {loadingGroups ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh matches
              </Button>
            </div>

            {loadingGroups && journeys.length === 0 ? (
              <div className="flex min-h-[160px] items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : summary ? (
              <FunnelViz summary={summary} chain={selectedChain} />
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Matched journeys · showing {journeys.length}
                {groupsCount > journeys.length ? ` of ${groupsCount}` : ""}
              </p>
            </div>

            {journeys.length === 0 ? (
              <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                No matches stored for this chain yet. Run <span className="font-medium text-foreground">Detect matches</span>{" "}
                on recent sessions.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2.5 font-medium">Session</th>
                        <th className="px-3 py-2.5 font-medium">Entered</th>
                        <th className="px-3 py-2.5 font-medium">Exited / last step</th>
                        <th className="px-3 py-2.5 font-medium">Progress</th>
                        <th className="px-3 py-2.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journeys.map((j) => {
                        const steps = j.steps
                        const total = selectedChain.tags.length
                        const reached = steps.length
                        const complete =
                          Boolean(j.completed_at) || (total > 0 && reached >= total)
                        const last = steps[steps.length - 1]
                        return (
                          <tr key={`${j.session_id}-${j.started_at}`} className="border-b last:border-0">
                            <td className="px-3 py-2.5">
                              <button
                                type="button"
                                className="font-mono text-xs text-primary hover:underline"
                                onClick={() => onOpenSession(j.session_id)}
                                title={j.session_id}
                              >
                                {j.session_id.slice(0, 10)}…
                              </button>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="space-y-0.5">
                                <p className="font-mono text-[11px]" title={steps[0]?.tag}>
                                  {steps[0]?.tag ?? "—"}
                                </p>
                                <p
                                  className="text-xs text-muted-foreground"
                                  title={formatAbsoluteTime(j.started_at)}
                                >
                                  {formatRelativeTime(j.started_at)}
                                </p>
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="space-y-0.5">
                                <p className="font-mono text-[11px]" title={last?.tag}>
                                  {last?.tag ?? "—"}
                                </p>
                                <p
                                  className="text-xs text-muted-foreground"
                                  title={formatAbsoluteTime(j.completed_at || last?.timestamp || "")}
                                >
                                  {j.completed_at
                                    ? formatRelativeTime(j.completed_at)
                                    : last?.timestamp
                                      ? formatRelativeTime(last.timestamp)
                                      : "—"}
                                </p>
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className={cn(
                                      "h-full rounded-full",
                                      complete ? "bg-emerald-500" : "bg-amber-500",
                                    )}
                                    style={{
                                      width: `${total === 0 ? 0 : Math.min(100, Math.round((reached / total) * 100))}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs tabular-nums text-muted-foreground">
                                  {reached}/{total}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              {complete ? (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                >
                                  Completed
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                                >
                                  Dropped
                                </Badge>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create journey chain</DialogTitle>
            <DialogDescription>
              Click tags in order to define seed → next → … Detection finds that successive sequence across sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-chain-name">Chain name (stable id)</Label>
                <Input
                  id="new-chain-name"
                  value={chainName}
                  onChange={(e) => setChainName(e.target.value)}
                  placeholder="search_to_play"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-chain-display">Display name</Label>
                <Input
                  id="new-chain-display"
                  value={chainDisplay}
                  onChange={(e) => setChainDisplay(e.target.value)}
                  placeholder="Search → Play"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Chain order</Label>
              {draftTags.length === 0 ? (
                <p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
                  No steps yet — click tags below
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-muted/30 px-3 py-3">
                  {draftTags.map((tag, i) => (
                    <span key={`${tag}-${i}`} className="inline-flex items-center gap-1">
                      {i > 0 ? <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" /> : null}
                      <button
                        type="button"
                        className="rounded-md border bg-background px-2 py-1 font-mono text-[11px] hover:border-destructive/50"
                        title="Remove step"
                        onClick={() => setDraftTags((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        {tag}
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="tag-filter">Event tags</Label>
                {loadingTags ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
              </div>
              <Input
                id="tag-filter"
                value={tagQuery}
                onChange={(e) => setTagQuery(e.target.value)}
                placeholder="Filter tags…"
                className="h-9"
              />
              <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                {filteredTags.length === 0 ? (
                  <p className="px-1 py-3 text-center text-xs text-muted-foreground">No tags found</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {filteredTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setDraftTags((prev) => [...prev, tag])}
                        className="rounded-md border bg-background px-2 py-1 font-mono text-[11px] hover:bg-muted"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save chain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
