"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { formatReportReason } from "@/lib/report/build-metadata"
import { getFlagApiErrorMessage } from "@/lib/report/flag-api-error"
import type { ContentFlag, FlagsConfigResponse, Phase1ReportType } from "@/lib/types/content-flag"
import { AuthDialog, AUTH_DIALOG_COPY } from "@/components/auth/auth-dialog"
import Link from "next/link"
import { Check, Copy, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

let cachedFlagsConfig: FlagsConfigResponse | null = null
let flagsConfigPromise: Promise<FlagsConfigResponse> | null = null

async function loadFlagsConfig(): Promise<FlagsConfigResponse> {
  if (cachedFlagsConfig) return cachedFlagsConfig
  if (!flagsConfigPromise) {
    flagsConfigPromise = apiClient.getFlagsConfig().then((config) => {
      cachedFlagsConfig = config
      return config
    })
  }
  return flagsConfigPromise
}

export interface ContentReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportType: Phase1ReportType
  targetId: string
  targetType: string
  metadata?: Record<string, unknown>
  contextLabel: string
}

export function ContentReportDialog({
  open,
  onOpenChange,
  reportType,
  targetId,
  targetType,
  metadata = {},
  contextLabel,
}: ContentReportDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [configLoading, setConfigLoading] = useState(false)
  const [reasons, setReasons] = useState<string[]>([])
  const [maxDescriptionLength, setMaxDescriptionLength] = useState(500)
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submittedFlag, setSubmittedFlag] = useState<ContentFlag | null>(null)
  const [copiedRef, setCopiedRef] = useState(false)

  const resetForm = useCallback(() => {
    setReason("")
    setDescription("")
    setSubmittedFlag(null)
    setCopiedRef(false)
  }, [])

  useEffect(() => {
    if (!open) {
      resetForm()
      return
    }
    if (!user) {
      onOpenChange(false)
      setAuthDialogOpen(true)
      return
    }

    let cancelled = false
    setConfigLoading(true)
    loadFlagsConfig()
      .then((config) => {
        if (cancelled) return
        const typeConfig = config.config?.[reportType]
        setReasons(typeConfig?.reasons ?? [])
        setMaxDescriptionLength(typeConfig?.max_description_length ?? 500)
        if (typeConfig?.reasons?.length) {
          setReason(typeConfig.reasons[0])
        }
      })
      .catch((err) => {
        if (cancelled) return
        toast({
          title: "Could not load report options",
          description: getFlagApiErrorMessage(err, "Please try again later."),
          variant: "destructive",
        })
        onOpenChange(false)
      })
      .finally(() => {
        if (!cancelled) setConfigLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, user, reportType, onOpenChange, resetForm, toast])

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({ title: "Select a reason", variant: "destructive" })
      return
    }
    if (description.length > maxDescriptionLength) {
      toast({
        title: "Description too long",
        description: `Maximum ${maxDescriptionLength} characters.`,
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const flag = await apiClient.createContentFlag({
        report_type: reportType,
        target_id: targetId,
        target_type: targetType,
        reason: reason.trim(),
        description: description.trim() || undefined,
        metadata,
        attachments: [],
      })
      setSubmittedFlag(flag)
    } catch (err) {
      toast({
        title: "Report not submitted",
        description: getFlagApiErrorMessage(err, "Something went wrong. Please try again."),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyReference = async () => {
    if (!submittedFlag?.reference_id) return
    try {
      await navigator.clipboard.writeText(submittedFlag.reference_id)
      setCopiedRef(true)
      setTimeout(() => setCopiedRef(false), 2000)
    } catch {
      toast({ title: "Could not copy", variant: "destructive" })
    }
  }

  const handleDialogOpenChange = (next: boolean) => {
    if (!next) resetForm()
    onOpenChange(next)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          {submittedFlag ? (
            <>
              <DialogHeader>
                <DialogTitle>Report submitted</DialogTitle>
                <DialogDescription>
                  Thank you for helping keep Hiffi safe. Save your case reference to track this report.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Case reference</p>
                <p className="font-mono text-sm font-semibold break-all">{submittedFlag.reference_id}</p>
                <p className="text-xs text-muted-foreground">
                  Status: <span className="capitalize">{submittedFlag.status.replace(/_/g, " ")}</span>
                </p>
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" asChild>
                  <Link href="/support/reports">View my reports</Link>
                </Button>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={handleCopyReference} className="gap-2">
                    {copiedRef ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiedRef ? "Copied" : "Copy reference"}
                  </Button>
                  <Button type="button" onClick={() => handleDialogOpenChange(false)}>
                    Done
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{contextLabel}</DialogTitle>
                <DialogDescription>
                  Reports are reviewed by our team. False reports may result in action on your account.
                </DialogDescription>
              </DialogHeader>

              {configLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="report-reason">Reason</Label>
                    <select
                      id="report-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                      disabled={submitting || reasons.length === 0}
                    >
                      {reasons.map((r) => (
                        <option key={r} value={r}>
                          {formatReportReason(r)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="report-description">
                      Additional details{" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Textarea
                      id="report-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the issue..."
                      rows={4}
                      maxLength={maxDescriptionLength}
                      disabled={submitting}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {description.length}/{maxDescriptionLength}
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || configLoading || !reason}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit report"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        title={AUTH_DIALOG_COPY.report.title}
        description={AUTH_DIALOG_COPY.report.description}
        signupLabel={AUTH_DIALOG_COPY.report.signupLabel}
        signinLabel={AUTH_DIALOG_COPY.report.signinLabel}
      />
    </>
  )
}
