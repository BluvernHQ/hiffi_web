import type { ReactNode } from "react"
import Link from "next/link"
import { Check, Clock, Mail, UserCheck } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { artistButtonMuted } from "@/components/artists/artist-styles"
import { cn } from "@/lib/utils"

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
}

export function ClaimSubmitted({
  artistName,
  artistSlug,
  email,
  isOwnershipRequest,
  accountSetupEnabled,
}: ClaimSubmittedProps) {
  const items: TimelineItem[] = [
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

  return (
    <section
      className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
        Under review
      </span>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
        Thanks — we&apos;re reviewing your claim for {artistName}.
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        You don&apos;t need to do anything else right now. Keep an eye on your inbox, including spam.
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
                    item.state === "done" ? "bg-[#E8192C]" : "bg-border",
                  )}
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                  item.state === "done" && "border-[#E8192C] bg-[#E8192C] text-white",
                  item.state === "current" && "border-[#E8192C] bg-[#E8192C]/10 text-[#E8192C]",
                  item.state === "upcoming" && "border-border bg-white text-muted-foreground",
                )}
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="pt-1.5">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    item.state === "upcoming" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {item.title}
                  {item.state === "current" ? <span className="sr-only"> (in progress)</span> : null}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/artist-index/${artistSlug}`} className={artistButtonMuted}>
          Back to {artistName}
        </Link>
        <Link href="/" className={cn(artistButtonMuted, "border-transparent")}>
          Explore Hiffi
        </Link>
      </div>
    </section>
  )
}
