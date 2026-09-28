"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import type { Artist } from "@/lib/artists"
import { formatClaimDate, resolveClaimReceiptState } from "@/lib/artist-index/claim-receipt"
import { useClaimReceipt } from "@/hooks/use-claim-receipt"
import { artistButtonMuted, artistButtonSolid } from "@/components/artists/artist-styles"
import { cn } from "@/lib/utils"

const CLAIM_VERIFICATION_EMAIL = "creator-noreply@hiffi.com"

export function ClaimNotApprovedNotice({
  email,
  submittedAt,
  onStartFresh,
}: {
  email: string
  submittedAt: string
  onStartFresh: () => void
}) {
  return (
    <div role="status" className="rounded-2xl border border-border bg-muted/30 p-5">
      <p className="text-sm font-semibold text-foreground">Your earlier claim wasn&apos;t approved</p>
      <p className="mt-1 text-sm text-muted-foreground">
        We couldn&apos;t verify the claim you sent on {formatClaimDate(submittedAt)} with{" "}
        <strong className="text-foreground">{email}</strong>. Check that your social links point to
        this artist and try again — we&apos;ve filled in your previous answers.
      </p>
      <button
        type="button"
        onClick={onStartFresh}
        className="mt-3 text-sm font-medium text-[#E8192C] underline-offset-2 hover:underline"
      >
        Start fresh instead
      </button>
    </div>
  )
}

/** Claim page, profile already claimed: tell a returning claimant what to do next. */
export function ClaimApprovedNotice({ slug }: { slug: string }) {
  const { receipt, clear } = useClaimReceipt(slug)
  if (!receipt) return null

  return (
    <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-left">
      <p className="text-sm font-semibold text-emerald-900">Submitted a claim with {receipt.email}?</p>
      <p className="mt-1 text-sm text-emerald-900/80">
        {receipt.accountSetup
          ? "If it was yours, it's been approved. Sign in with that email and the password you set."
          : `If it was yours, it's been approved. Check your inbox for the activation email from ${CLAIM_VERIFICATION_EMAIL}.`}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {receipt.accountSetup ? (
          <Link href="/login" onClick={clear} className={artistButtonSolid}>
            Sign in
          </Link>
        ) : null}
        <button type="button" onClick={clear} className={cn(artistButtonMuted, "border-transparent")}>
          Dismiss
        </button>
      </div>
    </div>
  )
}

/**
 * Profile hero: swaps the generic pending / unclaimed banner for the claimant's own status
 * when this device submitted a claim for the profile.
 */
export function ClaimReceiptBanner({
  artist,
  fallback,
}: {
  artist: Pick<Artist, "slug" | "name" | "claim_status" | "verified">
  fallback: ReactNode
}) {
  const { receipt } = useClaimReceipt(artist.slug)
  if (!receipt) return <>{fallback}</>

  const state = resolveClaimReceiptState(receipt, artist.claim_status, artist.verified)
  const claimHref = `/artist-index/${artist.slug}/claim`
  const submitted = formatClaimDate(receipt.submittedAt)

  if (state === "under_review") {
    return (
      <div className="mb-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 sm:mb-4 sm:px-5">
        <p className="text-sm text-amber-950">
          <span className="font-semibold">Your claim is under review.</span> You sent it on {submitted}{" "}
          with {receipt.email}. We&apos;ll email you once it&apos;s approved.
        </p>
      </div>
    )
  }

  if (state === "claimed") {
    return (
      <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 sm:mb-4 sm:px-5">
        <p className="text-sm text-emerald-950">
          <span className="font-semibold">This profile has been claimed.</span> If you submitted the
          claim with {receipt.email},{" "}
          {receipt.accountSetup ? (
            <>
              <Link href="/login" className="font-semibold underline-offset-2 hover:underline">
                sign in
              </Link>{" "}
              with the password you set.
            </>
          ) : (
            "check your inbox for the activation email."
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="mb-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 sm:mb-4 sm:px-5">
      <p className="text-sm text-foreground">
        <span className="font-semibold">Your claim from {submitted} wasn&apos;t approved.</span>{" "}
        <Link href={claimHref} className="font-semibold text-[#E8192C] underline-offset-2 hover:underline">
          Try again
        </Link>{" "}
        with links that show you&apos;re {artist.name}.
      </p>
    </div>
  )
}
