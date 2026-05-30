"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  ArrowLeft,
  ExternalLink,
  Flag,
  Loader2,
  User,
  Video,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import type { ContentFlag, ContentFlagStatus } from "@/lib/types/content-flag"
import { applyReporterDisplay, buildFlagDisplayModel } from "@/lib/report/flag-display"
import { getFlagApiErrorMessage } from "@/lib/report/flag-api-error"
import { cn } from "@/lib/utils"

const DEFAULT_STATUSES: ContentFlagStatus[] = [
  "pending",
  "under_review",
  "open",
  "escalated",
  "resolved",
  "dismissed",
  "closed",
]

function statusBadgeClass(status: string): string {
  if (status === "pending") return "bg-amber-500/15 text-amber-700 dark:text-amber-400"
  if (status === "escalated") return "bg-red-500/15 text-red-700 dark:text-red-400"
  if (["resolved", "dismissed", "closed"].includes(status)) {
    return "bg-muted text-muted-foreground"
  }
  return "bg-blue-500/15 text-blue-700 dark:text-blue-400"
}

function ReportTypeIcon({ reportType }: { reportType: string }) {
  if (reportType === "video") return <Video className="h-5 w-5" />
  if (reportType === "comment") return <MessageSquare className="h-5 w-5" />
  return <User className="h-5 w-5" />
}

export function AdminFlagDetail({ flagId }: { flagId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [flag, setFlag] = useState<ContentFlag | null>(null)
  const [loading, setLoading] = useState(true)
  const [statuses, setStatuses] = useState<ContentFlagStatus[]>(DEFAULT_STATUSES)
  const [editStatus, setEditStatus] = useState<ContentFlagStatus>("pending")
  const [editNotes, setEditNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [display, setDisplay] = useState<ReturnType<typeof buildFlagDisplayModel> | null>(null)

  const applyFlagToUi = useCallback(
    (full: ContentFlag, reporterModel?: ReturnType<typeof buildFlagDisplayModel>) => {
      const baseModel = reporterModel ?? buildFlagDisplayModel(full)
      setFlag(full)
      setDisplay(baseModel)
      setEditStatus(full.status)
      setEditNotes(full.resolution_notes ?? "")
    },
    [],
  )

  const loadFlag = useCallback(async () => {
    try {
      setLoading(true)
      const [full, cfg] = await Promise.all([
        apiClient.adminGetContentFlag(flagId),
        apiClient.getFlagsConfig().catch(() => null),
      ])
      if (cfg?.statuses?.length) setStatuses(cfg.statuses as ContentFlagStatus[])

      let model = buildFlagDisplayModel(full)
      try {
        const usersRes = await apiClient.adminListUsers({ uid: full.reporter_id, limit: 1 })
        const reporter = usersRes.users?.[0]
        if (reporter) {
          model = applyReporterDisplay(
            model,
            {
              username: reporter.username ?? reporter.user_username,
              name: reporter.name,
              uid: reporter.uid ?? reporter.user_uid,
            },
            full.reporter_id,
          )
        } else {
          model = applyReporterDisplay(model, null, full.reporter_id)
        }
      } catch {
        model = applyReporterDisplay(model, null, full.reporter_id)
      }

      applyFlagToUi(full, model)
    } catch (err) {
      toast({
        title: "Could not load report",
        description: getFlagApiErrorMessage(err, "Could not load report."),
        variant: "destructive",
      })
      setFlag(null)
    } finally {
      setLoading(false)
    }
  }, [flagId, toast, applyFlagToUi])

  useEffect(() => {
    void loadFlag()
  }, [loadFlag])

  const handleSave = async () => {
    if (!flag) return

    const currentNotes = flag.resolution_notes ?? ""
    if (editStatus === flag.status && editNotes === currentNotes) {
      toast({ title: "No changes to save" })
      return
    }

    const body: { status?: ContentFlagStatus; resolution_notes?: string } = {}
    if (editStatus !== flag.status) body.status = editStatus
    if (editNotes !== currentNotes) body.resolution_notes = editNotes

    try {
      setSaving(true)
      let updated = await apiClient.adminUpdateContentFlag(flag.id, body)

      if (!updated.reference_id || !updated.status) {
        updated = await apiClient.adminGetContentFlag(flag.id)
      }

      let model = buildFlagDisplayModel(updated)
      if (display) {
        model = {
          ...model,
          reporterLabel: display.reporterLabel,
          reporterSubLabel: display.reporterSubLabel,
        }
      }
      applyFlagToUi(updated, model)

      toast({
        title: "Report updated",
        description: `Status is now ${updated.status.replace(/_/g, " ")}.`,
      })
    } catch (err) {
      toast({
        title: "Update failed",
        description: getFlagApiErrorMessage(err, "Could not save moderation update."),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!flag) {
    return (
      <div className="space-y-4 py-8">
        <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
          <Link href="/admin/dashboard?section=flags">
            <ArrowLeft className="h-4 w-4" />
            Back to reports
          </Link>
        </Button>
        <p className="text-muted-foreground">This report could not be found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl min-w-0 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3 min-w-0">
          <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2 h-8">
            <Link href="/admin/dashboard?section=flags">
              <ArrowLeft className="h-4 w-4" />
              All reports
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-mono">
              {display?.referenceId ?? flag.reference_id}
            </h1>
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize",
                statusBadgeClass(flag.status),
              )}
            >
              {display?.statusLabel ?? flag.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Filed {format(new Date(flag.created_at), "MMMM d, yyyy 'at' h:mm a")}
            {flag.updated_at !== flag.created_at && (
              <> · Updated {format(new Date(flag.updated_at), "MMM d, yyyy h:mm a")}</>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 min-w-0">
        <div className="lg:col-span-3 space-y-6 min-w-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ReportTypeIcon reportType={flag.report_type} />
                Reported content
              </CardTitle>
              <CardDescription>{display?.reportTypeLabel ?? flag.report_type} report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                {display?.thumbnailUrl && (
                  <div className="shrink-0 w-36 sm:w-44 aspect-video rounded-lg overflow-hidden bg-muted border">
                    <img
                      src={display?.thumbnailUrl ?? ""}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-semibold text-lg leading-snug break-words">{display?.targetTitle ?? "—"}</p>
                  {display?.targetSubtitle && (
                    <p className="text-sm text-muted-foreground">{display.targetSubtitle}</p>
                  )}
                  {display?.messagePreview && (
                    <blockquote className="mt-3 text-sm border-l-2 border-muted-foreground/30 pl-3 text-foreground/90 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                      {display.messagePreview}
                    </blockquote>
                  )}
                  {display?.targetHref && (
                    <Button variant="outline" size="sm" asChild className="mt-3 gap-2">
                      <Link href={display?.targetHref ?? "#"} target="_blank" rel="noopener noreferrer">
                        Open on Hiffi
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {(display?.contextRows.length ?? 0) > 0 && (
                <dl className="grid gap-2 pt-2 border-t text-sm">
                  {display!.contextRows.map((row) => (
                    <div key={row.label} className="flex gap-2">
                      <dt className="text-muted-foreground w-24 shrink-0">{row.label}</dt>
                      <dd className="min-w-0 break-words [overflow-wrap:anywhere]">
                        {row.href ? (
                          <Link href={row.href} className="text-primary hover:underline" target="_blank">
                            {row.value}
                          </Link>
                        ) : (
                          row.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>

          {display?.reporterDescription && (
            <Card className="min-w-0 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Reporter&apos;s description</CardTitle>
              </CardHeader>
              <CardContent className="min-w-0">
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-all max-w-full overflow-hidden">
                  {display.reporterDescription}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Technical details</CardTitle>
            </CardHeader>
            <CardContent className="text-xs font-mono space-y-2 text-muted-foreground break-all">
              <p>
                <span className="text-foreground/70">Report ID:</span> {flag.id}
              </p>
              <p>
                <span className="text-foreground/70">Target ID:</span> {flag.target_id}
              </p>
              <p>
                <span className="text-foreground/70">Target type:</span> {flag.target_type}
              </p>
              <p>
                <span className="text-foreground/70">Reporter UID:</span> {flag.reporter_id}
              </p>
              {flag.moderator_id && (
                <p>
                  <span className="text-foreground/70">Last moderator:</span> {flag.moderator_id}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <dl className="space-y-3">
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Type</dt>
                  <dd className="font-medium mt-0.5">{display?.reportTypeLabel}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Reason</dt>
                  <dd className="font-medium mt-0.5">{display?.reasonLabel}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Reporter</dt>
                  <dd className="font-medium mt-0.5">{display?.reporterLabel}</dd>
                  {display?.reporterSubLabel && (
                    <dd className="text-muted-foreground text-xs mt-0.5">{display.reporterSubLabel}</dd>
                  )}
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Moderation</CardTitle>
              <CardDescription>Update status and internal notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="flag-detail-status">Status</Label>
                <select
                  id="flag-detail-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ContentFlagStatus)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  disabled={saving}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="flag-detail-notes">Resolution notes</Label>
                <Textarea
                  id="flag-detail-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  placeholder="Internal notes for your team…"
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">Leave empty and save to clear existing notes.</p>
              </div>
              {flag.resolved_at && (
                <p className="text-xs text-muted-foreground">
                  Resolved {format(new Date(flag.resolved_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}
              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
                <Button variant="outline" onClick={() => router.push("/admin/dashboard?section=flags")}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
