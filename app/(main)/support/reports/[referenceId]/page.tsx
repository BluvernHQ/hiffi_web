"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { Check, Copy, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"
import { buildLoginUrl } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import type { ContentFlag } from "@/lib/types/content-flag"
import { formatReportReason } from "@/lib/report/build-metadata"
import { getFlagTargetHref } from "@/lib/report/flag-links"
import { getFlagApiErrorMessage } from "@/lib/report/flag-api-error"
import { useToast } from "@/hooks/use-toast"

function formatStatus(status: string): string {
  return status.replace(/_/g, " ")
}

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const referenceId = decodeURIComponent(String(params.referenceId ?? ""))
  const [flag, setFlag] = useState<ContentFlag | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace(buildLoginUrl(`/support/reports/${encodeURIComponent(referenceId)}`))
      return
    }
    if (!referenceId) {
      setError("Invalid case reference")
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    apiClient
      .getContentFlagByReference(referenceId)
      .then((data) => {
        if (!cancelled) setFlag(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getFlagApiErrorMessage(err, "Could not load report"))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, user, router, referenceId])

  const handleCopy = async () => {
    if (!flag?.reference_id) return
    try {
      await navigator.clipboard.writeText(flag.reference_id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: "Could not copy", variant: "destructive" })
    }
  }

  const targetHref = flag ? getFlagTargetHref(flag) : null

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Link href="/support/reports" className="text-sm text-primary hover:underline">
        Back to My reports
      </Link>

      {error || !flag ? (
        <div className="mt-8 space-y-4">
          <h1 className="text-2xl font-bold">Report not found</h1>
          <p className="text-muted-foreground text-sm">{error ?? "This case could not be loaded."}</p>
          <Button asChild variant="outline">
            <Link href="/support/reports">View all reports</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Case {flag.reference_id}</h1>
            <p className="text-sm text-muted-foreground">
              Submitted {format(new Date(flag.created_at), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-sm font-semibold">{flag.reference_id}</p>
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy reference"}
              </Button>
            </div>

            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium capitalize">{formatStatus(flag.status)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium capitalize">{flag.report_type.replace(/_/g, " ")}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Reason</dt>
                <dd className="font-medium">{formatReportReason(flag.reason)}</dd>
              </div>
              {flag.description?.trim() && (
                <div>
                  <dt className="text-muted-foreground">Your description</dt>
                  <dd className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-w-full">
                    {flag.description}
                  </dd>
                </div>
              )}
              {flag.resolved_at && (
                <div>
                  <dt className="text-muted-foreground">Resolved</dt>
                  <dd>{format(new Date(flag.resolved_at), "MMMM d, yyyy")}</dd>
                </div>
              )}
            </dl>

            {targetHref && (
              <Button variant="outline" size="sm" asChild className="mt-2">
                <Link href={targetHref}>View reported content</Link>
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Need more help? Email{" "}
            <a href="mailto:care@hiffi.com" className="text-primary hover:underline">
              care@hiffi.com
            </a>{" "}
            and include your case reference.
          </p>
        </div>
      )}
    </div>
  )
}
