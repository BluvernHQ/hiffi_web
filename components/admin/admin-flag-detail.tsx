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
import { Separator } from "@/components/ui/separator"
import { adminApiClient } from "@/lib/admin-api-client"
import { useToast } from "@/hooks/use-toast"
import { useAdminPermissions } from "@/hooks/use-admin-permissions"
import type { ContentFlag, ContentFlagStatus } from "@/lib/types/content-flag"
import { applyReporterDisplay, buildFlagDisplayModel } from "@/lib/report/flag-display"
import { getFlagApiErrorMessage } from "@/lib/report/flag-api-error"
import { getFlagTargetHref } from "@/lib/report/flag-links"
import { getAdminFlagTargetLinks, getAdminUserTableLink } from "@/lib/report/admin-flag-links"
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
const MAX_RESOLUTION_NOTES_LENGTH = 500
const RESOLUTION_NOTES_ALLOWED_REGEX = /^[A-Za-z0-9\s]*$/

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
  const { canWrite } = useAdminPermissions()
  const router = useRouter()
  const { toast } = useToast()
  const [flag, setFlag] = useState<ContentFlag | null>(null)
  const [loading, setLoading] = useState(true)
  const [statuses, setStatuses] = useState<ContentFlagStatus[]>(DEFAULT_STATUSES)
  const [editStatus, setEditStatus] = useState<ContentFlagStatus>("pending")
  const [editNotes, setEditNotes] = useState("")
  const [notesLimitReached, setNotesLimitReached] = useState(false)
  const [notesValidationError, setNotesValidationError] = useState<string | null>(null)
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
        adminApiClient.adminGetContentFlag(flagId),
        adminApiClient.getFlagsConfig().catch(() => null),
      ])
      if (cfg?.statuses?.length) setStatuses(cfg.statuses as ContentFlagStatus[])

      let model = buildFlagDisplayModel(full)
      try {
        const usersRes = await adminApiClient.adminListUsers({ uid: full.reporter_id, limit: 1 })
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
    if (!RESOLUTION_NOTES_ALLOWED_REGEX.test(editNotes)) {
      setNotesValidationError("Resolution notes can only contain letters, numbers, and spaces.")
      toast({
        title: "Invalid resolution notes",
        description: "Remove symbols before saving.",
        variant: "destructive",
      })
      return
    }
    setNotesValidationError(null)

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
      let updated = await adminApiClient.adminUpdateContentFlag(flag.id, body)

      if (!updated.reference_id || !updated.status) {
        updated = await adminApiClient.adminGetContentFlag(flag.id)
      }

      let model = buildFlagDisplayModel(updated)
      if (display) {
        model = {
          ...model,
          reporterLabel: display.reporterLabel,
          reporterSubLabel: display.reporterSubLabel,
          reporterUsername: display.reporterUsername,
          reporterUid: display.reporterUid,
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

  const savedNotes = flag.resolution_notes ?? ""
  const hasChanges = editStatus !== flag.status || editNotes !== savedNotes
  const returnTo = `/admin/dashboard?section=flags&flagId=${encodeURIComponent(flag.id)}`
  const adminTargetLinks = getAdminFlagTargetLinks(flag, { returnTo })
  const publicTargetHref = getFlagTargetHref(flag)
  const reporterAdminHref = getAdminUserTableLink({
    username: display?.reporterUsername,
    uid: display?.reporterUid ?? flag.reporter_id,
    returnTo,
  })

  const contextRowHref = (row: { label: string; value: string; href?: string }) => {
    if (row.label === "Account") {
      const username = row.value.replace(/^@/, "").trim()
      return getAdminUserTableLink({ username, returnTo })
    }
    return row.href ?? null
  }

  return (
    <div className="space-y-8 max-w-6xl min-w-0 w-full">
      <div className="space-y-4 min-w-0">
        <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2 h-8 text-muted-foreground">
          <Link href="/admin/dashboard?section=flags">
            <ArrowLeft className="h-4 w-4" />
            All reports
          </Link>
        </Button>

        <div className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2 min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Case reference</p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-mono break-all">
                {display?.referenceId ?? flag.reference_id}
              </h1>
            </div>
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize shrink-0",
                statusBadgeClass(flag.status),
              )}
            >
              {display?.statusLabel ?? flag.status.replace(/_/g, " ")}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 font-medium">
              {display?.reportTypeLabel ?? flag.report_type}
            </span>
            <span className="inline-flex items-center rounded-md border px-2.5 py-1 text-muted-foreground">
              {display?.reasonLabel ?? flag.reason}
            </span>
          </div>

          <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
            <span>
              Filed {format(new Date(flag.created_at), "MMM d, yyyy · h:mm a")}
            </span>
            {flag.updated_at !== flag.created_at && (
              <span>
                Updated {format(new Date(flag.updated_at), "MMM d, yyyy · h:mm a")}
              </span>
            )}
            {flag.resolved_at && (
              <span>
                Resolved {format(new Date(flag.resolved_at), "MMM d, yyyy · h:mm a")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 min-w-0">
        <div className="lg:col-span-3 space-y-6 min-w-0">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4 bg-muted/30 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <ReportTypeIcon reportType={flag.report_type} />
                Reported content
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                {display?.thumbnailUrl ? (
                  <div className="shrink-0 w-full sm:w-40 aspect-video rounded-lg overflow-hidden bg-muted border">
                    <img
                      src={display.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-muted border">
                    <ReportTypeIcon reportType={flag.report_type} />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="font-semibold text-lg leading-snug break-words">{display?.targetTitle ?? "—"}</p>
                  {display?.targetSubtitle && (
                    <p className="text-sm text-muted-foreground">{display.targetSubtitle}</p>
                  )}
                  {display?.messagePreview && (
                    <blockquote className="rounded-lg bg-muted/50 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] border-l-4 border-primary/30">
                      {display.messagePreview}
                    </blockquote>
                  )}
                  {(adminTargetLinks.length > 0 || publicTargetHref) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {adminTargetLinks.map((link) => (
                        <Button key={link.href} size="sm" asChild>
                          <Link href={link.href}>{link.label}</Link>
                        </Button>
                      ))}
                      {publicTargetHref && (
                        <Button variant="outline" size="sm" asChild className="gap-2">
                          <Link href={publicTargetHref} target="_blank" rel="noopener noreferrer">
                            Open on site
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {(display?.contextRows.length ?? 0) > 0 && (
                <>
                  <Separator />
                  <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                    {display!.contextRows.map((row) => {
                      const href = contextRowHref(row)
                      return (
                      <div key={row.label} className="rounded-lg border bg-muted/20 px-3 py-2.5">
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                          {row.label}
                        </dt>
                        <dd className="min-w-0 break-words [overflow-wrap:anywhere] font-medium">
                          {href ? (
                            <Link href={href} className="text-primary hover:underline">
                              {row.value}
                            </Link>
                          ) : (
                            row.value
                          )}
                        </dd>
                      </div>
                      )
                    })}
                  </dl>
                </>
              )}
            </CardContent>
          </Card>

          {display?.reporterDescription && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Reporter&apos;s note</CardTitle>
                <CardDescription>Additional context from the person who filed this report</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-lg bg-muted/40 px-4 py-3">
                  {display.reporterDescription}
                </p>
              </CardContent>
            </Card>
          )}

        </div>

        <div className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Moderation
              </CardTitle>
              <CardDescription>Review and update this case</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted-foreground shrink-0">Reporter</dt>
                  <dd className="text-right font-medium min-w-0">
                    {reporterAdminHref ? (
                      <Link href={reporterAdminHref} className="text-primary hover:underline block truncate">
                        {display?.reporterLabel}
                      </Link>
                    ) : (
                      <span className="block truncate">{display?.reporterLabel}</span>
                    )}
                    {display?.reporterSubLabel && (
                      reporterAdminHref ? (
                        <Link
                          href={reporterAdminHref}
                          className="block text-xs text-muted-foreground hover:text-primary hover:underline font-normal mt-0.5"
                        >
                          {display.reporterSubLabel}
                        </Link>
                      ) : (
                        <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                          {display.reporterSubLabel}
                        </span>
                      )
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground shrink-0">Type</dt>
                  <dd className="font-medium capitalize">{display?.reportTypeLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground shrink-0">Reason</dt>
                  <dd className="font-medium text-right">{display?.reasonLabel}</dd>
                </div>
              </dl>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="flag-detail-status">Status</Label>
                <select
                  id="flag-detail-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ContentFlagStatus)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                  disabled={saving || !canWrite}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="flag-detail-notes">Resolution notes (optional)</Label>
                <Textarea
                  id="flag-detail-notes"
                  value={editNotes}
                  onChange={(e) => {
                    let nextValue = e.target.value
                    if (nextValue.length > MAX_RESOLUTION_NOTES_LENGTH) {
                      nextValue = nextValue.slice(0, MAX_RESOLUTION_NOTES_LENGTH)
                      setNotesLimitReached(true)
                    } else if (notesLimitReached) {
                      setNotesLimitReached(false)
                    }
                    if (!RESOLUTION_NOTES_ALLOWED_REGEX.test(nextValue)) {
                      const sanitized = nextValue.replace(/[^A-Za-z0-9\s]/g, "")
                      setEditNotes(sanitized)
                      setNotesValidationError("Symbols are not allowed.")
                      return
                    }
                    setNotesValidationError(null)
                    setEditNotes(nextValue)
                  }}
                  rows={4}
                  placeholder="Internal notes for your team…"
                  disabled={saving || !canWrite}
                  maxLength={MAX_RESOLUTION_NOTES_LENGTH}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Optional. Leave empty and save to clear notes.
                </p>
                <p className="text-xs text-muted-foreground text-right">
                  {editNotes.length}/{MAX_RESOLUTION_NOTES_LENGTH}
                </p>
                {notesLimitReached && (
                  <p className="text-xs text-destructive">
                    Maximum {MAX_RESOLUTION_NOTES_LENGTH} characters allowed.
                  </p>
                )}
                {notesValidationError && (
                  <p className="text-xs text-destructive">{notesValidationError}</p>
                )}
              </div>
              {canWrite && (
              <div className="flex flex-col gap-2 pt-1">
                <Button onClick={handleSave} disabled={saving || !hasChanges} className="w-full">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
                {!hasChanges && (
                  <p className="text-xs text-muted-foreground text-center">
                    No changes yet. Saving now will show a validation message.
                  </p>
                )}
              </div>
              )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/admin/dashboard?section=flags")}
                >
                  Back to queue
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
