"use client"

import { trackId } from "@/lib/analytics/tracking-ids"
import { useEffect, useState } from "react"
import { Clock, Loader2, Mail } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  InventoryClaimError,
  fetchInventoryClaimStatus,
  resendClaimConfirmation,
} from "@/lib/api/inventory"
import { cn } from "@/lib/utils"

const STATUS_CACHE_PREFIX = "hiffi_claim_status:"
const STATUS_CACHE_MS = 5 * 60 * 1000

type ResendState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "sent" }
  | { status: "error"; message: string }

function readCachedStatus(username: string): string | null | undefined {
  try {
    const raw = sessionStorage.getItem(STATUS_CACHE_PREFIX + username)
    if (!raw) return undefined
    const cached = JSON.parse(raw) as { status: string | null; at: number }
    return Date.now() - cached.at < STATUS_CACHE_MS ? cached.status : undefined
  } catch {
    return undefined
  }
}

function writeCachedStatus(username: string, status: string | null) {
  try {
    sessionStorage.setItem(STATUS_CACHE_PREFIX + username, JSON.stringify({ status, at: Date.now() }))
  } catch {
    // Private browsing: refetch next time.
  }
}

/** True while the signed-in user's own inventory profile has a claim under review. */
function useOwnClaimPending(username: string | null): boolean {
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!username) {
      setPending(false)
      return
    }
    const cached = readCachedStatus(username)
    if (cached !== undefined) {
      setPending(cached === "pending")
      return
    }
    let cancelled = false
    void fetchInventoryClaimStatus(username).then((status) => {
      writeCachedStatus(username, status)
      if (!cancelled) setPending(status === "pending")
    })
    return () => {
      cancelled = true
    }
  }, [username])

  return pending
}

/** Slim account notices for artists who signed in straight after claiming. */
export function ClaimStatusBanner({ className }: { className?: string }) {
  const { user, userData } = useAuth()
  const username = user?.username?.toLowerCase() ?? null
  const claimPending = useOwnClaimPending(username)
  const emailUnconfirmed = Boolean(user) && userData?.email_verified === false
  const email = typeof userData?.email === "string" ? userData.email : ""
  const [resend, setResend] = useState<ResendState>({ status: "idle" })

  if (!emailUnconfirmed && !claimPending) return null

  const handleResend = async () => {
    setResend({ status: "sending" })
    try {
      await resendClaimConfirmation()
      setResend({ status: "sent" })
    } catch (error) {
      setResend({
        status: "error",
        message:
          error instanceof InventoryClaimError ? error.message : "Could not resend the email. Try again shortly.",
      })
    }
  }

  return (
    <div
      role="status"
      className={cn("border-b border-[#0B0B0C]/10 bg-[#F4F1EA] text-[#0B0B0C]", className)}
    >
      <div className="flex flex-col gap-1.5 px-3 py-2.5 text-[13px] leading-5 sm:px-4 md:flex-row md:flex-wrap md:items-center md:gap-x-8">
        {emailUnconfirmed ? (
          <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            <Mail className="h-3.5 w-3.5 shrink-0 text-[#E8192C]" aria-hidden />
            <span className="font-semibold">Confirm your email.</span>
            <span className="text-[#0B0B0C]/60">
              {email ? <>We sent a link to {email}.</> : "Check your inbox for the link."}
            </span>
            {resend.status === "sent" ? (
              <span className="font-medium text-[#0B0B0C]/70">Sent. Check your inbox.</span>
            ) : (
              <button
                type="button"
                onClick={() => void handleResend()}
                disabled={resend.status === "sending"}
                {...trackId("claim-banner-resend-confirmation")}
                className="inline-flex items-center gap-1 font-semibold text-[#E8192C] underline-offset-4 hover:underline disabled:opacity-60"
              >
                {resend.status === "sending" ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
                Resend email
              </button>
            )}
            {resend.status === "error" ? (
              <span className="text-[#B3121F]">{resend.message}</span>
            ) : null}
          </p>
        ) : null}
        {claimPending ? (
          <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-[#0B0B0C]/50" aria-hidden />
            <span className="font-semibold">Your profile is under review.</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}
