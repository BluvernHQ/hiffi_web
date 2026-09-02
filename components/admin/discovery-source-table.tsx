"use client"

import { useEffect, useMemo, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Trash2 } from "lucide-react"
import { adminApiClient } from "@/lib/admin-api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { useAdminPermissions } from "@/hooks/use-admin-permissions"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { DiscoverySourceSubmission } from "@/lib/types/discovery-source"

const LIMIT_OPTIONS = [20, 50, 100]

function discoverySourceErrorMessage(error: unknown): string {
  const status = (error as { status?: number })?.status
  const message = error instanceof Error ? error.message : ""
  if (status === 404 || message.includes("404")) {
    return "Discovery survey admin API is not available on this environment yet (GET /admin/discovery-source)."
  }
  if (message.trim()) return message
  return "Failed to load discovery source submissions"
}

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

export function AdminDiscoverySourceTable() {
  const { toast } = useToast()
  const { canWrite } = useAdminPermissions()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } =
    useAdminNetworkError()
  const [rows, setRows] = useState<DiscoverySourceSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [emailQuery, setEmailQuery] = useState("")
  const [debouncedEmailQuery, setDebouncedEmailQuery] = useState("")
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [count, setCount] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DiscoverySourceSubmission | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedEmailQuery(emailQuery.trim()), 350)
    return () => clearTimeout(t)
  }, [emailQuery])

  const fetchSubmissions = async (isRefresh = false) => {
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

      const response = await adminApiClient.adminListDiscoverySourceSubmissions({
        limit,
        offset,
        ...(debouncedEmailQuery ? { email: debouncedEmailQuery } : {}),
      })

      setRows(response.submissions)
      setCount(response.count)
      refreshSucceeded = true
    } catch (error) {
      setRows([])
      setCount(0)
      handleFetchError(error, {
        genericMessage: discoverySourceErrorMessage(error),
        onGenericError: (description) => toast({ title: "Error", description, variant: "destructive" }),
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }

    if (isRefresh && refreshSucceeded) {
      toast({
        title: "Submissions refreshed",
        description: "The latest discovery survey responses are now shown.",
      })
    }
  }

  useEffect(() => {
    void fetchSubmissions()
  }, [limit, offset, debouncedEmailQuery])

  const selectedSubmission = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  )

  const canGoPrev = offset > 0
  const canGoNext = count === limit

  const handleDelete = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      await adminApiClient.adminDeleteDiscoverySourceSubmission(deleteTarget.id)
      toast({
        title: "Submission deleted",
        description: `${deleteTarget.email} was removed from the discovery survey queue.`,
      })
      if (selectedId === deleteTarget.id) setSelectedId(null)
      setDeleteTarget(null)
      void fetchSubmissions(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete submission"
      toast({ title: "Delete failed", description: message, variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

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
          void fetchSubmissions()
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
              placeholder="Filter by email…"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

            <Button variant="outline" size="sm" onClick={() => void fetchSubmissions(true)} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-1">Refresh</span>
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{rows.length}</span> responses on this page
          {debouncedEmailQuery ? (
            <>
              {" "}
              matching <span className="font-medium text-foreground">{debouncedEmailQuery}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="rounded-lg border bg-background shadow-sm overflow-auto">
        <table className="w-full min-w-[880px]">
          <thead className="sticky top-0 z-10 bg-muted/50">
            <tr className="border-b">
              <th className="h-11 px-4 text-left text-sm font-semibold">Name</th>
              <th className="h-11 px-4 text-left text-sm font-semibold">Email</th>
              <th className="h-11 px-4 text-left text-sm font-semibold">How they found us</th>
              <th className="h-11 px-4 text-left text-sm font-semibold">Submitted</th>
              {canWrite ? (
                <th className="h-11 px-4 text-right text-sm font-semibold">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={canWrite ? 5 : 4}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  No discovery survey responses yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => setSelectedId(row.id)}
                >
                  <td className="px-4 py-3 text-sm font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{row.email}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-[320px] truncate">
                    {row.how_find_us}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <span title={formatTimestamp(row.created_at)}>
                      {row.created_at
                        ? formatDistanceToNow(new Date(row.created_at), { addSuffix: true })
                        : "—"}
                    </span>
                  </td>
                  {canWrite ? (
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(row)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete submission</span>
                      </Button>
                    </td>
                  ) : null}
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
          {selectedSubmission ? (
            <>
              <SheetHeader>
                <SheetTitle>{selectedSubmission.name}</SheetTitle>
                <SheetDescription className="font-mono text-xs">{selectedSubmission.id}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <DetailField label="Email" value={selectedSubmission.email} />
                <DetailField label="How did you find us?" value={selectedSubmission.how_find_us} />
                <DetailField label="Client IP" value={selectedSubmission.client_ip} />
                <DetailField label="Submitted" value={formatTimestamp(selectedSubmission.created_at)} />

                {canWrite ? (
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={() => setDeleteTarget(selectedSubmission)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete submission
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete discovery response?</DialogTitle>
            <DialogDescription>
              This permanently removes the submission from{" "}
              <span className="font-medium text-foreground">{deleteTarget?.email}</span>. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
