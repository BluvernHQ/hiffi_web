"use client"

import { useCallback, useEffect, useState } from "react"
import { format } from "date-fns"
import { Loader2, RefreshCw } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

const LIST_LIMIT_OPTIONS = [25, 50, 100, 200] as const
const GROUP_LIMIT_OPTIONS = [50, 100, 200, 500] as const

type FilterForm = {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  session_id: string
  path: string
  client_ip: string
  created_after: string
  created_before: string
}

const emptyFilters: FilterForm = {
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  session_id: "",
  path: "",
  client_ip: "",
  created_after: "",
  created_before: "",
}

function rowCell(row: Record<string, unknown>, ...keys: string[]) {
  for (const k of keys) {
    const v = row[k]
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v)
  }
  return "—"
}

export function AdminUtmPollsPanel() {
  const { toast } = useToast()
  const [tab, setTab] = useState("list")

  const [draft, setDraft] = useState<FilterForm>({ ...emptyFilters })
  const [applied, setApplied] = useState<FilterForm>({ ...emptyFilters })

  const [listLimit, setListLimit] = useState(50)
  const [listOffset, setListOffset] = useState(0)
  const [rows, setRows] = useState<any[]>([])
  const [listCount, setListCount] = useState(0)
  const [listLoading, setListLoading] = useState(true)
  const [listRefreshing, setListRefreshing] = useState(false)

  const [groupLimit, setGroupLimit] = useState(100)
  const [analysis, setAnalysis] = useState<
    Array<{ utm_source: string; utm_medium?: string | null; utm_campaign?: string | null; event_count: number }>
  >([])
  const [totalEvents, setTotalEvents] = useState(0)
  const [analyzeLoading, setAnalyzeLoading] = useState(false)

  const fetchList = useCallback(
    async (isRefresh = false) => {
      let ok = false
      try {
        if (isRefresh) setListRefreshing(true)
        else setListLoading(true)
        const res = await apiClient.adminListUtmPollEvents({
          limit: listLimit,
          offset: listOffset,
          utm_source: applied.utm_source || undefined,
          utm_medium: applied.utm_medium || undefined,
          utm_campaign: applied.utm_campaign || undefined,
          session_id: applied.session_id || undefined,
          path: applied.path || undefined,
          client_ip: applied.client_ip || undefined,
          created_after: applied.created_after || undefined,
          created_before: applied.created_before || undefined,
        })
        setRows(res.utm_polls || [])
        setListCount(res.count || 0)
        ok = true
      } catch (e) {
        console.error("[admin] utm_polls list:", e)
        toast({ title: "Error", description: "Failed to load UTM poll events.", variant: "destructive" })
      } finally {
        setListLoading(false)
        setListRefreshing(false)
      }
      if (isRefresh && ok) {
        toast({ title: "UTM data refreshed", description: "List is up to date." })
      }
    },
    [listLimit, listOffset, applied],
  )

  const fetchAnalyze = useCallback(async () => {
    setAnalyzeLoading(true)
    try {
      const res = await apiClient.adminAnalyzeUtmPollEvents({
        limit: groupLimit,
        utm_source: applied.utm_source || undefined,
        utm_medium: applied.utm_medium || undefined,
        utm_campaign: applied.utm_campaign || undefined,
        session_id: applied.session_id || undefined,
        path: applied.path || undefined,
        client_ip: applied.client_ip || undefined,
        created_after: applied.created_after || undefined,
        created_before: applied.created_before || undefined,
      })
      setAnalysis(res.analysis || [])
      setTotalEvents(res.total_events ?? 0)
    } catch (e) {
      console.error("[admin] utm_polls analyze:", e)
      toast({ title: "Error", description: "Failed to load UTM analysis.", variant: "destructive" })
    } finally {
      setAnalyzeLoading(false)
    }
  }, [applied, groupLimit])

  useEffect(() => {
    if (tab !== "list") return
    void fetchList()
  }, [tab, fetchList])

  useEffect(() => {
    if (tab !== "analyze") return
    void fetchAnalyze()
  }, [tab, fetchAnalyze])

  const applyFilters = () => {
    setApplied({ ...draft })
    setListOffset(0)
  }

  const resetFilters = () => {
    setDraft({ ...emptyFilters })
    setApplied({ ...emptyFilters })
    setListOffset(0)
  }

  const listTotalPages = Math.max(1, Math.ceil(listCount / listLimit))
  const listPage = Math.floor(listOffset / listLimit) + 1

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full max-w-md grid grid-cols-2">
          <TabsTrigger value="list">Raw events</TabsTrigger>
          <TabsTrigger value="analyze">Analysis</TabsTrigger>
        </TabsList>

        <div className="rounded-lg border bg-background p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Filters apply to both tabs. Use RFC3339 for date bounds (e.g. <code className="text-xs">2025-01-15T00:00:00Z</code>
            ).
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="utm_source">utm_source (substring)</Label>
              <Input
                id="utm_source"
                value={draft.utm_source}
                onChange={(e) => setDraft((d) => ({ ...d, utm_source: e.target.value }))}
                placeholder="google"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="utm_medium">utm_medium</Label>
              <Input
                id="utm_medium"
                value={draft.utm_medium}
                onChange={(e) => setDraft((d) => ({ ...d, utm_medium: e.target.value }))}
                placeholder="cpc"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="utm_campaign">utm_campaign</Label>
              <Input
                id="utm_campaign"
                value={draft.utm_campaign}
                onChange={(e) => setDraft((d) => ({ ...d, utm_campaign: e.target.value }))}
                placeholder="spring_sale"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="session_id">session_id (exact)</Label>
              <Input
                id="session_id"
                value={draft.session_id}
                onChange={(e) => setDraft((d) => ({ ...d, session_id: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="path">path (substring)</Label>
              <Input
                id="path"
                value={draft.path}
                onChange={(e) => setDraft((d) => ({ ...d, path: e.target.value }))}
                placeholder="/watch/"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client_ip">client_ip (exact)</Label>
              <Input
                id="client_ip"
                value={draft.client_ip}
                onChange={(e) => setDraft((d) => ({ ...d, client_ip: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="created_after">created_after</Label>
              <Input
                id="created_after"
                value={draft.created_after}
                onChange={(e) => setDraft((d) => ({ ...d, created_after: e.target.value }))}
                placeholder="2025-01-01T00:00:00Z"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="created_before">created_before</Label>
              <Input
                id="created_before"
                value={draft.created_before}
                onChange={(e) => setDraft((d) => ({ ...d, created_before: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={applyFilters}>
              Apply filters
            </Button>
            <Button type="button" variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>

        <TabsContent value="list" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={listLimit}
                onChange={(e) => {
                  setListOffset(0)
                  setListLimit(Number(e.target.value))
                }}
              >
                {LIST_LIMIT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={() => void fetchList(true)} disabled={listRefreshing || listLoading}>
                {listRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="ml-1">Refresh</span>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Total <span className="font-medium text-foreground">{listCount}</span> rows
            </p>
          </div>

          {listLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-lg border bg-background shadow-sm overflow-x-auto">
              <table className="w-full min-w-[960px] text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="h-10 px-3 text-left font-semibold">Created</th>
                    <th className="h-10 px-3 text-left font-semibold">Source</th>
                    <th className="h-10 px-3 text-left font-semibold">Medium</th>
                    <th className="h-10 px-3 text-left font-semibold">Campaign</th>
                    <th className="h-10 px-3 text-left font-semibold">Term</th>
                    <th className="h-10 px-3 text-left font-semibold">Content</th>
                    <th className="h-10 px-3 text-left font-semibold">Session</th>
                    <th className="h-10 px-3 text-left font-semibold">Path</th>
                    <th className="h-10 px-3 text-left font-semibold">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="h-24 px-3 text-center text-muted-foreground">
                        No rows match the current filters.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, idx) => {
                      const r = row as Record<string, unknown>
                      const created = rowCell(r, "created_at", "createdAt")
                      let createdLabel = created
                      if (created !== "—") {
                        try {
                          createdLabel = format(new Date(String(created)), "MMM d, yyyy HH:mm")
                        } catch {
                          createdLabel = String(created)
                        }
                      }
                      return (
                        <tr key={String(r.id ?? idx)} className="border-b last:border-0 hover:bg-muted/40">
                          <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{createdLabel}</td>
                          <td className="px-3 py-2 break-words max-w-[140px]">{rowCell(r, "utm_source", "utmSource")}</td>
                          <td className="px-3 py-2 break-words max-w-[120px]">{rowCell(r, "utm_medium", "utmMedium")}</td>
                          <td className="px-3 py-2 break-words max-w-[160px]">{rowCell(r, "utm_campaign", "utmCampaign")}</td>
                          <td className="px-3 py-2 break-words max-w-[120px]">{rowCell(r, "utm_term", "utmTerm")}</td>
                          <td className="px-3 py-2 break-words max-w-[120px]">{rowCell(r, "utm_content", "utmContent")}</td>
                          <td className="px-3 py-2 break-all max-w-[140px] font-mono text-xs">{rowCell(r, "session_id", "sessionId")}</td>
                          <td className="px-3 py-2 break-all max-w-[180px] font-mono text-xs">{rowCell(r, "path")}</td>
                          <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">{rowCell(r, "client_ip", "clientIp")}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {listCount > listLimit && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Page {listPage} of {listTotalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={listOffset === 0 || listLoading}
                  onClick={() => setListOffset((o) => Math.max(0, o - listLimit))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={listOffset + rows.length >= listCount || listLoading}
                  onClick={() => setListOffset((o) => o + listLimit)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analyze" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-sm text-muted-foreground">Max groups</Label>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={groupLimit}
                onChange={(e) => setGroupLimit(Number(e.target.value))}
              >
                {GROUP_LIMIT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={() => void fetchAnalyze()} disabled={analyzeLoading}>
                {analyzeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="ml-1">Reload</span>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{totalEvents}</span> events after filters,{" "}
              <span className="font-medium text-foreground">{analysis.length}</span> groups shown
            </p>
          </div>

          {analyzeLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-lg border bg-background shadow-sm overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="h-10 px-3 text-left font-semibold">utm_source</th>
                    <th className="h-10 px-3 text-left font-semibold">utm_medium</th>
                    <th className="h-10 px-3 text-left font-semibold">utm_campaign</th>
                    <th className="h-10 px-3 text-right font-semibold">Events</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="h-24 px-3 text-center text-muted-foreground">
                        No grouped data for the current filters.
                      </td>
                    </tr>
                  ) : (
                    analysis.map((row, idx) => (
                      <tr key={`${row.utm_source}-${row.utm_medium}-${row.utm_campaign}-${idx}`} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="px-3 py-2 font-medium break-words">{row.utm_source}</td>
                        <td className="px-3 py-2 break-words">{row.utm_medium ?? "—"}</td>
                        <td className="px-3 py-2 break-words">{row.utm_campaign ?? "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{row.event_count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
