"use client"

import { useEffect, useMemo, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, RefreshCw, Search } from "lucide-react"
import { adminApiClient } from "@/lib/admin-api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { CollaborationInquiry } from "@/lib/types/collaboration-inquiry"
import { cn } from "@/lib/utils"

const LIMIT_OPTIONS = [20, 50, 100]

type EmailSentFilter = "all" | "true" | "false"

function formatTimestamp(value: string): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, "MMM d, yyyy · h:mm a")
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground break-words whitespace-pre-wrap">{value || "—"}</div>
    </div>
  )
}

export function AdminCollaborationInquiriesTable() {
  const { toast } = useToast()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } = useAdminNetworkError()
  const [rows, setRows] = useState<CollaborationInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [emailQuery, setEmailQuery] = useState("")
  const [debouncedEmailQuery, setDebouncedEmailQuery] = useState("")
  const [emailSentFilter, setEmailSentFilter] = useState<EmailSentFilter>("all")
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [count, setCount] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedEmailQuery(emailQuery.trim()), 350)
    return () => clearTimeout(t)
  }, [emailQuery])

  const fetchInquiries = async (isRefresh = false) => {
    let refreshSucceeded = false
    if (guardOfflineBeforeFetch()) {
      setRows([])
      setCount(0)
      setLoading(false)
      setRefreshing(false)
      return
    }

    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      clearNetworkError()

      const response = await adminApiClient.adminListCollaborationInquiries({
        limit,
        offset,
        ...(debouncedEmailQuery ? { contact_email: debouncedEmailQuery } : {}),
        ...(emailSentFilter === "all" ? {} : { email_sent: emailSentFilter === "true" }),
      })

      setRows(response.inquiries)
      setCount(response.count)
      refreshSucceeded = true
    } catch (error) {
      setRows([])
      setCount(0)
      handleFetchError(error, {
        genericMessage: "Failed to load collaboration inquiries",
        onGenericError: (description) => toast({ title: "Error", description, variant: "destructive" }),
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }

    if (isRefresh && refreshSucceeded) {
      toast({
        title: "Inquiries refreshed",
        description: "The latest collaboration submissions are now shown.",
      })
    }
  }

  useEffect(() => {
    void fetchInquiries()
  }, [limit, offset, debouncedEmailQuery, emailSentFilter])

  const selectedInquiry = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  )

  const canGoPrev = offset > 0
  const canGoNext = count === limit

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (networkError) {
    return (
      <AdminOfflineState
        message={networkError}
        onRetry={() => {
          clearNetworkError()
          void fetchInquiries()
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={emailQuery}
              onChange={(e) => {
                setOffset(0)
                setEmailQuery(e.target.value)
              }}
              placeholder="Filter by contact email…"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={emailSentFilter}
              onChange={(e) => {
                setOffset(0)
                setEmailSentFilter(e.target.value as EmailSentFilter)
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All email statuses</option>
              <option value="true">Notification sent</option>
              <option value="false">Notification failed</option>
            </select>

            <select
              value={limit}
              onChange={(e) => {
                setOffset(0)
                setLimit(Number(e.target.value))
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {LIMIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} / page
                </option>
              ))}
            </select>

            <Button variant="outline" size="sm" onClick={() => void fetchInquiries(true)} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-1">Refresh</span>
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{rows.length}</span> inquiries on this page
          {debouncedEmailQuery ? (
            <>
              {" "}
              matching <span className="font-medium text-foreground">{debouncedEmailQuery}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="rounded-lg border bg-background shadow-sm overflow-auto">
        <table className="w-full min-w-[900px]">
          <thead className="sticky top-0 z-10 bg-muted/50">
            <tr className="border-b">
              <th className="h-11 px-4 text-left text-sm font-semibold">Brand</th>
              <th className="h-11 px-4 text-left text-sm font-semibold">Contact</th>
              <th className="h-11 px-4 text-left text-sm font-semibold">Email</th>
              <th className="h-11 px-4 text-left text-sm font-semibold">Submitted</th>
              <th className="h-11 px-4 text-left text-sm font-semibold">Notification</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No collaboration inquiries found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => setSelectedId(row.id)}
                >
                  <td className="px-4 py-3 text-sm font-medium">{row.brand_name}</td>
                  <td className="px-4 py-3 text-sm">{row.contact_name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{row.contact_email}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <span title={formatTimestamp(row.created_at)}>
                      {row.created_at
                        ? formatDistanceToNow(new Date(row.created_at), { addSuffix: true })
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[11px] font-normal",
                        row.email_sent
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                      )}
                    >
                      {row.email_sent ? "Sent" : "Failed"}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page offset <span className="font-medium text-foreground">{offset}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canGoPrev}
            onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canGoNext}
            onClick={() => setOffset((prev) => prev + limit)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Sheet open={selectedId != null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedInquiry ? (
            <>
              <SheetHeader>
                <SheetTitle>{selectedInquiry.brand_name}</SheetTitle>
                <SheetDescription className="font-mono text-xs">{selectedInquiry.id}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailField label="Contact name" value={selectedInquiry.contact_name} />
                  <DetailField label="Contact email" value={selectedInquiry.contact_email} />
                </div>

                {selectedInquiry.website ? (
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Website</p>
                    <a
                      href={selectedInquiry.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline break-all"
                    >
                      {selectedInquiry.website}
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  </div>
                ) : null}

                <DetailField label="About the brand" value={selectedInquiry.brand_description} />
                <DetailField label="Collaboration goal" value={selectedInquiry.collaboration_goal} />
                {selectedInquiry.anything_else ? (
                  <DetailField label="Anything else" value={selectedInquiry.anything_else} />
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2 border-t pt-4">
                  <DetailField label="Submitted" value={formatTimestamp(selectedInquiry.created_at)} />
                  <DetailField
                    label="Internal notification"
                    value={
                      selectedInquiry.email_sent
                        ? `Sent${selectedInquiry.email_sent_at ? ` · ${formatTimestamp(selectedInquiry.email_sent_at)}` : ""}`
                        : "Failed to send"
                    }
                  />
                  {selectedInquiry.client_ip ? (
                    <DetailField label="Client IP" value={selectedInquiry.client_ip} />
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
