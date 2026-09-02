"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft, ExternalLink, Lightbulb, Loader2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { adminApiClient } from "@/lib/admin-api-client"
import { useToast } from "@/hooks/use-toast"
import type { FeedbackSubmission } from "@/lib/types/feedback"
import { getFeatureRequestDisplayTitle, parseFeedbackDescription } from "@/lib/feedback/parse-feature-request"
import { AdminFeatureRequestBody } from "@/components/admin/admin-feature-request-body"
import { FeedbackTypeBadge } from "@/components/admin/feedback-type-badge"
import { cn } from "@/lib/utils"

function platformBadgeClass(platform: string): string {
  if (platform === "ios") return "bg-blue-500/15 text-blue-700 dark:text-blue-400"
  if (platform === "android") return "bg-green-500/15 text-green-700 dark:text-green-400"
  return "bg-muted text-muted-foreground"
}

function formatDate(value?: string): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, "MMM d, yyyy · h:mm a")
}

export function AdminFeedbackDetail({ feedbackId }: { feedbackId: string }) {
  const { toast } = useToast()
  const [feedback, setFeedback] = useState<FeedbackSubmission | null>(null)
  const [submitterUsername, setSubmitterUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true)
      const full = await adminApiClient.adminGetFeedback(feedbackId)
      setFeedback(full)
      setSubmitterUsername(null)

      if (full.user_id) {
        try {
          const usersRes = await adminApiClient.adminListUsers({ uid: full.user_id, limit: 1 })
          const user = usersRes.users?.[0]
          const username = String(user?.username ?? user?.user_username ?? "").trim()
          setSubmitterUsername(username || null)
        } catch {
          setSubmitterUsername(null)
        }
      }
    } catch (err) {
      toast({
        title: "Could not load feedback",
        description: err instanceof Error ? err.message : "Could not load feedback.",
        variant: "destructive",
      })
      setFeedback(null)
    } finally {
      setLoading(false)
    }
  }, [feedbackId, toast])

  useEffect(() => {
    void loadFeedback()
  }, [loadFeedback])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!feedback) {
    return (
      <div className="space-y-4 py-8">
        <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
          <Link href="/admin/dashboard?section=feedback">
            <ArrowLeft className="h-4 w-4" />
            Back to feedback
          </Link>
        </Button>
        <p className="text-muted-foreground">This feedback could not be found.</p>
      </div>
    )
  }

  const submitterDisplay = !feedback.user_id
    ? "Anonymous"
    : submitterUsername
      ? `@${submitterUsername}`
      : "Unknown user"

  const contextRows: {
    label: string
    value: string
    mailto?: boolean
    profileHref?: string
  }[] = [
    { label: "Platform", value: feedback.platform },
    { label: "App version", value: feedback.app_version || "—" },
    {
      label: "Username",
      value: submitterDisplay,
      profileHref: submitterUsername
        ? `/profile/${encodeURIComponent(submitterUsername)}`
        : undefined,
    },
    {
      label: "Email",
      value: feedback.email ?? "—",
      mailto: Boolean(feedback.email),
    },
    { label: "Allow contact", value: feedback.allow_contact ? "Yes" : "No" },
    { label: "Client IP", value: feedback.client_ip ?? "—" },
    { label: "Email sent", value: feedback.email_sent ? "Yes" : "No" },
  ]

  const parsed = parseFeedbackDescription(feedback.description)
  const isFeatureRequest = parsed.kind === "feature-request"
  const featureName =
    isFeatureRequest ? getFeatureRequestDisplayTitle(parsed, { email: feedback.email }) : undefined

  return (
    <div className="space-y-8 max-w-6xl min-w-0 w-full">
      <div className="space-y-4 min-w-0">
        <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2 h-8 text-muted-foreground">
          <Link href="/admin/dashboard?section=feedback">
            <ArrowLeft className="h-4 w-4" />
            All feedback
          </Link>
        </Button>

        <div className="rounded-xl border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <FeedbackTypeBadge parsed={parsed} />
                {isFeatureRequest && featureName ? (
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Feature name
                  </p>
                ) : null}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight break-words [overflow-wrap:anywhere]">
                {isFeatureRequest ? featureName || "Untitled feature idea" : "Feedback submission"}
              </h1>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground font-mono break-all">
                {feedback.id}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase shrink-0",
                platformBadgeClass(feedback.platform),
              )}
            >
              {feedback.platform}
            </span>
          </div>

          <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
            <span>Submitted {formatDate(feedback.created_at)}</span>
            {feedback.email_sent && feedback.email_sent_at && (
              <span>Notified {formatDate(feedback.email_sent_at)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 min-w-0">
        <div className="lg:col-span-3 space-y-6 min-w-0">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4 bg-muted/30 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                {isFeatureRequest ? (
                  <>
                    <Lightbulb className="h-5 w-5" />
                    Feature idea
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-5 w-5" />
                    Feedback
                  </>
                )}
              </CardTitle>
              {isFeatureRequest ? (
                <CardDescription>Submitted from the public feature request form</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              {isFeatureRequest ? (
                <AdminFeatureRequestBody parsed={parsed} submitterEmail={feedback.email} />
              ) : (
                <blockquote className="rounded-lg bg-muted/50 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] border-l-4 border-primary/30">
                  {feedback.description || "—"}
                </blockquote>
              )}

              {feedback.screenshot_url && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Screenshot</p>
                  <Link
                    href={feedback.screenshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full sm:max-w-md rounded-lg overflow-hidden border bg-muted"
                  >
                    <img
                      src={feedback.screenshot_url}
                      alt="Feedback screenshot"
                      className="h-auto w-full object-contain"
                    />
                  </Link>
                  <Button variant="outline" size="sm" asChild className="gap-2">
                    <Link href={feedback.screenshot_url} target="_blank" rel="noopener noreferrer">
                      Open screenshot
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              )}

              {feedback.page_url && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Page</p>
                    <Link
                      href={feedback.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all inline-flex items-center gap-1"
                    >
                      {feedback.page_url}
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Details</CardTitle>
              <CardDescription>System and account context for this submission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                {contextRows.map((row) => (
                  <div key={row.label} className="rounded-lg border bg-muted/20 px-3 py-2.5">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                      {row.label}
                    </dt>
                    <dd
                      className={cn(
                        "min-w-0 break-words [overflow-wrap:anywhere] font-medium",
                        row.label !== "Email" && row.label !== "Username" && "capitalize",
                      )}
                    >
                      {row.mailto ? (
                        <a href={`mailto:${row.value}`} className="text-primary hover:underline">
                          {row.value}
                        </a>
                      ) : row.profileHref ? (
                        <Link href={row.profileHref} className="text-primary hover:underline">
                          {row.value}
                        </Link>
                      ) : (
                        row.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              {feedback.user_agent && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">User agent</p>
                    <p className="text-xs text-muted-foreground break-words [overflow-wrap:anywhere]">
                      {feedback.user_agent}
                    </p>
                  </div>
                </>
              )}

              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <Link href="/admin/dashboard?section=feedback">Back to list</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
