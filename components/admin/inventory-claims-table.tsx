"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { adminApiClient } from "@/lib/admin-api-client"
import type {
  InventoryClaim,
  InventoryClaimStatus,
  OnboardingStatus,
} from "@/lib/types/inventory"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { useAdminPermissions } from "@/hooks/use-admin-permissions"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { cn } from "@/lib/utils"

const LIMIT_OPTIONS = [20, 50, 100, 200]
const STATUS_OPTIONS: Array<{ value: "" | InventoryClaimStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "All statuses" },
]
const ONBOARDING_OPTIONS: Array<{ value: "" | OnboardingStatus; label: string }> = [
  { value: "", label: "Any onboarding" },
  { value: "awaiting_email", label: "Awaiting email" },
  { value: "email_sent", label: "Email sent" },
  { value: "link_opened", label: "Link opened" },
  { value: "activated", label: "Activated" },
]

function formatTimestamp(value?: string): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, "MMM d, yyyy · h:mm a")
}

function formatFunnelTime(value?: string): string {
  if (!value) return "Pending"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, "MMM d · h:mm a")
}

const FUNNEL_STEPS = [
  { key: "email", label: "Email sent", field: "welcome_email_sent_at" as const },
  { key: "opened", label: "Link opened", field: "onboard_verified_at" as const },
  { key: "password", label: "Password set", field: "password_set_at" as const },
  { key: "login", label: "Logged in", field: "last_login_at" as const },
]

function OnboardingFunnelCell({ claim }: { claim: InventoryClaim }) {
  const steps = FUNNEL_STEPS.map((step) => ({
    ...step,
    at: claim[step.field],
  }))
  const doneCount = steps.filter((step) => Boolean(step.at)).length
  const complete = doneCount === steps.length
  const nextStep = steps.find((step) => !step.at)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex w-full min-w-[168px] flex-col gap-1.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
            "hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            complete ? "border-emerald-200 bg-emerald-50/50" : "border-border bg-background",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "text-[11px] font-semibold tabular-nums",
                complete ? "text-emerald-700" : "text-foreground",
              )}
            >
              {doneCount}/{steps.length}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground group-hover:text-foreground">
              Details
            </span>
          </div>

          <div className="flex items-center gap-1" aria-hidden>
            {steps.map((step) => (
              <span
                key={step.key}
                title={step.label}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  step.at ? (complete ? "bg-emerald-500" : "bg-primary") : "bg-muted",
                )}
              />
            ))}
          </div>

          <p className="truncate text-[11px] text-muted-foreground">
            {complete
              ? "Onboarding complete"
              : nextStep
                ? `Next: ${nextStep.label}`
                : "No progress yet"}
          </p>
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-72 p-3">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">Onboarding funnel</p>
            <p className="text-xs text-muted-foreground">@{claim.username}</p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0",
              complete
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-border text-muted-foreground",
            )}
          >
            {doneCount}/{steps.length}
          </Badge>
        </div>

        <ol className="space-y-2.5">
          {steps.map((step, index) => {
            const done = Boolean(step.at)
            const isLast = index === steps.length - 1
            return (
              <li key={step.key} className="relative flex items-start gap-2.5">
                {!isLast ? (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-[7px] top-4 h-[calc(100%-2px)] w-px",
                      done ? "bg-emerald-300" : "bg-border",
                    )}
                  />
                ) : null}
                <span
                  className={cn(
                    "relative z-[1] mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
                    done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-muted-foreground/30 bg-background",
                  )}
                >
                  {done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
                </span>
                <div className="min-w-0 leading-tight">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      done ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatFunnelTime(step.at)}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </PopoverContent>
    </Popover>
  )
}

function discoverySourceDisplay(claim: InventoryClaim): {
  label: string
  detail?: string
} {
  if (claim.discovery_source === "other") {
    const detail =
      claim.discovery_source_other?.trim() ||
      claim.discovery_source_label?.replace(/^Other:\s*/i, "").trim()

    return {
      label: "Other",
      ...(detail && detail !== "Other" ? { detail } : {}),
    }
  }

  if (claim.discovery_source_label?.trim()) {
    return { label: claim.discovery_source_label.trim() }
  }

  return { label: "Unknown" }
}

function statusLabel(status: InventoryClaimStatus): string {
  switch (status) {
    case "approved":
      return "Approved"
    case "rejected":
      return "Rejected"
    default:
      return "Pending"
  }
}

function statusBadgeClass(status: InventoryClaimStatus): string {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-800 border-emerald-200"
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-amber-100 text-amber-900 border-amber-200"
  }
}

function onboardingLabel(status?: OnboardingStatus): string {
  switch (status) {
    case "awaiting_email":
      return "Awaiting email"
    case "email_sent":
      return "Email sent"
    case "link_opened":
      return "Link opened"
    case "activated":
      return "Activated"
    default:
      return "—"
  }
}

function onboardingBadgeClass(status?: OnboardingStatus): string {
  switch (status) {
    case "activated":
      return "bg-emerald-100 text-emerald-800 border-emerald-200"
    case "link_opened":
      return "bg-sky-100 text-sky-800 border-sky-200"
    case "email_sent":
      return "bg-amber-100 text-amber-900 border-amber-200"
    case "awaiting_email":
      return "bg-orange-100 text-orange-900 border-orange-200"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

function DiscoverySourceCell({ claim }: { claim: InventoryClaim }) {
  const source = discoverySourceDisplay(claim)

  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{source.label}</span>

      {source.detail ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`View discovery source detail for ${claim.email}`}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-red-50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>

          <PopoverContent align="start" side="top" className="w-72 rounded-lg border bg-background p-3 shadow-lg">
            <p className="mt-1 text-sm leading-5 text-foreground">{source.detail}</p>
          </PopoverContent>
        </Popover>
      ) : null}
    </span>
  )
}

export function InventoryClaimsTable() {
  const { toast } = useToast()
  const { can } = useAdminPermissions()
  const canInventoryClaimsWrite = can("inventory.claims:write")
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } =
    useAdminNetworkError()
  const [rows, setRows] = useState<InventoryClaim[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [usernameQuery, setUsernameQuery] = useState("")
  const [emailQuery, setEmailQuery] = useState("")
  const [debouncedUsername, setDebouncedUsername] = useState("")
  const [debouncedEmail, setDebouncedEmail] = useState("")
  const [statusFilter, setStatusFilter] = useState<"" | InventoryClaimStatus>("pending")
  const [onboardingFilter, setOnboardingFilter] = useState<"" | OnboardingStatus>("")
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [count, setCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [claimToApprove, setClaimToApprove] = useState<InventoryClaim | null>(null)
  const [claimToDelete, setClaimToDelete] = useState<InventoryClaim | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUsername(usernameQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [usernameQuery])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedEmail(emailQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [emailQuery])

  const fetchRows = async (isRefresh = false) => {
    if (guardOfflineBeforeFetch()) {
      setRows([])
      setCount(0)
      setHasMore(false)
      setFetching(false)
      setRefreshing(false)
      return
    }

    try {
      if (isRefresh) setRefreshing(true)
      else setFetching(true)
      clearNetworkError()

      const response = await adminApiClient.adminListInventoryClaims({
        limit,
        offset,
        ...(debouncedUsername ? { username: debouncedUsername } : {}),
        ...(debouncedEmail ? { email: debouncedEmail } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(onboardingFilter ? { onboarding_status: onboardingFilter } : {}),
      })
      setRows(response.items)
      setCount(response.count)
      setHasMore(response.has_more)
      setHasLoaded(true)
    } catch (error) {
      setRows([])
      setCount(0)
      setHasMore(false)
      handleFetchError(error, {
        genericMessage: "Failed to load profile claims",
        onGenericError: (description) =>
          toast({ title: "Error", description, variant: "destructive" }),
      })
    } finally {
      setFetching(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void fetchRows()
  }, [limit, offset, debouncedUsername, debouncedEmail, statusFilter, onboardingFilter])

  const applyApproveToLocalRows = (approved: InventoryClaim) => {
    const now = approved.updated_at || new Date().toISOString()
    setRows((prev) =>
      prev
        .map((row) => {
          if (row.id === approved.id) {
            return { ...approved, status: "approved" as const, updated_at: now }
          }
          if (row.username === approved.username && row.status === "pending") {
            return { ...row, status: "rejected" as const, updated_at: now }
          }
          return row
        })
        .filter((row) => (statusFilter === "pending" ? row.status === "pending" : true)),
    )
  }

  const handleApproveConfirm = async () => {
    if (!claimToApprove) return
    setApprovingId(claimToApprove.id)
    try {
      const result = await adminApiClient.adminApproveInventoryClaim(claimToApprove.id)
      const rejectedNote =
        result.rejected_count > 0
          ? ` · ${result.rejected_count} other pending claim${result.rejected_count === 1 ? "" : "s"} rejected`
          : ""
      const userNote = result.user_updated ? " · linked user updated" : ""
      const emailNote = result.email_sent
        ? " · welcome email sent"
        : " · welcome email not sent (funnel: awaiting email)"

      applyApproveToLocalRows(result.claim)
      setClaimToApprove(null)
      setOffset(0)
      setStatusFilter("approved")
      setOnboardingFilter("")

      toast({
        title: "Claim approved",
        description: `@${result.claim.username} is now Approved${rejectedNote}${userNote}${emailNote}.`,
        variant: result.email_sent ? "default" : "destructive",
      })

      void fetch("/api/artist-index/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: result.claim.username }),
      }).catch(() => {
        // Non-blocking — approve already succeeded.
      })
    } catch (error) {
      handleFetchError(error, {
        genericMessage: "Failed to approve claim",
        onGenericError: (description) =>
          toast({ title: "Error", description, variant: "destructive" }),
      })
    } finally {
      setApprovingId(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!claimToDelete) return
    setDeletingId(claimToDelete.id)
    try {
      const result = await adminApiClient.adminDeleteInventoryClaim(claimToDelete.id)
      setRows((prev) => prev.filter((row) => row.id !== result.id))
      setCount((prev) => Math.max(0, prev - 1))
      setClaimToDelete(null)
      toast({
        title: "Claim deleted",
        description: `Removed claim for @${result.claim.username || claimToDelete.username}.`,
      })
    } catch (error) {
      handleFetchError(error, {
        genericMessage: "Failed to delete claim",
        onGenericError: (description) =>
          toast({ title: "Error", description, variant: "destructive" }),
      })
    } finally {
      setDeletingId(null)
    }
  }

  const canGoPrev = offset > 0
  const canGoNext = hasMore
  const isInitialLoad = !hasLoaded && fetching
  const isFilterPending =
    usernameQuery.trim() !== debouncedUsername || emailQuery.trim() !== debouncedEmail
  const showUsernameSpinner = isFilterPending || (fetching && usernameQuery.length > 0)
  const showEmailSpinner = isFilterPending || (fetching && emailQuery.length > 0)
  const showOnboardingColumns = statusFilter === "approved" || statusFilter === ""
  const baseCols = showOnboardingColumns ? 9 : 7
  const colSpan = canInventoryClaimsWrite ? baseCols + 1 : baseCols
  const actionInFlight = approvingId != null || deletingId != null

  if (isInitialLoad) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (networkError && !hasLoaded) {
    return (
      <AdminOfflineState
        message={networkError}
        onRetry={() => {
          clearNetworkError()
          void fetchRows()
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Pending</span> → review queue.{" "}
          <span className="font-medium text-foreground">Approve</span> emails the artist an
          onboarding link, rejects sibling pending claims, and marks the profile claimed.{" "}
          <span className="font-medium text-foreground">Delete</span> removes a row without
          rejecting siblings.
        </p>
        <p className="mt-1">
          Track stuck artists with Approved + onboarding filters (email sent / link opened). Resend
          email is not available yet.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => {
            const active = statusFilter === option.value
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => {
                  setOffset(0)
                  setStatusFilter(option.value)
                  if (option.value !== "approved" && option.value !== "") {
                    setOnboardingFilter("")
                  }
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        {statusFilter === "approved" || statusFilter === "" ? (
          <div className="flex flex-wrap gap-2">
            {ONBOARDING_OPTIONS.map((option) => {
              const active = onboardingFilter === option.value
              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => {
                    setOffset(0)
                    setOnboardingFilter(option.value)
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={usernameQuery}
              onChange={(e) => {
                setOffset(0)
                setUsernameQuery(e.target.value)
              }}
              placeholder="Filter by username…"
              className={cn("pl-9", showUsernameSpinner && "pr-9")}
              aria-busy={showUsernameSpinner}
            />
            {showUsernameSpinner ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : null}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={emailQuery}
              onChange={(e) => {
                setOffset(0)
                setEmailQuery(e.target.value)
              }}
              placeholder="Filter by email…"
              className={cn("pl-9", showEmailSpinner && "pr-9")}
              aria-busy={showEmailSpinner}
            />
            {showEmailSpinner ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : null}
          </div>
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
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {fetching || isFilterPending
              ? "Updating claims…"
              : `${count.toLocaleString()} claim${count === 1 ? "" : "s"} · ${
                  statusFilter ? statusLabel(statusFilter) : "All statuses"
                }`}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchRows(true)}
            disabled={refreshing || fetching}
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-1">Refresh</span>
          </Button>
        </div>
      </div>

      {networkError ? (
        <AdminOfflineState
          message={networkError}
          onRetry={() => {
            clearNetworkError()
            void fetchRows()
          }}
        />
      ) : (
        <div className="rounded-lg border bg-background shadow-sm overflow-auto">
          <table className={cn("w-full min-w-[1100px] transition-opacity", fetching && "opacity-60")}>
            <thead className="sticky top-0 z-10 bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Profile
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Claimant
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  How they found us
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
                {showOnboardingColumns ? (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Onboarding
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Funnel
                    </th>
                  </>
                ) : null}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Submitted
                </th>
                {canInventoryClaimsWrite ? (
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No claims in this queue.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const rowBusy = approvingId === row.id || deletingId === row.id
                  return (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{row.artist_name || row.username}</div>
                        <Link
                          href={`/artist-index/${encodeURIComponent(row.username)}`}
                          className="text-primary hover:underline text-xs"
                          target="_blank"
                        >
                          @{row.username}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm">{row.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[220px] truncate">
                        {row.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <DiscoverySourceCell claim={row} />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline" className={cn(statusBadgeClass(row.status))}>
                          {statusLabel(row.status)}
                        </Badge>
                      </td>
                      {showOnboardingColumns ? (
                        <>
                          <td className="px-4 py-3 text-sm">
                            {row.status === "approved" ? (
                              <Badge
                                variant="outline"
                                className={cn(onboardingBadgeClass(row.onboarding_status))}
                              >
                                {onboardingLabel(row.onboarding_status)}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            {row.status === "approved" ? (
                              <OnboardingFunnelCell claim={row} />
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                        </>
                      ) : null}
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(row.created_at)}
                      </td>
                      {canInventoryClaimsWrite ? (
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            {row.status === "pending" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={rowBusy || actionInFlight}
                                onClick={() => setClaimToApprove(row)}
                              >
                                {approvingId === row.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                                <span className="ml-1">Approve</span>
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={rowBusy || actionInFlight}
                              onClick={() => setClaimToDelete(row)}
                              aria-label={`Delete claim from ${row.name}`}
                            >
                              {deletingId === row.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Offset {offset.toLocaleString()}</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canGoPrev || fetching}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canGoNext || fetching}
            onClick={() => setOffset(offset + limit)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog
        open={!!claimToApprove}
        onOpenChange={(open) => {
          if (!open && !approvingId) setClaimToApprove(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve profile claim?</DialogTitle>
            <DialogDescription>
              {claimToApprove ? (
                <>
                  Approve <strong>{claimToApprove.name}</strong> ({claimToApprove.email}) for{" "}
                  <strong>@{claimToApprove.username}</strong>. Other pending claims for this profile
                  become Rejected, and a welcome email with an onboarding link is sent when possible.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClaimToApprove(null)}
              disabled={!!approvingId}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleApproveConfirm()} disabled={!!approvingId}>
              {approvingId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span className={approvingId ? "ml-2" : undefined}>Approve claim</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!claimToDelete}
        onOpenChange={(open) => {
          if (!open && !deletingId) setClaimToDelete(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this claim permanently?</DialogTitle>
            <DialogDescription>
              {claimToDelete ? (
                <>
                  Removes the claim from <strong>{claimToDelete.name}</strong> (
                  {claimToDelete.email}) for <strong>@{claimToDelete.username}</strong>. This does
                  not reject sibling claims or revert a linked user&apos;s name/email.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClaimToDelete(null)}
              disabled={!!deletingId}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteConfirm()}
              disabled={!!deletingId}
            >
              {deletingId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span className={deletingId ? "ml-2" : undefined}>Delete claim</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
