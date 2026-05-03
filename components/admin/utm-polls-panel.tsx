"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { format } from "date-fns"
import { Loader2, RefreshCw, ChevronDown, ChevronUp, Link as LinkIcon, Activity, Globe, MousePointerClick, Hash, Clock } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { AdminUtmBuilder } from "@/components/admin/utm-builder"

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
  const [tab, setTab] = useState("analyze")
  const [showBuilder, setShowBuilder] = useState(false)

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
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [savedLinks, setSavedLinks] = useState<any[]>([])
  const [savedCount, setSavedCount] = useState(0)
  const [savedLoading, setSavedLoading] = useState(false)
  const [savedOffset, setSavedOffset] = useState(0)

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
    [listLimit, listOffset, applied, toast],
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
  }, [applied, groupLimit, toast])

  // Fetch both sets of data whenever applied filters change so the summary rail is accurate
  useEffect(() => {
    void fetchList()
  }, [fetchList])

  useEffect(() => {
    void fetchAnalyze()
  }, [fetchAnalyze])

  const fetchSavedLinks = useCallback(async () => {
    setSavedLoading(true)
    try {
      const res = await apiClient.adminListUtmGeneratedUrls({
        limit: 50,
        offset: savedOffset,
      })
      setSavedLinks(res.utm_generated_urls || [])
      setSavedCount(res.count || 0)
    } catch (e) {
      toast({ title: "Error", description: "Failed to load saved links.", variant: "destructive" })
    } finally {
      setSavedLoading(false)
    }
  }, [savedOffset, toast])

  useEffect(() => {
    if (tab === "saved") void fetchSavedLinks()
  }, [tab, fetchSavedLinks])

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

  // Compute summary metrics
  const summary = useMemo(() => {
    let topSource = { name: "—", count: 0 }
    let topMedium = { name: "—", count: 0 }
    let topCampaign = { name: "—", count: 0 }

    const sourceMap = new Map<string, number>()
    const mediumMap = new Map<string, number>()
    const campaignMap = new Map<string, number>()

    analysis.forEach((a) => {
      if (a.utm_source) sourceMap.set(a.utm_source, (sourceMap.get(a.utm_source) || 0) + a.event_count)
      if (a.utm_medium) mediumMap.set(a.utm_medium, (mediumMap.get(a.utm_medium) || 0) + a.event_count)
      if (a.utm_campaign) campaignMap.set(a.utm_campaign, (campaignMap.get(a.utm_campaign) || 0) + a.event_count)
    })

    sourceMap.forEach((count, name) => { if (count > topSource.count) topSource = { name, count } })
    mediumMap.forEach((count, name) => { if (count > topMedium.count) topMedium = { name, count } })
    campaignMap.forEach((count, name) => { if (count > topCampaign.count) topCampaign = { name, count } })

    let lastActivity = "—"
    if (rows.length > 0) {
      const firstRow = rows[0] as any
      if (firstRow.created_at) {
        try {
          lastActivity = format(new Date(firstRow.created_at), "MMM d, HH:mm")
        } catch {
          lastActivity = "Unknown"
        }
      }
    }

    return {
      topSource: topSource.name,
      topMedium: topMedium.name,
      topCampaign: topCampaign.name,
      lastActivity,
    }
  }, [analysis, rows])

  return (
    <div className="space-y-4">
      {/* Collapsible UTM Builder */}
      <div className="mb-4">
        <Button 
          variant="outline" 
          onClick={() => setShowBuilder(!showBuilder)}
          className="w-full justify-between font-medium h-12 shadow-sm bg-background border-dashed hover:bg-muted/50"
        >
          <span className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Create tracked URL
          </span>
          {showBuilder ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        {showBuilder && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <AdminUtmBuilder />
          </div>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full relative">
        <TabsList className="w-full max-w-md grid grid-cols-3 mb-4">
          <TabsTrigger value="analyze">Analysis</TabsTrigger>
          <TabsTrigger value="list">Raw events</TabsTrigger>
          <TabsTrigger value="saved">Saved Links</TabsTrigger>
        </TabsList>

        {/* Top Summary Rail */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <Card className="bg-muted/10 shadow-sm border-primary/10">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-primary" /> Total Visits
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{totalEvents}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-muted/10 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" /> Top Source
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-lg font-semibold truncate" title={summary.topSource}>{summary.topSource}</div>
            </CardContent>
          </Card>

          <Card className="bg-muted/10 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                <MousePointerClick className="h-3.5 w-3.5" /> Top Medium
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-lg font-semibold truncate" title={summary.topMedium}>{summary.topMedium}</div>
            </CardContent>
          </Card>

          <Card className="bg-muted/10 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                <Hash className="h-3.5 w-3.5" /> Top Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-lg font-semibold truncate" title={summary.topCampaign}>{summary.topCampaign}</div>
            </CardContent>
          </Card>

          <Card className="bg-muted/10 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> Last Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-sm font-medium pt-1 text-muted-foreground">{summary.lastActivity}</div>
            </CardContent>
          </Card>
        </div>

        {/* Sticky Filter Bar */}
        <div className="sticky top-16 z-20 bg-background/95 backdrop-blur pb-4 mb-6 pt-2">
          <div className="rounded-lg border bg-card p-3 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Filters</p>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={applyFilters} className="h-8">Apply</Button>
                <Button type="button" size="sm" variant="outline" onClick={resetFilters} className="h-8">Reset</Button>
                <Button type="button" size="sm" variant="ghost" className="text-muted-foreground h-8" onClick={() => setShowAdvanced(!showAdvanced)}>
                  {showAdvanced ? <><ChevronUp className="h-4 w-4 mr-1" /> Hide</> : <><ChevronDown className="h-4 w-4 mr-1" /> More</>}
                </Button>
              </div>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="utm_source" className="text-xs">Source</Label>
                <Input id="utm_source" className="h-8 text-sm" value={draft.utm_source} onChange={(e) => setDraft((d) => ({ ...d, utm_source: e.target.value }))} placeholder="instagram" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="utm_medium" className="text-xs">Medium</Label>
                <Input id="utm_medium" className="h-8 text-sm" value={draft.utm_medium} onChange={(e) => setDraft((d) => ({ ...d, utm_medium: e.target.value }))} placeholder="social" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="utm_campaign" className="text-xs">Campaign</Label>
                <Input id="utm_campaign" className="h-8 text-sm" value={draft.utm_campaign} onChange={(e) => setDraft((d) => ({ ...d, utm_campaign: e.target.value }))} placeholder="summer_drop" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="created_after" className="text-xs">After Date (RFC3339)</Label>
                <Input id="created_after" className="h-8 text-sm font-mono text-muted-foreground" value={draft.created_after} onChange={(e) => setDraft((d) => ({ ...d, created_after: e.target.value }))} placeholder="2025-01-01T00:00:00Z" />
              </div>
            </div>

            {showAdvanced && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-3 mt-3 border-t border-dashed">
                <div className="space-y-1.5">
                  <Label htmlFor="session_id" className="text-xs">Session ID</Label>
                  <Input id="session_id" className="h-8 text-sm" value={draft.session_id} onChange={(e) => setDraft((d) => ({ ...d, session_id: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="path" className="text-xs">Path</Label>
                  <Input id="path" className="h-8 text-sm font-mono" value={draft.path} onChange={(e) => setDraft((d) => ({ ...d, path: e.target.value }))} placeholder="/watch/cypher2025" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="client_ip" className="text-xs">Client IP</Label>
                  <Input id="client_ip" className="h-8 text-sm font-mono" value={draft.client_ip} onChange={(e) => setDraft((d) => ({ ...d, client_ip: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="created_before" className="text-xs">Before Date</Label>
                  <Input id="created_before" className="h-8 text-sm font-mono text-muted-foreground" value={draft.created_before} onChange={(e) => setDraft((d) => ({ ...d, created_before: e.target.value }))} placeholder="2025-12-31T00:00:00Z" />
                </div>
              </div>
            )}
          </div>
        </div>

        <TabsContent value="analyze" className="space-y-4 outline-none">
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
                      <tr key={`${row.utm_source}-${row.utm_medium}-${row.utm_campaign}-${idx}`} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="px-3 py-2 font-medium break-words">{row.utm_source}</td>
                        <td className="px-3 py-2 break-words text-muted-foreground">{row.utm_medium ?? "—"}</td>
                        <td className="px-3 py-2 break-words text-muted-foreground">{row.utm_campaign ?? "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{row.event_count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4 outline-none">
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
                        <tr key={String(r.id ?? idx)} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{createdLabel}</td>
                          <td className="px-3 py-2 break-words max-w-[140px] font-medium">{rowCell(r, "utm_source", "utmSource")}</td>
                          <td className="px-3 py-2 break-words max-w-[120px] text-muted-foreground">{rowCell(r, "utm_medium", "utmMedium")}</td>
                          <td className="px-3 py-2 break-words max-w-[160px] text-muted-foreground">{rowCell(r, "utm_campaign", "utmCampaign")}</td>
                          <td className="px-3 py-2 break-words max-w-[120px] text-muted-foreground">{rowCell(r, "utm_term", "utmTerm")}</td>
                          <td className="px-3 py-2 break-words max-w-[120px] text-muted-foreground">{rowCell(r, "utm_content", "utmContent")}</td>
                          <td className="px-3 py-2 break-all max-w-[140px] font-mono text-xs text-muted-foreground/70">{rowCell(r, "session_id", "sessionId")}</td>
                          <td className="px-3 py-2 break-all max-w-[180px] font-mono text-xs">{rowCell(r, "path")}</td>
                          <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-muted-foreground/70">{rowCell(r, "client_ip", "clientIp")}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {listCount > listLimit && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t mt-4">
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

        <TabsContent value="saved" className="space-y-4 outline-none">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => void fetchSavedLinks()} disabled={savedLoading}>
                {savedLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="ml-1">Refresh</span>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Total <span className="font-medium text-foreground">{savedCount}</span> saved links
            </p>
          </div>

          {savedLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-lg border bg-background shadow-sm overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="h-10 px-3 text-left font-semibold">Created</th>
                    <th className="h-10 px-3 text-left font-semibold">Label</th>
                    <th className="h-10 px-3 text-left font-semibold">Source</th>
                    <th className="h-10 px-3 text-left font-semibold">URL</th>
                    <th className="h-10 px-3 text-center font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {savedLinks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="h-24 px-3 text-center text-muted-foreground">
                        No saved links found.
                      </td>
                    </tr>
                  ) : (
                    savedLinks.map((row) => {
                      let createdLabel = row.created_at
                      if (createdLabel) {
                        try { createdLabel = format(new Date(createdLabel), "MMM d, yyyy HH:mm") } catch {}
                      }
                      return (
                        <tr key={row.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{createdLabel}</td>
                          <td className="px-3 py-2 font-medium">{row.label}</td>
                          <td className="px-3 py-2">{row.utm_source}</td>
                          <td className="px-3 py-2 font-mono text-xs max-w-[300px] truncate" title={row.url}>{row.url}</td>
                          <td className="px-3 py-2 text-center">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                navigator.clipboard.writeText(row.url)
                                toast({ title: "Copied", description: "URL copied to clipboard." })
                              }}
                            >
                              Copy
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {savedCount > 50 && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t mt-4">
              <p className="text-sm text-muted-foreground">
                Page {Math.floor(savedOffset / 50) + 1} of {Math.max(1, Math.ceil(savedCount / 50))}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={savedOffset === 0 || savedLoading}
                  onClick={() => setSavedOffset((o) => Math.max(0, o - 50))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={savedOffset + savedLinks.length >= savedCount || savedLoading}
                  onClick={() => setSavedOffset((o) => o + 50)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
