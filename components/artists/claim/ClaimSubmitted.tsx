import type { ReactNode } from "react"
import Link from "next/link"
import { Check, Clock, Mail, UserCheck } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatClaimDate } from "@/lib/artist-index/claim-receipt"

const CLAIM_VERIFICATION_EMAIL = "creator-noreply@hiffi.com"

type TimelineItem = {
  icon: LucideIcon
  title: string
  detail: ReactNode
  state: "done" | "current" | "upcoming"
}

type ClaimSubmittedProps = {
  artistName: string
  artistSlug: string
  email: string
  isOwnershipRequest: boolean
  accountSetupEnabled: boolean
  /** Password claims sign the artist in on submit; review and email confirmation run alongside. */
  signedIn?: boolean
  emailVerified?: boolean
  /** Set when the claimant returns later — shown so they know which claim this is. */
  submittedAt?: string
  /** Lets someone else on the same device file their own request instead. */
  onSeparateRequest?: () => void
}

export function ClaimSubmitted({
  artistName,
  artistSlug,
  email,
  isOwnershipRequest,
  accountSetupEnabled,
  signedIn = false,
  emailVerified = true,
  submittedAt,
  onSeparateRequest,
}: ClaimSubmittedProps) {
  const submittedLabel = formatClaimDate(submittedAt)
  const signedInItems: TimelineItem[] = [
    {
      icon: Check,
      title: "Claim submitted",
      detail: `You're signed in as @${artistSlug}. Browse, follow and edit your profile while we review.`,
      state: "done",
    },
    {
      icon: Mail,
      title: emailVerified ? "Email confirmed" : "Confirm your email",
      detail: emailVerified ? (
        <>
          <strong className="text-foreground">{email}</strong> is confirmed.
        </>
      ) : (
        <>
          We sent a link to <strong className="text-foreground">{email}</strong>. It expires in 7 days.
        </>
      ),
      state: emailVerified ? "done" : "current",
    },
    {
      icon: Clock,
      title: "Hiffi team review",
      detail: "We check your social accounts against the profile. This usually takes 24–48 hours.",
      state: "current",
    },
    {
      icon: UserCheck,
      title: "Owner tools unlock",
      detail: `Once approved, ${artistName}'s profile is yours, including your private ranking.`,
      state: "upcoming",
    },
  ]
  const reviewItems: TimelineItem[] = [
    {
      icon: Check,
      title: isOwnershipRequest ? "Ownership request submitted" : "Claim submitted",
      detail: "Your account details, socials and profile preferences are with our team.",
      state: "done",
    },
    {
      icon: Clock,
      title: "Hiffi team review",
      detail: "We check your social accounts against the profile. This usually takes 24–48 hours.",
      state: "current",
    },
    {
      icon: Mail,
      title: "Approval email",
      detail: (
        <>
          We&apos;ll email <strong className="text-foreground">{email}</strong> from{" "}
          <strong className="text-foreground">{CLAIM_VERIFICATION_EMAIL}</strong> once you&apos;re
          approved.
        </>
      ),
      state: "upcoming",
    },
    {
      icon: UserCheck,
      title: accountSetupEnabled ? "Sign in" : "Manage your profile",
      detail: accountSetupEnabled ? (
        <>
          Once approved, sign in with <strong className="text-foreground">{email}</strong> and the
          password you just set to manage {artistName}&apos;s profile.
        </>
      ) : (
        `Sign in to update ${artistName}'s profile, photos and links.`
      ),
      state: "upcoming",
    },
  ]
  const items = signedIn ? signedInItems : reviewItems

  return (
    <section
      className="artist-rise rounded-[24px] border border-[#0B0B0C]/10 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(11,11,12,0.35)] sm:p-8"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-2 rounded-full bg-[#F4F1EA] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-[#0B0B0C]/70">
        <span className="relative flex h-1.5 w-1.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E8192C]/60 motion-reduce:animate-none" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#E8192C]" />
        </span>
        Under review
      </span>
      <h2 className="font-signal mt-4 text-[2rem] font-bold uppercase leading-[0.9] tracking-[-0.005em] text-[#0B0B0C] sm:text-[2.5rem]">
        {signedIn ? "You're signed in." : <>Thanks. We&apos;re reviewing your claim for {artistName}.</>}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[#77726A]">
        {submittedLabel ? `Submitted ${submittedLabel} with ${email}. ` : null}
        {signedIn
          ? emailVerified
            ? `We're reviewing your claim for ${artistName}. You'll see a banner at the top of Hiffi until it's approved.`
            : `Check your inbox to confirm your email. We're reviewing your claim for ${artistName} in the meantime.`
          : "You don't need to do anything else right now. Keep an eye on your inbox, including spam."}
      </p>

      <ol className="mt-8 space-y-0">
        {items.map((item, index) => {
          const Icon = item.icon
          const last = index === items.length - 1
          return (
            <li key={item.title} className="relative flex gap-4 pb-6 last:pb-0">
              {!last ? (
                <span
                  className={cn(
                    "absolute left-[17px] top-9 h-[calc(100%-2.25rem)] w-px",
                    item.state === "done" ? "bg-[#E8192C]" : "bg-[#0B0B0C]/12",
                  )}
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                  item.state === "done" && "border-[#E8192C] bg-[#E8192C] text-white",
                  item.state === "current" && "border-[#E8192C] bg-[#E8192C]/10 text-[#E8192C]",
                  item.state === "upcoming" && "border-[#0B0B0C]/12 bg-[#FAF8F3] text-[#0B0B0C]/40",
                )}
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="pt-1.5">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    item.state === "upcoming" ? "text-[#0B0B0C]/50" : "text-[#0B0B0C]",
                  )}
                >
                  {item.title}
                  {item.state === "current" ? <span className="sr-only"> (in progress)</span> : null}
                </p>
                <p className="mt-1 text-sm leading-6 text-[#77726A]">{item.detail}</p>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-[#0B0B0C]/10 pt-6">
        <Link
          href={`/artist-index/${artistSlug}`}
          className="inline-flex items-center rounded-full bg-[#0B0B0C] px-5 py-3 text-sm font-semibold text-[#F4F1EA] transition-colors hover:bg-black"
        >
          Back to {artistName}
        </Link>
        <Link
          href="/"
          className="inline-flex items-center rounded-full px-4 py-3 text-sm font-semibold text-[#0B0B0C]/60 transition-colors hover:text-[#0B0B0C]"
        >
          Explore Hiffi
        </Link>
      </div>

      {onSeparateRequest ? (
        <p className="mt-5 text-sm text-[#77726A]">
          Not your claim?{" "}
          <button
            type="button"
            onClick={onSeparateRequest}
            className="font-semibold text-[#0B0B0C] underline decoration-[#0B0B0C]/25 underline-offset-4 transition-colors hover:decoration-[#0B0B0C]"
          >
            Submit a separate ownership request
          </button>
        </p>
      ) : null}
    </section>
  )
}
